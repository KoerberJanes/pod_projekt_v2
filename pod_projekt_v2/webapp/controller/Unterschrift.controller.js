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
                //this.saftyPig();
            },

            saftyPig:function(){
                console.log("                         _");
                console.log(" _._ _..._ .-',     _.._(`))");
                console.log("'-. `     '  /-._.-'    ',/");
                console.log("   )         \            '.");
                console.log("  / _    _    |             \"");
                console.log(" |  a    a    /              |");
                console.log(" \   .-.                     ;  ");
                console.log("  '-('' ).-'       ,'       ;");
                console.log("     '-;           |      .'");
                console.log("        \           \    /");
                console.log("        | 7  .__  _.-\   \"");
                console.log("        | |  |  ``/  /`  /");
                console.log("       /,_|  |   /,_/   /");
                console.log("          /,_/      '`-'");
            },

            onAfterRendering: function() {
                this._oBundle = this.getView().getModel("i18n").getResourceBundle();
            },

            onClearSignField:function(){
                var sDigitalSignatureId = this.byId("digitalSignatureId");
			    sDigitalSignatureId.clearArea();
            },

            onCheckIfStopSigned:function(){
                var sDigitalSignatureId = this.byId("digitalSignatureId");
                var sSignedFieldBase64=sDigitalSignatureId.getSignatureAsString();
                //var sSignedFieldPng=sDigitalSignatureId.getSignatureAsPng();

                if(sSignedFieldBase64!==""){ //Feld ist leer und wurde nicht Unterschrieben!
                    this.simulateBackendCall();
                } else{
                    this.notSignedError();
                }
            },

            notSignedError:function(){
                MessageBox.error(this._oBundle.getText("noSignatureDetected"), {
                    onClose:function(){
                        //NOP
                    }.bind(this)
                });
            },

            busyDialogOpen:function(){
                this.oBusyDialog ??= this.loadFragment({
                name: "podprojekt.view.fragments.BusyDialog",
                });
        
                this.oBusyDialog.then((oDialog) => oDialog.open());
            },

            busyDialogClose:function(){
                setTimeout(() => { this.byId("BusyDialog").close() },500);
            },

            simulateBackendCall:function(){
                this.busyDialogOpen();

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
               this.setCurrentStopAsFinished();
            },

            onRefreshDateAndTime:function(){
                var oCustomerModel=this.getOwnerComponent().getModel("CustomerModel");
                var sDateAndTime= sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.YYYY HH:mm:ss" }).format(new Date()); //Datum inklusive Uhrzeit
                oCustomerModel.setProperty("/dateAndTime", sDateAndTime);
            },

            showBackendConfirmMessage:function(){
                MessageToast.show(this._oBundle.getText("stopSuccessfullyReceipt"), {
                    duration: 2500,
                    width:"15em"
                });
            },

            setCurrentStopAsFinished:function(){ //!Statuscodes müssen abgesprochen werden
                var oTourStartModel=this.getOwnerComponent().getModel("StopInformationModel"); //Infos über derzeitigen Stopp

                oTourStartModel.setProperty("/tour/orderStatus", '70');
                this.checkIfAllStopsAreCompleted();
            },

            checkIfAllStopsAreCompleted:function(){ //!Statuscodes müssen abgesprochen werden
                var oTourStartModel=this.getOwnerComponent().getModel("TourStartFragmentModel"); //Tour mit allen Stopps und Infos vorhanden
                var aStopsOfCurrentTour=oTourStartModel.getProperty("/tour/stops");

                var bStatusNotFinished = (element) => element.stopStatus === "90";

                if(aStopsOfCurrentTour.some(bStatusNotFinished)){ //Wenn einer der Stopps noch nicht abgeschlossen wurde --> Status '90'
                    this.getOwnerComponent().getModel("TourStartFragmentModel").refresh(); //Die Infos werden richtig in den Models verwaltet, jedoch wird auf der ActiveTour View weiterhin die 3 für die NVEs angezeigt
                    //Refresh funktioniert noch nicht. Das ist ein Problem für den Janes von Montag
                    this.onNavToActiveTour();
                } else{
                    this.onNavToOverview();
                }
            },

            onNavToActiveTour:function(){
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("ActiveTour");
            },

            onNavToOverview:function(){
                var oRouter = this.getOwnerComponent().getRouter();

                oRouter.navTo("Overview");
            },
            

            onBreak:function(){
                console.log("Debugging-time");
            },
        });
    });
