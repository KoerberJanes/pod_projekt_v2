sap.ui.define([

], function () {
	"use strict";
	return {
		statusText: function (sStatus, ownerComponent) {
            const oResourceBundle = ownerComponent.getModel("i18n").getResourceBundle();
            switch (sStatus) {
                case "10":
                    return oResourceBundle.getText("invoiceStatusFreigegeben");
                case "50":
                    return oResourceBundle.getText("invoiceStatusBeladen");
                case "70":
                    return oResourceBundle.getText("invoiceStatusBeendet");
                case "90":
                    return oResourceBundle.getText("invoiceStatusAbgeschlossen");
                default:
                    return "Fehlerhaft";
            }
        }
	};
});