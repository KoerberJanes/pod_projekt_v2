sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox, StatusSounds) {
		"use strict";

		const STOP_STATUS_PROCESSED = "70"; // Konstanten für Statuscodes

		return Controller.extend("podprojekt.controller.ActiveTour", {
			onInit: function () {},

			onAfterRendering: function () {
				this._oBundle = this.getView().getModel("i18n").getResourceBundle();
			},

			checkIfStoppAlreadyDealtWith: function (oEvent) {
				//!Statuscodes müssen abgesprochen werden
				let oPressedModelObject = oEvent.getSource().getBindingContext("StopModel").getObject();
				let iNumberOfUnprocessedNves = oPressedModelObject.orders[0].loadingUnits.length;
				let sStopStatus = oPressedModelObject.stopStatus; //in Kombination mit der Methode: 'setCurrentStopAsFinished'

				if (iNumberOfUnprocessedNves === 0 && sStopStatus === STOP_STATUS_PROCESSED) {
					//Keine unbearbeiteten NVEs und Stopp hat status erledigt
					this._showErrorMessageBox("stopAlreadyProcessed", () => {});
				} else {
					//Stop zum verarbeiten vorbereiten
					this.onSetStoppInformation(oPressedModelObject);
				}
			},

			onSetStoppInformation: function (oPressedModelObject) {
				//Herausfinden welcher Stop in der Liste ausgewaehlt wurde
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel");
				let oPressedModelObjectDetails = oPressedModelObject.orders[0]; //Detailreichere Informationen über das Modelobjekt

				oStopInformationModel.setProperty("/tour", oPressedModelObjectDetails);
				this.createLoadingUnitsDetailedDescription(oPressedModelObjectDetails);
			},

			createLoadingUnitsDetailedDescription: function (oPressedModelObjectDetails) {
				//Erstellen der Unterstruktur von Nves (Details)
				let aLoadingUnits = oPressedModelObjectDetails.loadingUnits;

				aLoadingUnits.forEach((oCurrentDefaultLoadingUnit) => {
					oCurrentDefaultLoadingUnit.detailedInformation = [
						{
							accurateDescription: `${oCurrentDefaultLoadingUnit.amount}x ${oCurrentDefaultLoadingUnit.articleCaption}`,
						},
					];
					oCurrentDefaultLoadingUnit.accurateDescription = `${oCurrentDefaultLoadingUnit.label1} ${oCurrentDefaultLoadingUnit.lodingDeviceTypeCaption}`; // Erstellen der richtigen Bezeichnung
				});
				this.onNavToStopInformation();
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			onNavToStopInformation: function () {
				//Navigation zur StopInformation View
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("StopInformation");
			},

			onNavToOverview: function () {
				//Navigation zur Overview
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("Overview");
			},
		});
	}
);
