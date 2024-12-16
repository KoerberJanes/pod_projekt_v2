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

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			checkIfStoppAlreadyDealtWith: function (oEvent) { //!Statuscodes müssen abgesprochen werden
				let oPressedModelObject = oEvent.getSource().getBindingContext("StopModel").getObject();
				let iNumberOfUnprocessedNves = oPressedModelObject.orders[0].loadingUnits.length;
				let sStopStatus = oPressedModelObject.stopStatus; //in Kombination mit der Methode: 'setCurrentStopAsFinished'

				if (iNumberOfUnprocessedNves === 0 && sStopStatus === STOP_STATUS_PROCESSED) { //Keine unbearbeiteten NVEs und Stopp hat status erledigt
					this._showErrorMessageBox("stopAlreadyProcessed", () => {});
					//TODO: Anstatt Fehlermeldung, navigation zur Quittierung ohne bearbeitungsmoeglichkeiten.
					//TODO: Zusätzlich noch Foto der Abschlussuebersicht anzeigen lassen
				} else { //Stop zum verarbeiten vorbereiten
					this.onSetStoppInformation(oPressedModelObject);
				}
			},

			onSetStoppInformation: function (oPressedModelObject) { //Setzen des Stopps fuer weitere Verarbeitung
				let oStopInformationModel = this.getOwnerComponent().getModel("StopInformationModel");

				oStopInformationModel.setProperty("/tour", oPressedModelObject);
				this.createLoadingUnitsDetailedDescription(oPressedModelObject.orders[0]);

				this.updateModelBindings("StopInformationModel");
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
