sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast, MessageBox, StatusSounds) {
		"use strict";

		const MAX_PHOTOS_ALLOWED = 5;
		const REGEX_NVE_USER_INPUT = /^[0-9]{5}$/; //es sind nur Ziffern erlaubt mit genau 5 Zeichen laenge

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
						if (bTestCase) {
							//Success-Fall simulieren
							this.showSavingSuccessfullMessage();
							return resolve();
						} else {
							//Error-Fall simulieren
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
						if (bTestCase) {
							//Success-Fall simulieren
							this.showSavingSuccessfullMessage();
							return resolve(); // Erfolgreicher Call
						} else {
							//Error-Fall simulieren
							return reject("Fehler beim Klären der NVEs");
						}
					}, 500);
				});
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			onDialogAfterOpen: function (oEvent) {
				this._setFocusOnInput("barcodeInput");
			},

			_setFocusOnInput: function (sInputId) {
				let oInput = this.getView().byId(sInputId);

				if (oInput && oInput.getDomRef()) {
					requestAnimationFrame(() => oInput.focus());
				}
			},

			onManualInputChange: function (oEvent) {
				//Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();

				this._updateModel("manualNveInputModel", "/manualInput", oInput.getValue());
			},

			onManualInputInputLiveChange: function (oEvent) {
				let oInput = oEvent.getSource();

				this._validateInput(oInput);
			},

			_validateInput: function (oInput) {
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
				this._updateModel("manualNveInputModel", "/manualInput", "");
			},

			_setValueOnViewById: function (sViewId, value) {
				let oInput = this.getView().byId(sViewId);

				oInput.setValue(value);
			},

			scrollToInputAfterError: function () {
				let oInputField = this.getView().byId("barcodeInput");

				oInputField.setValueState("Error");
				setTimeout(() => {
					oInputField.focus();
				}, 50);
			},

			onClearingButtonPress: function (oEvent) {
				this._handleClearingButtonPress(oEvent);
			},

			_handleClearingButtonPress: function (oEvent) {// Das gedrueckte Element im Model erfassen
				let oTreeModelParent = oEvent.getSource().getBindingContext("DeliveryNoteModel").getObject();

				this._setClearingNveModel(oTreeModelParent);
			},

			_setClearingNveModel: function (oTreeModelParent) { //Uebergeordnete Struktur in das Klaer-Model setzen
				this.getOwnerComponent().getModel("nveClearingDialogModel").setProperty("/clearingNve", oTreeModelParent);
				this._openNveClearingDialog();
			},

			checkForRemainingNves: function () { //Pruefen ob noch Nves zu quittieren sind
				StatusSounds.playBeepSuccess();
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aRemainingNves = oDeliveryNoteModel.getProperty("/note/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				if (aRemainingNves.length > 0) { //Wenn mehr als eine NVE zu quittieren ist
					this._processRemainingNves(aRemainingNves); //onLoadAllRemainingNves
				} else {
					this._askForBackNavigation(); //Abfragen ob stattdessen zurueck navigiert werden soll
				}
			},

			_processRemainingNves: function (aRemainingNves) { //NVEs werden alle quittiert
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves
				let aUpdatedLoadingNvesTemp = [...aLoadingNvesTemp, ...aRemainingNves]; // zusammenfuehren der Nves

				oDeliveryNoteModel.setProperty("/note/aTempLoadedNVEs", aUpdatedLoadingNvesTemp); //Model der Temp verladenen Nves fuellen
				oDeliveryNoteModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", []); //Model der noch zu bearbeitenden Nves leeren
			},

			checkForUnsavedNves: function () {
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves
				let aLoadingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves

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

			AbortCurrentLoadedAndClearedNves: function () {
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves
				let aLoadingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves
				let aLoadingUnits = oDeliveryNoteModel.getProperty("/note/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				// Temp verladen und geklaerte Nves zusammenfassen und mit den unbearbeiteten zusammenfassen
				let aUpdatedLoadingUnits = [...aLoadingUnits, ...aClearingNvesTemp, ...aLoadingNvesTemp];

				oDeliveryNoteModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", aUpdatedLoadingUnits);
				this._emptyTempModels();
				this.navBackToQuittierung();
			},

			checkIfNvesWhereLoaded: function () { //Helper Methode, die zurueckgibt ob temporaer verladene NVEs existieren
				let bTempLoadedNves = false;
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves

				if (aLoadingNvesTemp.length > 0) {
					bTempLoadedNves = true;
				}
				return bTempLoadedNves;
			},

			checkIfNvesWhereCleared: function () { //Helper Methode, die zurueckgibt ob temporaer geklaerte NVEs existieren
				let bTempClearedNves = false;
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oDeliveryNoteModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves

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
				
				if(this.checkIfNvesWhereLoaded()){
					aPromises.push(this.simulateBackendCallForLoadingNVEs(true));
				}

				if(this.checkIfNvesWhereCleared()){
					aPromises.push(this.simulateBackendCallForClearingNVEs(true));
				}

				Promise.all(aPromises)
				.then(() => { // Wenn alle Versprechen eingehalten wurden
					this.closeBusyDialog();
					this._saveAllTempStoredNVEs();
					this.updateModelBindings("StopModel");

					if (bNavBackToQuittierung) {
						this.navBackToQuittierung();
					}
				})
				.catch((error) => {
					console.error("Error during backend calls:", error);
					// Optional: Fehlerhandling einbauen
				});	
				
			},

			_saveAllTempStoredNVEs: function () {
				StatusSounds.playBeepSuccess();
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");

				this._mergeAndSaveNves(oDeliveryNoteModel, "aTempLoadedNVEs", "aTotalLoadedNVEs");
				this._mergeAndSaveNves(oDeliveryNoteModel, "aTempClearedNVEs", "aTotalClearedNVEs");
				this._emptyTempModels();
			},

			_mergeAndSaveNves: function (oModel, sTempProperty, sTotalProperty) { //Zusammenfuehren von temp und abgeschlossenen NVEs aus dem klaerungs bzw. verladungs-Model
				let aTempNves = oModel.getProperty("/note/" + sTempProperty);
				let aTotalNves = oModel.getProperty("/note/" + sTotalProperty);

				if (aTempNves.length > 0) {
					let aUpdatedTotalNves = [...aTotalNves, ...aTempNves];
					oModel.setProperty("/note/" + sTotalProperty, aUpdatedTotalNves);
				}
			},

			_emptyTempModels: function () { //Leeren der temporaeren Arrays
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				oDeliveryNoteModel.setProperty("/note/aTempClearedNVEs", []);
				oDeliveryNoteModel.setProperty("/note/aTempLoadedNVEs", []);
			},

			nveClearingDialogConfirm: function (oEvent) { //Platz fuer zusaetzliche Funktionen, die gemacht werden koennen
				this.chekIfAtLeastOneErrorReasonIsSelected(oEvent);
			},

			chekIfAtLeastOneErrorReasonIsSelected: function (oEvent) {
				let oCurrentSittingClearingNvesModel = this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel"); //Model fier alle geklaeten NVEs
				let aCurrentClearingReasons = oCurrentSittingClearingNvesModel.getProperty("/results");
				let aQuantityOfSelectedReasons = aCurrentClearingReasons.filter((element) => element.value === true);

				if (aQuantityOfSelectedReasons.length > 0) { //Mindestens 1 Klaergrund wurde ausgewaehlt
					this.checkIfOnlyOneErrorReasonIsSelected(aQuantityOfSelectedReasons, oEvent);
				} else { //kein Klaergrund wurde ausgewaehlt
					this._showErrorMessageBox("noSelectedItem", () => {});
				}
			},

			checkIfOnlyOneErrorReasonIsSelected: function (aQuantityOfSelectedReasons, oEvent) {
				//Hier kann das Intervall beschraenkt werden!
				//Bisher >0 --> untere Schranke gegeben
				//Hier >1 --> obere Schranke wird festgelegt
				if (aQuantityOfSelectedReasons.length > 1) {
					//Mindestens 1 Klaergrund wurde ausgewaehlt
					this._showErrorMessageBox("tooManyClearingResonsSelected", () => {});
				} else {
					//ein Klaergrund wurde ausgewaehlt
					this.setClearingResonInNve(aQuantityOfSelectedReasons, oEvent); //Einzelner Reason
					//this.setClearingResonsInNve(aQuantityOfSelectedReasons); //!Mehrere Klaergruende, nicht entfernen!
				}
			},

			setClearingResonInNve: function (aQuantityOfSelectedReasons, oEvent) {
				let oClearingNveModel = this.getOwnerComponent().getModel("nveClearingDialogModel");
				let oClearingNve = oClearingNveModel.getProperty("/clearingNve");

				let oClearingReason = aQuantityOfSelectedReasons[0]; //da nur ein Klaergrund mitgegeben werden kann
				oClearingNve.clearingReasonDescription = oClearingReason.Description; //Beschreibung des Klaergrundes setzen

				this.findClearingNve(oEvent);
			},

			setClearingResonsInNve: function (aQuantityOfSelectedReasons) { //!Mehrere Klaergruende, nicht entfernen!
				let oClearingNveModel = this.getOwnerComponent().getModel("nveClearingDialogModel");
				let oClearingNve = oClearingNveModel.getProperty("/clearingNve");

				oClearingNve.aClearingReasons = {}; //Neues Attribut fuer die Nve erstellen
				oClearingNve.aClearingReasons = aQuantityOfSelectedReasons; //Attribut mit Infos fuellen

				//Nur einkommentieren, wenn die setClearingReasonInNve-Methode nicht verwendet wird.
				//Diese Methode wird nur nicht verwendet, wenn mehrere Klaergruende fuer eine Nve verwendet werden koennen
				//this.findClearingNve();
			},

			nveClearingDialogReject: function () { //Platz fuer zusaetzliche Funktionen, die gemacht werden koennen
				this.nveClearingDialogClose();
			},

			findClearingNve: function (oEvent) { //Klaer-Objekt finden
				//Ganantiert ein Klaer-Objekt vorhanden durch vorherige zwischenschritte
				let oClearingNve = this.getOwnerComponent().getModel("nveClearingDialogModel").getProperty("/clearingNve"); //Model der zu klaerenden Nve
				this.differenciateNveProcessingType(oClearingNve, oEvent); //Schnittstelle von Klaer- und Verlade-Nves
			},

			checkIfInputConstraintsComply: function (oEvent) {
				let sManualNveUserInput = this.getOwnerComponent().getModel("manualNveInputModel").getProperty("/manualInput"); //UserInput aus Feld auslesen

				if (REGEX_NVE_USER_INPUT.test(sManualNveUserInput)) {
					this.findLoadingNve(oEvent);
				} else {
					this._showErrorMessageBox("nameNotMatchingRegex", () => this.scrollToInputAfterError());
				}
			},

			findLoadingNve: function (oEvent) { //Verlade-Objekt finden
				let oManualNveInputModel = this.getOwnerComponent().getModel("manualNveInputModel");
				let sManualNveUserInput = oManualNveInputModel.getProperty("/manualInput"); //UserInput aus Feld auslesen
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingUnits = oDeliveryNoteModel.getProperty("/note/aUnprocessedNumberedDispatchUnits");

				let oLoadingNve = aLoadingUnits.find((element) => element.label1 === sManualNveUserInput);

				if (oLoadingNve) {
					this.differenciateNveProcessingType(oLoadingNve, oEvent);
				} else {
					this.resetUserBarcodeInput();
					this._showErrorMessageBox("noNveFound", () => this.scrollToInputAfterError());
				}
			},

			differenciateNveProcessingType: function (oDiffNve, oEvent) { //unterscheiden ob manuelles klaeren oder verladen verwendet wurde
				let sButtonId = oEvent.getSource().getId().split("-").pop();

				if (sButtonId === "clearNVEOkBtn") { // Klaer-Dialog
					this.saveTempNve(oDiffNve, "Clearing"); 
				} else { // Hand-Klaerung
					this.saveTempNve(oDiffNve, "Loading"); 
				}
			},

			saveTempNve(oNve, type) { //Bearbeitete NVE in temporaerem equivalent sichern
				StatusSounds.playBeepSuccess();
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let tempNvesKey = type === "Clearing" ? "/note/aTempClearedNVEs" : "/note/aTempLoadedNVEs";
				let aTempNves = oDeliveryNoteModel.getProperty(tempNvesKey);
				let aUpdatedTempNves = [...aTempNves, oNve];

				oDeliveryNoteModel.setProperty(tempNvesKey, aUpdatedTempNves);
				this.removeProcessedNve(oNve);
			},

			removeProcessedNve: function (oDiffNve) { //Bearbeitete NVE aus Array fuer unbearbeitete NVEs entfernen
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aRemainingNves = oDeliveryNoteModel.getProperty("/note/aUnprocessedNumberedDispatchUnits");
				let aNewFilteredNves = aRemainingNves.filter((oCurrentNve) => oCurrentNve !== oDiffNve);

				oDeliveryNoteModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", aNewFilteredNves);

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

			clearManualNveInput: function () {
				this.getOwnerComponent().getModel("manualNveInputModel").setProperty("/manualInput", "");
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			navBackToQuittierung: function () {
				this.updateModelBindings("StopInformationModel"); //Update, damit DeliveryNotes in der View als abgeschlossen zaehlen koennen
				this.getOwnerComponent().getRouter().navTo("Quittierung");
			},

			addCameraPlayerToCameraDialog: function () { //Erstellen des VideoPlayers fuer den CameraStream und diesen in den Dialog setzen
				let oVideoContainer = this.byId("photoDialogClearingVideoFeedContainer");
				oVideoContainer.setContent("<video id='clearingVideoPlayer' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer fuer die Kamera anheften
				this.enableVideoStream();
			},

			enableVideoStream: function () { // Video starten
				navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
					document.getElementById("clearingVideoPlayer").srcObject = stream;
				});
			},

			disableVideoStreams: function () { //Video beenden
				let oVideoStream = document.getElementById("clearingVideoPlayer");
				let oMediaStream = oVideoStream?.srcObject;

				oMediaStream?.getTracks().forEach((track) => track.stop());
			},

			checkIfPhotoNeedsToBeCleared: function () { //Pruefen ob bereits ein Foto angezeigt wird und ggf. entfernen
				let oSavedPhoto = this.getOwnerComponent().getModel("LatestPhotoModel").getProperty("/photo");

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
				let oCurrentSittingClearingNvesModel = this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel")?.getProperty("/results") || [];
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

			clearPhotoModel: function () { //entfernen von letztem Foto
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

			onOpenPhotoDialogClearing: function () {
				this.oPhotoDialogClearing ??= this.loadFragment({
					name: "podprojekt.view.fragments.photoDialogClearing",
				});

				this.oPhotoDialogClearing.then((oDialog) => oDialog.open());
			},

			onPhotoDialogClearingClose: function () {
				this.disableVideoStreams();
				this.clearPhotoModel();
				this.byId("photoDialogClearing").close();
			},

			oTakenPhoto: function () { //Derzeit nicht benutzt weil fotos in der Abladung oder Quittierung geklaert werden sollten
				//TODO: Hier wuerde Foto fuer den Klaergrund an die NVE gehaengt werden anstatt an das normale Model!
				let oTakenPhoto = this.getOwnerComponent().getModel("LatestPhotoModel").getProperty("/photo"); //'Geschossenes' Foto

				//Muss geprueft werden weil Model-Inhalt leeres Objekt ist
				if (Object.keys(oTakenPhoto).length !== 0) { //Wenn Objekt Attribute enthaelt, exisitert ein Foto
					let aPhotos = this.getOwnerComponent().getModel("TourClearingModel").getProperty("/aPhotos");

					if (aPhotos.length < MAX_PHOTOS_ALLOWED) {
						this.pushClearingPhotoToPhotosModel(oTakenPhoto);
					} else {
						this._showErrorMessageBox("notEnoughPhotoSpace", () => {});
					}
				}
				this.onPhotoDialogClearingClose();
			},

			pushClearingPhotoToPhotosModel(oTakenPhoto) { //Derzeit nicht benutzt weil fotos in der Abladung oder Qzittierung geklaert werden sollten
				let oTourClearingModel = this.getOwnerComponent().getModel("TourClearingModel");
				let aPhotos = oTourClearingModel.getProperty("/aPhotos");

				aPhotos.push(oTakenPhoto);
				oTourClearingModel.setProperty("/aPhotos", aPhotos);
			},

			showSavingSuccessfullMessage: function () {
				MessageToast.show(this._oBundle.getText("successfullyLoadedNves"), {
					duration: 1000,
					width: "15em",
				});
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
