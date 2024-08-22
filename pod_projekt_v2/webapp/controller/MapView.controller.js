sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast) {
		"use strict";

		// Konstanten für Hardcodierte Werte
		const MAP_ALTITUDE_TARGET = 15; // von 0 (weit weg) bis 20 oder so (sehr nah)
		const GPS_TIMEOUT = 5000;
		const GPS_MAX_AGE = 0;
		const ACCURACY_THRESHOLD = 100;

		return Controller.extend("podprojekt.controller.MapView", {
			onInit: function () {
				//Beim erstmaligen aufrufen der Seite muss die Methode angehängt werden, damit die Position des
				//Markers immer auf den aktuellen Stop Zeigt
				this._oRouter = this.getOwnerComponent().getRouter();
				this._oRouter.getRoute("MapView").attachPatternMatched(this.setSpotsIntoGeoMap, this);
			},

			onAfterRendering: function () {},

			setSpotsIntoGeoMap: function () {
				//Hinzufügen eines einzelnen Stops für die GeoMap
				let oCurrentStop = this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
				let {targetGeoL: sTargetGeoL, targetGeoB: sTargetGeoB} = oCurrentStop;

				this.createDestinationSpot(oCurrentStop, sTargetGeoL, sTargetGeoB);
				this.getCurrentPosition(false);
			},

			createDestinationSpot: function (oCurrentStop, sTargetGeoL, sTargetGeoB) {
				//Erstellen eines Stops
				let oGeoMapStopModel = this.getOwnerComponent().getModel("SpotModel");

				//Zuruecksetzen notwendig, weil sonst immer wieder der gleiche Stopp drin ist
				oGeoMapStopModel.setProperty("/spot", []);

				let aGeoMapSpots = oGeoMapStopModel.getProperty("/spot");
				// Neues Stop-Objekt erstellen
				let oStop = {
					bTarget: true,
					pos: `${sTargetGeoL};${sTargetGeoB}`,
					tooltip: oCurrentStop.city,
					type: "Success",
					description: oCurrentStop.addressName1,
				};

				let aUpdatedSpots = [...aGeoMapSpots, oStop]; //Array wird mit neuem Stopp erstellt, dass angezeigt wird
				oGeoMapStopModel.setProperty("/spot", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig

				this.toCurrentPosition(sTargetGeoL, sTargetGeoB);
			},

			createOwnLocationSpot: function (sCurrentGeoL, sCurrentGeoB, bZoomToSpot) {
				let oGeoMapStopModel = this.getOwnerComponent().getModel("SpotModel");
				let aGeoMapSpots = oGeoMapStopModel.getProperty("/spot");
				// Neues Stop-Objekt erstellen
				let oStop = {
					bTarget: false,
					pos: `${sCurrentGeoL};${sCurrentGeoB}`,
					tooltip: "current location",
					type: "Success",
					description: "Own Location",
				};

				let aUpdatedSpots = [...aGeoMapSpots, oStop]; //Array wird mit neuem Stopp erstellt, dass angezeigt wird
				oGeoMapStopModel.setProperty("/spot", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig
				if (bZoomToSpot) {
					this.toCurrentPosition(sCurrentGeoL, sCurrentGeoB);
				}
			},

			onClickGeoMapSpot: function (oEvent) {
				let oPressedSpot = oEvent.getSource().getBindingContext("SpotModel").getObject();
				oEvent.getSource().openDetailWindow(oPressedSpot.description, "0", "0");
			},

			getCurrentPosition: function (bZoomToSpot) {
				//Zurücksetzen der Map Position auf aktuellen Ort?
				//Leider abgesehen von der boolschen-let keine andere Möglichkeit eingefallen
				this.onBusyDialogOpen();

				navigator.geolocation.getCurrentPosition(
					(oPosition) => {
						this.onBusyDialogClose();
						this.checkIfOwnLoactionIsAccurate(oPosition, bZoomToSpot);
					},
					(oError) => {
						this.onBusyDialogClose();
						MessageToast.show("Could not fetch Geo-Location");
					},
					{
						//Attributes for better GPS-Data
						enableHighAccuracy: true,
						timeout: GPS_TIMEOUT,
						maximumAge: GPS_MAX_AGE,
					}
				);
			},

			removeOldOwnPosition: function () {
				let oGeoMapStopModel = this.getOwnerComponent().getModel("SpotModel");
				let aGeoMapSpots = oGeoMapStopModel.getProperty("/spot");

				let aUpdatedSpots = aGeoMapSpots.filter((oCurrentGeoMapSpot) => oCurrentGeoMapSpot.bTarget);
				oGeoMapStopModel.setProperty("/spot", aUpdatedSpots);

				this.getCurrentPosition(true);
			},

			checkIfOwnLoactionIsAccurate: function (oPosition, bZoomToSpot) {
				let sAccuracy = oPosition.coords.accuracy;
				//TODO: Hier wurde die Prüfung auskommentiert weil sie sehr sehr ungenau ist

				//if(sAccuracy>ACCURACY_THRESHOLD){ //Pruefen ob die Daten überhaupt genau genug sind!
				//MessageToast.show("Trying to fetch more accurate data! Accuracy is not good enough!");
				//} else{
				let {longitude: sCurrentGeoL, latitude: sCurrentGeoB} = oPosition.coords;
				this.createOwnLocationSpot(sCurrentGeoL, sCurrentGeoB, bZoomToSpot);
				//}
			},

			toCurrentPosition: function (sCurrentGeoL, sCurrentGeoB) {
				let oGeoMap = this.getView().byId("GeoMap");
				oGeoMap.zoomToGeoPosition(parseFloat(sCurrentGeoL), parseFloat(sCurrentGeoB), MAP_ALTITUDE_TARGET);
			},

			onToTargetPosition: function () {
				//Zur Position des derzeit ausgewählten Stops
				let oCurrentStop = this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
				let {targetGeoL: sTargetGeoL, targetGeoB: sTargetGeoB} = oCurrentStop;
				let oGeoMap = this.getView().byId("GeoMap");

				oGeoMap.zoomToGeoPosition(parseFloat(sTargetGeoL), parseFloat(sTargetGeoB), MAP_ALTITUDE_TARGET); //Werte muessen als float angegeben werden
			},

			onBusyDialogOpen: async function () {
				if (!this.oBusyDialog) {
					try {
						// Lade das Fragment, wenn es noch nicht geladen wurde
						this.oBusyDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.BusyDialog",
						});
					} catch (error) {
						// Fehlerbehandlung bei Problemen beim Laden des Fragments
						console.error("Fehler beim Laden des BusyDialogs:", error);
						MessageBox.error(this._oBundle.getText("errorLoadingBusyDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}
			},

			onBusyDialogClose: function () {
				setTimeout(() => {
					this.byId("BusyDialog").close();
				}, 250);
			},

			onNavToStopInformation: function () {
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("StopInformation");
			},
		});
	}
);
