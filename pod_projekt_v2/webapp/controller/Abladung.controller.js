sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast, MessageBox, StatusSounds) {
		"use strict";

		const MAX_PHOTOS_ALLOWED = 5; //Maximum an erlaubten Fotos
		const REGEX_NVE_USER_INPUT = /^[0-9]{5}$/; //es sind nur Ziffern erlaubt mit genau 5 Zeichen laenge
		const MIN_SELECTED_ERROR_REASONS = 1; //Minimum an selektierten Klaergruenden
		const MAX_SELECTED_ERROR_REASONS = 2; //Maximum an selektierten Klaergruenden

		return Controller.extend("podprojekt.controller.Abladung", {
			onInit: function () {},


			onAfterRendering: function () {
				this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			simulateBackendCallForLoadingNVEs: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten.
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
				return new Promise((resolve, reject) => { // Promise erstellen
					setTimeout(() => { // Asynchrone Verzögerung simulieren
						//this.closeBusyDialog();
						if (bTestCase)  {//Success-Fall simulieren
							this.showSavingSuccessfullMessage();
							return resolve();
						} else { //Error-Fall simulieren
							return reject("Fehler beim Verladen der NVEs.")
						}
					}, 500);
				});
			},

			simulateBackendCallForClearingNVEs: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten.
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
				return new Promise((resolve, reject) => { // Promise erstellen
					setTimeout(() => { // Asynchrone Verzögerung simulieren
						//this.closeBusyDialog();
						if (bTestCase) { //Success-Fall simulieren
							this.showSavingSuccessfullMessage();
							return resolve(); // Erfolgreicher Call
						} else { //Error-Fall simulieren
							return reject("Fehler beim Klären der NVEs");
						}
					}, 500);
				});
			},

			updateModelBindings:function(sModelName){ //Updated jede Eigenschaft innerhalb des Models auf allen Views
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			onDialogAfterOpen: function (oEvent) {
				this._setFocusOnInput("barcodeInput");
			},

			_setFocusOnInput: function (sInputId) {
				let oInput = this.getView().byId(sInputId);

				if (oInput && oInput.getDomRef()) { //Warten bis Renderer fertig ist um Fokus zu setzen
					requestAnimationFrame(() => oInput.focus());
				}
			},

			onManualInputChange: function (oEvent) { //Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();

				this._updateModel("TourAndStopModel", "/nveInputOfCustomer/manualInput", oInput.getValue());
			},

			onManualInputInputLiveChange: function (oEvent) {
				let oInput = oEvent.getSource();

				this._validateInput(oInput);
			},

			_validateInput: function (oInput) { //Zustaendig fuer die Anzeige ob Inhalt der view regex entspricht
				let sValueState = "None";

				try {
					oInput.getBinding("value").getType().validateValue(oInput.getValue());
				} catch (e) {
					sValueState = "Error";
				}
				oInput.setValueState(sValueState);
			},

			_updateModel: function (sModelName, sPath, value) {
				let oModel = this.getOwnerComponent().getModel(sModelName);
				oModel.setProperty(sPath, value);
			},

			resetUserBarcodeInput: function () { //Sowohl Model als auch Input leeren
				this._setValueOnViewById("barcodeInput", "");
				this._updateModel("TourAndStopModel", "/nveInputOfCustomer/manualInput", "");
			},

			_setValueOnViewById: function (sViewId, value) {
				let oInput = this.getView().byId(sViewId);

				oInput.setValue(value);
			},

			scrollToInputAfterError: function () { //Eingabe war nicht OK, sprung in der View zum Feld
				let oInputField = this.getView().byId("barcodeInput");

				oInputField.setValueState("Error");
				setTimeout(() => {
					oInputField.focus();
				}, 50);
			},

			onClearingButtonPress: function (oEvent) { //Sicherheit fuer weitere Logik implementation
				this._handleClearingButtonPress(oEvent);
			},

			_handleClearingButtonPress: function (oEvent) {// Das gedrueckte Element im Model erfassen
				let oTreeModelParent = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();

				this._setClearingNveModel(oTreeModelParent);
			},

			_setClearingNveModel: function (oTreeModelParent) { //Uebergeordnete Struktur in das Klaer-Model setzen
				this.getOwnerComponent().getModel("ClearingAndDialogModels").setProperty("/oClearingNve", oTreeModelParent);
				this._openNveClearingDialog();
			},

			getPossiblyRemainingNves:function(){ //Gibt unbearbeitet Nves zurueck, sofern vorhanden
				let aRemainingNves = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oDeliveryNote/note/aUnprocessedNumberedDispatchUnits") || []; //Noch nicht quittierte Nves

				return aRemainingNves;
			},

			checkForRemainingNves: function () { //Pruefen ob noch Nves zu quittieren sind
				StatusSounds.playBeepSuccess();
				let aRemainingNves = this.getPossiblyRemainingNves(); //Noch nicht quittierte Nves

				if (aRemainingNves.length > 0) { //Wenn mehr als eine NVE zu quittieren ist
					this._processRemainingNves(aRemainingNves); //onLoadAllRemainingNves
				} else {
					this._askForBackNavigation(); //Abfragen ob stattdessen zurueck navigiert werden soll
				}
			},

			_processRemainingNves: function (aRemainingNves) { //NVEs werden alle quittiert
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aLoadingNvesTemp = oTourAndStopModel.getProperty("/oDeliveryNote/note/aTempLoadedNVEs"); //verladene Nves
				let aUpdatedLoadingNvesTemp = [...aLoadingNvesTemp, ...aRemainingNves]; // zusammenfuehren der Nves

				oTourAndStopModel.setProperty("/oDeliveryNote/note/aTempLoadedNVEs", aUpdatedLoadingNvesTemp); //Model der Temp verladenen Nves fuellen
				oTourAndStopModel.setProperty("/oDeliveryNote/note/aUnprocessedNumberedDispatchUnits", []); //Model der noch zu bearbeitenden Nves leeren
			},

			getUnsavedClearedNves:function(){
				let aClearingNvesTemp = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oDeliveryNote/note/aTempClearedNVEs"); //geklaerte Nves

				return aClearingNvesTemp;
			},

			getUnsavedLoadedNves:function(){
				let aLoadingNvesTemp = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oDeliveryNote/note/aTempLoadedNVEs"); //verladene Nves

				return aLoadingNvesTemp;
			},

			checkForUnsavedNves: function () {
				let aClearingNvesTemp = this.getUnsavedClearedNves(); //geklaerte Nves
				let aLoadingNvesTemp = this.getUnsavedLoadedNves(); //verladene Nves

				if (aClearingNvesTemp.length > 0 || aLoadingNvesTemp.length > 0) { //Mindestens eine Nve wurde entweder verladen oder geklaert
					this.driverNveReceiptDescisionBox(); //Abfragen ob diese Gespeichert werden soll
				} else {
					this.navBackToQuittierung(); //Zurueck zur vorherigen Seite
				}
			},

			driverNveReceiptDescisionBox: function () { //Es sind nicht gespeicherte aber bearbeitete NVEs vorhanden
				MessageBox.show(this._oBundle.getText("saveChanges"), {
					icon: MessageBox.Icon.INFORMATION,
					title: this._oBundle.getText("unsavedChanges"),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: (oAction) => {
						if (oAction === "YES") { //Speichern
							this.checkWhatBackendCallsAreNeccessary(true);
						} else { //Abbrechen
							this.AbortCurrentLoadedAndClearedNves();
						}
					},
				});
			},

			_askForBackNavigation: function () { //Alle LS-Positionen Quittieren gedrueckt nachdem alle NVEs bearbeitet wurden
				MessageBox.show(this._oBundle.getText("navBackToUnloading"), {
					icon: MessageBox.Icon.INFORMATION,
					title: this._oBundle.getText("nvesRecieved"),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: (oAction) => {
						if (oAction === "YES") {
							this._saveAllTempStoredNVEs(); //Speichern der temporaeren NVEs
							this.navBackToQuittierung();
						} else {
							//NOP: Dialog schliesst sich selbst
						}
					},
				});
			},

			AbortCurrentLoadedAndClearedNves: function () { //Nachdem Nves verarbeitet wurden moechte der User zurueck gehen ohne zu sichern
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aClearingNvesTemp = this.getUnsavedClearedNves(); //geklaerte Nves
				let aLoadingNvesTemp = this.getUnsavedLoadedNves(); //verladene Nves
				let aLoadingUnits = this.getPossiblyRemainingNves(); //Noch nicht quittierte Nves

				// Temp verladen und geklaerte Nves zusammenfassen und mit den unbearbeiteten zusammenfassen
				let aUpdatedLoadingUnits = [...aLoadingUnits, ...aClearingNvesTemp, ...aLoadingNvesTemp];

				oTourAndStopModel.setProperty("/oDeliveryNote/note/aUnprocessedNumberedDispatchUnits", aUpdatedLoadingUnits);
				this._emptyTempNves();
				this.navBackToQuittierung();
			},

			checkIfNvesWhereLoaded: function () { //Helper Methode, die zurueckgibt ob temporaer verladene NVEs existieren
				let bTempLoadedNves = false;
				let aLoadingNvesTemp = this.getUnsavedLoadedNves(); //verladene Nves

				if (aLoadingNvesTemp.length > 0) {
					bTempLoadedNves = true;
				}
				return bTempLoadedNves;
			},

			checkIfNvesWhereCleared: function () { //Helper Methode, die zurueckgibt ob temporaer geklaerte NVEs existieren
				let bTempClearedNves = false;
				let aClearingNvesTemp = this.getUnsavedClearedNves(); //geklaerte Nves

				if (aClearingNvesTemp.length > 0) {
					bTempClearedNves = true;
				}

				return bTempClearedNves;
			},

			checkIfSavingIsNesseccary: function () { //Explizites Speichern der bearbeiteten NVEs
				if (!this.checkIfNvesWhereCleared() && !this.checkIfNvesWhereLoaded()) { //Wenn weder geklaert noch verladen wurde --> Message Toast
					MessageToast.show(this._oBundle.getText("noProcessedNves"), {
						duration: 1000,
						width: "15em",
					});
				} else {
					this.checkWhatBackendCallsAreNeccessary(false);
				}
			},

			checkWhatBackendCallsAreNeccessary:function(bNavBackToQuittierung){ // Pruefen in welchen Arrays temporaere NVEs vorhanden sind und backend-Call entsprechend ausführen.
				this.openBusyDialog();
				let aPromises = [];
				
				if(this.checkIfNvesWhereLoaded()){ //Boolsche Variable ob verladene Nves existieren
					aPromises.push(this.simulateBackendCallForLoadingNVEs(true));
				}

				if(this.checkIfNvesWhereCleared()){ //Boolsche Variable ob geklaerte Nves existieren
					aPromises.push(this.simulateBackendCallForClearingNVEs(true));
				}

				Promise.all(aPromises)
				.then(() => { // Wenn alle Versprechen eingehalten wurden
					this.closeBusyDialog();
					this._saveAllTempStoredNVEs();
					this.updateModelBindings("TourAndStopModel");

					if (bNavBackToQuittierung) {
						this.navBackToQuittierung();
					}
				})
				.catch((error) => {
					this.closeBusyDialog();
					console.error("Error during backend calls:", error);
					// Optional: Fehlerhandling einbauen
				});	
				
			},

			_saveAllTempStoredNVEs: function () { //sichern der temporär verladenen Nves
				StatusSounds.playBeepSuccess();
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				this._mergeAndSaveNves(oTourAndStopModel, "aTempLoadedNVEs", "aTotalLoadedNVEs");
				this._mergeAndSaveNves(oTourAndStopModel, "aTempClearedNVEs", "aTotalClearedNVEs");
				this._emptyTempNves();
			},

			_mergeAndSaveNves: function (oModel, sTempProperty, sTotalProperty) { //Zusammenfuehren von temp und abgeschlossenen NVEs aus dem klaerungs bzw. verladungs-Model
				let aTempNves = oModel.getProperty("/oDeliveryNote/note/" + sTempProperty);
				let aTotalNves = oModel.getProperty("/oDeliveryNote/note/" + sTotalProperty);

				if (aTempNves.length > 0) {
					let aUpdatedTotalNves = [...aTotalNves, ...aTempNves];
					oModel.setProperty("/oDeliveryNote/note/" + sTotalProperty, aUpdatedTotalNves);
				}
			},

			_emptyTempNves: function () { //Leeren der temporaeren Arrays
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oTourAndStopModel.setProperty("/oDeliveryNote/note/aTempClearedNVEs", []);
				oTourAndStopModel.setProperty("/oDeliveryNote/note/aTempLoadedNVEs", []);
			},

			nveClearingDialogConfirm: function (oEvent) { //Nve soll geklaert werden
				//Platz fuer zusaetzliche Funktionen, die gemacht werden koennen
				this.checkIfMinErrorReasonsSelected(oEvent);
			},

			getCurrentClearingReasons:function(){
				let aCurrentClearingReasons = this.getOwnerComponent().getModel("ClearingAndDialogModels")?.getProperty("/aClearingReasons/results") || [];

				return aCurrentClearingReasons;
			},

			checkIfMinErrorReasonsSelected: function (oEvent) { //pruefen ob mindestanzahl an Gruenden eingehalten wurde 
				let aCurrentClearingReasons = this.getCurrentClearingReasons();
				let aCollectionOfSelectedReasons = aCurrentClearingReasons.filter((element) => element.value === true);

				if (aCollectionOfSelectedReasons.length >= MIN_SELECTED_ERROR_REASONS) { //Mindestanzahl Klaergruende wurde bestaetigt
					this.checkIfMaxErrorReasonsSelected(aCollectionOfSelectedReasons, oEvent);
				} else { //kein Klaergrund wurde ausgewaehlt
					this._showErrorMessageBox("noSelectedItem", () => {});
				}
			},

			checkIfMaxErrorReasonsSelected: function (aCollectionOfSelectedReasons, oEvent) { //pruefen ob maximalanzahl an Gruenden eingehalten wurde
				if (aCollectionOfSelectedReasons.length <= MAX_SELECTED_ERROR_REASONS) { //Maximalanzahl Klaergruende wurde bestaetigt
					this.setClearingResonInNve(aCollectionOfSelectedReasons, oEvent); //Einzelner Reason
					//this.setClearingResonsInNve(aCollectionOfSelectedReasons); //!Mehrere Klaergruende, nicht entfernen!
				} else { //Maximalzahl ueberschritten
					this._showErrorMessageBox("tooManyClearingResonsSelected", () => {});
				}
			},

			getClearingNve:function(){ //Rueckgabe der klaer-Nve
				let oClearingNve = this.getOwnerComponent().getModel("ClearingAndDialogModels").getProperty("/oClearingNve");

				return oClearingNve;
			},

			setClearingResonInNve: function (aCollectionOfSelectedReasons, oEvent) { //Attribut fuer Klaergruende der Nve erstellen und fuellen
				let oClearingNve = this.getClearingNve();

				let oClearingReason = aCollectionOfSelectedReasons[0]; //da nur ein Klaergrund mitgegeben werden kann
				oClearingNve.clearingReasonDescription = oClearingReason.Description; //Beschreibung des Klaergrundes setzen

				this.differenciateNveProcessingType(oClearingNve, oEvent); //Schnittstelle von Klaer- und Verlade-Nves
			},

			setClearingResonsInNve: function (aCollectionOfSelectedReasons) { //!Mehrere Klaergruende, nicht entfernen!
				let oClearingNve = this.getClearingNve();

				oClearingNve.aClearingReasons = {}; //Neues Attribut fuer die Nve erstellen
				oClearingNve.aClearingReasons = aCollectionOfSelectedReasons; //Attribut mit Infos fuellen
				//TODO: undefined muss geaendert werden
				this.differenciateNveProcessingType(oClearingNve, undefined); //Schnittstelle von Klaer- und Verlade-Nves
			},

			nveClearingDialogReject: function () { //Platz fuer zusaetzliche Funktionen, die gemacht werden koennen
				this.nveClearingDialogClose();
			},
			
			getUserInputForNve:function(){ //Auslesen des Strings der eine Nve darstellen soll
				let sManualNveUserInput = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/nveInputOfCustomer/manualInput"); //UserInput aus Feld auslesen

				return sManualNveUserInput;
			},

			checkIfInputConstraintsComply: function (oEvent) { //Pruefen ob Eingabebedingungen erfuellt sind
				let sManualNveUserInput = this.getUserInputForNve(); //UserInput aus Feld auslesen

				if (REGEX_NVE_USER_INPUT.test(sManualNveUserInput)) {
					this.findManualProcessingNve(oEvent);
				} else {
					this._showErrorMessageBox("nameNotMatchingRegex", () => this.scrollToInputAfterError());
				}
			},

			findManualProcessingNve: function (oEvent) { //Zu bearbeitende Nve finden
				let sManualNveUserInput = this.getUserInputForNve(); //UserInput aus Feld auslesen
				let aRemainingNves = this.getPossiblyRemainingNves();

				let oLoadingNve = aRemainingNves.find((element) => element.label1 === sManualNveUserInput);

				if (oLoadingNve) { //Nve fuer manuelle bearbeitung wurde gefunden
					this.differenciateNveProcessingType(oLoadingNve, oEvent);
				} else {
					this.resetUserBarcodeInput();
					this._showErrorMessageBox("noNveFound", () => this.scrollToInputAfterError());
				}
			},

			differenciateNveProcessingType: function (oDiffNve, oEvent) { //unterscheiden ob manuelles klaeren oder verladen verwendet wurde
				let sDialogId = oEvent.getSource().getParent().getId().split("-").pop(); //leider keine bessere Idee dazu gehabt

				if (sDialogId === "clearDialog") { // Klaer-Dialog
					this.saveTempNve(oDiffNve, "Clearing"); 
				} else { // Loading-Klaerung
					this.saveTempNve(oDiffNve, "Loading"); 
				}
			},

			saveTempNve(oNve, sType) { //Bearbeitete NVE in temporaerem equivalent sichern
				StatusSounds.playBeepSuccess();
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let tempNvesKey = sType === "Clearing" ? "/oDeliveryNote/note/aTempClearedNVEs" : "/oDeliveryNote/note/aTempLoadedNVEs";
				let aTempNves = oTourAndStopModel.getProperty(tempNvesKey);
				let aUpdatedTempNves = [...aTempNves, oNve];

				oTourAndStopModel.setProperty(tempNvesKey, aUpdatedTempNves); //Einheitliche Loesung fuer verladen und klaeren
				this.removeProcessedNve(oNve);
			},

			removeProcessedNve: function (oDiffNve) { //Bearbeitete NVE aus Array fuer unbearbeitete NVEs entfernen
				let aRemainingNves = this.getPossiblyRemainingNves();
				let aNewFilteredNves = aRemainingNves.filter((oCurrentNve) => oCurrentNve !== oDiffNve);
				
				this.setNewUnprocessedNves(aNewFilteredNves);
			},

			setNewUnprocessedNves:function(aNewFilteredNves){ //Setzen von neuem Array ohne die bearbeitete Nve
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/oDeliveryNote/note/aUnprocessedNumberedDispatchUnits", aNewFilteredNves);
				this.decideWichDialogShouldBeClosed();
			},

			decideWichDialogShouldBeClosed: function () { //Unterscheidung welcher Dialog nun geschlossen werden muss
				let oManualNveInputDialog = this.getView().byId("ManualNveInputDialogId");
				let oClearDialog = this.getView().byId("clearDialog");
				
				if (oManualNveInputDialog) this.onManualNveInputFragmentClose();
				if (oClearDialog) this.nveClearingDialogClose();
			},

			onNveClearingDialogCallbackReject: function () { //Abbrechen im Dialog fuer manuelles verladen geklickt
				//Platz fuer zusaetzliche Funktionen, die gemacht werden koennen
				this.onManualNveInputFragmentClose();
			},

			clearManualNveInput: function () { //Eingabefeld fuer Klaer-Nve leeren
				this.getOwnerComponent().getModel("TourAndStopModel").setProperty("/nveInputOfCustomer/manualInput", "");
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) { //Generische loesung fuer alle Fehlermeldungen
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			navBackToQuittierung: function () {
				this.updateModelBindings("TourAndStopModel"); //Update, damit DeliveryNotes in der View als abgeschlossen zaehlen koennen
				this.getOwnerComponent().getRouter().navTo("Quittierung");
			},

			addCameraPlayerToCameraDialog: function () { //Erstellen des VideoPlayers fuer den CameraStream und diesen in den Dialog setzen
				let oVideoContainer = this.byId("photoDialogClearingVideoFeedContainer");
				oVideoContainer.setContent("<video id='clearingVideoPlayer' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer fuer die Kamera anheften
				this.enableVideoStream();
			},

			enableVideoStream: function () { // Video-Stream starten
				navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
					document.getElementById("clearingVideoPlayer").srcObject = stream;
				});
			},

			disableVideoStreams: function () { //Video-Stream beenden
				let oVideoStream = document.getElementById("clearingVideoPlayer");
				let oMediaStream = oVideoStream?.srcObject;

				oMediaStream?.getTracks().forEach((track) => track.stop());
			},

			checkIfPhotoNeedsToBeCleared: function () { //Pruefen ob bereits ein Foto angezeigt wird und ggf. entfernen
				let oSavedPhoto = this.getNewestImage();

				if (Object.keys(oSavedPhoto).length !== 0) { //Wenn Objekt Attribute enthaelt, vermeindliches Foto loeschen
					this.clearPhotoModel();
				}
				this.onSnappPicture();
			},

			onSnappPicture: function () { //(neues) Foto machen
				// Video-Feed und Canvas erstellen
				let oVideoFeed = document.getElementById("clearingVideoPlayer");
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d");
				// Datum und Uhrzeit formatieren
				let oDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit
				// Zugriff auf ausgewaehltes Element und Modell
				let oSelectedItem = this.getView().byId("ClearingList").getSelectedItem()?.getId();
				let oCurrentSittingClearingNvesModel = this.getCurrentClearingReasons();
				let aListItems = this.getView().byId("ClearingList").getItems();
				// Finden des Listenelements und Modell-Objekt
				let oListObject = aListItems.find((item) => item.getId() === oSelectedItemId);
				let oSelectedModelItem = oListObject ? oCurrentSittingClearingNvesModel[aListItems.indexOf(oListObject)] : null;
				// Canvas Groeße an Video-Feed anpassen und Bild zeichnen
				canvas.width = oVideoFeed.videoWidth;
				canvas.height = oVideoFeed.videoHeight;
				context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

				let oImageData = canvas.toDataURL("image/png"); //Base 64 encoded Bild-String
				// Bild-Objekt erstellen und speichern
				let oImage = {
					src: oImageData,
					width: "100%",
					height: "auto",
					dateAndTime: oDateAndTime,
					photoType: oSelectedModelItem.Description || "Unknown", // Default-Wert hinzufuegen
					fileName: `${oDateAndTime.replace(/:/g, "-")}.png`, // ":" im Dateinamen vermeiden
					mediaType: "image/png",
					uploadState: "Ready",
				}; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

				this.saveNewImage(oImage);
			},

			saveNewImage: function (oImage) { //Speichern von zu letzt geschossenem Foto
				this.getOwnerComponent().getModel("LatestPhotoModel").setProperty("/photo", oImage);
			},

			getNewestImage:function(){ //zuerckgeben des letzten Fotos
				let oImage = this.getOwnerComponent().getModel("LatestPhotoModel").getProperty("/photo");

				return oImage;
			},

			clearPhotoModel: function () { //entfernen des letzten Fotos
				this.getOwnerComponent().getModel("LatestPhotoModel").setProperty("/photo", {});
			},

			clearingNvesSelectCheck: function () { //Pruefen ob bei Klaergrund auch NVE ausgewaehlt wurde
				let oSelectedItem = this.getView().byId("ClearingList").getSelectedItem();
				if (oSelectedItem) {
					this.onOpenPhotoDialogClearing();
				} else {
					this._showErrorMessageBox("noSelectedItem", () => {});
				}
			},

			onOpenPhotoDialogClearing: function () { //Klaergrund-Dialog oeffnen
				this.oPhotoDialogClearing ??= this.loadFragment({
					name: "podprojekt.view.fragments.photoDialogClearing",
				});

				this.oPhotoDialogClearing.then((oDialog) => oDialog.open());
			},

			onPhotoDialogClearingClose: function () { //Schliessen des DIaloges
				this.disableVideoStreams();
				this.clearPhotoModel();
				this.byId("photoDialogClearing").close();
			},

			onTakenPhoto: function () { //Derzeit nicht benutzt weil fotos in der Abladung oder Quittierung geklaert werden sollten
				//TODO: Hier wuerde Foto fuer den Klaergrund an die NVE gehaengt werden anstatt an das normale Model!
				let oTakenPhoto = this.getNewestImage(); //'Geschossenes' Foto

				//Muss geprueft werden weil Model-Inhalt leeres Objekt ist
				if (Object.keys(oTakenPhoto).length !== 0) { //Wenn Objekt Attribute enthaelt, exisitert ein Foto
					let aPhotos = this.getClearingPhotos();

					if (aPhotos.length < MAX_PHOTOS_ALLOWED) {
						this.pushClearingPhotoToPhotosModel(oTakenPhoto);
					} else {
						this._showErrorMessageBox("notEnoughPhotoSpace", () => {});
					}
				}
				this.onPhotoDialogClearingClose();
			},

			onClearedNvePressed:function(oEvent){ //Klaer-Nve wurde im Anzeigemodus geoeffnet
				let oPressedClearedNve = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();
				let oTourAndStopModel =this.getOwnerComponent().getModel("TourAndStopModel");
				
				oTourAndStopModel.setProperty("/oViewerModeNve", oPressedClearedNve);
				this.openClearedViewerInfoDialog();
			},

			onLoadedNvePressed:function(oEvent){ //Verladene-Nve wurde im Anzeigemodus geoeffnet
				let oPressedLoadedNve = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();
				let oTourAndStopModel =this.getOwnerComponent().getModel("TourAndStopModel");
				
				oTourAndStopModel.setProperty("/oViewerModeNve", oPressedLoadedNve);
				this.openLoadedViewerInfoDialog();
			},

			openClearedViewerInfoDialog:function(){ //Oeffnen des Dialoges zur Ansicht der geklaerten Nve 
				this.oClearedViewerInfoDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.clearedViewerInfoDialog",
				});

				this.oClearedViewerInfoDialog.then((oDialog) => oDialog.open());
			},

			openLoadedViewerInfoDialog:function(){ //Oeffnen des Dialoges zur Ansicht der verladenen Nve 
				this.oLoadedViewerInfoDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.loadedViewerInfoDialog",
				});

				this.oLoadedViewerInfoDialog.then((oDialog) => oDialog.open());
			},

			onClearedViewerInfoDialogClose:function(){ //schliessen des Dialoges zur Ansicht der geklaerten Nve 
				this.getView().byId("clearedViewerInfoDialog").close();
			},

			onLoadedViewerInfoDialogClose:function(){ //schliessen des Dialoges zur Ansicht der verladenen Nve 
				this.getView().byId("loadedViewerInfoDialog").close();
			},

			getClearingPhotos:function(){ //zurueckgeben der Klaergrund-Fotos
				let aPhotos = this.getOwnerComponent().getModel("TourClearingModel").getProperty("/aPhotos");

				return aPhotos;
			},

			pushClearingPhotoToPhotosModel(oTakenPhoto) { //Derzeit nicht benutzt weil fotos in der Abladung oder Qzittierung geklaert werden sollten
				let aPhotos = this.getClearingPhotos();

				aPhotos.push(oTakenPhoto);
				oTourClearingModel.setProperty("/aPhotos", aPhotos);
			},

			showSavingSuccessfullMessage: function () { //Meldung, dass sichern erfolgreich war
				MessageToast.show(this._oBundle.getText("successfullyLoadedNves"), {
					duration: 1000,
					width: "15em",
				});
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
			
			closeBusyDialog: function () { //Schliessen vom Busy-Dialog
				this.byId("BusyDialog").close();
			},

			_openNveClearingDialog: function () { //Oeffnen des Klaer-Dialoges
				this.oNveClearingDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.nveClearingDialog",
				});

				this.oNveClearingDialog.then((oDialog) => oDialog.open());
			},

			nveClearingDialogClose: function () { //Schließen des Klaer-Dialoges
				this.byId("clearDialog").close();
			},

			onManualNveInputFragmentOpen: async function () { //Oeffnen des Handeingabe-Dialoges
				if (!this.oManualNveInputDialog) {
					try {// Lade das Fragment, wenn es noch nicht geladen wurde
						this.oManualNveInputDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.manualNveInput",
						});
					} catch (error) { // Fehlerbehandlung bei Problemen beim Laden des Fragments
						console.error("Fehler beim Laden des ManualNveInputDialogs:", error);
						MessageBox.error(this._oBundle.getText("errorLoadingManualNveInputDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// Oeffne das Dialog, wenn es erfolgreich geladen wurde
				this.oManualNveInputDialog.open();
			},

			onManualNveInputFragmentClose: function () { //Schließen des Handeingabe fragmentes
				this.byId("ManualNveInputDialogId").close();
				this.clearManualNveInput();
			},
		});
	}
);
