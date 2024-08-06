sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "podprojekt/utils/Helper",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Helper, MessageToast) {
        "use strict";

        return Controller.extend("podprojekt.controller.ActiveTour", {
            onInit: function () {

            },

            onAfterRendering: function() {
                this.alterStopDescriptionForOrder(); //Anpassen des Titels eines Stops entsprechend der Reihgenfolge
                this.setCustomAttributes(); 
            },

            alterStopDescriptionForOrder:function(){ //Anpassung der Beschreibung, damit alles so aussieht wie auf der Vorlage
                var oStopModel=this.getOwnerComponent().getModel("StopModel");
                var aStops=oStopModel.getProperty("/results");

                for(var i in aStops){
                    var sActualDescription=aStops[i].addressName1;
                    var iSequence=aStops[i].sequence;
                    var sNewDescription="";

                    if(iSequence < 10){ //kleiner 10
                        sNewDescription= "00" + iSequence + "-" +sActualDescription;
                    }

                    if(iSequence >= 10 && iSequence < 100){ //Größer gleich 10 aber kleiner 100
                        sNewDescription= "0" + iSequence + "-" +sActualDescription;
                    }

                    if(iSequence >= 100){ //Größer 100
                        sNewDescription= iSequence + "-" +sActualDescription;
                    }

                    aStops[i].addressName1=""; //erstellen des Attributes fuer das Objekt --> kann ggf. weggelassen werden
                    aStops[i].addressName1=sNewDescription;
                }
                
                oStopModel.refresh();
            },

            setCustomAttributes:function(){ //Erstellen zusätzlicher Attribute für die Anzeige

                var oStopModel=this.getOwnerComponent().getModel("StopModel");
                var oStopModelItems = oStopModel.getProperty("/results");

                for(var i in oStopModelItems){
                    oStopModelItems[i].stopOrder="";
                    oStopModelItems[i].stopOrder=(parseInt(i)+2);
                    oStopModelItems[i].loadingUnitsCount=""; //Erstellen des Anzuzeigenden Attributes
                    oStopModelItems[i].loadingUnitsCount=oStopModelItems[i].orders[0].loadingUnits.length;
                }
                oStopModel.refresh(); //Aktualisieren

            },

            onSetStoppInformation:function(oEvent){ //Herausfinden welcher Stop in der Liste ausgewaehlt wurde
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var oPressedModelObject=oEvent.getSource().getBindingContext("StopModel").getObject();
                var oPressedModelObjectDetails=oPressedModelObject.orders[0]; //Detailreichere Informationen über das Modelobjekt
                
                oStopInformationModel.setProperty("/tour", oPressedModelObjectDetails);
                this.alterLoadingUnits(oPressedModelObjectDetails);
            },

            alterLoadingUnits:function(oPressedModelObjectDetails){
                var aLoadingUnits=oPressedModelObjectDetails.loadingUnits;

                for(var i in aLoadingUnits){
                    //erstellen der Unterstruktur
                    var oCurrentDefaultLoadingUnit=aLoadingUnits[i];
                    oCurrentDefaultLoadingUnit.detailedInformation=[{
                        "accurateDescription": oCurrentDefaultLoadingUnit.amount + "x " + oCurrentDefaultLoadingUnit.articleCaption
                    }];
                    //erstellen der richtigen Bezeichnung
                    oCurrentDefaultLoadingUnit.accurateDescription= oCurrentDefaultLoadingUnit.label1 +" "+ oCurrentDefaultLoadingUnit.lodingDeviceTypeCaption;
                }
                this.onNavToStopInformation();
            },

            setLoadingUnits:function(aDefaultLoadingUnits){ //Zu Verladenen NVEs in Model setzen
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");

                oLoadingUnitsModel.setProperty("/results", aDefaultLoadingUnits);

                this.onNavToStopInformation();
            },

            onNavToStopInformation:function(){ //Navigation zur StopInformation View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("StopInformation");
            },
        });
    });
