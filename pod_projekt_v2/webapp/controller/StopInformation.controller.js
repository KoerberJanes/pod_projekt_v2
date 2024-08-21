sap.ui.define(
	["sap/ui/core/mvc/Controller"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller) {
		"use strict";

		return Controller.extend("podprojekt.controller.StopInformation", {
			onInit: function () {},

			onAfterRendering: function () {},

			onPressBtnAvisNr: function (oEvent) {
				//Natives anrufen der Telefonnummer
				let sPhoneAvis = this.getOwnerComponent().getModel("StopInformationModel").getProperty("/tour/phoneAvis");
				sap.m.URLHelper.triggerTel(sPhoneAvis);
			},

			onNavToMap: function () {
				//Navigation zur GeoMap View
				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("MapView");
			},

			onNavToQuittierung: function () {
				//Navigation zur Quittierung View
				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Quittierung");
			},
		});
	}
);
