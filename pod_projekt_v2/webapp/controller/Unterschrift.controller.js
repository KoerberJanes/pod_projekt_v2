sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/m/MessageToast", "podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox, MessageToast, StatusSounds) {
		"use strict";

		return Controller.extend("podprojekt.controller.Unterschrift", {
			onInit: function () {
				
			},

			onAfterRendering: function () {
				this._oBundle = this.getView().getModel("i18n").getResourceBundle();
			},

			formatRetoureText:function(aDeliveryNotes, retouresText, processedText){ // Fallback, wenn aDeliveryNotes nicht geladen oder kein Array ist
				const count = Array.isArray(aDeliveryNotes) ? aDeliveryNotes.filter(note => note.bRetoure === true).length : 0;

				return `${count} ${retouresText} ${processedText}`;// Formatierter Text mit der Anzahl
			},

			formatDeliveryNoteText:function(aDeliveryNotes, retouresText, processedText){ // Fallback, wenn aDeliveryNotes nicht geladen oder kein Array ist
				const count = Array.isArray(aDeliveryNotes) ? aDeliveryNotes.filter(note => note.bRetoure === false).length : 0;

				return `${count} ${retouresText} ${processedText}`; // Formatierter Text mit der Anzahl
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			onClearSignField: function () {
				this.getView().byId("digitalSignatureId").clearArea();
			},

			onCheckIfStopSigned: function () { //Pruefen ob die Tour unterschrieben wurde
				let sDigitalSignatureId = this.byId("digitalSignatureId");
				let sSignatureAsSvg = sDigitalSignatureId.getSignatureAsString();

				if (sSignatureAsSvg) { // Feld enthält etwas und wurde unterschrieben!
					this.simulateBackendCall();
				} else {
					this._showErrorMessageBox("noSignatureDetected", () => {});
				}
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			busyDialogOpen: async function () {
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

			busyDialogClose: function () {
				setTimeout(() => {
					if (this.byId("BusyDialog")) this.byId("BusyDialog").close();
				}, 500);
			},

			simulateBackendCall: function () {
				//this.busyDialogOpen();

				let sPath = "/ABAP_FUNKTIONSBAUSTEIN"; //Pfad zu OData-EntitySet
				let oODataModel = this.getOwnerComponent().getModel("ABC"); //O-Data Model aus der View
				//let oFilter1 = new Filter(); //Filter Attribut 1
				//let oFilter2 = new Filter(); //Filter Attribut 2
				//let oFilter3 = new Filter(); //Filter Attribut 3
				//let aFilters = [oFilter1, oFilter2, oFilter3]; //Array an Filtern, die an das Backend uebergeben werden

				/*
                oODataModel.read(sPath, {
                filters: aFilters,

                success: (oData) => {
                    this.busyDialogClose();
                    StatusSounds.playBeepSuccess();
                    let aRecievedTours=oData.getProperty("/results");

                    if(aRecievedTours.length===0){
                        this.noToursError(); //Fahrer hat keine Touren
                    } else{
                        this.handleRecievedTours(aRecievedTours); //Setzen der Touren in Model
                    }

                },
                error: (oError) => {
                    this.busyDialogClose();
                    StatusSounds.playBeepError();
                    //Bisher keine Funktion
                }
                */

				this.busyDialogClose();
				this.onClearSignField();
				this.showBackendConfirmMessage();
				this.setCurrentStopAsFinished();
			},

			onRefreshDateAndTime: function () {
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel");
				let sDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit
				oCustomerModel.setProperty("/dateAndTime", sDateAndTime);
			},

			showBackendConfirmMessage: function () {
				StatusSounds.playBeepSuccess();
				MessageToast.show(this._oBundle.getText("stopSuccessfullyReceipt"), {
					duration: 2500,
					width: "15em",
				});
			},

			setCurrentStopAsFinished: function () {
				//!Statuscodes müssen abgesprochen werden
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel"); //Infos über derzeitigen Stopp
				let oCurrentStop = oStopInformationModel.getProperty("/tour"); //'addressName1' bei der deepEntity gleich wie beim Stopp --> Vergleichsoperator
				let oTourStartModel = this.getOwnerComponent().getModel("TourStartFragmentModel"); //Tour mit allen Stopps und Infos vorhanden
				let aStopsOfCurrentTour = oTourStartModel.getProperty("/tour/stops"); //'addressName1' bei der deepEntity gleich wie beim Stopp --> Vergleichsoperator
				let oFoundTour = aStopsOfCurrentTour.find((element) => element.addressName1 === oCurrentStop.addressName1); //'.filter' wuerde ein Arraay zurueckgeben

				if (oFoundTour) {
					oFoundTour.stopStatus = "70"; // --> Annahme: 70 ist erledigt
					this.checkIfAllStopsAreCompleted();
				}
			},

			checkIfAllStopsAreCompleted: function () { //Prüfen ob es nicht abgeschlossene Stops ( '90' abgeschlossene Stops '70' ) gibt
				//!Statuscodes müssen abgesprochen werden
				let aStopsOfCurrentTour = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour/stops"); //Tour mit allen Stopps und Infos vorhanden

				if (aStopsOfCurrentTour.some((element) => element.stopStatus === "90")) { //Wenn einer der Stopps noch nicht abgeschlossen wurde --> Status '90'
					this.changeDisplayedNvesOfStop(); 
				} else {
					this.setTourStatusProcessed(); 
				}
			},
			changeDisplayedNvesOfStop: function () { //Aendern der Anzeige von verbleibenden NVEs in der Stoppuebersicht
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel");
				let aRemainingNves = oStopInformationModel.getProperty("/tour/orders/0/aDeliveryNotes/0/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				oStopInformationModel.setProperty("/tour/orders/0/loadingUnits", aRemainingNves);

				this.setCurrentStopStatus();
			},

			setCurrentStopStatus:function(){
				//let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel");
				//let oCurrentStop = oStopInformationModel.getProperty("/tour");

				this.resetUserInput();
				this.resetUserPhotos();
				this.onNavToActiveTour(); 
			},

			setTourStatusProcessed: function () { //!Statuscodes müssen abgesprochen werden
				let oCurrentTour = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour");

				oCurrentTour.routeStatus = "10";
				this.onNavToOverview(); 
			},

			resetUserInput: function () {
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel"); //Angabe zum Namen des Kunden
				//TODO: LoadingDevices. Entweder Objekte nach erhalt vom Backend aendern oder expressionBinding verwenden
				//let oLoadingDevicesModel=this.getOwnerComponent().getModel("LoadingDeviceModel");

				oCustomerModel.setProperty("/customerName", "");
			},

			resetUserPhotos: function () {
				let oPhotoListModel = this.getOwnerComponent().getModel("PhotoModel");

				oPhotoListModel.setProperty("/photos", []);
			},

			onNavToActiveTour: function () { //Nicht alle Stopps beendet
				this.updateModelBindings("StopModel"); //Aktualisiert die verbleibenden NVEs und das Unterschrift Icon

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ActiveTour");
			},

			onNavToOverview: function () { //Alle Stopps beendet, navigation zur Touruebersicht
				//Models über Statusänderung der Tour informieren
				this.updateModelBindings("StopModel");
				this.updateModelBindings("TourModel");
				this.resetUserInput();

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Overview");
			},

			onNavToQuittierung: function () {
				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Quittierung");
			},
		});
	}
);
