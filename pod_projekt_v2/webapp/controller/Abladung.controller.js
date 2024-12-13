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

			resetUserBarcodeInput: function () {
				//Sowohl Model als auch Input leeren
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

			_handleClearingButtonPress: function (oEvent) {
				//Das gedrueckte Element im Model erfassen
				let oTreeModelParent = oEvent.getSource().getBindingContext("DeliveryNoteModel").getObject();

				this._setClearingNveModel(oTreeModelParent);
			},

			_setClearingNveModel: function (oTreeModelParent) {
				//Uebergeordnete Struktur in das Klaer-Model setzen
				this.getOwnerComponent().getModel("nveClearingDialogModel").setProperty("/clearingNve", oTreeModelParent);
				this._openNveClearingDialog();
			},

			checkForRemainingNves: function () {
				//Prüfen ob noch Nves zu quittieren sind
				StatusSounds.playBeepSuccess();
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aRemainingNves = oStopInformationModel.getProperty("/note/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				if (aRemainingNves.length > 0) {
					//Wenn mehr als eine NVE zu quittieren ist
					this._processRemainingNves(aRemainingNves); //onLoadAllRemainingNves
				} else {
					this._askForBackNavigation(); //Abfragen ob stattdessen zurueck navigiert werden soll
				}
			},

			_processRemainingNves: function (aRemainingNves) {
				//NVEs werden alle quittiert
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingNvesTemp = oStopInformationModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves
				let aUpdatedLoadingNvesTemp = [...aLoadingNvesTemp, ...aRemainingNves]; // zusammenführen der Nves

				oStopInformationModel.setProperty("/note/aTempLoadedNVEs", aUpdatedLoadingNvesTemp); //Model der Temp verladenen Nves fuellen
				oStopInformationModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", []); //Model der noch zu bearbeitenden Nves leeren
			},

			checkForUnsavedNves: function () {
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oStopInformationModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves
				let aLoadingNvesTemp = oStopInformationModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves

				if (aClearingNvesTemp.length > 0 || aLoadingNvesTemp.length > 0) {
					//Mindestens eine Nve wurde entweder verladen oder geklaert
					this.driverNveReceiptDescisionBox(); //Abfragen ob diese Gespeichert werden soll
				} else {
					this.navBackToQuittierung(); //Zurück zur vorherigen Seite
				}
			},

			driverNveReceiptDescisionBox: function () {
				//Es sind nicht gespeicherte aber bearbeitete NVEs vorhanden
				MessageBox.show("Save changes bevor going back?", {
					icon: MessageBox.Icon.INFORMATION,
					title: "Unsaved changes!",
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: (oAction) => {
						if (oAction === "YES") {
							//Speichern
							this.showSavingSuccessfullMessage();
							this._saveAllTempStoredNVEs();
							this.updateModelBindings("StopModel");
							this.navBackToQuittierung();
						} else {
							//Abbrechen
							this.AbortCurrentLoadedAndClearedNves();
						}
					},
				});
			},

			_askForBackNavigation: function () {
				//Alle LS-Positionen Quittieren gedrueckt nachdem alle NVEs bearbeitet wurden
				MessageBox.show("Do you want to go back to Abladung?", {
					icon: MessageBox.Icon.INFORMATION,
					title: "NVEs completly received!",
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
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oStopInformationModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves
				let aLoadingNvesTemp = oStopInformationModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves
				let aLoadingUnits = oStopInformationModel.getProperty("/note/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				// Temp verladen und geklaerte Nves zusammenfassen und mit den unbearbeiteten zusammenfassen
				let aUpdatedLoadingUnits = [...aLoadingUnits, ...aClearingNvesTemp, ...aLoadingNvesTemp];

				oStopInformationModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", aUpdatedLoadingUnits);
				this._emptyTempModels();
				this.navBackToQuittierung();
			},

			checkIfNvesWhereLoaded: function () {
				let bTempLoadedNves = false;
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingNvesTemp = oStopInformationModel.getProperty("/note/aTempLoadedNVEs"); //verladene Nves

				if (aLoadingNvesTemp.length > 0) {
					bTempLoadedNves = true;
				}
				return bTempLoadedNves;
			},

			checkIfNvesWhereCleared: function () {
				let bTempClearedNves = false;
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aClearingNvesTemp = oStopInformationModel.getProperty("/note/aTempClearedNVEs"); //geklaerte Nves

				if (aClearingNvesTemp.length > 0) {
					bTempClearedNves = true;
				}

				return bTempClearedNves;
			},

			checkIfSavingIsNesseccary: function () {
				if (!this.checkIfNvesWhereCleared() && !this.checkIfNvesWhereLoaded()) {
					//Wenn weder geklaert noch verladen wurde --> Message Toast
					MessageToast.show(this._oBundle.getText("noProcessedNves"), {
						duration: 1000,
						width: "15em",
					});
				} else {
					this.showSavingSuccessfullMessage();
					this._saveAllTempStoredNVEs();
					this.updateModelBindings("StopModel");
				}
			},

			_saveAllTempStoredNVEs: function () {
				StatusSounds.playBeepSuccess();
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");

				this._mergeAndSaveNves(oStopInformationModel, "aTempLoadedNVEs", "aTotalLoadedNVEs");
				this._mergeAndSaveNves(oStopInformationModel, "aTempClearedNVEs", "aTotalClearedNves");
				this._emptyTempModels();
			},

			_mergeAndSaveNves: function (oModel, sTempProperty, sTotalProperty) {
				let aTempNves = oModel.getProperty("/note/" + sTempProperty);
				let aTotalNves = oModel.getProperty("/note/" + sTotalProperty);

				if (aTempNves.length > 0) {
					let aUpdatedTotalNves = [...aTotalNves, ...aTempNves];
					oModel.setProperty("/note/" + sTotalProperty, aUpdatedTotalNves);
				}
			},

			_emptyTempModels: function () {
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				oStopInformationModel.setProperty("/note/aTempClearedNVEs", []);
				oStopInformationModel.setProperty("/note/aTempLoadedNVEs", []);
			},

			nveClearingDialogConfirm: function () {
				//Platz fuer zusaetzliche Funktionen, die gemacht werden können
				this.chekIfAtLeastOneErrorReasonIsSelected();
			},

			chekIfAtLeastOneErrorReasonIsSelected: function () {
				let oCurrentSittingClearingNvesModel = this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel"); //Model fier alle geklaeten NVEs
				let aCurrentClearingReasons = oCurrentSittingClearingNvesModel.getProperty("/results");
				let aQuantityOfSelectedReasons = aCurrentClearingReasons.filter((element) => element.value === true);

				if (aQuantityOfSelectedReasons.length > 0) {
					//Mindestens 1 Klaergrund wurde ausgewaehlt
					this.checkIfOnlyOneErrorReasonIsSelected(aQuantityOfSelectedReasons);
				} else {
					//kein Klaergrund wurde ausgewaehlt
					this._showErrorMessageBox("noSelectedItem", () => {});
				}
			},

			checkIfOnlyOneErrorReasonIsSelected: function (aQuantityOfSelectedReasons) {
				//let oCurrentSittingClearingNvesModel=this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel"); //Model fier alle geklaeten NVEs
				//let oCurrentClearingReasons=oCurrentSittingClearingNvesModel.getProperty("/results");

				//Hier kann das Intervall beschränkt werden!
				//Bisher >0 --> untere Schranke gegeben
				//Hier >1 --> obere Schranke wird festgelegt
				if (aQuantityOfSelectedReasons.length > 1) {
					//Mindestens 1 Klaergrund wurde ausgewaehlt
					this._showErrorMessageBox("tooManyClearingResonsSelected", () => {});
				} else {
					//ein Klaergrund wurde ausgewaehlt
					this.setClearingResonInNve(aQuantityOfSelectedReasons); //Einzelner Reason
					//this.setClearingResonsInNve(aQuantityOfSelectedReasons); //!Mehrere Klaergruende, nicht entfernen!
				}
			},

			setClearingResonInNve: function (aQuantityOfSelectedReasons) {
				let oClearingNveModel = this.getOwnerComponent().getModel("nveClearingDialogModel");
				let oClearingNve = oClearingNveModel.getProperty("/clearingNve");

				let oClearingReason = aQuantityOfSelectedReasons[0]; //da nur ein Klaergrund mitgegeben werden kann
				oClearingNve.clearingReasyonDescription = oClearingReason.Description; //Beschreibung des Klaergrundes setzen

				//Undefined ist notwendig um die verschiedenen Dialoge auseinander zu halten.
				this.findClearingNve(undefined);
			},

			setClearingResonsInNve: function (aQuantityOfSelectedReasons) {
				//!Mehrere Klaergruende, nicht entfernen!
				let oClearingNveModel = this.getOwnerComponent().getModel("nveClearingDialogModel");
				let oClearingNve = oClearingNveModel.getProperty("/clearingNve");

				oClearingNve.aClearingReasons = {}; //Neues Attribut fuer die Nve erstellen
				oClearingNve.aClearingReasons = aQuantityOfSelectedReasons; //Attribut mit Infos fuellen

				//Nur einkommentieren, wenn die setClearingReasonInNve-Methode nicht verwendet wird.
				//Diese Methode wird nur nicht verwendet, wenn mehrere Klaergruende fuer eine Nve verwendet werden koennen
				//this.findClearingNve();
			},

			nveClearingDialogReject: function () {
				//Platz fuer zusaetzliche Funktionen, die gemacht werden können
				this.nveClearingDialogClose();
			},

			findClearingNve: function (oEvent) {
				//Ganantiert ein Klaer-Objekt vorhanden durch vorherige zwischenschritte
				//Klaer-Objekt finden
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

			findLoadingNve: function (oEvent) {
				//Verlade-Objekt finden
				let oManualNveInputModel = this.getOwnerComponent().getModel("manualNveInputModel");
				let sManualNveUserInput = oManualNveInputModel.getProperty("/manualInput"); //UserInput aus Feld auslesen
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aLoadingUnits = oStopInformationModel.getProperty("/note/aUnprocessedNumberedDispatchUnits");

				let oLoadingNve = aLoadingUnits.find((element) => element.label1 === sManualNveUserInput);

				if (oLoadingNve) {
					this.differenciateNveProcessingType(oLoadingNve, oEvent);
				} else {
					this.resetUserBarcodeInput();
					this._showErrorMessageBox("noNveFound", () => this.scrollToInputAfterError());
				}
			},

			differenciateNveProcessingType: function (oDiffNve, oEvent) {
				let sManualNveInputDialogTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("manualInputTitle");
				let sDialogTitle = oEvent?.getSource()?.getParent()?.getTitle();

				if (!oEvent) {
					this.saveTempNve(oDiffNve, "Clearing"); // Klär-Dialog
				} else if (sDialogTitle === sManualNveInputDialogTitle) {
					this.saveTempNve(oDiffNve, "Loading"); // Hand-Klärung
				}
			},

			saveTempNve(oNve, type) {
				StatusSounds.playBeepSuccess();
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let tempNvesKey = type === "Clearing" ? "/note/aTempClearedNVEs" : "/note/aTempLoadedNVEs";
				let aTempNves = oStopInformationModel.getProperty(tempNvesKey);
				let aUpdatedTempNves = [...aTempNves, oNve];

				oStopInformationModel.setProperty(tempNvesKey, aUpdatedTempNves);
				this.removeProcessedNve(oNve);
			},

			removeProcessedNve: function (oDiffNve) {
				let oStopInformationModel = this.getOwnerComponent().getModel("DeliveryNoteModel");
				let aRemainingNves = oStopInformationModel.getProperty("/note/aUnprocessedNumberedDispatchUnits");
				let aNewFilteredNves = aRemainingNves.filter((oCurrentNve) => oCurrentNve !== oDiffNve);

				oStopInformationModel.setProperty("/note/aUnprocessedNumberedDispatchUnits", aNewFilteredNves);

				this.decideWichDialogShouldBeClosed();
			},

			decideWichDialogShouldBeClosed: function () {
				let oManualNveInputDialog = this.getView().byId("ManualNveInputDialogId");
				let oClearDialog = this.getView().byId("clearDialog");

				if (oManualNveInputDialog) this.onManualNveInputFragmentClose();
				if (oClearDialog) this.nveClearingDialogClose();
			},

			onNveClearingDialogCallbackReject: function () {
				//Abbrechen im Dialog wurde geklickt
				//Platz fuer zusaetzliche Funktionen, die gemacht werden können
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

			addCameraPlayerToCameraDialog: function () {
				//Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
				let oVideoContainer = this.byId("photoDialogClearingVideoFeedContainer");
				oVideoContainer.setContent("<video id='clearingVideoPlayer' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
				this.enableVideoStream();
			},

			enableVideoStream: function () {
				// Video starten
				navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
					document.getElementById("clearingVideoPlayer").srcObject = stream;
				});
			},

			disableVideoStreams: function () {
				//Video beenden
				let oVideoStream = document.getElementById("clearingVideoPlayer");
				let oMediaStream = oVideoStream?.srcObject;

				oMediaStream?.getTracks().forEach((track) => track.stop());
			},

			checkIfPhotoNeedsToBeCleared: function () {
				//Prüfen ob bereits ein Foto angezeigt wird
				let oSavedPhoto = this.getOwnerComponent().getModel("LatestPhotoModel").getProperty("/photo");

				if (Object.keys(oSavedPhoto).length !== 0) {
					//Wenn Objekt Attribute enthält, vermeindliches Foto loeschen
					this.clearPhotoModel();
				}

				this.onSnappPicture();
			},

			onSnappPicture: function () {
				//(neues) Foto machen
				// Video-Feed und Canvas erstellen
				let oVideoFeed = document.getElementById("clearingVideoPlayer");
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d");
				// Datum und Uhrzeit formatieren
				let oDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit
				// Zugriff auf ausgewähltes Element und Modell
				let oSelectedItem = this.getView().byId("ClearingList").getSelectedItem()?.getId();
				let oCurrentSittingClearingNvesModel = this.getOwnerComponent().getModel("CurrentSittingClearingNvesModel")?.getProperty("/results") || [];
				let aListItems = this.getView().byId("ClearingList").getItems();
				// Finden des Listenelements und Modell-Objekt
				let oListObject = aListItems.find((item) => item.getId() === oSelectedItemId);
				let oSelectedModelItem = oListObject ? oCurrentSittingClearingNvesModel[aListItems.indexOf(oListObject)] : null;
				// Canvas Größe an Video-Feed anpassen und Bild zeichnen
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
					photoType: oSelectedModelItem.Description || "Unknown", // Default-Wert hinzufügen
					fileName: `${oDateAndTime.replace(/:/g, "-")}.png`, // ":" im Dateinamen vermeiden
					mediaType: "image/png",
					uploadState: "Ready",
				}; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

				this.saveNewImage(oImage);
			},

			saveNewImage: function (oImage) {
				//Speichern von zu letzt geschossenem Foto
				this.getOwnerComponent().getModel("LatestPhotoModel").setProperty("/photo", oImage);
			},

			clearPhotoModel: function () {
				this.getOwnerComponent().getModel("LatestPhotoModel").setProperty("/photo", {});
			},

			selectCheck: function () {
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

			oTakenPhoto: function () {
				//Derzeit nicht benutzt weil fotos in der Abladung oder Qzittierung geklaert werden sollten
				let oTakenPhoto = this.getOwnerComponent().getModel("LatestPhotoModel").getProperty("/photo"); //'Geschossenes' Foto

				//Muss geprüft werden weil Model-Inhalt leeres Objekt ist
				if (Object.keys(oTakenPhoto).length !== 0) {
					//Wenn Objekt Attribute enthält, exisitert ein Foto
					let aPhotos = this.getOwnerComponent().getModel("TourClearingModel").getProperty("/aPhotos");

					if (aPhotos.length < MAX_PHOTOS_ALLOWED) {
						this.pushClearingPhotoToPhotosModel(oTakenPhoto);
						//this.showSuccessMessage("successfullyLoadedNves");
					} else {
						this._showErrorMessageBox("notEnoughPhotoSpace", () => {});
					}
				}
				this.onPhotoDialogClearingClose();
			},

			pushClearingPhotoToPhotosModel(oTakenPhoto) {
				//Derzeit nicht benutzt weil fotos in der Abladung oder Qzittierung geklaert werden sollten
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

			_openNveClearingDialog: function () {
				//Oeffnen des Klaer-Dialoges
				this.oNveClearingDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.nveClearingDialog",
				});

				this.oNveClearingDialog.then((oDialog) => oDialog.open());
			},

			nveClearingDialogClose: function () {
				//Schließen des Klaer-Dialoges
				this.byId("clearDialog").close();
			},

			onManualNveInputFragmentOpen: async function () {
				//Oeffnen des Handeingabe fragmentes
				if (!this.oManualNveInputDialog) {
					try {
						// Lade das Fragment, wenn es noch nicht geladen wurde
						this.oManualNveInputDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.manualNveInput",
						});
					} catch (error) {
						// Fehlerbehandlung bei Problemen beim Laden des Fragments
						console.error("Fehler beim Laden des ManualNveInputDialogs:", error);
						MessageBox.error(this._oBundle.getText("errorLoadingManualNveInputDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// Öffne das Dialog, wenn es erfolgreich geladen wurde
				this.oManualNveInputDialog.open();
			},

			onManualNveInputFragmentClose: function () {
				//Schließen des Handeingabe fragmentes
				this.byId("ManualNveInputDialogId").close();
				this.clearManualNveInput();
			},
		});
	}
);
