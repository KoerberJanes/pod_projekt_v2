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
                    "shipmentConditionCaption": oTourInformation.shipmentConditionCaption,
                    "aTempClearedNVEs": [],
                    "aTotalClearedNves": [],
                    "aTempLoadedNVEs": [],
                    "aTotalLoadedNVEs": [],
                    "aUnprocessedNumberedDispatchUnits": [],
                    "aConstNumberedDispatchUnits": []
                };

                oTourInformation.aDeliveryNotes=[];
                var aNewDeliveryNotes=oTourInformation.aDeliveryNotes.concat([oNewDeliveryNote]);
                oStopInformationModel.setProperty("/tour/aDeliveryNotes", aNewDeliveryNotes);
                this.linkNvesToDeliveryNote();
                this.onNavToQuittierung();
            },

            linkNvesToDeliveryNote:function(){ //Provisorische Methode
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var aLoadingUnits=oStopInformationModel.getProperty("/tour/loadingUnits");
                var aDeliveryNotes=oStopInformationModel.getProperty("/tour/aDeliveryNotes");
                var sDeliveryNoteShipmentNumber= aDeliveryNotes[0].shipmentNumber;//Angenommen, dass es nur einen Lieferschein gibt

                for(var i in aLoadingUnits){ //Alle Nves des Lieferscheins durchgehen
                    var oCurrentLoadingUnit=aLoadingUnits[i]; 
                    oCurrentLoadingUnit.deliveryNoteShipmentNumber= sDeliveryNoteShipmentNumber; //Erstellen und Beschreiben eines neuen Attributes um die Zuordnung zum Lieferschein zu machen
                }

                oStopInformationModel.setProperty("/tour/aDeliveryNotes/0/aUnprocessedNumberedDispatchUnits", aLoadingUnits);//Angenommen, dass es nur einen Lieferschein gibt
            },

            onNavToQuittierung:function(){ //Navigation zur Quittierung View
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Quittierung");
            },
        });
    });
