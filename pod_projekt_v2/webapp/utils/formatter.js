sap.ui.define([

], function () {
	"use strict";
	return {
		statusText: function (sStatus, oOwnerComponent) {
            var oResourceBundle = oOwnerComponent.getModel("i18n").getResourceBundle();
            var sReturnStatusText="";
            switch (sStatus) {
                case "10":
                    sReturnStatusText= oResourceBundle.getText("invoiceStatusApproved");
                    break;
                case "50":
                    sReturnStatusText= oResourceBundle.getText("invoiceStatusLoaded");
                    break;
                case "70":
                    sReturnStatusText= oResourceBundle.getText("invoiceStatusFinished");
                    break;
                case "90":
                    sReturnStatusText= oResourceBundle.getText("invoiceStatusCompleted");
                    break;
                default:
                    sReturnStatusText= oResourceBundle.getText("invoiceStatusFaulty");
            }

            return sReturnStatusText;
        }
	};
});