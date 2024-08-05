sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast) {
        "use strict";

        return Controller.extend("podprojekt.controller.StopInformation", {
            onInit: function () {

            },

            onAfterRendering: function() {
                
            },

            onPressBtnAvisNr: function(oEvent){ //Natives anrufen der Telefonnummer
                var sPhoneAvis=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour/phoneAvis");

                sap.m.URLHelper.triggerTel(sPhoneAvis);
            },

            onNavToMap:function(){ //Navigation zur GeoMap View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("MapView");
            },

            onCreateDeliveryNote:function(){
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var oTourInformation=oStopInformationModel.getProperty("/tour");
                var oNewDeliveryNote={
                    "shipmentNumber": oTourInformation.shipmentNumber,
                    "shipmentCondition": oTourInformation.shipmentCondition,
                    "shipmentConditionCaption": oTourInformation.shipmentConditionCaption
                };

                oTourInformation.aDeliveryNotes=[];
                var aNewDeliveryNotes=oTourInformation.aDeliveryNotes.concat([oNewDeliveryNote]);
                oStopInformationModel.setProperty("/tour/aDeliveryNotes", aNewDeliveryNotes);
                this.onNavToQuittierung();
            },

            onNavToQuittierung:function(){ //Navigation zur Quittierung View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Quittierung");
            },
        });
    });
