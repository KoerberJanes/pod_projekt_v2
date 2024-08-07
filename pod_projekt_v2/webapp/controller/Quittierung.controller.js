sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
    "sap/base/assert"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, MessageToast, assert) {
        "use strict";

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {

                //! WICHTIG: Es muss noch das Model gesetzt werden für das Selektierte Model (PhotoTypeSelectedModel)
                //! Muss gemacht werden, weil das Moden inital leer ist und erst beim wechsel des Selektierten Items alles autonom abläuft
            },

            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            },

            onRecipientNotFound:function(){ //Wenn Empfaenger nicht da ist, Tour fertig machen und abschicken
                
                MessageToast.show("Tour fertig machen und abschicken! Navigation zur Tourübersicht erfolgt in 2 Sekunden!", {
                    duration: 2500,
                    width:"15em"
                });

                setTimeout(() => {
                    this.onNavToOverview();
                }, 2000);
            },

            onDeliveryNotePressed:function(oEvent){
                /*
                var oPressedDeliveryNote=oEvent.getSource().getBindingContext("StopInformationModel").getObject();

                this.linkNvesToDeliveryNote(oPressedDeliveryNote);
                */
               this.onNavToAbladung();
            },

            /*
            linkNvesToDeliveryNote:function(oPressedDeliveryNote){
                var sDeliveryNoteShipmentNumber= oPressedDeliveryNote.shipmentNumber;

                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var aLoadingUnits=oStopInformationModel.getProperty("/tour/loadingUnits");

                for(var i in aLoadingUnits){ //Alle Nves des Lieferscheins durchgehen
                    var oCurrentLoadingUnit=aLoadingUnits[i]; 
                    oCurrentLoadingUnit.deliveryNoteShipmentNumber= sDeliveryNoteShipmentNumber; //Erstellen und Beschreiben eines neuen Attributes um die Zuordnung zum Lieferschein zu machen
                }
                this.onNavToAbladung();
            },
            */

            addCameraPlayerToCameraDialog:function(){ //Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
                this.onPhotoTypesSelectChange(); //Initiales setzen des Models für die gemachten Fotos
                var oVideoContainer = this.byId("videoFeedContainer"); //TODO sprechenderen Namen im Fragment verwenden
                oVideoContainer.setContent("<video id='player' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
                this.enableVideoStream();
            },

            enableVideoStream:function(){// Video starten
                navigator.mediaDevices.getUserMedia({  video:true  })
                .then((stream) => {
                    player.srcObject = stream;
                });
            },

            disableVideoStreams:function(){//Video beenden
                var oVideoStream = document.getElementById("player");
                if (oVideoStream) {
                    var oMediaStream = oVideoStream.srcObject;
                    if (oMediaStream) {
                        oMediaStream.getTracks().forEach(track => track.stop());
                    }
                }
            },

            onOpenPhotoDialog:function(){ //Dialog für das aufnehmen eines Fotos oeffnen
                this.oAddFotoDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotomachen",
                });
          
                this.oAddFotoDialog.then((oDialog) => oDialog.open());
            },

            checkSignConditions:function(){ //Pruefen ob zur bedingungen erfuellt sind zur Unterschrift View zu wechseln
                var oRecipientNameModel=this.getOwnerComponent().getModel("CustomerModel")
                var sRecipientName=oRecipientNameModel.getProperty("/customerName");

                //!Test
                //assert(sRecipientName.length > 0, "No user input has been provided");

                if(sRecipientName !== ""){
                   this.checkIfNvesAreProcessed();
                } else{
                    this.showEmptyNameError();
                }
            },

            checkIfNvesAreProcessed:function(){ //Prüfen ob noch nicht bearbeitete Nves existieren
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");
                var aRemainingNves=oLoadingUnitsModel.getProperty("/results");

                //!Test
                //assert(aRemainingNves.length > 0, "Not all remaining nves have been processed!");

                if(aRemainingNves.length >0){ //Es sind noch Nves zu bearbeiten
                    this.showProgressStatusError();
                } else{ //Es sind keine Nves mehr zu bearbeiten
                    //this.onNavToUnterschrift();
                    this.setSigningDateAndTime();
                }
            },

            setSigningDateAndTime:function(){
                var oCustomerModel=this.getOwnerComponent().getModel("CustomerModel");
                var sDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit
                oCustomerModel.setProperty("/dateAndTime", sDateAndTime);

                this.onNavToUnterschrift();
            },

            onAddFotoDialogClose:function(){ //Schließen Dialog
                this.disableVideoStreams();
                this.clearPhotoModel();
                this.byId("FotoMachenDialog").close();
            },

            checkIfPhotoNeedsToBeCleared:function(){ //Prüfen ob bereits ein Foto angezeigt wird
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                var oSavedPhoto=oPhotoModel.getProperty("/photo");

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
                var sSelectedPhotoTypeText=oSelectedPhotoType.getText();
                var oSelectedType=this.getSelectedPhotoTypeObject(sSelectedPhotoTypeText);
                this.setPhotoTypeSelectedModel(oSelectedType);
            },

            setPhotoTypeSelectedModel:function(oSelectedType){
                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");
                
                oPhotoTypeSelectedModel.setProperty("/type", oSelectedType);
            },

            getSelectedPhotoTypeObject:function(sSelectedTypeText){
                var oPhotoTypeModel=this.getOwnerComponent().getModel("PhotoTypeModel"); //Model mit Select-Optionen
                var aSelectPhotoTypes=oPhotoTypeModel.getProperty("/photoTypes"); //Array des Models
                var getIndex= (element) => element.photoTyp === sSelectedTypeText; //
                var iIndexOfSelectedType= aSelectPhotoTypes.findIndex(getIndex); //Index des ausgewählten Model-Objektes erfahren 

                return aSelectPhotoTypes[iIndexOfSelectedType]; //Model-Objekt zurückgeben, denn Model-Objekt != Select-Objekt
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
                MessageBox.error(this._oBundle.getText("notPermitedToSignTour"),{
                    onClose: function() {
                        //Bisher funktionslos
                    }.bind(this)
                });
            },

            showNotEnoughSpaceError:function(){
                MessageBox.error(this._oBundle.getText("notEnoughSpace"),{
                    onClose: function() {
                        //Bisher funktionslos
                    }.bind(this)
                });
            },
                
            showEmptyNameError:function(){ //Fehler weil kein Kundenname eingetragen
                MessageBox.error(this._oBundle.getText("nameMissing"),{
                    onClose: function() {
                        //Bisher funktionslos
                    }.bind(this)
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
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Unterschrift");
            },

            onNavToOverview:function(){ //Navigation zurueck zur Uebersicht
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Overview");
            }

        });
    });
