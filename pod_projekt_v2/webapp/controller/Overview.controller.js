sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/base/assert"
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, MessageToast, MessageBox, assert) {
    "use strict";

    return Controller.extend("podprojekt.controller.Overview", {
      onInit: function () {
      },

      onAfterRendering: function() {
        this._oBundle=this.getOwnerComponent().getModel("i18n").getResourceBundle(); //Globales Model für die i18n
        this.simulateBackendCallForTours(true);
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
        oCustomerModel.setProperty("/driverId", sIdEumDev);
    },

      simulateBackendCallForTours:function(bTestCase){
        this.onBusyDialogOpen(); //Dialog oeffnen um Backend-Call abzuwarten.
        //Methoden und Filter können hier erstellt werden.

        var sPath="/ABAP_FUNKTIONSBAUSTEIN"; //Pfad zu OData-EntitySet
        var oODataModel= this.getOwnerComponent().getModel("ABC"); //O-Data Model aus der View
        //var oFilter1 = new Filter(); //Filter Attribut 1
        //var oFilter2 = new Filter(); //Filter Attribut 2
        //var oFilter3 = new Filter(); //Filter Attribut 3
        //var aFilters = [oFilter1, oFilter2, oFilter3]; //Array an Filtern, die an das Backend uebergeben werden


        /*
        oODataModel.read(sPath, {
          filters: aFilters,

          success: (oData) => {
              this.busyDialogClose();
              var aRecievedTours=oData.getProperty("/results");

              if(aRecievedTours.length===0){
                  this.noToursReceivedError(); //Fahrer hat keine Touren
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
            this.noToursReceivedError();
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
      },

      filterFinishedStops: function(aRecievedTours) { //Beendete oder Abgeschlossene Touren werden gefiltert

        for (var i in aRecievedTours) { //Filtern aller Touren mit Status 90 & 70
            var sCurrentTourStatus=aRecievedTours[i].routeStatus;
            if (sCurrentTourStatus==="90" || sCurrentTourStatus==="70") {
              aRecievedTours.splice(parseInt(i), 1);
            }
        }
        return aRecievedTours;
      },

      setPressedTour:function(oEvent){ //Ausgewählte Tour-Infos in Model für Fragment setzen
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var oPressedModelObject=oEvent.getSource().getBindingContext("TourModel").getObject();

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
        
        this.oTourstartDialog.then((oDialog) => {oDialog.open() });
      },

      onTourStartDialogButtonCallback: function (oEvent) { //Callback vom TourStartFrtagment um Buttons zu unterscheiden
        var sLongButtonId = oEvent.getSource().getId();
        var sShortButtonId = sLongButtonId.substring(sLongButtonId.lastIndexOf("-") + 1,sLongButtonId.length);

        if (sShortButtonId === "TourstartFragmentButtonConfirm") { //Bestätigen
          this.checkIfInputConstraintsComply();
        }

        if (sShortButtonId === "TourstartFragmentButtonAbort") { //Abbrechen
          this.onCloseTourStartFragment(); //Dialog Schließen
        }
      },

      resetMileageUserInput:function(){
        var oInput=this.getView().byId("kilometerInput");
        oInput.setValue(""); 

        var oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
        oTourStartFragmentModel.setProperty("/mileage", "");
      },

      onMileageInputChange:function(oEvent){ //Wird als Update fuer das Model verwendet
        var oInput = oEvent.getSource();
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        oTourStartFragmentModel.setProperty("/mileage", oInput.getValue());
      },

      onMileageInputLiveChange:function(oEvent){ //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
        var oInput = oEvent.getSource();
        this.handleRequiredField(oInput);
        this.checkInputConstraints(oInput);
      },

      handleRequiredField: function (oInput) {
        var sValueState = "None";
  
        if (!oInput.getValue()) {
          sValueState="Error"
          oInput.setValueState(sValueState);
        }
      },

      checkInputConstraints: function (oInput) {
        var oBinding = oInput.getBinding("value");
        var sValueState = "None";

        try {
          oBinding.getType().validateValue(oInput.getValue());
        } catch (oException) {
          sValueState = "Error";
        }
        oInput.setValueState(sValueState);
      },

      checkIfInputConstraintsComply:function(){
        var oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
        var sTourStartFragmentInput = oTourStartFragmentModel.getProperty("/mileage"); // User-Eingabe
        var regex = /^[0-9]{2,}$/; //es sind nur Ziffern erlaubt mit einer Mindestlaenge von 2

        if (regex.test(sTourStartFragmentInput)) {
          this.checkIfEnteredValueInRange();
        } else {
          this.showInputConstraintViolationError();
        }
      },

      checkIfEnteredValueInRange: function () { //Pruefen ob Tolleranz eingehalten wurde
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel"); //Ausgewaehlte Tour-Infos
        var iTourStartFragmentInput=oTourStartFragmentModel.getProperty("/mileage"); //User-Eingabe

        var iRespectiveTourMileage= oTourStartFragmentModel.getProperty("/tour/mileage");
        var iRespectiveTourMileageTolerance=oTourStartFragmentModel.getProperty("/tour/mileageTolerance");
        
        //!Test
        //assert(iTourStartFragmentInput >= (iRespectiveTourMileage-iRespectiveTourMileageTolerance) && iTourStartFragmentInput <= (iRespectiveTourMileage+iRespectiveTourMileageTolerance), "Entered value was not in range of tollerance!");

        if(iTourStartFragmentInput >= (iRespectiveTourMileage-iRespectiveTourMileageTolerance) && 
            iTourStartFragmentInput <= (iRespectiveTourMileage+iRespectiveTourMileageTolerance)){ //Eingabe in Tolleranz
            this.setStopInformationModelData();
        } else{ //Eingabe nicht in Tolleranz
          this.tourTolleranceNotAcceptedError();
        }
        this.resetMileageUserInput(); //Bei akzeptierter Eingabe das Feld leeren
      },

      setStopInformationModelData:function(){ //Tolleranz eingehalten und Stops der Tour in entsprechendes Model setzen
        var oStopInformationModel=this.getOwnerComponent().getModel("StopModel"); //Stop Model
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var aRespectiveTourStops=oTourStartFragmentModel.getProperty("/tour/stops"); //Array an Stops der ausgewaehlten Tour

        oStopInformationModel.setProperty("/results", aRespectiveTourStops); //Setzen der Stops
        this.onNavToActiveTour();
      },

      noToursReceivedError:function(){ //Keine Touren wurden aus dem Backend bekommen
        MessageBox.error(this._oBundle.getText("noToursLoaded"), {
            onClose: () => {
                //NOP:
            }
        });
      },

      setFocusIntoMileageInput:function(){//Habe leider keine bessere Moeglichkeit gesehen den Fokus wieder zu setzen
        var oInputField= this.getView().byId("kilometerInput");

        //oInputField.setValueState("Error");
        setTimeout(() =>{
          oInputField.focus();
        }, 50);
        
      },

      scrollToInputAfterError:function(){
        this.resetMileageUserInput();
        var oInputField=this.getView().byId("kilometerInput");
        
        oInputField.setValueState("Error");
        setTimeout(() => {
            oInputField.focus();
        }, 50);
      },

      tourTolleranceNotAcceptedError:function(){ //Kilometer vom User nicht akzeptiert, da nicht in Tolleranz
        
        MessageBox.error(this._oBundle.getText("tolleranceNotAccepted"),{
          onClose: () => {
              this.scrollToInputAfterError();
          }
        });
      },

      showInputConstraintViolationError:function(){
        MessageBox.error(this._oBundle.getText("nameNotMatchingRegex"),{
          onClose: () => {
            this.scrollToInputAfterError();
          }
        });
      },
      
      onRefreshTours:function(){ //Refresh der Touren, bisher ein Dummy
        MessageToast.show(this._oBundle.getText("dummyRefresh"), {
          duration: 1000,
          width:"15em"
        });
        this.simulateBackendCallForTours();
      },

      onCloseTourStartFragment: function () { //Tourstart Fragment schließen
        this.resetMileageUserInput();
        this.byId("TourstartDialog").close();
      },

      onNavToActiveTour: function () { //Navigation zu den Stops der derzeitgen Tour
        var oRouter = this.getOwnerComponent().getRouter();
        
        oRouter.navTo("ActiveTour");
      },
    });
  }
);
