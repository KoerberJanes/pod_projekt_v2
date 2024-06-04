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
            },

            alterStopDescriptionForOrder:function(){
                var oStopModel=this.getOwnerComponent().getModel("StopModel");
                var aStops=oStopModel.getProperty("/results");

                
                for(var i in aStops){
                    var oStopInOrder=oStopModel.getProperty("/results")[i]
                    var sOldStopDescription=oStopInOrder.addressName1;
                    //var iStopNumber=parseInt(i)+2;
                    //var sNewStopDescription= iStopNumber+"-"+sOldStopDescription;
                    var sNewStopDescription= (parseInt(i)+2)+"-"+sOldStopDescription;
                    oStopInOrder.addressName1=sNewStopDescription;
                }
                
                oStopModel.refresh();
            },

            onRefreshRespectiveStops:function(){
                
                MessageToast.show("Dies ist ein Dummy-Rrefresh!", {
                    duration: 1000,
                    width:"15em"
                });
            },
        });
    });
