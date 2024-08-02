sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
    "sap/ui/model/Filter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, Filter) {
        "use strict";

        return Controller.extend("podprojekt.controller.Unterschrift", {
            onInit: function () {

            },

            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();

            },

            onClearSignField:function(){
                var digitalSignatureId = this.byId("digitalSignatureId");
			    digitalSignatureId.clearArea();
            },

            onBreak:function(){
                console.log("Debugging-time");
            },

            onReceiptStop:function(){
                this.simulateBackendCall();
            },

            busyDialogOpen:function(){
                this.oBusyDialog ??= this.loadFragment({
                name: "podprojekt.view.fragments.BusyDialog",
                });
        
                this.oBusyDialog.then((oDialog) => oDialog.open());
            },

            busyDialogClose:function(){
                setTimeout(() => { this.byId("BusyDialog").close() },1000);
            },

            simulateBackendCall:function(){
                this.busyDialogOpen();

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
                */

               this.busyDialogClose();
               this.showBackendConfirmMessage();
               this.onNavToOverview();
            },

            showBackendConfirmMessage:function(){
                MessageToast.show(this._oBundle.getText("stopSuccessfullyReceipt"), {
                    duration: 2500,
                    width:"15em"
                });
            },

            onNavToOverview:function(){
                var oRouter = this.getOwnerComponent().getRouter();
        
                oRouter.navTo("Overview");
            }
        });
    });
