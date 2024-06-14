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
                var oCurrentStopDetails=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour/orders")[0];
                var sPhoneAvis=oCurrentStopDetails.phoneAvis;

                sap.m.URLHelper.triggerTel(sPhoneAvis);
            },

            onNavToMap:function(){ //Navigation zur GeoMap View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("MapView");
            },

            /*onNavToAbladung:function(){ //Navigation zur Abladung View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Abladung");
            },*/

            onNavToQuittierung:function(){ //Navigation zur Quittierung View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Quittierung");
            },

            /*onNavToActiveTour:function(){ //Navigation zur AvtiveTour View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("ActiveTour");
            },*/

            onRefreshRespectiveStops:function(){ //Dummy-Refresh
                
                MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
                    duration: 1000,
                    width:"15em"
                });
            },
        });
    });
