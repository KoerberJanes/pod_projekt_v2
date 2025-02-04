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

			signatureFieldFormatter: function(bViwerMode) {//Regelt ob das Unterschrift-Feld sichtbar sein soll
				// Habe leider keine bessere moeglichkeit gefunden
				// Da das visible Attribut in den metadaten des SignFields steckt reagiert es nicht auf die View
				return !bViwerMode;
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
						if (bTestCase) { //Success-Fall simulieren
							return resolve();
						} else { //Error-Fall simulieren
							return reject("Fehler beim senden des Stopps.");
						}
					}, 50);
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

			updateModelBindings:function(sModelName){ //Update des Models in allen Views
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			onClearSignField: function () { //Leeren des Unterschrift-Feldes
				this.getView().byId("digitalSignatureId").clearArea();
			},

			clearRemarksField:function(){ //Leeren des Feldes fuer Bemerkungen
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/aQuittierungInformation/sRemarks", "");
				this.updateModelBindings("TourAndStopModel");
			},

			onCheckIfStopSigned: function () { //Pruefen ob die Tour unterschrieben wurde
				let sDigitalSignatureId = this.byId("digitalSignatureId");
				let sSignatureAsPng = sDigitalSignatureId.getSignatureAsPng();

				if (sSignatureAsPng) { // Feld enthaelt etwas und wurde unterschrieben!
					this.openBusyDialog();
					this.concludeStop(sSignatureAsPng); //Setzt alle notwendigen Infos fuer den Stopp

					let aPromises = [];

					aPromises.push(this.simulateBackendCallForSigneageOfStopp(true));

					Promise.all(aPromises)
					.then(() => { //Setzt alle Dinge fuer den naechsten Stopp zurueck
						this.closeBusyDialog();
						this.onClearSignField(); //unterschrift leeren
						this.clearCustomerNameInput(); //Kundenname leeren
						this.clearStopComplaints(); //Beanstandungen leeren
						this.resetComplaintsSwitch(); //Beanstandungen-Switch reset
						this.clearRemarksField(); //Bemerkungen leeren
						this.resetRemarksSwitch(); //Bemerkungen-Switch reset

						this.updateModelBindings("TourAndStopModel"); //update, damit Tourinfos wieder zurueckgesetzt sind
						this.updateModelBindings("ComplaintsModel"); //update, damit complaints wieder zurueckgesetzt sind
						this.updateModelBindings("ConfigModel"); //update, damit switches, etc. wieder zurueckgesetzt sind
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

			clearCustomerNameInput:function(){ //Leeren des Feldes des Kundennamen im Model
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/aQuittierungInformation/sName", "");
			},

			clearStopComplaints:function(){ //Leeren des Feldes der Beanstandungen im Model
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/aQuittierungInformation/aComplaints", []);
				this.resetUserComplaints();
			},

			resetComplaintsSwitch:function(){ //Zuruecksetzen der Switch fuer Beanstandungen
				let oConfigModel = this.getOwnerComponent().getModel("ConfigModel");

				oConfigModel.setProperty("/generalSettings/complaintsSwitch", false);
			},

			resetRemarksSwitch:function(){ //Zuruecksetzen der Switch fuer Bemerkungen
				let oConfigModel = this.getOwnerComponent().getModel("ConfigModel");

				oConfigModel.setProperty("/generalSettings/remarksSwitch", false);
			},

			resetUserComplaints:function(){ //Zuruecksetzen der Hacken bei Beanstandungen
				let oComplaintsModel = this.getOwnerComponent().getModel("ComplaintsModel");
				let aComplaints = oComplaintsModel.getProperty("/results");

				aComplaints.forEach((stop) => stop.value = false);
			},

			concludeStop:function(sSignatureAsPng){ //Methode um alle Dinge des Stops zu sichern
				this.setSignatureOfStopp(sSignatureAsPng); //Unterschirft dem Stop zuweisen
				this.setRecipientOfStop(); //Empfaenger dem Stop zuweisen
				this.setRemarksOfStop(); //Bemerkungen dem Stop zuweisen
				this.setSignTimeOfStop(); //Uhrzeit dem Stop Zuweisen
				this.setComplaintsOfStop(); //Array mit Beanstandungen dem Stop zuweisen
				this.resetUserPhotos(); //User-Fotos leeren
			},

			setSignatureOfStopp:function(sSignatureAsPng){ //Setzen der Unterschrift fuer den Stopp
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/oCurrentStop/finishedSignature", sSignatureAsPng);
			},

			setRecipientOfStop:function(){ //Setzen des Empfaengers fuer den Stopp
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sCustomerName = oTourAndStopModel.getProperty("/aQuittierungInformation/sName");

				oTourAndStopModel.setProperty("/oCurrentStop/signedCustomerName", sCustomerName);
			},

			setRemarksOfStop:function(){ //Setzen der Bemerkungen fuer den Stopp
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sRemarkesFieldInput = oTourAndStopModel.getProperty("/aQuittierungInformation/sRemarks");

				oTourAndStopModel.setProperty("/oCurrentStop/sDeliveryRemarks", sRemarkesFieldInput);
			},

			setSignTimeOfStop:function(){ //Setzen der Zeit und des Datums fuer den Stopp
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sDateAndTime = oTourAndStopModel.getProperty("/customerInformation/dateAndTime");

				oTourAndStopModel.setProperty("/oCurrentStop/sDateAndTimeOfSignature", sDateAndTime);
			},

			setComplaintsOfStop:function(){ //Setzen des Beanstandungen fuer den Stopp
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aCollectionOfFilteredComplaints = oTourAndStopModel.getProperty("/aQuittierungInformation/aComplaints");
				
				oTourAndStopModel.setProperty("/oCurrentStop/aComplaints", aCollectionOfFilteredComplaints);
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) { //Generische Loesung feur Fehlermeldungen
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			onRefreshDateAndTime: function () { //Datum und Uhrzeit werden aktualisiert
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit
				oTourAndStopModel.setProperty("/customerInformation/dateAndTime", sDateAndTime);
			},

			showBackendConfirmMessage: function () { //Meldung an den User, dass der Stopp erfolgreich verarbeitet wurde
				StatusSounds.playBeepSuccess();
				MessageToast.show(this._oBundle.getText("stopSuccessfullyReceipt"), {
					duration: 2500,
					width: "15em",
				});
			},

			getCurrentTour:function(){ //Zurueckgeben der aktuellen Tour
				let oCurrentTour = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour");

				return oCurrentTour;
			},

			getCurrentStopOfTour:function(){ //Zurueckgeben der aktuellen Stopps der aktuellen Tour
				let oCurrentStop = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentStop"); //Infos ueber derzeitigen Stopp

				return oCurrentStop;
			},

			getStopsOfCurrentTour:function(){ //Zurueckgeben aller Stopps der aktuellen Tour
				let aStopsOfCurrentTour = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/stops"); //Tour mit allen Stopps und Infos vorhanden

				return aStopsOfCurrentTour;
			},

			setCurrentStopAsFinished: function () { //aktuellen Stopp als bearbeitet Markieren
				//!Statuscodes muessen abgesprochen werden
				let oCurrentStop = this.getCurrentStopOfTour(); 
				let aStopsOfCurrentTour = this.getStopsOfCurrentTour(); 
				let oFoundCurrentStop = aStopsOfCurrentTour.find((element) => element.addressName1 === oCurrentStop.addressName1); //'.filter' wuerde ein Arraay zurueckgeben

				if (oFoundCurrentStop) {
					oFoundCurrentStop.stopStatus = "70"; // --> Annahme: 70 ist erledigt
					this.checkIfAllStopsAreCompleted();
				}
			},

			checkIfAllStopsAreCompleted: function () { //Pruefen ob es nicht abgeschlossene Stops ( '90' abgeschlossene Stops '70' ) gibt
				//!Statuscodes muessen abgesprochen werden
				let aStopsOfCurrentTour = this.getStopsOfCurrentTour(); //Tour mit allen Stopps und Infos vorhanden
				let bAllStoppsProcessed = aStopsOfCurrentTour.every((element) => element.stopStatus === "70");
				
				if (bAllStoppsProcessed) { //Pruefen ob alle stops beendet
					//this.alterDisplayedNvesOfStop(); 
					this.setTourStatusProcessed(); 
				} else {
					this.setStopSequenceChangeableFalse();
					this.onNavToActiveTour();
				}
			},

			setStopSequenceChangeableFalse:function(){ //Zuruecksetzen des Attributes fuer die veraenderte Stoppreihenfolge
				let oConfigModel = this.getOwnerComponent().getModel("ConfigModel");
				oConfigModel.setProperty("/generalSettings/bStopSequenceChangeable", false);
			},

			setTourStatusProcessed: function () { //Tour als Abgeschlossen markieren
				//!Statuscodes muessen abgesprochen werden
				let oCurrentTour = this.getCurrentTour();

				oCurrentTour.routeStatus = "10";
				this.onNavToOverview(); 
			},

			resetUserPhotos: function () { //Zuruecksetzen der Fotos vom User
				let oPhotoManagementModel = this.getOwnerComponent().getModel("PhotoManagementModel");
				let aPhotoTypes = oPhotoManagementModel.getProperty("/photos/types");

				oPhotoManagementModel.setProperty("/photos/allPhotos", []);
				aPhotoTypes.forEach(photoTyp => {
					photoTyp.photo = [];
				});
			},

			setStopOrderChangedToFalse:function(){ //Setzen des StopOrderChanged Attributes auf false
				let oSettingsModel = this.getOwnerComponent().getModel("ConfigModel");
				oSettingsModel.setProperty("/generalSettings/bStopOrderChanged", false);
			},

			setUserViewerSettingToFalse:function(){ //Setzen des Viewer-Modus Attributes auf false
				let oConfigModel = this.getOwnerComponent().getModel("ConfigModel");
				oConfigModel.setProperty("/generalSettings/bViewerMode", false);
			},

			onTourReviewed:function(){ //Tour wurde im Viewer-Modus betrachtet
				this.setUserViewerSettingToFalse();
				this.setStopOrderChangedToFalse();
				this.onNavToActiveTour();
			},

			openBusyDialog: async function () {
				//Lade-Dialog oeffnen
				if (!this.oBusyDialog) {
					try { // Lade das Fragment, wenn es noch nicht geladen wurde
						this.oBusyDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.BusyDialog",
						});
					} catch (error) { // Fehlerbehandlung bei Problemen beim Laden des Fragments
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
				this.updateModelBindings("TourAndStopModel"); //Aktualisiert die verbleibenden NVEs und das Unterschrift Icon

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ActiveTour");
			},

			onNavToOverview: function () { //Alle Stopps beendet, navigation zur Touruebersicht
				//Models ueber Statusaenderung der Tour informieren
				this.updateModelBindings("TourAndStopModel");
				//this.resetUserModelInput();

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
