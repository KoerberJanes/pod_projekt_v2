sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "podprojekt/utils/StatusSounds"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, StatusSounds) {
        "use strict";

        return Controller.extend("podprojekt.controller.ActiveTour", {
            onInit: function () {

            },

            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            },

            checkIfStoppAlreadyDealtWith:function(oEvent){ //!Statuscodes müssen abgesprochen werden
                var oPressedModelObject=oEvent.getSource().getBindingContext("StopModel").getObject();
                var iNumberOfUnprocessedNves=oPressedModelObject.orders[0].loadingUnits.length;
                var sStopStatus=oPressedModelObject.stopStatus; //in Kombination mit der Methode: 'setCurrentStopAsFinished'

                if(iNumberOfUnprocessedNves===0 && sStopStatus === "70"){ //Keine unbearbeiteten NVEs und Stopp hat status erledigt
                    this.stopAlreadyDealtWithError();
                } else{ //Stop zum verarbeiten vorbereiten
                    this.onSetStoppInformation(oPressedModelObject);
                }

            },

            onSetStoppInformation:function(oPressedModelObject){ //Herausfinden welcher Stop in der Liste ausgewaehlt wurde
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                //var oPressedModelObject=oEvent.getSource().getBindingContext("StopModel").getObject();
                var oPressedModelObjectDetails=oPressedModelObject.orders[0]; //Detailreichere Informationen über das Modelobjekt
                
                oStopInformationModel.setProperty("/tour", oPressedModelObjectDetails);
                this.createLoadingUnitsDetailedDescription(oPressedModelObjectDetails);
            },

            createLoadingUnitsDetailedDescription:function(oPressedModelObjectDetails){//Erstellen der Unterstruktur von Nves (Details)
                var aLoadingUnits=oPressedModelObjectDetails.loadingUnits;

                for(var i in aLoadingUnits){
                    var oCurrentDefaultLoadingUnit=aLoadingUnits[i]; //Speichern der Aktuellen Nve
                    oCurrentDefaultLoadingUnit.detailedInformation=[{
                        "accurateDescription": oCurrentDefaultLoadingUnit.amount + "x " + oCurrentDefaultLoadingUnit.articleCaption
                    }]
                    oCurrentDefaultLoadingUnit.accurateDescription= oCurrentDefaultLoadingUnit.label1 +" "+ oCurrentDefaultLoadingUnit.lodingDeviceTypeCaption;; //erstellen der richtigen Bezeichnung
                }
                this.onNavToStopInformation();
            },

            stopAlreadyDealtWithError:function(){
                StatusSounds.playBeepError();
                MessageBox.error(this._oBundle.getText("stopAlreadyProcessed"),{
                    onClose: () => {
                        //NOP
                    }
                });
            },

            onNavToStopInformation:function(){ //Navigation zur StopInformation View
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("StopInformation");
            },
        });
    });
