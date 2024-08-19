sap.ui.define([
    "sap/ui/core/routing/HashChanger"
], function(HashChanger) {
    "use strict";

    var HashManager = {

        _bHandlerAttached: false, // Flagge für den Event-Handler

        init: function(oView) {

            if (!this._bHandlerAttached) { //Sicherstellen, dass das Event nur 1x angehaengt wird
                HashChanger.getInstance().attachEvent("hashChanged", (oEvent) => {
                    this.onHashChanged(oEvent, oView);
                });
                this._bHandlerAttached = true; // Event-Handler wurde angehängt
            }

            if (!HashChanger.getInstance().getHash()) {
                HashChanger.getInstance().setHash("home");
            }
        },

        onHashChanged: function(oEvent, oView) { //Fragt nach dem 'pattern' in der manifest.json ab
            var sNewHash = oEvent.getParameter("newHash"); //unique pattern

            const refreshFunctions = {
                "overview": () => this._refreshPage(oView, "TourModel", "/results"),
                "tour": () => this._refreshPage(oView, "StopModel", "/results"),
                "stop": () => this._refreshPage(oView, "StopInformationModel", "/tour"),
                "map": () => this._refreshMapPage(oView),
                "confirmation": () => this._refreshPage(oView, "StopInformationModel", "/tour"),
                "unloading": () => this._refreshPage(oView, "StopInformationModel", "/tour"),
                "signature": () => this._refreshPage(oView, "StopInformationModel", "/tour")
            };

            var refreshFunction = refreshFunctions[sNewHash] || (() => this._refreshNotFoundPage(oView));
            refreshFunction();
        },

        _refreshPage: function(oView, sModelName, sPropertyPath) {
            var oModel = oView.getModel(sModelName);
            if (oModel) {
                var oData = oModel.getProperty(sPropertyPath);
                oModel.setProperty(sPropertyPath, oData);
                oModel.refresh(true);
                //console.log(`${sModelName} Seite wurde aktualisiert.`); //Zur Pruefung in der Konsole
            }
        },

        _refreshMapPage: function(oView) {
            //console.log("Map Seite wurde aktualisiert."); // Hier muss nichts gemacht werden
        },

        _refreshNotFoundPage: function(oView) {
            //console.log("404 - Seite unbekannt!"); //Zur Pruefung in der Konsoles
        }
    };

    return HashManager; // Hier wird das HashManager-Objekt zurückgegeben
});
