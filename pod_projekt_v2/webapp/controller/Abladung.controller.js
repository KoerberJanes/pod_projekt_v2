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

                this.nveClearingDialogClose();
            },

            setClearingResonsInNve:function(aSelectedAttributeWithValue){
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");
                var oClearingNve=oClearingNveModel.getProperty("/clearingNve");


                //Fue mehrere Klaergruende
                Object.defineProperty(oClearingNve, "aClearingReasons", {
                    value: aSelectedAttributeWithValue
                });

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
                
                //Leider nicht zu verallgemeinern, da sehr spezifisch
                for(var i in aLoadingUnits){
                    sExternalId=aLoadingUnits[i].externalId; //Oder eben sArticleId
                    if(sExternalId===sManualNveUserInput){ //Oder eben articleId
                        oEnteredLoadingUnit=aLoadingUnits[i];
                    } 
                }

                this.removeEnteredLoadingUnit(oEnteredLoadingUnit);
                this.receiptEnteredLoadingUnit(oEnteredLoadingUnit);
            },

            removeEnteredLoadingUnit:function(oEnteredLoadingUnit){
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");
                var iIndexOfLoadingUnit=aRemainingNves.indexOf(oEnteredLoadingUnit);

                if(iIndexOfLoadingUnit!==-1){
                    aRemainingNves.splice(iIndexOfLoadingUnit, 1);
                }
                oLoadingUnitsModel.refresh();
            },

            

            selectOnlyThis:function(oEvent){
                var sEventId=oEvent.getSource().getId();
                var oList=this.getView().byId("checkBoxList");

                for(var i in oList){
                    oList[i].setSelected
                }

                console.log("Success");
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
            },

            onBreakpoint:function(){ //Breakpoint für den Debugger
                console.log("Break!");
            }
        });
    });
