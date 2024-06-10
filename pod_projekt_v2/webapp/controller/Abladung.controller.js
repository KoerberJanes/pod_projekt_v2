sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
	"podprojekt/utils/Helper",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Button, Dialog, JSONModel, MessageToast, MessageBox, Helper) {
        "use strict";

        return Controller.extend("podprojekt.controller.Abladung", {
            onInit: function () {

            },

            onAfterRendering: function() {
                this.alterLoadingUnitsModelDescription();
            },

            alterLoadingUnitsModelDescription:function(){ //Anpassung der Beschreibung, damit alles so aussieht wie auf der Vorlage
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aLoadingUnits=oLoadingUnitsModel.getProperty("/results");

                for(var i in aLoadingUnits){
                    var sOldLoadingUnitDescription=aLoadingUnits[i].label1;
                    var sLodingDeviceTypeCaption=aLoadingUnits[i].lodingDeviceTypeCaption;

                    aLoadingUnits[i].label1=sOldLoadingUnitDescription + " " + sLodingDeviceTypeCaption;
                }
                this.setTreeStructureForModel(oLoadingUnitsModel, aLoadingUnits);
            },

            setTreeStructureForModel:function(oLoadingUnitsModel, aLoadingUnits){

                for(var i in aLoadingUnits){
                    var oCurerntLoadingUnit=aLoadingUnits[i];
                    oCurerntLoadingUnit.DetailedInformations={}; //Erstellen der unteren Struktur
                    oCurerntLoadingUnit.DetailedInformations.label1="";

                    oCurerntLoadingUnit.DetailedInformations.label1=oCurerntLoadingUnit.amount + "x " + oCurerntLoadingUnit.articleCaption;
                }
                oLoadingUnitsModel.refresh();
            },

            onCheckTreeItemPress:function(oEvent){
                var sLevelOfPressedObject=oEvent.getSource().getLevel();
                
                if(sLevelOfPressedObject==="0"){
                    //Fehler Meldung oder sonst was
                }else{
                    this.getSelectedModelItem(oEvent);
                }
            },

            getSelectedModelItem:function(oEvent){
                var sParentNodeId=oEvent.getSource().getParentNode().getId();
                var aNveTreeItems=this.byId("NVETree").getItems();
                var aModelItems=this.getOwnerComponent().getModel("LoadingUnitsModel").getProperty("/results");

                var oTreeModelParent=Helper.findModelObjectSlimm(sParentNodeId, aNveTreeItems, aModelItems);
                //var oPressedModelObject=oTreeModelParent.DetailedInformations;

                this.setClearingNveModel(oTreeModelParent);
            },

            setClearingNveModel:function(oTreeModelParent){
                var oClearingNveModel=this.getOwnerComponent().getModel("nveClearingDialogModel");

                oClearingNveModel.setProperty("/clearingNve", oTreeModelParent);

                this.nveClearingDialogOpen();
            },

            nveClearingDialogConfirm:function(){
                
            },

            nveClearingDialogOpen:function(){
                this.oNveClearingDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.nveClearingDialog",
                });
          
                this.oNveClearingDialog.then((oDialog) => oDialog.open());
            },

            nveClearingDialogClose:function(){
                this.byId("clearDialog").close();
            },

            onManualNveInputFragmentOpen:function(){
                this.oManualNveInputDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.manualNveInput",
                });
          
                this.oManualNveInputDialog.then((oDialog) => oDialog.open());
            },

            onManualNveInputFragmentClose:function(){
                this.byId("ManualNveInputDialogId").close();
            },

            onBreakpoint:function(){
                console.log("Break!");
            }
        });
    });
