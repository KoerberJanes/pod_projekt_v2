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

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter(); // Router registrieren, um Routing-Ereignisse zu verarbeiten
                oRouter.getRoute("Quittierung").attachPatternMatched(this._onObjectMatched, this);
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
                    var oInput = this.byId("recipientNameInp");
                    if (oInput) { oInput.focus(); }
                });
            },

            onCustomerNameInputChange:function(oEvent){ //Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
                //! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
                var oInput = oEvent.getSource();
                var oCustomerModel=this.getView().getModel("CustomerModel");
                oCustomerModel.setProperty("/customerName", oInput.getValue());
            },

            onCustomerNameInputLiveChange:function(oEvent){ //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
                var oInput = oEvent.getSource();
                this.handleRequiredField(oInput);
                this.checkInputConstraints(oInput);
            },

            handleRequiredField: function (oInput) { //Wenn kein Wert im Inputfeld vorliegt, Rot markieren

                var sValueState = "None";
          
                if (!oInput.getValue()) {
                  sValueState="Error"
                  oInput.setValueState(sValueState);
                }
              },
        
              checkInputConstraints: function (oInput) { //Wenn Wert nicht der Regex entspricht, Rot markieren
                var oBinding = oInput.getBinding("value");
                var sValueState = "None";
        
                try {
                  oBinding.getType().validateValue(oInput.getValue());
                } catch (oException) {
                  sValueState = "Error";
                }
                oInput.setValueState(sValueState);
              },

            onRecipientNotFound:function(){ //Wenn Empfaenger nicht da ist, Tour fertig machen und abschicken
                
                MessageToast.show(this._oBundle.getText("dummyProcessFinished"), {
                    duration: 2500,
                    width:"15em"
                });

                setTimeout(() => {
                    this.onNavToOverview();
                }, 2000);
            },

            onDeliveryNotePressed:function(oEvent){
                var oPressedDeliveryNote=oEvent.getSource().getBindingContext("StopInformationModel").getObject(); //Fuer den Fall, dass es mal mehrere DeliveryNotes geben sollte
                this.onNavToAbladung();
            },

            addCameraPlayerToCameraDialog:function(){ //Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
                this.onPhotoTypesSelectChange(); //Initiales setzen des Models für die gemachten Fotos
                var oVideoContainer = this.byId("videoFeedContainer"); //TODO sprechenderen Namen im Fragment verwenden
                oVideoContainer.setContent("<video id='player' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
                this.enableVideoStream();
            },

            enableVideoStream:function(){// Video Streams starten
                navigator.mediaDevices.getUserMedia({  video:true  })
                .then((stream) => {
                    player.srcObject = stream;
                });
            },

            disableVideoStreams:function(){//Video Streams beenden
                var oVideoStream = document.getElementById("player");
                if (oVideoStream) {
                    var oMediaStream = oVideoStream.srcObject;
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
                var oInputField=this.getView().byId("recipientNameInp");
                
                oInputField.setValueState("Error");
                setTimeout(() => {
                    oInputField.focus();
                }, 50);
            },

            scrollToDeliveryNotesAfterError:function(){
                var oDeliveryNotesTable=this.getView().byId("deliveryNoteList");
                var oDeliveryNote=oDeliveryNotesTable.getItems()[0];

                setTimeout(() => {
                    oDeliveryNote.focus();
                }, 50);
            },

            checkSignConditions:function(){
                this.checkIfInputConstraintsComply();
            },

            checkIfInputConstraintsComply:function(){ //Werteeingabe gegen regex pruefen
                var oCustomerModel=this.getView().getModel("CustomerModel");
                var sCustomerModelInput=oCustomerModel.getProperty("/customerName");
                var regex= /^[a-zA-Z\-]{2,15}$/;//nur Ziffern mit mindestlaenge 2, maxlaenge 15 und Sonderzeichen '-'

                if(regex.test(sCustomerModelInput)){ //Eingabe-Parameter passen
                    this.checkIfNvesAreProcessed();
                } else{ //Eingabe-Parameter passen nicht
                    this.showFaultyInputError();
                }
            },

            checkIfNvesAreProcessed:function(){ //Prüfen ob noch nicht bearbeitete Nves existieren
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var aRemainingNves=oStopInformationModel.getProperty("/tour/aDeliveryNotes/0/aUnprocessedNumberedDispatchUnits"); //Noch nicht quittierte Nves

                //!Test
                //assert(aRemainingNves.length > 0, "Not all remaining nves have been processed!");

                if(aRemainingNves.length >0){ //Es sind noch Nves zu bearbeiten
                    this.showProgressStatusError();
                } else{ //Es sind keine Nves mehr zu bearbeiten
                    this.setSigningDateAndTime();
                }
                
            },

            setSigningDateAndTime:function(){ //Erstellen des Datums und der Uhrzeit fuer die Unterschrift-Seite
                var oCustomerModel=this.getOwnerComponent().getModel("CustomerModel");
                var sDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit
                oCustomerModel.setProperty("/dateAndTime", sDateAndTime);

                this.onNavToUnterschrift();
            },

            onAddFotoDialogClose:function(){ //Schließen Dialog
                this.disableVideoStreams();
                this.byId("FotoMachenDialog").close();
            },

            checkIfPhotoNeedsToBeCleared:function(){ //Prüfen ob bereits ein Foto angezeigt wird
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                var oSavedPhoto=oPhotoModel.getProperty("/photo"); //Zuletzt aufgenommenes Foto

                if(Object.keys(oSavedPhoto).length !== 0){ //Wenn Objekt Attribute enthält, vermeindliches Foto loeschen
                    this.clearPhotoModel();
                } 

                this.onSnappPicture();
            },

            clearPhotoModel:function(){
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); //Model in dem das geschossene Foto gespeichert wird

                oPhotoModel.setProperty("/photo", {});
            },

            onSnappPicture:function(){ //(neues) Foto machen
                var oVideoFeed=document.getElementById("player"); //VideoStream
                var canvas=document.createElement('canvas');
                var context = canvas.getContext('2d');
                var oDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit

                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                var sSelectedType=oPhotoTypeSelectedModel.getProperty("/type/photoTyp"); //Selektierter Foto-Typ 

                canvas.width = oVideoFeed.videoWidth;
                canvas.height = oVideoFeed.videoHeight;
                context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

                var oImageData=canvas.toDataURL("image/png"); //Base 64 encoded Bild-String

                var oImage= {
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
                var oSelectedPhotoType=this.getView().byId("photoTypeSelect").getSelectedItem();
                var oSelectedType=oSelectedPhotoType.getBindingContext("PhotoTypeModel").getObject();
                this.setPhotoTypeSelectedModel(oSelectedType);
            },

            setPhotoTypeSelectedModel:function(oSelectedType){
                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");
                
                oPhotoTypeSelectedModel.setProperty("/type", oSelectedType);
            },

            checkPhotoLimit:function(){ //Wirft eine Fehlermeldung, wenn Menge an Fotos überschritten wird
                
                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                var oSelectedType=oPhotoTypeSelectedModel.getProperty("/type"); //Selektierter Foto-Typ 
                var sTyp=oSelectedType.photoTyp;
                var iAllowedPhotos=0;
                var bEnoughSpace=true;

                switch (sTyp) { //Existiert nur, wenn unterschiedliche Anzahl Photos möglich sind!
                    case "Zum Stopp":
                        iAllowedPhotos=5;
                        break;
                    case "Zur Beanstandung":
                        iAllowedPhotos=3;
                        break;
                    case "Test":
                        iAllowedPhotos=0;
                        break;
                
                    default:
                        break;
                }
                
                if(oSelectedType.photo.length === iAllowedPhotos){
                    bEnoughSpace=false;
                }

                return bEnoughSpace;
            },

            onCheckIfPhotoTaken:function(){
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //'Geschossenes' Foto

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
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //Geschossenes Foto

                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                var oSelectedType=oPhotoTypeSelectedModel.getProperty("/type"); //Selektierter Foto-Typ 
                var bEnoughSpace=this.checkPhotoLimit(); //Platz für weitere Fotos?

                if(bEnoughSpace===true){
                    var aNewPhoto=[oTakenPhoto]; //Erstellen eines Arrays mit Aktuellem Foto
                    var aUpdatedPhotos=oSelectedType.photo.concat(aNewPhoto); //Erstellen eines Arrays mit alten Fotos und neuem Foto darin
                    oPhotoTypeSelectedModel.setProperty("/type/photo", aUpdatedPhotos);//Setzen der neuen Fotos in das Model
                    this.refreshFragmentTitle(oPhotoTypeSelectedModel);
                } else{
                    this.showNotEnoughSpaceError();
                }
                this.clearPhotoModel();
            },

            onUploadSelectedButton:function(){
                MessageToast.show("Hier werden dann die Selektierten Fotos hochgeladen!", {
                    duration: 2500,
                    width:"15em"
                });
            },

            refreshFragmentTitle:function(oPhotoTypeSelectedModel){ //Aktualisieren des Fregment-Titels nachdem ein Foto gespeichert wurde
                var aPhotosForType=oPhotoTypeSelectedModel.getProperty("/type/photo"); //Array an geschossenen Fotos
                var sTextForType=oPhotoTypeSelectedModel.getProperty("/type/photoTyp"); //Bezeichnung des Foto-Typs
                var oTitle=this.getView().byId("FotoMachenDialogeTitle"); //Title Objekt aus der View
                
                oTitle.setText(sTextForType + " (" +aPhotosForType.length + ")" ); 
            },

            saveNewImage:function(oImage){ //Speichern von zu letzt geschossenem Foto
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                oPhotoModel.setProperty("/photo", oImage);
                this.setNewPhotoInPhotoList(oImage);
                oPhotoModel.refresh();
            },

            setNewPhotoInPhotoList:function(oImage){
                var oPhotoListModel=this.getOwnerComponent().getModel("PhotoModel");
                var aPhotoListItems=oPhotoListModel.getProperty("/photos");
                var aNewPhoto=[oImage]; //Erstellen eines Arrays mit Aktuellem Foto
                var aUpdatedPhotos=aPhotoListItems.concat(aNewPhoto); //Erstellen eines Arrays mit alten Fotos und neuem Foto darin

                oPhotoListModel.setProperty("/photos", aUpdatedPhotos);
            },
            
            showProgressStatusError:function(){ //Fehler weil nicht alle Checkboxen bearbeitet wurden
                StatusSounds.playBeepError();
                MessageBox.error(this._oBundle.getText("notPermitedToSignTour"),{
                    onClose: () => {
                        //Bisher funktionslos
                        this.scrollToDeliveryNotesAfterError();
                    }
                });
            },

            showNotEnoughSpaceError:function(){
                StatusSounds.playBeepError();
                MessageBox.error(this._oBundle.getText("notEnoughSpace"),{
                    onClose: () => {
                        //Bisher funktionslos
                    }
                });
            },

            showFaultyInputError:function(){
                StatusSounds.playBeepError();
                MessageBox.error(this._oBundle.getText("nameNotMatchingRegex"),{
                    onClose: () => {
                        this.scrollToInputAfterError();
                    }
                });
            },
            

            onFotoabfrageDialogOpen:function(){ //Oeffnen Fotoabfrage frament
                this.oFotoabfrageDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotoabfrage",
                });
          
                this.oFotoabfrageDialog.then((oDialog) => oDialog.open());
            },
            
            onNavToAbladung:function(){ //Navigation zur Abladung View
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Abladung");
            },

            onNavToUnterschrift:function(){ //Navigation zur Unterschrift View
                StatusSounds.playBeepSuccess();
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Unterschrift");
            },

            onNavToOverview:function(){ //Navigation zurueck zur Uebersicht
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Overview");
            }

        });
    });
