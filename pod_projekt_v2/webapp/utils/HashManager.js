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
                "overview": async() => await this._refreshPage(oView, "TourModel", "/results"),
                "tour": async () => {
                    await this._refreshPage(oView, "StopModel", "/results");
                    await this._refreshPage(oView, "StopInformationModel", "/tour");
                },
                "stop": async() => await this._refreshPage(oView, "StopInformationModel", "/tour"),
                "map": async() => await this._refreshMapPage(oView),
                "confirmation": async () => {
                    await this._refreshPage(oView, "StopInformationModel", "/tour");
                    await this._refreshPage(oView, "StopModel", "/results");
                },
                "unloading": async() => await this._refreshPage(oView, "StopInformationModel", "/tour"),
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

                if (!oModel) {
                    //console.error("Modell nicht gefunden:", sModelName);
                    resolve(); // Modell nicht gefunden, trotzdem auflösen
                    return;
                }

                if (!(oModel instanceof sap.ui.model.json.JSONModel)) {
                    //console.error("Das Modell ist kein JSONModel");
                    resolve(); // Modell ist nicht vom Typ JSONModel, trotzdem auflösen
                    return;
                }

                //console.log("Aktualisiere Modell:", sModelName, "für Pfad:", sPropertyPath);

                // Hole die Daten für den angegebenen Property-Pfad
                var oData = oModel.getProperty(sPropertyPath);
                // Setze die Daten erneut im Modell
                oModel.setProperty(sPropertyPath, oData);

                // Da JSONModel keine refresh-Methode hat, gibt es keine Callbacks für Erfolg oder Fehler
                //console.info("Model wurde erfolgreich aktualisiert:", sModelName, "für Pfad:", sPropertyPath);

                resolve();
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
