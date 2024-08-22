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

        onHashChanged: async function(oEvent, oView) { // Fragt nach dem 'pattern' in der manifest.json ab
            var sNewHash = oEvent.getParameter("newHash"); // unique pattern

            const refreshFunctions = {
                "overview": async() => this._refreshPage(oView, "TourModel", "/results"),
                "tour": async () => {
                    await this._refreshPage(oView, "StopModel", "/results");
                    await this._refreshPage(oView, "StopInformationModel", "/tour");
                },
                "stop": async() => this._refreshPage(oView, "StopInformationModel", "/tour"),
                "map": async() => this._refreshMapPage(oView),
                "confirmation": async () => {
                    await this._refreshPage(oView, "StopInformationModel", "/tour");
                    await this._refreshPage(oView, "StopModel", "/results");
                },
                "unloading": async() => this._refreshPage(oView, "StopInformationModel", "/tour"),
                "signature": async () => {
                    await this._refreshPage(oView, "StopInformationModel", "/tour");
                    await this._refreshPage(oView, "StopModel", "/results");
                }
            };

            var refreshFunction = refreshFunctions[sNewHash] || (() => this._refreshNotFoundPage(oView));
            await refreshFunction();
        },

        _refreshPage: function(oView, sModelName, sPropertyPath) {
            return new Promise((resolve) => {
                var oModel = oView.getModel(sModelName);
                if (oModel) {
                    var oData = oModel.getProperty(sPropertyPath);
                    oModel.setProperty(sPropertyPath, oData);
                    oModel.refresh(true, {
                        success: () => {
                            resolve(); //Abschließen der Methode 
                        },
                        error: () => {
                            // Handle any errors if needed
                            resolve();//Abschließen der Methode in jedem Fall
                        }
                    });
                } else {
                    resolve(); //Abschließen der Methode in jedem Fall
                }
            });
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
