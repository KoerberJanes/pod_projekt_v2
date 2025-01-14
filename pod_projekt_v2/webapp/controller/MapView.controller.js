sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast) {
		"use strict";

		// Konstanten fuer Hardcodierte Werte
		const MAP_ALTITUDE_TARGET = 15; // von 0 (weit weg) bis 20 oder so (sehr nah)
		const GPS_TIMEOUT = 5000;
		const GPS_MAX_AGE = 0;
		const ACCURACY_THRESHOLD = 100;

		return Controller.extend("podprojekt.controller.MapView", {
			onInit: function () { //Beim erstmaligen aufrufen der Seite muss die Methode angehaengt werden, damit die Position des Markers immer auf den aktuellen Stop Zeigt
				//TODO: Ladeindikator
				this._oRouter = this.getOwnerComponent().getRouter();
				this._oRouter.getRoute("MapView").attachPatternMatched(this.setSpotsIntoGeoMap, this);
			},

			onAfterRendering: function () {},

			setSpotsIntoGeoMap: function () { //Hinzufuegen eines einzelnen Stops fuer die GeoMap
				//this.onBusyDialogOpen();

				requestAnimationFrame(() => {
					let oCurrentStop = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentStop");
					let {targetGeoL: sTargetGeoL, targetGeoB: sTargetGeoB} = oCurrentStop;

					this.createDestinationSpot(oCurrentStop, sTargetGeoL, sTargetGeoB);  
					this.getCurrentPosition(false); // Abrufen der aktuellen Position

					//this.onBusyDialogClose(); // Ladeindikator schließen
				});
			},

			createDestinationSpot: function (oCurrentStop, sTargetGeoL, sTargetGeoB) { //Erstellen eines Stops
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oTourAndStopModel.setProperty("/GeoMapSpots/spots", []); //Zuruecksetzen notwendig, weil sonst immer wieder der gleiche Stopp drin ist

				let aGeoMapSpots = oTourAndStopModel.getProperty("/GeoMapSpots/spots");
				// Neues Stop-Objekt erstellen
				let oStop = {
					bTarget: true,
					pos: `${sTargetGeoL};${sTargetGeoB}`,
					tooltip: oCurrentStop.city,
					type: "Success",
					description: oCurrentStop.addressName1,
				};

				let aUpdatedSpots = [...aGeoMapSpots, oStop]; //Array wird mit neuem Stopp erstellt, dass angezeigt wird
				oTourAndStopModel.setProperty("/GeoMapSpots/spots", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig

				this.toCurrentPosition(sTargetGeoL, sTargetGeoB);
			},

			createOwnLocationSpot: function (sCurrentGeoL, sCurrentGeoB, bZoomToSpot) {
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aGeoMapSpots = oTourAndStopModel.getProperty("/GeoMapSpots/spots");
				// Neues Stop-Objekt erstellen
				let oStop = {
					bTarget: false,
					pos: `${sCurrentGeoL};${sCurrentGeoB}`,
					tooltip: "current location",
					type: "Success",
					description: "Own Location",
				};

				let aUpdatedSpots = [...aGeoMapSpots, oStop]; //Array wird mit neuem Stopp erstellt, dass angezeigt wird
				oTourAndStopModel.setProperty("/GeoMapSpots/spots", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig
				if (bZoomToSpot) {
					this.toCurrentPosition(sCurrentGeoL, sCurrentGeoB);
				}
			},

			onClickGeoMapSpot: function (oEvent) {
				let oPressedSpot = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();
				oEvent.getSource().openDetailWindow(oPressedSpot.description, "0", "0");
			},

			getCurrentPosition: function (bZoomToSpot) {
				//Zuruecksetzen der Map Position auf aktuellen Ort?
				//Leider abgesehen von der boolschen-let keine andere Moeglichkeit eingefallen

				navigator.geolocation.getCurrentPosition(
					(oPosition) => {
						this.checkIfOwnLoactionIsAccurate(oPosition, bZoomToSpot);
					},
					(oError) => {
						MessageToast.show("Could not fetch Geo-Location");
					},
					{
						//Attributes for better GPS-Data
						enableHighAccuracy: true,
						timeout: GPS_TIMEOUT,
						maximumAge: GPS_MAX_AGE,
					}
				);
				//this.onBusyDialogClose();
			},

			removeOldOwnPosition: function () { //entfernen vom alten eigenen Pointer
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aGeoMapSpots = oTourAndStopModel.getProperty("/GeoMapSpots/spots");

				let aUpdatedSpots = aGeoMapSpots.filter((oCurrentGeoMapSpot) => oCurrentGeoMapSpot.bTarget);
				oTourAndStopModel.setProperty("/GeoMapSpots/spots", aUpdatedSpots);

				this.getCurrentPosition(true);
			},

			checkIfOwnLoactionIsAccurate: function (oPosition, bZoomToSpot) {
				let sAccuracy = oPosition.coords.accuracy;
				//! Hier wurde die Pruefung auskommentiert weil sie sehr sehr ungenau ist

				//if(sAccuracy>ACCURACY_THRESHOLD){ //Pruefen ob die Daten ueberhaupt genau genug sind!
				//MessageToast.show("Trying to fetch more accurate data! Accuracy is not good enough!");
				//} else{
				let {longitude: sCurrentGeoL, latitude: sCurrentGeoB} = oPosition.coords;
				this.createOwnLocationSpot(sCurrentGeoL, sCurrentGeoB, bZoomToSpot);
				//}
			},

			toCurrentPosition: function (sCurrentGeoL, sCurrentGeoB) { //Sprung auf der Map zum eigenen Pointer
				let oGeoMap = this.getView().byId("GeoMap");
				oGeoMap.zoomToGeoPosition(parseFloat(sCurrentGeoL), parseFloat(sCurrentGeoB), MAP_ALTITUDE_TARGET);
			},

			onToTargetPosition: function () { //Zur Position des derzeit ausgewaehlten Stops
				let oCurrentStop = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentStop");
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
