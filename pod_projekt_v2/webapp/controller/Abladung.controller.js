sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
	"podprojekt/utils/Helper",
    "sap/base/util/deepClone"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Button, Dialog, JSONModel, MessageToast, MessageBox, Helper, deepClone) {
        "use strict";

        return Controller.extend("podprojekt.controller.Abladung", {
            onInit: function () {

            },

            onAfterRendering: function() {
                this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this.alterLoadingUnitsModelDescription();
            },

            alterLoadingUnitsModelDescription:function(){ //Anpassung der Beschreibung, damit alles so aussieht wie auf der Vorlage
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/results");

                for(var i in aLoadingUnits){
                    var sOldLoadingUnitDescription=aLoadingUnits[i].label1; //Alter Text
                    var sLodingDeviceTypeCaption=aLoadingUnits[i].lodingDeviceTypeCaption; //Beschreibung des Objektes

                    aLoadingUnits[i].label1=sOldLoadingUnitDescription + " " + sLodingDeviceTypeCaption; //Concatination der Strings
                }
                this.setTreeStructureForModel(oLoadingUnitsModel, aLoadingUnits);
            },

            setTreeStructureForModel:function(oLoadingUnitsModel, aLoadingUnits){ //Struktur und Attribute für den Tree erstellen

                for(var i in aLoadingUnits){
                    var oCurerntLoadingUnit=aLoadingUnits[i]; //Aktuelles Objekt merken
                    oCurerntLoadingUnit.DetailedInformations={}; //Erstellen der neuen Struktur für Objekt
                    oCurerntLoadingUnit.DetailedInformations.label1=""; //Attribut für die View erstellen
                    //Contatination der Strings
                    oCurerntLoadingUnit.DetailedInformations.label1=oCurerntLoadingUnit.amount + "x " + oCurerntLoadingUnit.articleCaption;
                }
                oLoadingUnitsModel.refresh();
                this.setReceivedLoadingUnitsModel(aLoadingUnits);
            },

            setReceivedLoadingUnitsModel:function(aLoadingUnits){ //Setzen der Erhaltenen NVEs in ein Model für die Anzeige
                var oReceivedLoadingUnitsModel=this.getOwnerComponent().getModel("ReceivedLoadingUnitsModel");
                //const aStableLoadingUnits=aLoadingUnits.slice(); //Schummeln um Array by Value zu Klonnen
                var aStableLoadingUnits=deepClone(aLoadingUnits); //deepClone ist der sichere Weg

                oReceivedLoadingUnitsModel.setProperty("/results", aStableLoadingUnits);
            },

            onClearingButtonPress:function(oEvent){
                this.getSelectedModelItem(oEvent);
            },

            getSelectedModelItem:function(oEvent){ //Das gedrueckte Element im Model erfassen
                var sParentNodeId=oEvent.getSource().getEventingParent().getParent().getId();  
                var aNveTreeItems=this.byId("NVETree").getItems();
                var aModelItems=this.getOwnerComponent().getModel("LoadingUnitsModel").getProperty("/results");

                var oTreeModelParent=Helper.findModelObjectSlimm(sParentNodeId, aNveTreeItems, aModelItems);
                //var oPressedModelObject=oTreeModelParent.DetailedInformations;

                this.setClearingNveModel(oTreeModelParent);
            },

            setClearingNveModel:function(oTreeModelParent){ //Uebergeordnete Struktur in das Klaer-Model setzen
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");

                oClearingNveModel.setProperty("/clearingNve", oTreeModelParent);
                this.nveClearingDialogOpen();
            },

            checkForRemainingNves:function(){ //Prüfen ob noch Nves zu quittieren sind
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");

                if(aRemainingNves.length>0){ //Wenn mehr als eine NVE zu quittieren ist
                    this.onReceiptAllRemainingNves(oLoadingUnitsModel, aRemainingNves);
                } else{
                    this.driverNveReceiptBackDescisionBox(); 
                }
            },

            onReceiptAllRemainingNves:function(oLoadingUnitsModel, aRemainingNves){ //NVEs werden alle quittiert
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für Quittierte NVEs dieser sitzung
                var aCurrentReceiptNves=oCurrentSittingReceiptNvesModel.getProperty("/results");
                var aUpdatedCurrentReceiptNves=aCurrentReceiptNves.concat(aRemainingNves); //Neues Array erstellen damit Model automatisch aktualisiert wird

                oCurrentSittingReceiptNvesModel.setProperty("/results", aUpdatedCurrentReceiptNves);
                oLoadingUnitsModel.setProperty("/results", []); //Model anpassen
            },

            checkForUnsavedNves:function(){ //In der View Auskommentiert
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für Quittierte NVEs dieser sitzung
                var aCurrentReceiptNves=oCurrentSittingReceiptNvesModel.getProperty("/results");

                if(aCurrentReceiptNves.length>0){ //Eine Nve wurde quittiert
                    this.driverNveReceiptDescisionBox(); //Abfragen ob diese Gespeichert werden soll
                } else{
                    this.navBackToQuittierung(); //Zurück zur vorherigen Seite
                }
            },


            driverNveReceiptDescisionBox:function(){
                MessageBox.show(
                    "Save changes bevor going back?", {
                        icon: MessageBox.Icon.INFORMATION,
                        title: "Unsaved changes!",
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.YES,
                        onClose: function (oAction) { 
                            if(oAction==="YES"){
                                this.onSave();
                            } else{
                                this.onAbortCurrentReceiptNves();
                            }
                        }.bind(this)
                    }
                );
            },

            driverNveReceiptBackDescisionBox:function(){
                MessageBox.show(
                    "Do you want to go back to Abladung?", {
                        icon: MessageBox.Icon.INFORMATION,
                        title: "NVEs completly received!",
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.YES,
                        onClose: function (oAction) { 
                            if(oAction==="YES"){
                                this.navBackToQuittierung();
                            } else{
                                
                            }
                        }.bind(this)
                    }
                );
            },

            onAbortCurrentReceiptNves:function(){ //Herstellen des Ursprünglichen zustandes der Bearbeitung
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für quittierte NVEs dieser sitzung
                var aCurrentReceiptNves=oCurrentSittingReceiptNvesModel.getProperty("/results");
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel"); //Noch nicht quittierte Nves
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/results");
                var aUpdatedLoadingUnits= aLoadingUnits.concat(aCurrentReceiptNves);

                oLoadingUnitsModel.setProperty("/results", aUpdatedLoadingUnits);
                this.emptyCurrentSittingNvesModel();
                this.navBackToQuittierung();
            },

            onSave:function(){ //Speichern des aktuellen zustandes der Bearbeitung; In der View auskommentiert
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für Quittierte NVEs dieser sitzung
                var oTotalReceiptNvesModel=this.getOwnerComponent().getModel("TotalReceiptNvesModel"); //Model für bereits vorher Quittierte NVEs
                var aCurrentReceiptNves=oCurrentSittingReceiptNvesModel.getProperty("/results");
                var aTotalReceiptNves=oTotalReceiptNvesModel.getProperty("/results");

                if(aCurrentReceiptNves.length>0){ //Wenn mindestens eine neue NVE quittiert wurde abfragen ob gespeichert werden soll
                    var aUpdatedTotalReceiptNves=aTotalReceiptNves.concat(aCurrentReceiptNves);//zusammenführen der Nves
                    oTotalReceiptNvesModel.setProperty("/results", aUpdatedTotalReceiptNves);
                    this.emptyCurrentSittingNvesModel();

                    MessageToast.show("Nves wurden gesichert!", {
                        duration: 1000,
                        width:"15em"
                    });
                } else{
                    //Keine Ahnung was gemacht werden soll, wenn keine Änderung stattgefunden hat.
                    MessageToast.show("Es gab keine Nves die inzwischen bearbeitet wurden!", {
                        duration: 1000,
                        width:"15em"
                    });
                }
                
            },

            emptyCurrentSittingNvesModel:function(){ //Erstmal vorhanden weil es eventuell nochmal gebraucht wird
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für quittierte NVEs dieser sitzung
                oCurrentSittingReceiptNvesModel.setProperty("/results", []);
            },

            nveClearingDialogConfirm:function(oEvent){ 
                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
                
                this.chekIfAtLeastOneErrorReasonIsSelected();
            },

            chekIfAtLeastOneErrorReasonIsSelected:function(){
                var oCurrentSittingClearingNvesModel=this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel"); //Model fier alle geklaeten NVEs
                var aCurrentClearingReasons=oCurrentSittingClearingNvesModel.getProperty("/results");
                var aQuantityOfSelectedReasons=this.getSelectedClearingReasonQuantity(aCurrentClearingReasons);

                if(aQuantityOfSelectedReasons.length>0){ //Mindestens 1 Klaergrund wurde ausgewaehlt
                    this.checkIfOnlyOneErrorReasonIsSelected(aQuantityOfSelectedReasons);
                } else{ //kein Klaergrund wurde ausgewaehlt
                    this.noClearingReasonSelectedError();
                }
        
               var oSelectedClearingReason="";
            },

            
            checkIfOnlyOneErrorReasonIsSelected:function(aQuantityOfSelectedReasons){
                var oCurrentSittingClearingNvesModel=this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel"); //Model fier alle geklaeten NVEs
                var oCurrentClearingReasons=oCurrentSittingClearingNvesModel.getProperty("/results");

                //Hier kann das Intervall beschränkt werden!
                //Bisher >0 --> untere Schranke gegeben
                //Hier >1 --> obere Schranke wird festgelegt 
                if(aQuantityOfSelectedReasons.length>1){ //Mindestens 1 Klaergrund wurde ausgewaehlt
                    this.tooManyErrorReasonsSelectedError();
                } else{ //kein Klaergrund wurde ausgewaehlt
                    this.setSelectedClearingAttributes(oCurrentClearingReasons);
                }
            },
            

            
            getSelectedClearingReasonQuantity:function(aCurrentClearingReasons){ //Gibt Array mit Anzahl der Selectierten Klaergruende zurueck
                //return Object.entries(aCurrentClearingReasons).filter(([, bool]) => bool).map(e => e[0]);
                var aAcumulatedErrorReasons=[];
                var aSelectedClearingReasons=[];
                for(var i in aCurrentClearingReasons){
                    if(aCurrentClearingReasons[i].value===true){
                        var aNewClearingReasonArray=[aCurrentClearingReasons[i]];
                        aAcumulatedErrorReasons=aSelectedClearingReasons.concat(aNewClearingReasonArray);
                    }
                }
                return aAcumulatedErrorReasons;
            },
            

            setSelectedClearingAttributes:function(oCurrentClearingReasons){ //Setzen der Klaergruende in die zu klaerende NVE
                var aSelectedAttributeWithValue=[];

                for (var i in oCurrentClearingReasons) { //Jedes Atrtibut wird durchlaufen
                    //console.log(`${property}: ${oCurrentClearingReasons[property]}`);
                    if(oCurrentClearingReasons[i].value===true){

                        var sPropertyName=oCurrentClearingReasons[i].Description;
                        var oAttributeWithValue={};
                        Object.defineProperty(oAttributeWithValue, sPropertyName, {
                            value: oCurrentClearingReasons[i].value,
                            writable: false,
                        });
                        var aNewAttributeObject=[oAttributeWithValue];

                        aSelectedAttributeWithValue=aSelectedAttributeWithValue.concat(aNewAttributeObject);
                    }
                }

                this.setClearingResonInNve(aSelectedAttributeWithValue); //Einzelner Reason
                this.setClearingResonsInNve(aSelectedAttributeWithValue); //Mehrere Reasons
            },

            setClearingResonInNve:function(aSelectedAttributeWithValue){
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");
                var oClearingNve=oClearingNveModel.getProperty("/clearingNve");

                //Einzelnes Objekt
                var oSelectedReason=aSelectedAttributeWithValue[0];
                Object.defineProperty(oClearingNve, "clearingReason", {
                    value: oSelectedReason
                });

                //Methode für das Entfernen der NVE aus dem Model und zwischenspeichern oder so
                this.nveClearingDialogClose();
            },

            setClearingResonsInNve:function(aSelectedAttributeWithValue){
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");
                var oClearingNve=oClearingNveModel.getProperty("/clearingNve");


                //Fue mehrere Klaergruende
                Object.defineProperty(oClearingNve, "aClearingReasons", {
                    value: aSelectedAttributeWithValue
                });

                //Methode für das Entfernen der NVE aus dem Model und zwischenspeichern oder so
                this.nveClearingDialogClose();
            },


            nveClearingDialogReject:function(){
                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
                this.nveClearingDialogClose();
            },

            onNveClearingDialogCallbackConfirm:function(){ //Bestaetigen im Dialog wurde geklickt
                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
                this.checkIfEnteredNveInList();
            },

            onNveClearingDialogCallbackReject:function(){ //Abbrechen im Dialog wurde geklickt

                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
                this.onManualNveInputFragmentClose();
            },

            checkIfEnteredNveInList:function(){
                //Hier muss dann nach bestimmten Werten geprüft werden ob die NVE existiert
                var oManualNveInputModel=this.getOwnerComponent().getModel("manualNveInputModel");
                var sManualNveUserInput=oManualNveInputModel.getProperty("/manualInput");
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel"); //Model für Quittierte NVEs
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/results");
                var sExternalId;
                var sArticleId;
                var oEnteredLoadingUnit=undefined;
                
                //Leider nicht zu verallgemeinern, da sehr spezifisch --> Oder eben sArticleId anstatt 'Objekt.externalId'
                for(var i in aLoadingUnits){
                    var sLabelId=aLoadingUnits[i].label1.substring(0, aLoadingUnits[i].label1.indexOf(" "));
                    if(sLabelId===sManualNveUserInput){
                        oEnteredLoadingUnit=aLoadingUnits[i];
                    }
                }

                this.removeEnteredLoadingUnit(oEnteredLoadingUnit);
            },

            removeEnteredLoadingUnit:function(oEnteredLoadingUnit){
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");
                var iIndexOfLoadingUnit=aRemainingNves.indexOf(oEnteredLoadingUnit);

                if(iIndexOfLoadingUnit!==-1){ //Wenn Nve in der Liste
                    //TODO: Hier andere Möglichkeit nutzen, damit Model automatisch auf der View aktualisiert wird
                    aRemainingNves.splice(iIndexOfLoadingUnit, 1);
                    oLoadingUnitsModel.refresh();
                    this.receiptEnteredLoadingUnit(oEnteredLoadingUnit);
                } else{ //Wenn Nve nicht in der Liste
                    this.noNveFoundError();
                    //Optional, da ggf. der gescannte Barcode angezeigt bleiben soll
                    //this.clearManualNveInput(); 
                }
                
            },

            receiptEnteredLoadingUnit:function(oEnteredLoadingUnit){
                var oCurrentSittingReceiptNvesModel=this.getOwnerComponent().getModel("CurrentSittingReceiptNvesModel"); //Model für Quittierte NVEs
                var aCurrentReceiptNves=oCurrentSittingReceiptNvesModel.getProperty("/results"); //Merken des vorherigen Zustandes
                var aEnteredLoadingUnit=[oEnteredLoadingUnit]; //Erstellen eines Arrays mit quittierter NVE
                var aUpdatedCurrentReceiptNves=aCurrentReceiptNves.concat(aEnteredLoadingUnit); //Erstellen eines Arrays mit alten NVEs und quittierter NVE darin

                oCurrentSittingReceiptNvesModel.setProperty("/results", aUpdatedCurrentReceiptNves); //Setzen der neuen NVEs in das Model
                //oTotalReceiptNvesModel.refresh();
                this.onManualNveInputFragmentClose();
            },

            setInputFocus:function(){
                this.getView().byId("barcodeInput").focus();
            },

            clearManualNveInput:function(){
                var oManualNveInputModel=this.getOwnerComponent().getModel("manualNveInputModel");

                oManualNveInputModel.setProperty("/manualInput", "");
            },

            noNveFoundError:function(){
                MessageBox.error(this._oBundle.getText("noNveFound"), {
                    onClose:function(){
                        //NOP:
                    }.bind(this)
                });
            },

            showNotAllNvesProcessedError:function(){
                MessageBox.error(this._oBundle.getText("nvsUnbe"), {
                    onClose:function(){
                        //NOP:
                    }.bind(this)
                });
            },

            tooManyErrorReasonsSelectedError:function(){
                MessageBox.error(this._oBundle.getText("tooManyClearingResonsSelected"), {
                    onClose:function(){
                        //NOP:
                    }.bind(this)
                });
            },

            noClearingReasonSelectedError:function(){
                MessageBox.error(this._oBundle.getText("noClearingResonSelected"), {
                    onClose:function(){
                        //NOP:
                    }.bind(this)
                });
            },

            navBackToQuittierung:function(){
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Quittierung");
            },




            addCameraPlayerToCameraDialog:function(){ //Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
                this.onPhotoTypesSelectChange(); //Initiales setzen des Models für die gemachten Fotos
                var oVideoContainer = this.byId("photoDialogClearingVideoFeedContainer"); 
                oVideoContainer.setContent("<video id='clearingVideoPlayer' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
                this.enableVideoStream();
            },

            onPhotoTypesSelectChange:function(){

            },

            enableVideoStream:function(){// Video starten
                navigator.mediaDevices.getUserMedia({  video:true  })
                .then((stream) => {
                    clearingVideoPlayer.srcObject = stream;
                });
            },

            disableVideoStreams:function(){//Video beenden
                var oVideoStream = document.getElementById("clearingVideoPlayer");
                if (oVideoStream) {
                    var oMediaStream = oVideoStream.srcObject;
                    if (oMediaStream) {
                        oMediaStream.getTracks().forEach(track => track.stop());
                    }
                }
            },

            checkIfPhotoNeedsToBeCleared:function(){ //Prüfen ob bereits ein Foto angezeigt wird
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                var oSavedPhoto=oPhotoModel.getProperty("/photo");

                if(Object.keys(oSavedPhoto).length !== 0){ //Wenn Objekt Attribute enthält, vermeindliches Foto loeschen
                    this.clearPhotoModel();
                } 

                this.onSnappPicture();
            },

            onSnappPicture:function(){ //(neues) Foto machen
                var oVideoFeed=document.getElementById("clearingVideoPlayer"); //VideoStream
                var canvas=document.createElement('canvas');
                var context = canvas.getContext('2d');
                var oDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit
                var sParentNodeId=this.getView().byId("ClearingList").getSelectedItem().getId(); 
                var aClearingListItems=this.getView().byId("ClearingList").getItems();
                var oCurrentSittingClearingNvesModel=this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel").getProperty("/results");
                
                var oSelectedModelItem=Helper.findModelObjectSlimm(sParentNodeId, aClearingListItems, oCurrentSittingClearingNvesModel);

                canvas.width = oVideoFeed.videoWidth;
                canvas.height = oVideoFeed.videoHeight;
                context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

                var oImageData=canvas.toDataURL("image/png"); //Base 64 encoded Bild-String

                var oImage= {
                    src: oImageData,
                    width: "100%",
                    height: "auto",
                    dateAndTime: oDateAndTime,
                    photoType: oSelectedModelItem.Description,
                    fileName: oDateAndTime + ".png",
                    mediaType: "image/png",
                    uploadState: "Ready"
                }; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

                this.saveNewImage(oImage);
            },

            saveNewImage:function(oImage){ //Speichern von zu letzt geschossenem Foto
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                oPhotoModel.setProperty("/photo", oImage);
                //this.setNewPhotoInPhotoList(oImage);
                oPhotoModel.refresh();
            },

            clearPhotoModel:function(){
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); //Model in dem das geschossene Foto gespeichert wird

                oPhotoModel.setProperty("/photo", {});
            },

            onOpenPhotoDialogClearing:function(){
                this.oPhotoDialogClearing ??= this.loadFragment({
                    name: "podprojekt.view.fragments.photoDialogClearing",
                });
          
                this.oPhotoDialogClearing.then((oDialog) => oDialog.open());
            },

            onPhotoDialogClearingClose:function(){
                this.disableVideoStreams();
                this.clearPhotoModel();
                this.byId("photoDialogClearing").close();
            },

            onCheckIfPhotoTaken:function(){
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //'Geschossenes' Foto

                //Muss geprüft werden weil Model-Inhalt leeres Objekt ist
                if(Object.keys(oTakenPhoto).length !== 0){ //Wenn Objekt Attribute enthält, exisitert ein Foto
                    this.confirmFoto();
                } else{
                    MessageToast.show("Es wurde kein Foto geschossen!", {
                        duration: 1000,
                        width:"15em"
                    });
                }
            },

            confirmFoto:function(){ //Foto bestätigen und übernehmen
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //Geschossenes Foto

                var oPhotoModelUnloadingModel=this.getOwnerComponent().getModel("PhotoModelUnloading");//Model mit gespeichertem Foto-Typ
                var aPhotoModelUnloading=oPhotoModelUnloadingModel.getProperty("/results"); //Selektierter Foto-Typ 
                var bEnoughSpace=this.checkPhotoLimit(); //Platz für weitere Fotos?

                if(bEnoughSpace===true){
                    var aNewPhoto=[oTakenPhoto]; //Erstellen eines Arrays mit Aktuellem Foto
                    var aUpdatedPhotos=aPhotoModelUnloading.concat(aNewPhoto); //Erstellen eines Arrays mit alten Fotos und neuem Foto darin
                    oPhotoModelUnloadingModel.setProperty("/results", aUpdatedPhotos);//Setzen der neuen Fotos in das Model
                    //this.refreshFragmentTitle(oPhotoTypeSelectedModel);
                } else{
                    this.showNotEnoughSpaceError();
                }
                this.clearPhotoModel();
                
            },

            checkPhotoLimit:function(){ //Wirft eine Fehlermeldung, wenn Menge an Fotos überschritten wird
                
                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoModelUnloading");//Model mit gespeichertem Foto-Typ
                var oSelectedType=oPhotoTypeSelectedModel.getProperty("/results"); //Selektierter Foto-Typ 
                var iAllowedPhotos=5;//TODO: hier kann angepasst werden ob die maximale Anzahl Fotos stimmt
                var bEnoughSpace=true;

                if(oSelectedType.length === iAllowedPhotos){
                    bEnoughSpace=false;
                }
                
                return bEnoughSpace;
            },

            showNotEnoughSpaceError:function(){
                MessageBox.error(this._oBundle.getText("notEnoughSpace"),{
                    onClose: function() {
                        //Bisher funktionslos
                    }.bind(this)
                });
            },
            















            nveClearingDialogOpen:function(){ //Oeffnen des Klaer-Dialoges
                this.oNveClearingDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.nveClearingDialog",
                });
          
                this.oNveClearingDialog.then((oDialog) => oDialog.open());
            },

            nveClearingDialogClose:function(){ //Schließen des Klaer-Dialoges
                this.byId("clearDialog").close();
            },

            onManualNveInputFragmentOpen:function(){ //Oeffnen des Handeingabe fragmentes
                this.oManualNveInputDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.manualNveInput",
                });
          
                this.oManualNveInputDialog.then((oDialog) => oDialog.open());
            },

            onManualNveInputFragmentClose:function(){ //Schließen des Handeingabe fragmentes
                this.byId("ManualNveInputDialogId").close();
                this.clearManualNveInput();
            },

            onBreakpoint:function(){ //Breakpoint für den Debugger
                console.log("Break!");
            }
        });
    });
