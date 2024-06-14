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

            onCheckTreeItemPress:function(oEvent){ //Pruefen ob eine untergeordnete Struktur ausgewaehlt wurde
                var sLevelOfPressedObject=oEvent.getSource().getLevel();
                
                if(sLevelOfPressedObject==="0"){
                    //Fehler Meldung oder sonst was
                }else{
                    this.getSelectedModelItem(oEvent);
                }
            },

            getSelectedModelItem:function(oEvent){ //Das gedrueckte Element im Model erfassen
                var sParentNodeId=oEvent.getSource().getParentNode().getId();
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

            checkForRemainingNves:function(){
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");

                if(aRemainingNves.length>0){ //Wenn mehr als eine NVE zu quittieren ist
                    this.onReceiptAllRemainingNves(oLoadingUnitsModel, aRemainingNves);
                }
            },

            onReceiptAllRemainingNves:function(oLoadingUnitsModel, aRemainingNves){
                var oReceiptNvesModel=this.getOwnerComponent().getModel("ReceiptNvesModel"); //Model für Quittierte NVEs
                var aReceiptNves=oReceiptNvesModel.getProperty("/results");

                for(var i in aRemainingNves){
                    aReceiptNves.concat(aRemainingNves[i]); //Jede NVE in das Quittierte Model schieben
                }

                oLoadingUnitsModel.setProperty("/results", []); //Model anpassen
                
            },

            onSave:function(){
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");

                if(aRemainingNves.length>0){
                    this.showNotAllNvesProcessedError();
                } else{
                    this.navBackToQuittierung();
                }
            },

            nveClearingDialogConfirm:function(){ 
                //Platz fuer zusaetzliche Funktionen, die gemacht werden können

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

            receiptEnteredLoadingUnit:function(oEnteredLoadingUnit){
                var oReceiptNvesModel=this.getOwnerComponent().getModel("ReceiptNvesModel"); //Model für Quittierte NVEs
                var aReceiptNves=oReceiptNvesModel.getProperty("/results"); //Merken des vorherigen Zustandes
                var aEnteredLoadingUnit=[oEnteredLoadingUnit]; //Erstellen eines Arrays mit quittierter NVE
                var aUpdatedReceiptNves=aReceiptNves.concat(aEnteredLoadingUnit); //Erstellen eines Arrays mit alten NVEs und quittierter NVE darin

                oReceiptNvesModel.setProperty("/results", aUpdatedReceiptNves); //Setzen der neuen NVEs in das Model
                oReceiptNvesModel.refresh();
                this.onManualNveInputFragmentClose();
            },

            showNotAllNvesProcessedError:function(){
                MessageBox.error(this._oBundle.getText("nvsUnbe"), {
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
