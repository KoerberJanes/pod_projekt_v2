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

			simulateBackendCallForSigneageOfStopp: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten ggf. nicht notwendig, da nur gesendet wird
				//Methoden und Filter koennen hier erstellt werden.
			
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
					
				},
				error: (oError) => {
					this.busyDialogClose();
					//Bisher keine Funktion
				}
				});
				*/

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						//this.closeBusyDialog();
						if (bTestCase) {
							//Success-Fall simulieren
							//this.setStopOrderChangedToFalse();
							return resolve();
						} else {
							//Error-Fall simulieren
							return reject("Fehler beim senden des Stopps.");
						}
					}, 1000);
				});
				
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
				let sSignatureAsPng = sDigitalSignatureId.getSignatureAsPng();

				if (sSignatureAsPng) { // Feld enthaelt etwas und wurde unterschrieben!
					this.openBusyDialog();
					this.setSignatureOfStopp(sSignatureAsPng);

					let aPromises = [];

					aPromises.push(this.simulateBackendCallForSigneageOfStopp(true));

					Promise.all(aPromises)
					.then(() => {
						this.closeBusyDialog();
						this.onClearSignField();
						this.showBackendConfirmMessage();
						this.setCurrentStopAsFinished();
					})	
					.catch((error) => {
						this.closeBusyDialog();
						console.error("Error during backend calls:", error);
					});
				} else {
					this._showErrorMessageBox("noSignatureDetected", () => {});
				}
			},

			setSignatureOfStopp:function(sSignatureAsPng){
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel");
				oStopInformationModel.setProperty("/tour/finishedSignature", sSignatureAsPng)
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
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
				//!Statuscodes muessen abgesprochen werden
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel"); //Infos ueber derzeitigen Stopp
				let oCurrentStop = oStopInformationModel.getProperty("/tour"); //'addressName1' bei der deepEntity gleich wie beim Stopp --> Vergleichsoperator
				let oTourStartModel = this.getOwnerComponent().getModel("TourStartFragmentModel"); //Tour mit allen Stopps und Infos vorhanden
				let aStopsOfCurrentTour = oTourStartModel.getProperty("/tour/stops"); //'addressName1' bei der deepEntity gleich wie beim Stopp --> Vergleichsoperator
				let oFoundTour = aStopsOfCurrentTour.find((element) => element.addressName1 === oCurrentStop.addressName1); //'.filter' wuerde ein Arraay zurueckgeben

				if (oFoundTour) {
					oFoundTour.stopStatus = "70"; // --> Annahme: 70 ist erledigt
					this.checkIfAllStopsAreCompleted();
				}
			},

			checkIfAllStopsAreCompleted: function () { //Pruefen ob es nicht abgeschlossene Stops ( '90' abgeschlossene Stops '70' ) gibt
				//!Statuscodes muessen abgesprochen werden
				let aStopsOfCurrentTour = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour/stops"); //Tour mit allen Stopps und Infos vorhanden
				let bAllStoppsProcessed = aStopsOfCurrentTour.every((element) => element.stopStatus === "70");

				if (!bAllStoppsProcessed) { //Pruefen ob es mindestens einen Stopp gibt, der nicht den Status 70 hat
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

			setTourStatusProcessed: function () { //!Statuscodes muessen abgesprochen werden
				let oCurrentTour = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour");

				oCurrentTour.routeStatus = "10";
				this.onNavToOverview(); 
			},

			resetUserInput: function () {
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel"); //Angabe zum Namen des Kunden
				//let oLoadingDevicesModel=this.getOwnerComponent().getModel("LoadingDeviceModel");

				oCustomerModel.setProperty("/customerName", "");
			},

			resetUserPhotos: function () {
				let oPhotoListModel = this.getOwnerComponent().getModel("PhotoModel");

				oPhotoListModel.setProperty("/photos", []);
			},

			setStopOrderChangedToTrue:function(){
				let oSettingsModel = this.getOwnerComponent().getModel("settings");
				oSettingsModel.setProperty("/bStopOrderChanged", true);
			},

			setStopOrderChangedToFalse:function(){
				let oSettingsModel = this.getOwnerComponent().getModel("settings");
				oSettingsModel.setProperty("/bStopOrderChanged", false);
			},

			setUserViewerSettingToTrue:function(){
				let oSettingsModel = this.getOwnerComponent().getModel("settings");
				oSettingsModel.setProperty("/bViewerMode", true);
			},

			setUserViewerSettingToFalse:function(){
				let oSettingsModel = this.getOwnerComponent().getModel("settings");
				oSettingsModel.setProperty("/bViewerMode", false);
			},

			onTourReviewed:function(){
				this.setUserViewerSettingToFalse();
				this.setStopOrderChangedToFalse();
				this.onNavToActiveTour();
			},

			openBusyDialog: async function () {
				//Lade-Dialog oeffnen
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

				// Öffne das Dialog, wenn es erfolgreich geladen wurde
				this.oBusyDialog.open();
			},
			
			closeBusyDialog: function () {
				this.byId("BusyDialog").close();
			},

			onNavToActiveTour: function () { //Nicht alle Stopps beendet
				this.updateModelBindings("StopModel"); //Aktualisiert die verbleibenden NVEs und das Unterschrift Icon

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ActiveTour");
			},

			onNavToOverview: function () { //Alle Stopps beendet, navigation zur Touruebersicht
				//Models ueber Statusaenderung der Tour informieren
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
