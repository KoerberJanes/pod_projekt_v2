sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/base/util/deepClone",
    "sap/ui/core/IconPool",
    "podprojekt/utils/formatter",
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

      getUrlParameters() {
        var oCustomerModel=this.getOwnerComponent().getModel("CustomerModel");
        var sIdEumDev;
        try {                // Abfragen der Startup-Parameter, wenn die App innerhalb einer Fiori-Umgebung läuft
            const startupParams = this.getOwnerComponent().getComponentData().startupParameters;
            sIdEumDev = startupParams.IdEumDev[0]; 
        } catch (e) {// Abfragen der URL-Parameter direkt aus der URL, falls kein Startup-Parameter verfügbar ist
            sIdEumDev = jQuery.sap.getUriParameters().get("IdEumDev");
            if (!sIdEumDev){
                sIdEumDev = 3;
            }
        }

        //Vielleicht noch das Setzen des Namens
        oCustomerModel.setProperty("/customerId", sIdEumDev);
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

          success: (oData) => {
              this.busyDialogClose();
              var aRecievedTours=oData.getProperty("/results");

              if(aRecievedTours.length===0){
                  this.noToursError(); //Fahrer hat keine Touren
              } else{
                  this.handleRecievedTours(aRecievedTours); //Setzen der Touren in Model
              }

          },
          error: (oError) => {
              this.busyDialogClose();
              //Bisher keine Funktion
          }
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

      handleRecievedTours:function(aRecievedTours){ //Verarbeiten der erhaltenen Touren
        var oTourModel=this.getOwnerComponent().getModel("TourModel");
        var aFilteredTours=this.filterFinishedStops(aRecievedTours);
        
        oTourModel.setProperty("/results", aFilteredTours);
        this.setCustomAttributes();
      },

      filterFinishedStops: function(aRecievedTours) { //Beendete oder Abgeschlossene Touren werden gefiltert

        for (var i in aRecievedTours) {
            var sCurrentTourStatus=aRecievedTours[i].routeStatus;
            if (sCurrentTourStatus==="90" || sCurrentTourStatus==="70") {
              aRecievedTours.splice(parseInt(i), 1);
            }
        }
        return aRecievedTours;
    },

      setCustomAttributes:function(){ //Erstellen der anzuzeigenden Stati für Touren in der View
        var oTourModel=this.getOwnerComponent().getModel("TourModel");
        var aTourModelItems = oTourModel.getProperty("/results");

        for(var i in aTourModelItems){
            aTourModelItems[i].altRouteStatus=""; //Erstellen des Anzuzeigenden Attributes
            aTourModelItems[i].altRouteStatus=formatter.statusText(aTourModelItems[i].routeStatus, this.getOwnerComponent()); //Füllen mit wert
        }
        oTourModel.refresh(); //Aktualisieren
      },

      setPressedTour:function(oEvent){ //Ausgewählte Tour-Infos in Model für Fragment setzen
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var sObjectId=oEvent.getSource().getId(); //Event-Id vom Objekt
        var aListItems=this.getView().byId("tourSelectionList").getItems(); //Array an Items in der Liste
        var aModelItems=this.getOwnerComponent().getModel("TourModel").getProperty("/results"); //Array an Objekten im Model
        var oPressedModelObject=Helper.findModelObjectSlimm(sObjectId, aListItems, aModelItems);

        oTourStartFragmentModel.setProperty("/tour", oPressedModelObject);
        this.openTourStartFragment();
      },

      onBusyDialogOpen:function(){ //Lade-Dialog oeffnen
        this.oBusyDialog ??= this.loadFragment({
          name: "podprojekt.view.fragments.BusyDialog",
        });

        this.oBusyDialog.then((oDialog) => oDialog.open());
      },

      onBusyDialogClose:function(){ //Lade-Dialog schließen
        setTimeout(() => { this.byId("BusyDialog").close() },1000);
      },

      openTourStartFragment: function () { //Tourstart Fragment oeffnen
        this.oTourstartDialog ??= this.loadFragment({
          name: "podprojekt.view.fragments.Tourstart",
        });

        this.oTourstartDialog.then((oDialog) => oDialog.open());
      },

      onTourStartDialogButtonCallback: function (oEvent) { //Callback vom TourStartFrtagment um Buttons zu unterscheiden
        var sLongButtonId = oEvent.getSource().getId();
        var sShortButtonId = sLongButtonId.substring(sLongButtonId.lastIndexOf("-") + 1,sLongButtonId.length);

        if (sShortButtonId === "TourstartFragmentButtonConfirm") {
          this.checkIfEnteredValueInRange();
        }

        if (sShortButtonId === "TourstartFragmentButtonAbort") {
          this.onCloseTourStartFragment();
        }
      },

      checkIfEnteredValueInRange: function () { //Pruefen ob Tolleranz eingehalten wurde
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var sTourStartFragmentInput=oTourStartFragmentModel.getProperty("/mileage");
        var iTourStartFragmentInput=parseInt(sTourStartFragmentInput);

        var iRespectiveTourMileage= oTourStartFragmentModel.getProperty("/tour/mileage");
        var iRespectiveTourMileageTolerance=oTourStartFragmentModel.getProperty("/tour/mileageTolerance");

        if(iTourStartFragmentInput >= (iRespectiveTourMileage-iRespectiveTourMileageTolerance) && 
            iTourStartFragmentInput <= (iRespectiveTourMileage+iRespectiveTourMileageTolerance)){
          this.setStopInformationModelData();
        } 
        this.resetTourStartFragmentUserInput();
      },

      setStopInformationModelData:function(){ //Tolleranz eingehalten und Stops der Tour in entsprechendes Model setzen

        var oStopInformationModel=this.getOwnerComponent().getModel("StopModel");
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var aRespectiveTourStops=oTourStartFragmentModel.getProperty("/tour/stops");

        oStopInformationModel.setProperty("/results", aRespectiveTourStops);
        this.onNavToActiveTour();
      },

      setInputFocus:function(){
        this.getView().byId("kilometerInput").focus();
      },

      noToursError:function(){
        MessageBox.error(this._oBundle.getText("noToursLoaded"), {
            onClose:function(){
                //NOP:
            }.bind(this)
        });
    },

      resetTourStartFragmentUserInput:function(){ //Tolleranz nicht eingehalten, zuruecksetzen des Eingabefeldes
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        oTourStartFragmentModel.setProperty("/mileage", "");
      },

      
      onRefreshTours:function(){ //Refresh der Touren, bisher ein Dummy
        MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
          duration: 1000,
          width:"15em"
        });
        this.simulateBackendCallForTours();
      },

      onCloseTourStartFragment: function () { //Tourstart Fragment schließen
        this.resetTourStartFragmentUserInput();
        this.byId("TourstartDialog").close();
      },

      onNavToActiveTour: function () { //Navigation zu den Stops der derzeitgen Tour
        var oRouter = this.getOwnerComponent().getRouter();
        
        oRouter.navTo("ActiveTour");
      },
    });
  }
);
