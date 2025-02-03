sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/m/MessageToast", "podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox, MessageToast, StatusSounds) {
		"use strict";

		// Definierte Konstanten
		const ROUTE_QUITTIERUNG = "Quittierung";
		const REGEX_CUSTOMER_NAME = /^[a-zA-ZäöüßÄÖÜ\-]{2,15}$/; //nur Buchstaben mit mindestlaenge 2, maxlaenge 15 und Sonderzeichen '-'
		const PHOTO_LIMITS = {
			"Zum Stopp": 5,
			"Zur Beanstandung": 3,
			"Test": 0
		};

		return Controller.extend("podprojekt.controller.Quittierung", {
			onInit: function () {
				let oRouter = this.getOwnerComponent().getRouter(); // Router registrieren, um Routing-Ereignisse zu verarbeiten
				oRouter.getRoute(ROUTE_QUITTIERUNG).attachPatternMatched(this._onObjectMatched, this);
			},

			onAfterRendering: function () {
				this._oBundle = this.getView().getModel("i18n").getResourceBundle();
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			_onObjectMatched: function () { //Fokus-Methoden aufruf nach dem Routing
				this._setFocus();
			},

			_setFocus: function () { //Tatsaechliches setzen des Fokus
				// Verzoegertes Setzen des Fokus, um sicherzustellen, dass das Element vollstaendig gerendert ist
				const oInput = this.getView()?.byId("recipientNameInp");

				if (oInput?.getDomRef()) {
					requestAnimationFrame(() => oInput.focus());
				}
			},

			onCustomerNameInputChange: function (oEvent) {
				//Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();
				this.setCustomerName(oInput.getValue());
			},

			setCustomerName:function(sCustomerInput){
				this.getView().getModel("TourAndStopModel").setProperty("/aQuittierungInformation/sName", sCustomerInput);
			},

			onCustomerNameInputLiveChange: function (oEvent) { //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
				let oInput = oEvent.getSource();
				this._handleRequiredField(oInput);
				this._checkInputConstraints(oInput);
			},

			_handleRequiredField: function (oInput) { //Wenn kein Wert im Inputfeld vorliegt, Rot markieren
				oInput.setValueState(oInput.getValue() ? "None" : "Error");
			},

			_checkInputConstraints: function (oInput) { //Wenn Wert nicht der Regex entspricht, Rot markieren
				let oBinding = oInput.getBinding("value");
				let sValueState = "None";

				try {
					oBinding.getType().validateValue(oInput.getValue());
				} catch (oException) {
					sValueState = "Error";
				}
				oInput.setValueState(sValueState);
			},

			onRecipientNotFound: function () { //TODO: Wenn Empfaenger nicht da ist, Tour fertig machen und abschicken
				this._showMessageToast("dummyProcessFinished", 2500);

				setTimeout(() => {
					this.setCurrentStopAsFinished(); //Demo weil Kunde nicht angetroffen
					this.onNavToActiveTour();
				}, 2000);
			},

			setCurrentStopAsFinished: function () {
				//!Statuscodes muessen abgesprochen werden
				let oCurrentStop = this.getCurrentStopOfTour(); 
				let aStopsOfCurrentTour = this.getStopsOfCurrentTour(); 
				let oFoundCurrentStop = aStopsOfCurrentTour.find((element) => element.addressName1 === oCurrentStop.addressName1); //'.filter' wuerde ein Arraay zurueckgeben

				if (oFoundCurrentStop) {
					oFoundCurrentStop.stopStatus = "70"; // --> Annahme: 70 ist erledigt
				}
			},

			getCurrentStopOfTour:function(){
				let oCurrentStop = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentStop"); //Infos ueber derzeitigen Stopp

				return oCurrentStop;
			},

			getStopsOfCurrentTour:function(){
				let aStopsOfCurrentTour = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/stops"); //Tour mit allen Stopps und Infos vorhanden

				return aStopsOfCurrentTour;
			},

			_showMessageToast: function (sMessageKey, iDuration) {
				MessageToast.show(this._oBundle.getText(sMessageKey), {
					duration: iDuration,
					width: "15em",
				});
			},

			onDeliveryNotePressed: function (oEvent) { //Infos fuer deliveryNote in Model setzen
				let oPressedDeliveryNote=oEvent.getSource().getBindingContext("TourAndStopModel").getObject(); //Fuer den Fall, dass es mal mehrere DeliveryNotes geben sollte
				this.setPressedDeliveryNoteModel(oPressedDeliveryNote);
			},

			setPressedDeliveryNoteModel:function(oPressedDeliveryNote){
				let oDeliveryNoteModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oDeliveryNoteModel.setProperty("/oDeliveryNote/note", oPressedDeliveryNote);
				this.onNavToAbladung();
			},

			addCameraPlayerToCameraDialog: function () {//Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
				this.onPhotoTypesSelectChange(); //Initiales setzen des Models für die gemachten Fotos
				let oVideoContainer = this.byId("videoFeedContainer"); 
				oVideoContainer.setContent("<video id='player' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
				this.enableVideoStream();
			},

			enableVideoStream: function () { // Video Streams starten
				navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
					let oPlayer = document.getElementById("player");
					if (oPlayer) oPlayer.srcObject = stream;
				});
			},

			disableVideoStreams: function () { //Video Streams beenden
				let oVideoStream = document.getElementById("player");
				if (oVideoStream) {
					let oMediaStream = oVideoStream.srcObject;
					if (oMediaStream) {
						oMediaStream.getTracks().forEach((track) => track.stop());
					}
				}
				this.clearLatestPhotoFromPhotoModel();
			},

			onOpenPhotoDialog: function () { //Dialog für das aufnehmen eines Fotos oeffnen
				this.oAddFotoDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.fotomachen",
				});

				this.oAddFotoDialog.then((oDialog) => oDialog.open());
			},

			scrollToInputAfterError: function () { //View zum Empfaenger Namen scrollen
				let oInputField = this.getView().byId("recipientNameInp");

				if (oInputField?.getDomRef()) {
					oInputField.setValueState("Error");
					requestAnimationFrame(() => oInputField.focus());
				}
			},

			scrollToDeliveryNotesAfterError: function () { //View zur deliveryNote scrollen
				let oDeliveryNotesTable = this.getView().byId("deliveryNoteList");
				let oDeliveryNote = oDeliveryNotesTable.getItems()[0];

				if (oDeliveryNote?.getDomRef()) {
					requestAnimationFrame(() => oDeliveryNote.focus());
				}
			},

			checkSignConditions: function () {
				this.checkIfInputConstraintsComply();
			},

			getCustomerName:function(){
				let sTourAndStopModelInput = this.getView().getModel("TourAndStopModel").getProperty("/aQuittierungInformation/sName");

				return sTourAndStopModelInput;
			},

			checkIfInputConstraintsComply: function () { //Werteeingabe gegen regex pruefen
				let sConfigModelInput = this.getCustomerName();

				if (REGEX_CUSTOMER_NAME.test(sConfigModelInput)) { //Eingabe-Parameter passen
					this.checkIfNvesAreProcessed();
				} else { //Eingabe-Parameter passen nicht
					this.showMatchingErrorReason();
				}
			},

			showMatchingErrorReason:function(){
				let sConfigModelInput = this.getCustomerName();

				if (!sConfigModelInput || sConfigModelInput.length === 0) { //Kein Name Angegeben
					this._showErrorMessageBox("nameNotMatchingRegexEmpty", () => this.scrollToInputAfterError());
				}
			
				if (sConfigModelInput && sConfigModelInput.length > 0 && sConfigModelInput.length < 2) { //Name mit weniger als 2 Buchstaben
					this._showErrorMessageBox("nameNotMatchingRegexNameTooShort", () => this.scrollToInputAfterError());
				}
			
				if (sConfigModelInput && sConfigModelInput.length >= 2) { //Allgemeine sonderzeichenregel verletzt
					this._showErrorMessageBox("nameNotMatchingRegex", () => this.scrollToInputAfterError());
				}

			},

			checkIfNvesAreProcessed: function () { //Prüfen ob noch nicht bearbeitete Nves existieren
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aRemainingNves = oTourAndStopModel.getProperty("/oDeliveryNote/note/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

				if (aRemainingNves.length > 0) { //Es sind noch Nves zu bearbeiten
					this._showErrorMessageBox("notPermitedToSignTour", () => this.scrollToDeliveryNotesAfterError());
				} else { //Es sind keine Nves mehr zu bearbeiten
					this.setSigningDateAndTime();
					this.setComplaints();
				}
			},

			setSigningDateAndTime: function () { //Erstellen des Datums und der Uhrzeit fuer die Unterschrift-Seite
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit
				oTourAndStopModel.setProperty("/customerInformation/dateAndTime", sDateAndTime);

				this.onNavToUnterschrift();
			},

			setComplaints:function(){
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aCollectionOfFilteredComplaints = this.getFilteredComplaints();
				
				oTourAndStopModel.setProperty("/aQuittierungInformation/aComplaints", aCollectionOfFilteredComplaints);
			},

			getFilteredComplaints:function(){
				let aCurrentComplaints = this.getOwnerComponent().getModel("ComplaintsModel")?.getProperty("/results") || [];
				let aCollectionOfFilteredComplaints = aCurrentComplaints.filter((element) => element.value === true);

				return aCollectionOfFilteredComplaints;
			},

			onAddFotoDialogClose: function () { //Schließen Dialog
				this.disableVideoStreams();
				this.byId("FotoMachenDialog").close();
			},

			getLatestPhoto:function(){
				let oSavedPhoto = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/latestPhoto"); //Zuletzt aufgenommenes Foto

				return oSavedPhoto;
			},

			checkIfPhotoNeedsToBeCleared: function () { //Prüfen ob bereits ein Foto angezeigt wird
				let oSavedPhoto = this.getLatestPhoto(); //Zuletzt aufgenommenes Foto

				if (Object.keys(oSavedPhoto).length !== 0) { //Wenn Objekt Attribute enthaelt, vermeindliches Foto loeschen
					this.clearLatestPhotoFromPhotoModel();
				}

				this.onSnappPicture();
			},

			clearLatestPhotoFromPhotoModel: function () {
				let oPhotoModel = this.getOwnerComponent().getModel("PhotoManagementModel"); //Model in dem das geschossene Foto gespeichert wird

				oPhotoModel.setProperty("/photos/latestPhoto", {});
			},

			getSelectedPhotoTypeDescription:function(){
				let sSelectedType = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/selectedType/photoTyp"); //Selektierter Foto-Typ

				return sSelectedType;
			},

			onSnappPicture: function () { //(neues) Foto machen
				let oVideoFeed = document.getElementById("player"); //VideoStream
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d");
				let oDateAndTime = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY HH:mm:ss",
				}).format(new Date()); //Datum inklusive Uhrzeit

				let sSelectedType = this.getSelectedPhotoTypeDescription(); //Selektierter Foto-Typ

				canvas.width = oVideoFeed.videoWidth;
				canvas.height = oVideoFeed.videoHeight;
				context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

				let oImageData = canvas.toDataURL("image/png"); //Base 64 encoded Bild-String

				let oImage = {
					src: oImageData,
					width: "100%",
					height: "auto",
					dateAndTime: oDateAndTime,
					photoType: sSelectedType,
					fileName: oDateAndTime + ".png",
					mediaType: "image/png",
					uploadState: "Ready",
				}; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

				this.setNewImage(oImage);
			},

			onPhotoTypesSelectChange: function () {
				let oSelectedPhotoType = this.getView().byId("photoTypeSelect").getSelectedItem();
				let oSelectedType = oSelectedPhotoType.getBindingContext("PhotoManagementModel").getObject();
				this.setPhotoManagementModel(oSelectedType);
			},

			setPhotoManagementModel: function (oSelectedType) {
				let oPhotoManagementModel = this.getOwnerComponent().getModel("PhotoManagementModel");

				oPhotoManagementModel.setProperty("/photos/selectedType", oSelectedType);
			},

			getSelectedPhotoCount:function(){
				let iCurrentPhotoCount = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/selectedType/photo").length; // Erhalte die Anzahl der aktuellen Fotos

				return iCurrentPhotoCount;
			},

			checkPhotoLimit: function (sPhotoType) { //Wirft eine Fehlermeldung, wenn Menge an Fotos überschritten wird

				let iAllowedPhotos = PHOTO_LIMITS[sPhotoType] || 0; // Hole das erlaubte Limit basierend auf dem Foto-Typ
				let iCurrentPhotoCount = this.getSelectedPhotoCount(); // Erhalte die Anzahl der aktuellen Fotos

				return iCurrentPhotoCount < iAllowedPhotos; // Überprüfe, ob noch Platz für weitere Fotos ist
			},

			onCheckIfPhotoTaken: function () { //Pruefen ob bereits ein Foto geschossen wurde und das 'alte' geloescht werden muss
				let oTakenPhoto =this.getLatestPhoto(); //'Geschossenes' Foto

				if (Object.keys(oTakenPhoto).length !== 0) {//Wenn Objekt Attribute enthaelt, exisitert ein Foto
					this.confirmFoto();
				} else {
					MessageToast.show(this._oBundle.getText("noPhotoTaken"), {
						duration: 1000,
						width: "15em",
					});
				}
			},

			getSelectedPhotoType:function(){
				let oSelectedType = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/selectedType"); //Selektierter Foto-Typ
				
				return oSelectedType;
			},

			confirmFoto: function () { //Foto bestaetigen und übernehmen
				let oTakenPhoto = this.getLatestPhoto(); //Geschossenes Foto
				let oSelectedType = this.getSelectedPhotoType(); //Selektierter Foto-Typ
				let bEnoughSpace = this.checkPhotoLimit(oSelectedType.photoTyp); //Platz für weitere Fotos?

				if (bEnoughSpace) {
					this.setNewPhotoForType(oSelectedType, oTakenPhoto);
					this.setNewPhotoInPhotoList(oTakenPhoto); //Uebernehmen in der Allgemeinen Liste
				} else {
					this._showErrorMessageBox("notEnoughSpace", () => {});
				}
				this.clearLatestPhotoFromPhotoModel();
			},

			setNewPhotoForType:function(oSelectedPhotoType, oTakenPhoto){
				let oPhotoManagementModel = this.getOwnerComponent().getModel("PhotoManagementModel"); //Model mit gespeichertem Foto-Typ
				let aUpdatedPhotos = [...oSelectedPhotoType.photo, oTakenPhoto]; // Erstellen eines Arrays mit alten Fotos und neuem Foto darin

				oPhotoManagementModel.setProperty("/photos/selectedType/photo", aUpdatedPhotos); // Setzen der neuen Fotos in das Model
				oPhotoManagementModel.refresh(true); // Erzwinge binding refresh fuer dialog Titel
			},

			onUploadSelectedButton: function () {
				MessageToast.show(this._oBundle.getText("demoUpload"), {
					duration: 2500,
					width: "15em",
				});
			},

			setNewImage: function (oImage) { //Speichern von zu letzt geschossenem Foto
				let oPhotoModel = this.getOwnerComponent().getModel("PhotoManagementModel");
				oPhotoModel.setProperty("/photos/latestPhoto", oImage);
				oPhotoModel.refresh();
			},

			setNewPhotoInPhotoList: function (oImage) {
				let oPhotoListModel = this.getOwnerComponent().getModel("PhotoManagementModel");
				let aPhotoListItems = oPhotoListModel.getProperty("/photos/allPhotos");
				let aUpdatedPhotos = [...aPhotoListItems, oImage];

				oPhotoListModel.setProperty("/photos/allPhotos", aUpdatedPhotos);
			},

			onRemoveFilePressed:function(oEvent){
				let oPressedPhoto = oEvent.getSource().getBindingContext("PhotoManagementModel").getObject(); 
				this.removeItemMessage(oPressedPhoto);
			},

			removeItemMessage: function(oPressedPhoto) {
				MessageBox.warning(
					"Are you sure you want to remove the document" + " " + oPressedPhoto.fileName + " " + "?",
					{
						icon: MessageBox.Icon.WARNING,
						actions: ["Remove", MessageBox.Action.CANCEL],
						emphasizedAction: "Remove",
						styleClass: "sapMUSTRemovePopoverContainer",
						initialFocus: MessageBox.Action.CANCEL,
						onClose: (oAction) => {
							if (oAction === "Remove") {
								//Sofern die Bilder nicht zu 100% identisch sind, stellt die Abfrage kein Problem dar
								this.removePictureFromPhotoType(oPressedPhoto);
								this.removePictureFromDispplay(oPressedPhoto);
							}
							else{
								return;
							}
						}
					}
				);
			},

			removePictureFromPhotoType:function(oPressedPhoto){
				let getPhotoTypePhotos = oPressedPhoto.photoType;
				let aSelectedPhotoTypePhotos = this.getPhotoTypePhotos(getPhotoTypePhotos);
				let iPhotoIndex = aSelectedPhotoTypePhotos.findIndex(photo => photo.src = oPressedPhoto.src);

				aSelectedPhotoTypePhotos.splice(iPhotoIndex, 1);
				this.updateModelBindings("PhotoManagementModel");
			},

			removePictureFromDispplay:function(oPressedPhoto){
				let aPhotos=this.getAllPhotos();
				let iPhotoIndex = aPhotos.findIndex(photo => photo.src = oPressedPhoto.src);
				aPhotos.splice(iPhotoIndex, 1); //Pruefung nicht notwendig, kann ja nur stimmen
				this.updateModelBindings("PhotoManagementModel");
			},


			getPhotoFromButton:function(oEvent){
				let oPressedPhoto = oEvent.getSource().getBindingContext("PhotoManagementModel").getObject(); 

				return oPressedPhoto;
			},

			onEditFile:function(oEvent){
				let oPressedPhoto = this.getPhotoFromButton(oEvent);
				this.setEditingPhoto(oPressedPhoto);
				this.editPhotoDialogOpen();
			},

			setEditingPhoto:function(oPressedPhoto){
				let oPhotoManagementModel = this.getOwnerComponent().getModel("PhotoManagementModel");

				oPhotoManagementModel.setProperty("/photos/editingPhoto", oPressedPhoto);
			},

			onRenameDocument:function(oEvent){
				let oPressedPhoto = this.getPhotoFromButton(oEvent);
				//Methode zum Setzen der Infos 
				//Methode für das Umbenennen bzw oeffnen von Dialog.
				this.editPhotoDialogOpen();
			},

			onPhotoEditReject:function(){
				this.editPhotoDialogClose();
			},

			editPhotoDialogClose:function(){
				this.byId("photoEditDialog").close();
			},

			editPhotoDialogOpen: async function(){
				if (!this.oEditPhotoDialog) {
					try { // Lade das Fragment, wenn es noch nicht geladen wurde
						this.oEditPhotoDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.editPhoto",
						});
					} catch (error) { // Fehlerbehandlung bei Problemen beim Laden des Fragments
						MessageBox.error(this._oBundle.getText("errorLoadingEditPhotoDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// oeffne das Dialog, wenn es erfolgreich geladen wurde
				this.oEditPhotoDialog.open();
			},

			getAllPhotos:function(){
				let aPhotos = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/allPhotos");

				return aPhotos;
			},

			getPhotoTypePhotos:function(sPhotoTyp){
				let aPhotoTypes = this.getOwnerComponent().getModel("PhotoManagementModel").getProperty("/photos/types");
				let oType = aPhotoTypes.find(type => type.photoTyp = sPhotoTyp);

				return oType.photo;
			},

			clearCustomerInput:function(){
				let oConfigModel = this.getOwnerComponent().getModel("ConfigModel"); //Angabe zum Namen des Kunden

				oConfigModel.setProperty("/customerName", "");
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			onFotoabfrageDialogOpen: async function () { // Oeffnen Fotoabfrage fragment
				if (!this.oFotoabfrageDialog) {
					try { // Lade das Fragment, wenn es noch nicht geladen wurde
						this.oFotoabfrageDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.fotoabfrage",
						});
					} catch (error) { // Fehlerbehandlung bei Problemen beim Laden des Fragments
						MessageBox.error(this._oBundle.getText("errorLoadingFotoabfrageDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// oeffne das Dialog, wenn es erfolgreich geladen wurde
				this.oFotoabfrageDialog.open();
			},

			onViewerModeUnterschrift:function(){
				this.onNavToUnterschrift();
			},

			onNavToActiveTour: function () { //Nicht alle Stopps beendet
				this.updateModelBindings("TourAndStopModel"); //Aktualisiert die verbleibenden NVEs und das Unterschrift Icon

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("ActiveTour");
			},

			onNavToAbladung: function () { //Navigation zur Abladung View
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("Abladung");
			},

			onNavToUnterschrift: function () { //Navigation zur Unterschrift View
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("Unterschrift");
			},

			onNavToOverview: function () { //Navigation zurueck zur Uebersicht
				this.clearCustomerInput();
				
				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Overview");
			},

			onNavToStopInformation: function () { //Navigation zurueck zur Uebersicht
				this.clearCustomerInput();

				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("StopInformation");
			},
		});
	}
);
