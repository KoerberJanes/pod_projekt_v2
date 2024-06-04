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
                //Controller.prototype.onAfterRendering.apply(this, arguments);
                this.alterStopDescriptionForOrder();
                this.setCustomAttributes();
            },

            alterStopDescriptionForOrder:function(){
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

            setCustomAttributes:function(){

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

            onStopListItemPressed:function(oEvent){
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var sStopId=oEvent.getSource().getId(); //Event-Id vom Objekt
                var aListItems=this.getView().byId("stopSelectionList").getItems(); //Array an Items in der Liste
                var aModelItems=this.getOwnerComponent().getModel("StopModel").getProperty("/results"); //Array an Objekten im Model
                var oPressedModelObject=Helper.findModelObjectSlimm(sStopId, aListItems, aModelItems);
                
                oStopInformationModel.setProperty("/tour", oPressedModelObject);
                this.onNavToStopInformation();
            },

            onNavToStopInformation:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("StopInformation");
            },

            onRefreshRespectiveStops:function(){
                
                MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
                    duration: 1000,
                    width:"15em"
                });
            },
        });
    });
