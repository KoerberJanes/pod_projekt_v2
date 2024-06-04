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
                //Controller.prototype.onAfterRendering.apply(this, arguments);
                console.log("Hi! Du hast es geschafft!");
            },

            onRefreshRespectiveStops:function(){
                
                MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
                    duration: 1000,
                    width:"15em"
                });
            },
        });
    });
