sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/base/util/deepClone",
    "sap/ui/core/IconPool",
    "podprojekt/model/formatter",
    "podprojekt/utils/Helper",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, deepClone, IconPool, formatter, Helper) {
    "use strict";

    return Controller.extend("podprojekt.controller.Overview", {
      onInit: function () {

      },

      /**
       * @override
       */
      onAfterRendering: function() {
        //Controller.prototype.onAfterRendering.apply(this, arguments);
        this.setCustomAttributesForTourStatus();
      },

      setCustomAttributesForTourStatus:function(){
        var oTourModel=this.getOwnerComponent().getModel("TourModel");
        var oTourModelItems = oTourModel.getProperty("/results");
        for(var i in oTourModelItems){
            oTourModelItems[i].altRouteStatus=""; //Erstellen des Anzuzeigenden Attributes
            oTourModelItems[i].altRouteStatus=formatter.statusText(oTourModelItems[i].routeStatus, this.getOwnerComponent()); //Füllen mit wert
        }
        oTourModel.refresh(); //Aktualisieren
      },

      setPressedTour:function(oEvent){
        var oTourStartFragmentModel=this.getOwnerComponent().getModel("TourStartFragmentModel");
        var sObjectId=oEvent.getSource().getId(); //Event-Id vom Objekt
        var aListItems=this.getView().byId("LTourAuswahl").getItems(); //Array an Items in der Liste
        var aModelItems=this.getOwnerComponent().getModel("TourModel").getProperty("/results"); //Array an Objekten im Model
        var oPressedModelObject=Helper.findModelObjectSlimm(sObjectId, aListItems, aModelItems);
        oTourStartFragmentModel.setProperty("/tour", oPressedModelObject);
        this.openTourStartFragment();
      },

      openTourStartFragment: function () {
        this.oTourstartDialog ??= this.loadFragment({
          name: "podprojekt.view.fragments.Tourstart",
        });

        this.oTourstartDialog.then((oDialog) => oDialog.open());
      },

      onDialogButtonCallback: function (oEvent) { //Callbacl vom TourStartFrtagment um Buttons zu unterscheiden
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
          this.onNavToActiveTour();
        } 
        oTourStartFragmentUserModel.setProperty("/result/mileage", "");
        
      },

      onCloseTourStartFragment: function () {
        this.byId("TourstartDialog").close();
      },

      onNavToActiveTour: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("ActiveTour");
      },
    });
  }
);
