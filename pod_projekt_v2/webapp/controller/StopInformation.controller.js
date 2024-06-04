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

            onPressBtnAvisNr: function(oEvent){
                /*
                const oSingleStopModel = this.getView().getModel("SingleStopModel").getProperty("/results");
                const {phoneAvis} = oSingleStopModel;
                sap.m.URLHelper.triggerTel(phoneAvis);//phoneAvis
                const telefonBtn = this.getView().byId("btnAvisNr");
                const toQuittierungsBtn = this.getView().byId("QuittierungBtn");
                telefonBtn.setType("Default");
                toQuittierungsBtn.setType("Emphasized");
                */
            },

            onNavToMap:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("MapView");
            },

            onNavToAbladung:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Abladung");
            },

            onNavToQuittierung:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Quittierung");
            },

            onNavToActiveTour:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("ActiveTour");
            },

            onRefreshRespectiveStops:function(){
                
                MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
                    duration: 1000,
                    width:"15em"
                });
            },
        });
    });
