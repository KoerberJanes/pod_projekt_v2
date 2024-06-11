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

            onPhotoVarietyOpen:function(){ //Dialog für Art des Fotos wählen
                this.oAddFotoDialog ??= this.loadFragment({
                    name: "podprojekt.view.fragments.fotomachen",
                });
          
                this.oAddFotoDialog.then((oDialog) => oDialog.open());
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
                var oActiveTour=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour/orders")[0];
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
                this.byId("FotoMachenDialog").close();
            },

            onPhotoQueryDialogClose:function(){ //Schließen Y Dialog
                this.byId("FotoDialog").close();
            },

            onSnappPicture:function(){ //Foto machen
                var oPhotoModel=this.getOwnerComponent().getModel("PhotoModel");
                var aPhotos=oPhotoModel.getProperty("/photos");
                var iQuantityOfPhotos=aPhotos.length;

                if(iQuantityOfPhotos<5){
                    this.onFotoabfrageDialogOpen();
                }
            },

            onConfirmFoto:function(){ //Foto bestätigen

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
