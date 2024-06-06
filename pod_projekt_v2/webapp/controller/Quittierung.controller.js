sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {

            },

            onAfterRendering: function() {
                
            },

            onRecipientFoundSwitchChange:function(){ //Switch mit Kunde nicht angetroffen

            },

            onFotoVisibileToggle:function(){ //Methode um geschossene Fotos ein-/auszublenden

            },

            onDeliveryItemVisibleToggle:function(){ //Paletten oder so ein-/ausblenden

            },

            onLoadingDevicesVisibleToggle:function(){ //Loading Devices oder so ein-/ausblenden

            },

            onAddPhoto:function(){ //Foto hinzufügen

            },

            onDeliveryUnload:function(){

            },

            onSign:function(){

            },

            onCustomerAbsent:function(){

            }

        });
    });
