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
                this._oRouter.getRoute("MapView").attachPatternMatched(this.setSpotsIntoGeoMap, this);
                //Alternativ zu diesem Code könnte der Marker auf der Map auch im 'StopInformation' Controller erstellt werden,
                //dann wäre hier ein refresh nicht mehr nötig aber der Code etwas unübersichtlicher
            },

            onAfterRendering: function() {
            
            },

            setSpotsIntoGeoMap:function(){ //Hinzufügen eines einzelnen Stops für die GeoMap
                var oCurrentStop=this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour");
                var sTargetGeoL=oCurrentStop.targetGeoL;
                var sTargetGeoB=oCurrentStop.targetGeoB;

                this.createDestinationSpot(oCurrentStop, sTargetGeoL, sTargetGeoB);
                this.getCurrentPosition(false);
            },

            createDestinationSpot:function(oCurrentStop, sTargetGeoL, sTargetGeoB){ //Erstellen eines Stops
                var oGeoMapStopModel=this.getOwnerComponent().getModel("SpotModel");

                //Zuruecksetzen notwendig, weil sonst immer wieder der gleiche Stopp drin ist
                //Anpassung notwendig, wenn ganze Tour abgebildet sein soll
                oGeoMapStopModel.setProperty("/spot", []); 

                var aGeoMapSpots=oGeoMapStopModel.getProperty("/spot");

                var oStop={
                    "bTarget": true,
                    "pos": sTargetGeoL+";"+sTargetGeoB,
                    "tooltip": oCurrentStop.city,
                    "type": "Success",
                    "description": oCurrentStop.addressName1
                };

                var aUpdatedSpots=aGeoMapSpots.concat([oStop]); //Array wird mit neuem Stopp erstellt, dass angezeigt wird
                oGeoMapStopModel.setProperty("/spot", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig

                this.toCurrentPosition(sTargetGeoL, sTargetGeoB); 
            },

            createOwnLocationSpot:function(sCurrentGeoL, sCurrentGeoB, bZoomToSpot){
                var oGeoMapStopModel=this.getOwnerComponent().getModel("SpotModel");
                var aGeoMapSpots=oGeoMapStopModel.getProperty("/spot");

                var oStop={
                    "bTarget": false,
                    "pos": sCurrentGeoL+";"+sCurrentGeoB,
                    "tooltip": "current location",
                    "type": "Success",
                    "description": "Own Location"
                };

                var aUpdatedSpots=aGeoMapSpots.concat([oStop]); //Array wird mit neuem Stopp erstellt, dass angezeigt wird
                oGeoMapStopModel.setProperty("/spot", aUpdatedSpots); //damit ist kein Model.refresh() mehr notwendig
                if(bZoomToSpot){
                    this.toCurrentPosition(sCurrentGeoL, sCurrentGeoB);
                }
            },

            setInitialPosition:function(sTargetGeoL, sTargetGeoB){
                var oGeoMap=this.getView().byId("GeoMap");
                var sAltitude="12";
                oGeoMap.setInitialPosition(sTargetGeoL+";"+sTargetGeoB+";"+sAltitude);
            },

            onClickGeoMapSpot:function(oEvent){
                var oPressedSpot=oEvent.getSource().getBindingContext("SpotModel").getObject();
                oEvent.getSource().openDetailWindow(oPressedSpot.description ,"0", "0");
            },

            getCurrentPosition:function(bZoomToSpot){ //Zurücksetzen der Map Position auf aktuellen Ort?
                //Leider abgesehen von der boolschen-Var keine andere Möglichkeit eingefallen
                this.onBusyDialogOpen();

                navigator.geolocation.getCurrentPosition(
                    (oPosition) => {
                        this.onBusyDialogClose();
                        this.checkIfOwnLoactionIsAccurate(oPosition, bZoomToSpot);
                    },
                    (oError) =>{
                        this.onBusyDialogClose();
                        MessageToast.show("Could not fetch Geo-Location");
                    },
                    {
                        //Attributes for better GPS-Data
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            },

            removeOldOwnPosition:function(){
                var oGeoMapStopModel=this.getOwnerComponent().getModel("SpotModel");
                var aGeoMapSpots=oGeoMapStopModel.getProperty("/spot");
                var aUpdatedPots=[];

                for(var i in aGeoMapSpots){
                    var oCurrentGeoMapSpot=aGeoMapSpots[i];
                    if(oCurrentGeoMapSpot.bTarget === true){
                        aUpdatedPots=aUpdatedPots.concat([oCurrentGeoMapSpot]);
                    }
                }

                oGeoMapStopModel.setProperty("/spot", aUpdatedPots);

                this.getCurrentPosition(true);
            },

            checkIfOwnLoactionIsAccurate:function(oPosition, bZoomToSpot){
                var sAccuracy=oPosition.coords.accuracy;
                //TODO: Hier wurde die Prüfung auskommentiert weil sie sehr sehr ungenau ist

                //if(sAccuracy>100){ //Pruefen ob die Daten überhaupt genau genug sind!
                    //MessageToast.show("Trying to fetch more accurate data! Accuracy is not good enough!");
                //} else{
                    var sCurrentGeoL=oPosition.coords.longitude;
                    var sCurrentGeoB=oPosition.coords.latitude;
                    this.createOwnLocationSpot(sCurrentGeoL, sCurrentGeoB, bZoomToSpot);
                //}
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
