sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/vbm/Spot",
    "sap/m/MessageToast",
    "sap/ui/vbm/GeoMap",
    "podprojekt/utils/Helper",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Spot, MessageToast, GeoMap, Helper) {
        "use strict";

        return Controller.extend("podprojekt.controller.MapView", {
            onInit: function () {
                //Beim erstmaligen aufrufen der Seite muss die Methode angehängt werden, damit die Position des
                //Markers immer auf den aktuellen Stop Zeigt
                this._oRouter = this.getOwnerComponent().getRouter();
                this._oRouter.getRoute("MapView").attachPatternMatched(this.getStopInformationData, this);
                //Alternativ zu diesem Code könnte der Marker auf der Map auch im 'StopInformation' Controller erstellt werden,
                //dann wäre hier ein refresh nicht mehr nötig aber der Code etwas unübersichtlicher
            },

            onAfterRendering: function() {
            
            },
            /*
            getTourInformationData:function(){ //Hinzufügen aller Stops der Tour in die GeoMap
                var oTourStopModel=this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour");
                var aTourStops=oTourStopModel.stops;

                for(var i in aTourStops){
                    var oCurrentStop=aTourStops[i];
                    var sTargetGeoL=oCurrentStop.targetGeoL;
                    var sTargetGeoB=oCurrentStop.targetGeoB;
                    this.createNewStop(oCurrentStop, sTargetGeoL, sTargetGeoB);
                }
            },*/

            getStopInformationData:function(){ //Hinzufügen eines einzelnen Stops für die GeoMap
                var oCurrentStop=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
                var sTargetGeoL=oCurrentStop.targetGeoL;
                var sTargetGeoB=oCurrentStop.targetGeoB;

                this.createNewStop(oCurrentStop, sTargetGeoL, sTargetGeoB);
            },

            createNewStop:function(oCurrentStop, sTargetGeoL, sTargetGeoB){ //Erstellen eines Stops
                var oGeoMapStopModel=this.getOwnerComponent().getModel("SpotModel");

                //Zuruecksetzen notwendig, weil sonst immer wieder der gleiche Stopp drin ist
                //Anpassung notwendig, wenn ganze Tour abgebildet sein soll
                oGeoMapStopModel.setProperty("/spot", []); 

                var aGeoMapSpots=oGeoMapStopModel.getProperty("/spot");
                

                var oStop={
                    "pos": sTargetGeoL+";"+sTargetGeoB,
                    "tooltip": oCurrentStop.city,
                    "type": "Success",
                    "text": oCurrentStop.addressName1
                };

                var aUpdatedSpots=aGeoMapSpots.concat([oStop]); //Array wird mit neuem Stopp erstellt, dass angezeigt wird
                oGeoMapStopModel.setProperty("/spot", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig

                this.setInitialPosition(sTargetGeoL, sTargetGeoB); //Anschließend oeffnen der Map
            },

            setInitialPosition:function(sTargetGeoL, sTargetGeoB){
                var oGeoMap=this.getView().byId("GeoMap");
                var sAltitude="0";
                oGeoMap.setInitialPosition(sTargetGeoL+";"+sTargetGeoB+";"+sAltitude);
            },

            onClickGeoMapSpot:function(oEvent){
                var oStopInformationModel=this.getOwnerComponent().getModel("StopInformationModel");
                var oStop=oStopInformationModel.getProperty("/tour");
                oEvent.getSource().openDetailWindow(oStop.sequence + " " + oStop.addressName1,"0", "0");
            },

            onGetCurrentPosition:function(){ //Zurücksetzen der Map Position auf aktuellen Ort?
                this.onBusyDialogOpen();

                navigator.geolocation.getCurrentPosition(
                    (oPosition) => {
                        this.onBusyDialogClose();
                        var sCurrentGeoL=oPosition.coords.longitude;
                        var sCurrentGeoB=oPosition.coords.latitude;
                        //var sAltitude=oPosition.coords.altitude;
                        var sAccuracy=oPosition.coords.accuracy;
                        //var sSpeed=oPosition.coords.speed;

                        if(sAccuracy>100){ //Pruefen ob die Daten überhaupt genau genug sind!
                            MessageToast.show("Trying to fetch more accurate data! Accuracy is not good enough!");
                            //this.onGetCurrentPosition();
                        } else{
                            this.toCurrentPosition(sCurrentGeoL, sCurrentGeoB);
                        }
                    },
                    (oError) =>{
                        this.onBusyDialogClose();
                        MessageToast.show("Unknown error occured!");
                    },
                    {
                        //Attributes for better GPS-Data
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            },

            toCurrentPosition:function(sCurrentGeoL, sCurrentGeoB){
                var sAltitude="15"; // von 0 (weit weg) bis 20 oder so (sehr nah)
                var oGeoMap=this.getView().byId("GeoMap");
                oGeoMap.zoomToGeoPosition(parseFloat(sCurrentGeoL), parseFloat(sCurrentGeoB), parseFloat(sAltitude));

            },

            onToTargetPosition:function(){ //Zur Position des derzeit ausgewählten Stops
                var oCurrentStop=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
                var sTargetGeoL=oCurrentStop.targetGeoL;
                var sTargetGeoB=oCurrentStop.targetGeoB;
                var sAltitude="15"; // von 0 (weit weg) bis 20 oder so (sehr nah)
                var oGeoMap=this.getView().byId("GeoMap");

                oGeoMap.zoomToGeoPosition(parseFloat(sTargetGeoL), parseFloat(sTargetGeoB), parseFloat(sAltitude)); //Werte muessen als float angegeben werden
            },

            onBusyDialogOpen:function(){
                this.oBusyDialog ??= this.loadFragment({
                  name: "podprojekt.view.fragments.BusyDialog",
                });
        
                this.oBusyDialog.then((oDialog) => oDialog.open());
              },
        
              onBusyDialogClose:function(){
                setTimeout(() => { this.byId("BusyDialog").close() },250);
              },


        });
    });
