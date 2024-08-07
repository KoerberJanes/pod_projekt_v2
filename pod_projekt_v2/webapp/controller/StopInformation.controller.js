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
                this.alterDeliveryNoteType();
                this.linkNvesToDeliveryNote();
                this.onNavToQuittierung();
            },

            alterDeliveryNoteType:function(){
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var i18nModel=this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var aLoadingUnits=oStopInformationModel.getProperty("/tour/loadingUnits");
                var aDeliveryNotes=oStopInformationModel.getProperty("/tour/aDeliveryNotes");
                var oDeliveryNote=aDeliveryNotes[0]; //Angenommen, dass es nur einen Lieferschein gibt
                //Es wurde aus vorsicht in der manifest.json schonmal als Array angegeben, daher der Aufwand

                //?Hier wird angenommen, dass es sich immer um reine Abladungen oder Retouren handelt
                var checkReturning= (element) => element.isReturning === true;

                if(aLoadingUnits.some(checkReturning)){ //Wenn true --> DeliveryNote eine Retoure
                    oDeliveryNote.deliveryType=i18nModel.getText("returning");
                } else{ //Wenn false -_> DeliverNote ist Abladung
                    oDeliveryNote.deliveryType=i18nModel.getText("unloading");
                }
            },

            linkNvesToDeliveryNote:function(){ //Provisorische Methode
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var aLoadingUnits=oStopInformationModel.getProperty("/tour/loadingUnits");
                var aDeliveryNotes=oStopInformationModel.getProperty("/tour/aDeliveryNotes");
                var oDeliveryNote=aDeliveryNotes[0]; //Angenommen, dass es nur einen Lieferschein gibt
                //Verbindet NVEs mit Lieferschein. Zumindest dem Aktuellen.
                var sDeliveryNoteShipmentNumber= oDeliveryNote.shipmentNumber;

                for(var i in aLoadingUnits){ //Alle Nves des Lieferscheins durchgehen
                    var oCurrentLoadingUnit=aLoadingUnits[i]; 
                    oCurrentLoadingUnit.deliveryNoteShipmentNumber= sDeliveryNoteShipmentNumber; //Erstellen und Beschreiben eines neuen Attributes um die Zuordnung zum Lieferschein zu machen
                }
            },

            onNavToQuittierung:function(){ //Navigation zur Quittierung View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Quittierung");
            },
        });
    });
