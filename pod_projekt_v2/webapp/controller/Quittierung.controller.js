sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
    "sap/base/assert",
    "podprojekt/utils/StatusSounds"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, assert, StatusSounds) {
        "use strict";

        // Definierte Konstanten
        const ROUTE_QUITTIERUNG = "Quittierung";
        const REGEX_CUSTOMER_NAME = /^[a-zA-Z\-]{2,15}$/; //nur Ziffern mit mindestlaenge 2, maxlaenge 15 und Sonderzeichen '-'

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {
                let oRouter = this.getOwnerComponent().getRouter(); // Router registrieren, um Routing-Ereignisse zu verarbeiten
                oRouter.getRoute(ROUTE_QUITTIERUNG).attachPatternMatched(this._onObjectMatched, this);
            },
            
            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            },

            _onObjectMatched: function() { //Fokus-Methoden aufruf nach dem Routing
                this._setFocus();
            },

            _setFocus: function() { //Tatsächliches setzen des Fokus
                // Verzögertes Setzen des Fokus, um sicherzustellen, dass das Element vollständig gerendert ist
                requestAnimationFrame(() => {
                    let oInput = this.byId("recipientNameInp");
                    if (oInput) { oInput.focus(); }
                });
            },

            onCustomerNameInputChange:function(oEvent){ //Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
                //! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
                let oInput = oEvent.getSource();
                let oCustomerModel=this.getView().getModel("CustomerModel");
                oCustomerModel.setProperty("/customerName", oInput.getValue());
            },

            onCustomerNameInputLiveChange:function(oEvent){ //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
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

            onRecipientNotFound:function(){ //Wenn Empfaenger nicht da ist, Tour fertig machen und abschicken
                this._showMessageToast("dummyProcessFinished", 2500);

                setTimeout(() => {
                    this.onNavToOverview();
                }, 2000);
            },

            _showMessageToast:function(sMessageKey, iDuration){
                MessageToast.show(this._oBundle.getText(sMessageKey), {
                    duration: iDuration,
                    width: "15em"
                });
            },

            onDeliveryNotePressed:function(oEvent){
                //let oPressedDeliveryNote=oEvent.getSource().getBindingContext("StopInformationModel").getObject(); //Fuer den Fall, dass es mal mehrere DeliveryNotes geben sollte
                this.onNavToAbladung();
            },

            addCameraPlayerToCameraDialog:function(){ //Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
                this.onPhotoTypesSelectChange(); //Initiales setzen des Models für die gemachten Fotos
                let oVideoContainer = this.byId("videoFeedContainer"); //TODO sprechenderen Namen im Fragment verwenden
                oVideoContainer.setContent("<video id='player' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
                this.enableVideoStream();
            },

            enableVideoStream:function(){// Video Streams starten
                navigator.mediaDevices.getUserMedia({  video:true  })
                .then((stream) => {
                    let oPlayer = document.getElementById("player");
                    if (oPlayer) oPlayer.srcObject = stream;
                });
            },

            disableVideoStreams:function(){//Video Streams beenden
                let oVideoStream = document.getElementById("player");
                if (oVideoStream) {
                    let oMediaStream = oVideoStream.srcObject;
                    if (oMediaStream) {
                        oMediaStream.getTracks().forEach(track => track.stop());
                    }
                }
                this.clearPhotoModel();
            },

            onOpenPhotoDialog:function(){ //Dialog für das aufnehmen eines Fotos oeffnen
                this.oAddFotoDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotomachen",
                });
          
                this.oAddFotoDialog.then((oDialog) => oDialog.open());
            },

            scrollToInputAfterError:function(){
                let oInputField=this.getView().byId("recipientNameInp");
                
                oInputField.setValueState("Error");
                setTimeout(() => {
                    oInputField.focus();
                }, 50);
            },

            scrollToDeliveryNotesAfterError:function(){
                let oDeliveryNotesTable=this.getView().byId("deliveryNoteList");
                let oDeliveryNote=oDeliveryNotesTable.getItems()[0];

                setTimeout(() => {
                    oDeliveryNote.focus();
                }, 50);
            },

            checkSignConditions:function(){
                this.checkIfInputConstraintsComply();
            },

            checkIfInputConstraintsComply:function(){ //Werteeingabe gegen regex pruefen
                let oCustomerModel=this.getView().getModel("CustomerModel");
                let sCustomerModelInput=oCustomerModel.getProperty("/customerName");

                if(REGEX_CUSTOMER_NAME.test(sCustomerModelInput)){ //Eingabe-Parameter passen
                    this.checkIfNvesAreProcessed();
                } else{ //Eingabe-Parameter passen nicht
                    this._showErrorMessageBox("nameNotMatchingRegex", () => this.scrollToInputAfterError());
                }
            },

            checkIfNvesAreProcessed:function(){ //Prüfen ob noch nicht bearbeitete Nves existieren
                let oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                let aRemainingNves=oStopInformationModel.getProperty("/tour/aDeliveryNotes/0/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

                //!Test
                //assert(aRemainingNves.length > 0, "Not all remaining nves have been processed!");

                if(aRemainingNves.length >0){ //Es sind noch Nves zu bearbeiten
                    this._showErrorMessageBox("notPermitedToSignTour", () => this.scrollToDeliveryNotesAfterError());
                } else{ //Es sind keine Nves mehr zu bearbeiten
                    this.setSigningDateAndTime();
                }
                
            },

            setSigningDateAndTime:function(){ //Erstellen des Datums und der Uhrzeit fuer die Unterschrift-Seite
                let oCustomerModel=this.getOwnerComponent().getModel("CustomerModel");
                let sDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit
                oCustomerModel.setProperty("/dateAndTime", sDateAndTime);

                this.onNavToUnterschrift();
            },

            onAddFotoDialogClose:function(){ //Schließen Dialog
                this.disableVideoStreams();
                this.byId("FotoMachenDialog").close();
            },

            checkIfPhotoNeedsToBeCleared:function(){ //Prüfen ob bereits ein Foto angezeigt wird
                let oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                let oSavedPhoto=oPhotoModel.getProperty("/photo"); //Zuletzt aufgenommenes Foto

                if(Object.keys(oSavedPhoto).length !== 0){ //Wenn Objekt Attribute enthält, vermeindliches Foto loeschen
                    this.clearPhotoModel();
                } 

                this.onSnappPicture();
            },

            clearPhotoModel:function(){
                let oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); //Model in dem das geschossene Foto gespeichert wird

                oPhotoModel.setProperty("/photo", {});
            },

            onSnappPicture:function(){ //(neues) Foto machen
                let oVideoFeed=document.getElementById("player"); //VideoStream
                let canvas=document.createElement('canvas');
                let context = canvas.getContext('2d');
                let oDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit

                let oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                let sSelectedType=oPhotoTypeSelectedModel.getProperty("/type/photoTyp"); //Selektierter Foto-Typ 

                canvas.width = oVideoFeed.videoWidth;
                canvas.height = oVideoFeed.videoHeight;
                context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

                let oImageData=canvas.toDataURL("image/png"); //Base 64 encoded Bild-String

                let oImage= {
                    src: oImageData,
                    width: "100%",
                    height: "auto",
                    dateAndTime: oDateAndTime,
                    photoType: sSelectedType,
                    fileName: oDateAndTime + ".png",
                    mediaType: "image/png",
                    uploadState: "Ready"
                }; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

                this.saveNewImage(oImage);
            },

            onPhotoTypesSelectChange:function(){
                let oSelectedPhotoType=this.getView().byId("photoTypeSelect").getSelectedItem();
                let oSelectedType=oSelectedPhotoType.getBindingContext("PhotoTypeModel").getObject();
                this.setPhotoTypeSelectedModel(oSelectedType);
            },

            setPhotoTypeSelectedModel:function(oSelectedType){
                let oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");
                
                oPhotoTypeSelectedModel.setProperty("/type", oSelectedType);
            },

            checkPhotoLimit:function(sPhotoType){ //Wirft eine Fehlermeldung, wenn Menge an Fotos überschritten wird
                
                // Definiere die erlaubten Foto-Grenzen für verschiedene Typen
                let PHOTO_LIMITS = {
                    "Zum Stopp": 5,
                    "Zur Beanstandung": 3,
                    "Test": 0
                };

                // Hole das erlaubte Limit basierend auf dem Foto-Typ
                let iAllowedPhotos = PHOTO_LIMITS[sPhotoType] || 0;

                // Hole das Modell für die ausgewählten Foto-Typen
                let oPhotoTypeSelectedModel = this.getOwnerComponent().getModel("PhotoTypeSelectedModel");
                
                // Erhalte die Anzahl der aktuellen Fotos
                let iCurrentPhotoCount = oPhotoTypeSelectedModel.getProperty("/type/photo").length;

                // Überprüfe, ob noch Platz für weitere Fotos ist
                return iCurrentPhotoCount < iAllowedPhotos;
            },

            onCheckIfPhotoTaken:function(){
                let oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                let oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //'Geschossenes' Foto

                //Muss geprüft werden weil Model-Inhalt leeres Objekt ist
                if(Object.keys(oTakenPhoto).length !== 0){ //Wenn Objekt Attribute enthält, exisitert ein Foto
                    this.confirmFoto();
                } else{
                    MessageToast.show("Es wurde kein Foto geschossen!", {
                        duration: 1000,
                        width:"15em"
                    });
                }
            },

            confirmFoto:function(){ //Foto bestätigen und übernehmen
                let oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                let oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //Geschossenes Foto

                let oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                let oSelectedType=oPhotoTypeSelectedModel.getProperty("/type"); //Selektierter Foto-Typ 
                let bEnoughSpace=this.checkPhotoLimit(oSelectedType.photoTyp); //Platz für weitere Fotos?

                if(bEnoughSpace){
                    let aUpdatedPhotos = [...oSelectedType.photo, oTakenPhoto]; // Erstellen eines Arrays mit alten Fotos und neuem Foto darin
                    oPhotoTypeSelectedModel.setProperty("/type/photo", aUpdatedPhotos); // Setzen der neuen Fotos in das Model
                    oPhotoTypeSelectedModel.refresh(true); // Erzwinge binding refresh fuer dialog Titel
                    this.setNewPhotoInPhotoList(oTakenPhoto); //Uebernehmen in der Allgemeinen Liste
                } else{
                    this._showErrorMessageBox("notEnoughSpace", () => {});
                }
                this.clearPhotoModel();
            },

            onUploadSelectedButton:function(){
                MessageToast.show("Hier werden dann die Selektierten Fotos hochgeladen!", {
                    duration: 2500,
                    width:"15em"
                });
            },

            saveNewImage:function(oImage){ //Speichern von zu letzt geschossenem Foto
                let oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                oPhotoModel.setProperty("/photo", oImage);
                oPhotoModel.refresh();
            },

            setNewPhotoInPhotoList:function(oImage){
                let oPhotoListModel=this.getOwnerComponent().getModel("PhotoModel");
                let aPhotoListItems=oPhotoListModel.getProperty("/photos");
                let aUpdatedPhotos = [...aPhotoListItems, oImage];

                oPhotoListModel.setProperty("/photos", aUpdatedPhotos);
            },

            _showErrorMessageBox: function(sMessageKey, fnOnClose) {
                StatusSounds.playBeepError();
                MessageBox.error(this._oBundle.getText(sMessageKey), {
                    onClose: fnOnClose || function() {}  // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
                });
            },

            onFotoabfrageDialogOpen: async function(){ //Oeffnen Fotoabfrage frament
                if (!this.oFotoabfrageDialog) {
                    try {
                        // Lade das Fragment, wenn es noch nicht geladen wurde
                        this.oFotoabfrageDialog = await this.loadFragment({
                            name: "podprojekt.view.fragments.fotoabfrage"
                        });
                    } catch (error) {
                        // Fehlerbehandlung bei Problemen beim Laden des Fragments
                        console.error("Fehler beim Laden des FotoabfrageDialogs:", error);
                        MessageBox.error(this._oBundle.getText("errorLoadingFotoabfrageDialog"));
                        return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
                    }
                }
                
                // Öffne das Dialog, wenn es erfolgreich geladen wurde
                this.oFotoabfrageDialog.open();
            },
            
            onNavToAbladung:function(){ //Navigation zur Abladung View
                let oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Abladung");
            },

            onNavToUnterschrift:function(){ //Navigation zur Unterschrift View
                StatusSounds.playBeepSuccess();
                let oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Unterschrift");
            },

            onNavToOverview:function(){ //Navigation zurueck zur Uebersicht
                let oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Overview");
            }

        });
    });
