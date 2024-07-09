sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("podprojekt.controller.Quittierung", {
            onInit: function () {

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

            onAddFotoDialogClose:function(){ //Schließen X Dialog
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

            clearPhotoModel:function(oPhotoModel){
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");

                oPhotoModel.setProperty("/photo", {});
            },

            onSnappPicture:function(){ //(neues) Foto machen
                var oVideoFeed=document.getElementById("player");
                var canvas=document.createElement('canvas');
                var context = canvas.getContext('2d');

                canvas.width = oVideoFeed.videoWidth;
                canvas.height = oVideoFeed.videoHeight;
                context.drawImage(oVideoFeed, 0, 0, canvas.width, canvas.height);

                var oImageData=canvas.toDataURL("image/png");

                var oImage= {
                    src: oImageData,
                    width: "100%",
                    height: "auto"
                };

                this.saveNewImage(oImage);
                
                
            },

            onConfirmFoto:function(){ //Foto bestätigen

            },       

            saveNewImage:function(oImage){
                var oPhotoModel=this.getOwnerComponent().getModel("LatestPhotoModel");
                var oSavedPhoto=oPhotoModel.getProperty("/photo");
                //var aNewPicture=[oImage];
                //var aUpdatedPhotos=aSavedPhotos.concat(aNewPicture);
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
