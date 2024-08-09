sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "podprojekt/utils/Helper",
    "sap/m/MessageToast",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Helper, MessageToast, ) {
        "use strict";

        return Controller.extend("podprojekt.controller.ActiveTour", {
            onInit: function () {

            },

            onAfterRendering: function() {
                
            },

            onSetStoppInformation:function(oEvent){ //Herausfinden welcher Stop in der Liste ausgewaehlt wurde
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var oPressedModelObject=oEvent.getSource().getBindingContext("StopModel").getObject();
                var oPressedModelObjectDetails=oPressedModelObject.orders[0]; //Detailreichere Informationen über das Modelobjekt
                
                oStopInformationModel.setProperty("/tour", oPressedModelObjectDetails);
                this.createLoadingUnitsDetailedDescription(oPressedModelObjectDetails);
            },

            createLoadingUnitsDetailedDescription:function(oPressedModelObjectDetails){//Erstellen der Unterstruktur von Nves (Details)
                var aLoadingUnits=oPressedModelObjectDetails.loadingUnits;

                for(var i in aLoadingUnits){
                    var oCurrentDefaultLoadingUnit=aLoadingUnits[i]; //Speichern der Aktuellen Nve
                    oCurrentDefaultLoadingUnit.detailedInformation=[{
                        "accurateDescription": oCurrentDefaultLoadingUnit.amount + "x " + oCurrentDefaultLoadingUnit.articleCaption
                    }]
                    oCurrentDefaultLoadingUnit.accurateDescription= oCurrentDefaultLoadingUnit.label1 +" "+ oCurrentDefaultLoadingUnit.lodingDeviceTypeCaption;; //erstellen der richtigen Bezeichnung
                }
                this.onNavToStopInformation();
            },

            onNavToStopInformation:function(){ //Navigation zur StopInformation View
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("StopInformation");
            },
        });
    });
