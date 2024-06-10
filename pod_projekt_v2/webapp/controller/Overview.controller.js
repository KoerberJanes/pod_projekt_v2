sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/base/util/deepClone",
    "sap/ui/core/IconPool",
    "podprojekt/model/formatter",
    "podprojekt/utils/Helper",
    "sap/m/MessageToast",
    "sap/ui/model/Filter"
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, deepClone, IconPool, formatter, Helper, MessageToast, Filter) {
    "use strict";

    return Controller.extend("podprojekt.controller.Overview", {
      onInit: function () {

      },

      onAfterRendering: function() {
        this._oBundle=this.getOwnerComponent().getModel("i18n").getResourceBundle(); //Globales Model für die i18n
        this.simulateBackendCallForTours(true);
        //this.setCustomAttributes();
      },

      simulateBackendCallForTours:function(bTestCase){
        this.onBusyDialogOpen(); //Dialog oeffnen um Backend-Call abzuwarten.
        //Methoden und Filter können hier erstellt werden.
        var sPathPos="/ABAP_FUNKTIONSBAUSTEIN"; //Methode am Backend um Daten zu erhalten.
        var oFilter1 = new Filter(); //Filter Attribut 1
        var oFilter2 = new Filter(); //Filter Attribut 2
        var oFilter3 = new Filter(); //Filter Attribut 3
        var aFilters = [oFilter1, oFilter2, oFilter3]; //Array an Filtern, die an das Backend uebergeben werden


        /*
        this.getView().getModel("TP_VERLADUNG_SRV").read(sPathPos, {
          filters: aFilters,

          success: function (oData) {
              this.busyDialogClose();
              var aRecievedTours=oData.getProperty("/results");

              if(aRecievedTours.length===0){
                  this.noToursError(); //Fahrer hat keine Touren
              } else{
                  this.handleRecievedTours(aRecievedTours); //Setzen der Touren in Model
              }

          }.bind(this),
          error: function(oError){
              this.busyDialogClose();
              //Bisher keine Funktion
          }.bind(this)
        });
      */

        if(bTestCase){ //Success-Fall simulieren
          this.onBusyDialogClose();
          var oTourModel=this.getOwnerComponent().getModel("TourModel"); //Demo Model bereits vorab gefüllt
          var aTourModelItems = oTourModel.getProperty("/results"); //Inhalt für Abfrage benoetigt. Wird später durch das oData Model ersetzt

          if(aTourModelItems.length===0){ //Keine Tour vorhanden
            this.noToursError();
          }else{
            this.handleRecievedTours(aTourModelItems);
          }
        }else{
          //Error-Fall simulieren
          this.onBusyDialogClose();
        }
      },

      handleRecievedTours:function(aRecievedTours){
        var oTourModel=this.getOwnerComponent().getModel("TourModel");

        oTourModel.setProperty("/results", aRecievedTours);
        this.setCustomAttributes();
      },

      setCustomAttributes:function(){
        var oTourModel=this.getOwnerComponent().getModel("TourModel");
        var aTourModelItems = oTourModel.getProperty("/results");

        for(var i in aTourModelItems){
            aTourModelItems[i].altRouteStatus=""; //Erstellen des Anzuzeigenden Attributes
            aTourModelItems[i].altRouteStatus=formatter.statusText(aTourModelItems[i].routeStatus, this.getOwnerComponent()); //Füllen mit wert
        }
        oTourModel.refresh(); //Aktualisieren
      },

      setPressedTour:function(oEvent){
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var sObjectId=oEvent.getSource().getId(); //Event-Id vom Objekt
        var aListItems=this.getView().byId("tourSelectionList").getItems(); //Array an Items in der Liste
        var aModelItems=this.getOwnerComponent().getModel("TourModel").getProperty("/results"); //Array an Objekten im Model
        var oPressedModelObject=Helper.findModelObjectSlimm(sObjectId, aListItems, aModelItems);

        oTourStartFragmentModel.setProperty("/tour", oPressedModelObject);
        this.openTourStartFragment();
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

      openTourStartFragment: function () {
        this.oTourstartDialog ??= this.loadFragment({
          name: "podprojekt.view.fragments.Tourstart",
        });

        this.oTourstartDialog.then((oDialog) => oDialog.open());
      },

      onTourStartDialogButtonCallback: function (oEvent) { //Callbacl vom TourStartFrtagment um Buttons zu unterscheiden
        var sLongButtonId = oEvent.getSource().getId();
        var sShortButtonId = sLongButtonId.substring(sLongButtonId.lastIndexOf("-") + 1,sLongButtonId.length);

        if (sShortButtonId === "TourstartFragmentButtonConfirm") {
          this.checkIfEnteredValueInRange();
        }

        if (sShortButtonId === "TourstartFragmentButtonAbort") {
          this.onCloseTourStartFragment();
        }
      },

      checkIfEnteredValueInRange: function () {
        var oTourStartFragmentUserModel=this.getOwnerComponent().getModel("TourStartFragmentUserModel");
        var sTourStartFragmentInput=oTourStartFragmentUserModel.getProperty("/result/mileage");
        var iTourStartFragmentInput=parseInt(sTourStartFragmentInput);

        var oDisplayedTour=this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/tour");
        var iRespectiveTourMileage= oDisplayedTour.mileage;
        var iRespectiveTourMileageTolerance=oDisplayedTour.mileageTolerance;

        if(iTourStartFragmentInput >= (iRespectiveTourMileage-iRespectiveTourMileageTolerance) && 
            iTourStartFragmentInput <= (iRespectiveTourMileage+iRespectiveTourMileageTolerance)){
          this.setStopInformationModelData();
        } 
        this.resetTourStartFragmentUserModel();
      },

      setStopInformationModelData:function(){

        var oStopInformationModel=this.getOwnerComponent().getModel("StopModel");
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var aRespectiveTourStops=oTourStartFragmentModel.getProperty("/tour/stops");

        oStopInformationModel.setProperty("/results", aRespectiveTourStops);
        this.onNavToActiveTour();
      },

      noToursError:function(){ //Es konnten keine Touren geladen werden
        MessageBox.error(this._oBundle.getText("noToursLoaded"), {
            onClose:function(){
                //NOP:
            }.bind(this)
        });
    },

      resetTourStartFragmentUserModel:function(){
        var oTourStartFragmentUserModel=this.getOwnerComponent().getModel("TourStartFragmentUserModel");
        oTourStartFragmentUserModel.setProperty("/result/mileage", "");
      },

      onRefreshTours:function(){
        MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
          duration: 1000,
          width:"15em"
        });
        this.simulateBackendCallForTours();
      },

      onCloseTourStartFragment: function () {
        this.resetTourStartFragmentUserModel();
        this.byId("TourstartDialog").close();
      },

      onNavToActiveTour: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        
        oRouter.navTo("ActiveTour");
      },
    });
  }
);
