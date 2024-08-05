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
                    this.onLoadAllRemainingNves(oLoadingUnitsModel, aRemainingNves);
                } else{
                    this.driverNveReceiptBackDescisionBox(); 
                }
            },

            onLoadAllRemainingNves:function(oLoadingUnitsModel, aRemainingNves){ //NVEs werden alle quittiert

                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel"); //Temp verladene Nves Model
                var aLoadingNvesTemp=oLoadingNvesTempModel.getProperty("/results"); //verladene Nves
                var aUpdatedLoadingNvesTemp=aLoadingNvesTemp.concat(aRemainingNves); //zusammenfuehren der Nves

                oLoadingNvesTempModel.setProperty("/results", aUpdatedLoadingNvesTemp); //Model der Temp verladenen Nves fuellen
                oLoadingUnitsModel.setProperty("/results", []); //Model der noch zu bearbeitenden Nves leeren
            },

            checkForUnsavedNves:function(){ //In der View Auskommentiert
                var oClearingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel"); //Temp geklaerte Nves Model
                var aClearingNvesTemp=oClearingNvesTempModel.getProperty("/results"); //geklaerte Nves

                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel");  //Temp verladene Nves Model
                var aLoadingNvesTemp=oLoadingNvesTempModel.getProperty("/results"); //verladene Nves

                if(aClearingNvesTemp.length > 0 || aLoadingNvesTemp.length > 0){ //Mindestens eine Nve wurde entweder verladen oder geklaert
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
                                this.onSaveAllTempStoredNVEs();
                                this.navBackToQuittierung();
                            } else{
                                this.AbortCurrentLoadedAndClearedNves();
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

            AbortCurrentLoadedAndClearedNves:function(){
                var oClearingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel"); //Temp geklaerte Nves Model
                var aClearingNvesTemp=oClearingNvesTempModel.getProperty("/results"); //geklaerte Nves

                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel");  //Temp verladene Nves Model
                var aLoadingNvesTemp=oLoadingNvesTempModel.getProperty("/results"); //verladene Nves

                var oLoadingUnitsModel=this.getOwnerComponent().getModel("StopInformationModel"); //Offene Nves Model
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/tour/loadingUnits"); //Noch nicht quittierte Nves

                var aAccumulatedTempNves=aClearingNvesTemp.concat(aLoadingNvesTemp); //Temp verladen und geklaerte Nves zusammenfassen
                var aUpdatedLoadingUnits=aLoadingUnits.concat(aAccumulatedTempNves); //Zusammengefaste Nves mit den unbearbeiteten zusmmenfassen

                oLoadingUnitsModel.setProperty("/tour/loadingUnits", aUpdatedLoadingUnits);
                this.emptyTempClearedAndLoadedModels();
                this.navBackToQuittierung();
            },

            checkIfNvesWhereLoaded:function(){
                var bTempLoadedNves=false;
                var aLoadingNvesTemp=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel").getProperty("/results"); //verladene Nves

                if(aLoadingNvesTemp.length > 0){
                    bTempLoadedNves=true;
                }
                return bTempLoadedNves;
            },

            checkIfNvesWhereCleared:function(){
                var bTempClearedNves=false;
                var aClearingNvesTemp=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel").getProperty("/results"); //geklaerte Nves

                if(aClearingNvesTemp.length > 0){
                    bTempClearedNves= true;
                }

                return bTempClearedNves;
            },

            checkIfSavingIsNesseccary:function(){
                if(!this.checkIfNvesWhereCleared() && !this.checkIfNvesWhereLoaded()){ //Wenn weder geklaert noch verladen wurde --> Message Toast
                    MessageToast.show(this._oBundle.getText("noProcessedNves"), {
                        duration: 1000,
                        width:"15em"
                    });
                } else{
                    this.onSaveAllTempStoredNVEs();
                }
            },

            onSaveAllTempStoredNVEs:function(){
                var oClearingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel"); //Temp geklaerte Nves Model
                var aClearingNvesTemp=oClearingNvesTempModel.getProperty("/results"); //geklaerte Nves

                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel");  //Temp verladene Nves Model
                var aLoadingNvesTemp=oLoadingNvesTempModel.getProperty("/results"); //verladene Nves

                var oTotalClearedNvesModel=this.getOwnerComponent().getModel("TotalClearedNvesModel"); //Model fuer gespeicherte geklaerte Nves
                var oTotalLoadedNvesModel=this.getOwnerComponent().getModel("TotalLoadedNvesModel"); //Model fuer gespeicherte verladene Nves

                if(this.checkIfNvesWhereCleared()){ //bTempClearedNves
                    var aUpdatedTotalClearedNves=oTotalClearedNvesModel.getProperty("/results").concat(aClearingNvesTemp);//zusammenführen der Nves
                    oTotalClearedNvesModel.setProperty("/results", aUpdatedTotalClearedNves);
                }

                if(this.checkIfNvesWhereLoaded()){//bTempLoadedNves
                    var aUpdatedTotalLoadedNves=oTotalLoadedNvesModel.getProperty("/results").concat(aLoadingNvesTemp);//zusammenführen der Nves
                    oTotalLoadedNvesModel.setProperty("/results", aUpdatedTotalLoadedNves);
                }

                this.emptyTempClearedAndLoadedModels(); //Leeren der Temporaeren Nves
            },

            emptyTempClearedAndLoadedModels:function(){
                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel");  //Temp verladene Nves Model
                var oClearingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel"); //Temp geklaerte Nves Model

                oLoadingNvesTempModel.setProperty("/results", []);
                oClearingNvesTempModel.setProperty("/results", []);
                //this.navBackToQuittierung();
                this.showSavingSuccessfullMessage();
            },
            
            nveClearingDialogConfirm:function(){ 
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
                    this.selectError();
                }
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

                oClearingNve.clearingReason={}; //Neues Attribut fuer die Nve erstellen
                var oClearingReason=aSelectedAttributeWithValue[0]; //da nur ein Klaergrund mitgegeben werden kann
                oClearingNve.clearingReason=oClearingReason; //Attribut mit Infos fuellen

                //Undefined ist notwendig um die verschiedenen Dialoge auseinander zu halten.
                this.findClearingNve(undefined);
            },

            setClearingResonsInNve:function(aSelectedAttributeWithValue){
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");
                var oClearingNve=oClearingNveModel.getProperty("/clearingNve");

                oClearingNve.aClearingReasons={}; //Neues Attribut fuer die Nve erstellen
                oClearingNve.aClearingReasons=aSelectedAttributeWithValue; //Attribut mit Infos fuellen

                //Nur einkommentieren, wenn die setClearingReasonInNve-Methode nicht verwendet wird.
                //Diese Methode wird nur nicht verwendet, wenn mehrere Klaergruende fuer eine Nve verwendet werden koennen
                //this.findClearingNve(); 
            },


            nveClearingDialogReject:function(){
                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
                this.nveClearingDialogClose();
            },            

            findClearingNve:function(oEvent){ //Ganantiert ein Klaer-Objekt vorhanden durch vorherige zwischenschritte
                //Klaer-Objekt finden
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel"); //Model der zu klaerenden Nve
                var oClearingNve=oClearingNveModel.getProperty("/clearingNve"); //Einzelne klaer-Nve
                this.differenciateNveProcessingType(oClearingNve, oEvent); //Schnittstelle von Klaer- und Verlade-Nves
            },

            findLoadingNve:function(oEvent){
                //Verlade-Objekt finden
                var oManualNveInputModel=this.getOwnerComponent().getModel("manualNveInputModel");
                var sManualNveUserInput=oManualNveInputModel.getProperty("/manualInput"); //UserInput aus Feld auslesen
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("StopInformationModel"); //Model für noch zu bearbeitende NVEs
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/tour/loadingUnits"); //Array aus zu bearbeitenden Nves
                var oLoadingNve=undefined;
                
                //Leider nicht zu verallgemeinern, da sehr spezifisch --> Oder eben 'Objekt.sArticleId' anstatt 'Objekt.externalId'
                for(var i in aLoadingUnits){
                    var sLabelId=aLoadingUnits[i].label1.substring(0, aLoadingUnits[i].label1.indexOf(" "));
                    if(sLabelId===sManualNveUserInput){
                        oLoadingNve=aLoadingUnits[i];
                    }
                }

                if(oLoadingNve!==undefined){
                    this.differenciateNveProcessingType(oLoadingNve, oEvent);
                } else{
                    this.noNveFoundError();
                }
            },
            
            differenciateNveProcessingType:function(oDiffNve, oEvent){
                var sManualNveInputDialogTitle=this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("manualInputTitle");

                if(oEvent === undefined){ //Handelt sich um den Klaer-Dialog als Ausgangspunkt
                    this.saveTempClearing(oDiffNve); //Geklaerte Nve speichern
                } else{ //Handelt sich um den ManualClearing-Dialog als Ausgangspunkt, Titel des Dialoges speichern
                    var sDialogTitle= oEvent.getSource().getParent().getTitle();
                }
                if(sDialogTitle=== sManualNveInputDialogTitle){ //Abgleichen von Soll-Titel und Ist-Titel
                    this.saveTempLoading(oDiffNve); //Geklaerte Nve speichern
                }
            },

            saveTempClearing:function(oClearingNve){
                var oClearingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingClearedNvesModel");
                var aClearingNvesTemp=oClearingNvesTempModel.getProperty("/results");

                var aClearingUnit=[oClearingNve];//Erstellen eines Arrays mit quittierter NVE
                var aUpdatedClearingNvesTemp=aClearingNvesTemp.concat((aClearingUnit));//Erstellen eines Arrays mit alten NVEs und quittierter NVE darin

                oClearingNvesTempModel.setProperty("/results", aUpdatedClearingNvesTemp);//Setzen der neuen NVEs in das Model
                this.removeProcessedNve(oClearingNve);
            },

            saveTempLoading:function(oLoadingNve){
                var oLoadingNvesTempModel=this.getOwnerComponent().getModel("CurrentSittingLoadedNvesModel");
                var aLoadingNvesTemp=oLoadingNvesTempModel.getProperty("/results");

                var aLoadingUnit=[oLoadingNve];//Erstellen eines Arrays mit quittierter NVE
                var aUpdatedLoadingNvesTemp=aLoadingNvesTemp.concat((aLoadingUnit));//Erstellen eines Arrays mit alten NVEs und quittierter NVE darin

                oLoadingNvesTempModel.setProperty("/results", aUpdatedLoadingNvesTemp);//Setzen der neuen NVEs in das Model
                this.removeProcessedNve(oLoadingNve);
            },

            removeProcessedNve:function(oDiffNve){
                //NVE wurde entweder geklärt oder verladen --> entfernen aus dem Model der NVEs ("LoadingUnitsModel")
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("StopInformationModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/tour/loadingUnits");
                var iIndexOfLoadingUnit=aRemainingNves.indexOf(oDiffNve);

                aRemainingNves.splice(iIndexOfLoadingUnit, 1);
                oLoadingUnitsModel.refresh();

                this.decideWichDialogShouldBeClosed();                
            },

            decideWichDialogShouldBeClosed:function(){
               var oManualNveInputDialog=this.getView().byId("ManualNveInputDialogId");
               var oClearDialog=this.getView().byId("clearDialog");
                
                if(oManualNveInputDialog!==undefined){
                    this.onManualNveInputFragmentClose();
                }
                
                if(oClearDialog!==undefined){
                    this.nveClearingDialogClose();
                }
                
            },

            onNveClearingDialogCallbackReject:function(){ //Abbrechen im Dialog wurde geklickt

                //Platz fuer zusaetzliche Funktionen, die gemacht werden können
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
                MessageBox.error(this._oBundle.getText("notAllNvesProcessed"), {
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
                var oSelectedItem = this.getView().byId("ClearingList").getSelectedItem();
                var sParentNodeId=oSelectedItem.getId(); 
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

            selectCheck:function(){
                var oSelectedItem = this.getView().byId("ClearingList").getSelectedItem();
                if(oSelectedItem){
                    this.onOpenPhotoDialogClearing();
                }else{
                    this.selectError();
                }
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
                    MessageToast.show(this._oBundle.getText("noPictureTaken"), {
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

            showSavingSuccessfullMessage:function(){
                MessageToast.show(this._oBundle.getText("successfullyLoadedNves"), {
                    duration: 1000,
                    width:"15em"
                });
            },

            showNotEnoughSpaceError:function(){
                MessageBox.error(this._oBundle.getText("notEnoughPhotoSpace"),{
                    onClose: function() {
                        //Bisher funktionslos
                    }.bind(this)
                });
            },

            selectError:function(){
                MessageBox.error(this._oBundle.getText("noSelectedItem"), {
                    onClose:function(){
                        //NOP:
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
