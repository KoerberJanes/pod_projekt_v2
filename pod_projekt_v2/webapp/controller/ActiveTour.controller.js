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
                var sActualDescription="";
                var iStopnumber=2;

                
                for(var i in aStops){
                    var sNewDescription="";
                    sActualDescription=aStops[i].addressName1;

                    if(iStopnumber<10){ //Kleiner 10
                        sNewDescription=sNewDescription.concat("00" + iStopnumber +"-"+ sActualDescription);
                        aStops[i].addressName1=sNewDescription;
                    }

                    if(iStopnumber>=10 && iStopnumber<100){ //Größer gleich 10 aber kleiner 100
                        sNewDescription=sNewDescription.concat("0" + iStopnumber +"-"+ sActualDescription);
                        aStops[i].addressName1=sNewDescription;
                    }

                    if(iStopnumber>=100){ //Größer gleich 100
                        sNewDescription=sNewDescription.concat(iStopnumber +"-"+ sActualDescription);
                        aStops[i].addressName1=sNewDescription;
                    }
                    iStopnumber++;
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

            onStopListItemPressed:function(oEvent){ //Herausfinden welcher Stop in der Liste ausgewaehlt wurde
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var sStopId=oEvent.getSource().getId(); //Event-Id vom Objekt
                var aListItems=this.getView().byId("stopSelectionList").getItems(); //Array an Items in der Liste
                var aModelItems=this.getOwnerComponent().getModel("StopModel").getProperty("/results"); //Array an Objekten im Model
                var oPressedModelObject=Helper.findModelObjectSlimm(sStopId, aListItems, aModelItems);
                var oPressedModelObjectDetails=oPressedModelObject.orders[0]; //Detailreichere Informationen über das Modelobjekt
                
                oStopInformationModel.setProperty("/tour", oPressedModelObjectDetails);
                this.setLoadingUnits(oPressedModelObjectDetails);
            },

            setLoadingUnits:function(oPressedModelObjectDetails){ //Zu Verladenen NVEs in Model setzen
                var aLoadingUnits=oPressedModelObjectDetails.loadingUnits;
                var oLoadingUnitsModel=this.getOwnerComponent().getModel("LoadingUnitsModel");

                oLoadingUnitsModel.setProperty("/results", aLoadingUnits);

                this.onNavToStopInformation();
            },

            onNavToStopInformation:function(){ //Navigation zur StopInformation View
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("StopInformation");
            },
        });
    });
