sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
	"sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
	JSONModel,
	MessageBox,
	MessageToast) {
        "use strict";

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {

                //! WICHTIG: Es muss noch das Model gesetzt werden für das Selektierte Model (PhotoTypeSelectedModel)
                //! Muss gemacht werden, weil das Moden inital leer ist und erst beim wechsel des Selektierten Items alles autonom abläuft
            },

            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            },

            onRecipientFoundSwitchChange:function(){ //Switch mit Kunde nicht angetroffen

            },

            onFotoVisibileToggle:function(){ //Methode um geschossene Fotos ein-/auszublenden
                //Wird derzeit einfach so gemacht, brauch ich nichts weiter machen.
            },

            onDeliveryItemVisibleToggle:function(){ //Paletten oder so ein-/ausblenden

            },

            onLoadingDevicesVisibleToggle:function(){ //Loading Devices oder so ein-/ausblenden

            },

            addCameraPlayerToCameraDialog:function(){ //Erstellen des VideoPlayers für den CameraStream und diesen in den Dialog setzen
                var oVideoContainer = this.byId("videoFeedContainer"); //TODO sprechenderen Namen im Fragment verwenden
                oVideoContainer.setContent("<video id='player' width='100%' autoplay></video>"); //an das HTML Element in der XML view einen videoplayer für die Kamera anheften
                this.enableVideoStream();
            },

            enableVideoStream:function(){
                navigator.mediaDevices.getUserMedia({  video:true  })// Video starten
                .then((stream) => {
                    player.srcObject = stream;
                })
            },

            disableVideoStreams:function(){
                var oVideoStream = document.getElementById("player");
                if (oVideoStream) {
                    var oMediaStream = oVideoStream.srcObject;
                    if (oMediaStream) {
                        oMediaStream.getTracks().forEach(track => track.stop());
                    }
                }
            },

            /*onPhotoVarietyOpen:function(){ //Dialog für Art des Fotos wählen
                this.oAddFotoDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotomachen",
                });
          
                this.oAddFotoDialog.then((oDialog) => oDialog.open());
            },*/

            checkPhotoLimit:function(){
                
            },

            onOpenPhotoDialog:function(){ //Dialog für das aufnehmen eines Fotos oeffnen
                this.oAddFotoDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotomachen",
                });
          
                this.oAddFotoDialog.then((oDialog) => oDialog.open());
                this.clearPhotoModel();
            },

            checkSignConditions:function(){ //Pruefen ob zur bedingungen erfuellt sind zur Unterschrift View zu wechseln
                var oRecipientNameModel=this.getOwnerComponent().getModel("RecipientNameModel")
                var sRecipientName=oRecipientNameModel.getProperty("/recipient/name");

                if(sRecipientName !== ""){
                   this.checkIfTourIsFinished(); 
                } else{
                    this.showEmptyNameError();
                }
            },
            
            checkIfTourIsFinished:function(){ //Pruefen ob die Tour abgeschlossen ist
                var oActiveTour=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
                var sTourStatus=oActiveTour.orderStatus;

                if(sTourStatus==="90"){
                    this.onNavToUnterschrift();
                } else{
                    this.showChekBoxError();
                }
            },

            onCustomerAbsent:function(){ //Kunde nicht angetroffen switch

            },

            onAddFotoDialogClose:function(){ //Schließen Dialog
                this.disableVideoStreams();
                this.clearPhotoModel();
                this.byId("FotoMachenDialog").close();
            },

            onPhotoQueryDialogClose:function(){ //Schließen Y Dialog
                this.byId("FotoDialog").close();
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
                var oDateAndTime= new Date(); //Datum inklusive Uhrzeit

                canvas.width = oVideoFeed.videoWidth;
                canvas.height = oVideoFeed.videoHeight;
                context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

                var oImageData=canvas.toDataURL("image/png"); //Base 64 encoded Bild-String

                var oImage= {
                    src: oImageData,
                    width: "100%",
                    height: "auto",
                    dateAndTime: oDateAndTime.toUTCString()
                }; //Objekt wirde erzeugt und ist bereit als Image in der View interpretiert zu werden

                this.saveNewImage(oImage);
            },

            onPhotoTypesSelectChange:function(){
                var oSelectedPhotoType=this.getView().byId("photoTypeSelect").getSelectedItem();
                var sSelectedPhotoTypeText=oSelectedPhotoType.getText();
                var oSelectedType=this.getSelectedPhotoTypeObject(sSelectedPhotoTypeText);
                this.setPhotoTypeSelectedModel(oSelectedType);
                
                //Es besteht die Option hier den Select-Typen der voll ist, zu deaktivieren
                //var bEoughSpace=this.checkIfSpaceForAnotherPhoto(oSelectedType);
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

            checkIfSpaceForAnotherPhoto:function(oSelectedType){ //Wirft eine Fehlermeldung, wenn Menge an Fotos überschritten wird
                
                var sTyp=oSelectedType.photoTyp;
                var iAllawedPhotos=0;
                var bEnoughSpace=true;

                switch (sTyp) { //Existiert nur, wenn unterschiedliche Anzahl Photos möglich sind!
                    case "Zum Stopp":
                        iAllawedPhotos=5;
                        break;
                    case "Zur Beanstandung":
                        iAllawedPhotos=3;
                        break;
                    case "Test":
                        iAllawedPhotos=0;
                        break;
                
                    default:
                        break;
                }
                
                if(oSelectedType.photo.length === iAllawedPhotos){
                    this.showNotEnoughSpaceError();
                    //moeglichkeit fotos zu entfernen einbauen
                    //Vielleicht das Select-Element deaktivieren
                    bEnoughSpace=false;
                }

                return bEnoughSpace;
            },

            onCheckIfPhotoTaken:function(){
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //'Geschossenes' Foto

                //Muss geprüft werden weil Model-Inhalt leeres Objekt ist
                if(Object.keys(oTakenPhoto).length !== 0){ //Wenn Objekt Attribute enthält, exisitert ein Foto
                    this.onConfirmFoto();
                } else{
                    MessageToast.show("Es wurde kein Foto geschossen!", {
                        duration: 1000,
                        width:"15em"
                    });
                }
            },

            onConfirmFoto:function(){ //Foto bestätigen und übernehmen
                var oLatestPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel"); 
                var oTakenPhoto= oLatestPhotoModel.getProperty("/photo"); //Geschossenes Foto

                var oPhotoTypeSelectedModel=this.getOwnerComponent().getModel("PhotoTypeSelectedModel");//Model mit gespeichertem Foto-Typ
                var oSelectedType=oPhotoTypeSelectedModel.getProperty("/type"); //Selektierter Foto-Typ 
                var bEnoughSpace=this.checkIfSpaceForAnotherPhoto(oSelectedType); //Platz für weitere Fotos?

                if(bEnoughSpace){
                    var aNewPhoto=[oTakenPhoto]; //Erstellen eines Arrays mit Aktuellem Foto
                    var aUpdatedPhotos=oSelectedType.photo.concat(aNewPhoto); //Erstellen eines Arrays mit alten Fotos und neuem Foto darin
                    oPhotoTypeSelectedModel.setProperty("/type/photo", aUpdatedPhotos);//Setzen der neuen Fotos in das Model
                } else{
                    this.showNotEnoughSpaceError();
                }
                
            },       

            saveNewImage:function(oImage){ //Speichern von zu letzt geschossenem Foto
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                oPhotoModel.setProperty("/photo", oImage);
                oPhotoModel.refresh();
            },
            
            showChekBoxError:function(){ //Fehler weil nicht alle Checkboxen bearbeitet wurden
                MessageBox.error(this._oBundle.getText("haken"),{
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
                MessageBox.error(this._oBundle.getText("nameang"),{
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
            }

        });
    });
