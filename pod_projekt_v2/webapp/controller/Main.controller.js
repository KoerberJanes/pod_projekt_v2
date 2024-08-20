sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("podprojekt.controller.Main", {
            onInit: function () {
                
            },
            onNavToOverview: function() {
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Overview");
            }
        });
    });
