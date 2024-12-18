sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "podprojekt/utils/StatusSounds",
	"sap/gantt/def/gradient/Stop"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox, StatusSounds) {
		"use strict";

		const STOP_STATUS_PROCESSED = "70"; // Konstanten für Statuscodes
		const REGEX_CUSTOM_POSITION = /^[0-9]+$/; //Es sind nur Ziffern erlaubt mit einer Mindestlaenge von 1

		return Controller.extend("podprojekt.controller.ActiveTour", {
			onInit: function () {},

			onAfterRendering: function () {
				this._oBundle = this.getView().getModel("i18n").getResourceBundle();
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			onCustomPositionInputChange: function (oEvent) {
				//Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("customStopPositionModel");
				oTourStartFragmentModel.setProperty("/position", oInput.getValue());
			},

			onCutomPositionInputLiveChange: function (oEvent) { //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
				let oInput = oEvent.getSource();
				this.handleRequiredField(oInput);
				this.checkInputConstraints(oInput);
			},

			handleRequiredField: function (oInput) { //Wenn kein Wert im Inputfeld vorliegt, Rot markieren
				oInput.setValueState(oInput.getValue() ? "None" : "Error");
			},

			checkInputConstraints: function (oInput) { //Wenn Wert nicht der Regex entspricht, Rot markieren
				let oBinding = oInput.getBinding("value");
				let sValueState = "None";

				try {
					oBinding.getType().validateValue(oInput.getValue());
				} catch (oException) {
					sValueState = "Error";
				}
				oInput.setValueState(sValueState);
			},

			onCheckIfStopOrderChangeableForButtons:function(oEvent){ //Pruefen ob Stoppreihenfolge verändert werden darf
				let oPressedEventId = oEvent.getSource().getId().split("-").pop();

				if(this.getStoppSequenceChangeable()){
					this.checkIfNvesAreProcessed(oPressedEventId);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("stopOrderNotChangeable"), () => {});
				}
			},

			getIfNvesAreUnprocessed:function(){ //Erhalten des Wertes ob NVEs nicht verarbeitet wurden
				let bNvesAreUnprocessed = true;

				return bNvesAreUnprocessed;
			},

			checkIfNvesAreProcessed:function(oPressedEventId){ //Pruefen ob bisher keine NVE verladen wurde

				if(this.getIfNvesAreUnprocessed()){
					this.checkIfNvesAreSelected(oPressedEventId);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("stopNvesAreProcessed"), () => {});
				}
			},

			checkIfNvesAreSelected:function(oPressedEventId){
				let aSelectedStopModelItems = this.getSelectedStops();

				if(aSelectedStopModelItems.length > 0){
					this.checkIfCustomOrderButton(oPressedEventId, aSelectedStopModelItems);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("noStopsSelected"), () => {});
				}
			},

			checkIfCustomOrderButton:function(oPressedEventId, aSelectedStopModelItems){
				if(oPressedEventId === "btnCustomOrder"){
					this.customStopPostitionFragmentOpen();
				} else{
					this.differanciateStopOrderChangeEvents(oPressedEventId, aSelectedStopModelItems);
				}
			},

			getSelectedStops:function(){ //Erhalten der Selektierten Stopps und Mapping auf Model
				let aSelectedItems = this.getView().byId("stopSelectionList").getSelectedItems();

				let aSelectedStopModelItems = aSelectedItems.map(oItem => {
					let oContext = oItem.getBindingContext("StopModel");
					return oContext ? oContext.getObject() : null;
				}).filter(oData => oData !== null);

				return aSelectedStopModelItems;
			},

			onCustomStopPositionAccept:function(){
				this.checkIfInputConstraintsComply();
			},

			checkIfInputConstraintsComply: function () { //Werteeingabe gegen regex pruefen
				let iCustomPositionInput = this.getOwnerComponent().getModel("customStopPositionModel").getProperty("/position"); // User-Eingabe

				if (REGEX_CUSTOM_POSITION.test(iCustomPositionInput)) { //Eingabe-Parameter passen
					this.checkIfEnteredValueInRange();
				} else { //Eingabe-Parameter passen nicht
					this._showErrorMessageBox("notMatchingRegex", () => {});
				}
			},

			checkIfEnteredValueInRange:function(){
				let oStopModel = this.getOwnerComponent().getModel("StopModel");
				let aStops = oStopModel.getProperty("/results");
				let oCustomPositionModel = this.getOwnerComponent().getModel("customStopPositionModel");
				let iCustomPosition = oCustomPositionModel.getProperty("/position");
				let iMaxSequenceNumber = this.getMaxSequence(aStops);
				let iMinSequenceNumber = this.getMinSequence(aStops);

				if(iCustomPosition < iMaxSequenceNumber && iCustomPosition > iMinSequenceNumber){ //Nummer ist im Intervall
					this.moveSelectedStopsToCustomPosition(iCustomPosition);
				} else{ //Nummer ist nicht im Intervall
					this._showErrorMessageBox("notMatchingRegex", () => this._setFocus());
				}
			},

			moveSelectedStopsToCustomPosition:function(iCustomPosition){
				let aSelectedStopModelItems = this.getSelectedStops();
				let oStopModel = this.getOwnerComponent().getModel("StopModel");
    			let aStops = oStopModel.getProperty("/results");

				// Alle ausgewählten Items aus der aktuellen Liste entfernen
				aSelectedStopModelItems.forEach(item => {
					let index = aStops.indexOf(item);
					if (index > -1) {
						aStops.splice(index, 1); // Entfernen des Items aus der Liste
					}
				});

				// Neue position ermitteln
				let iValidPosition = aStops.findIndex(stop => stop.sequence < iCustomPosition);
				aStops.splice(iValidPosition, 0, ...aSelectedStopModelItems); // Items an der benutzerdefinierten Position einfügen

				this.adjustStopSequence(aStops);// Stoppreihenfolge Nummern anpassen
				this.updateModelBindings("StopModel"); // Model-Bindings aktualisieren, um die UI zu synchronisieren
				this.selectSameItemsAgain(aSelectedStopModelItems); // Die gleichen Items erneut selektieren
				this.customStopPostitionFragmentClose(); //Schliessen des Dialoges
			},

			_setFocus:function(){
				const oInput = this.getView()?.byId("CustomPositionInput");

				if (oInput?.getDomRef()) {
					requestAnimationFrame(() => oInput.focus());
				}
			},

			getMaxSequence: function(aStops) { // Gehe alle Stops durch und finde den maximalen Sequence-Wert
				return Math.max(...aStops.map(stop => stop.sequence));
			},

			getMinSequence:function(aStops){ // Gehe alle Stops durch und finde den minimalen Sequence-Wert
				return Math.min(...aStops.map(stop => stop.sequence));
			},

			getCustomPosition:function(){ //Rueckgabe des position-Wertes als Integer
				return this.getOwnerComponent().getModel("customStopPositionModel").getProperty("/position");
			},

			onCustomStopPositionReject:function(){
				this.customStopPostitionFragmentClose();
			},

			differanciateStopOrderChangeEvents:function(oPressedEventId, aSelectedStopModelItems){
				let oStopModel = this.getOwnerComponent().getModel("StopModel");
				let aModelStops = oStopModel.getProperty("/results");

				switch (oPressedEventId) {
					case "bUp":
						// Elemente eins nach oben verschieben
						aSelectedStopModelItems.forEach(item => {
							let index = aModelStops.indexOf(item);
							if (index > 0 && !aSelectedStopModelItems.includes(aModelStops[index - 1])) {
								[aModelStops[index - 1], aModelStops[index]] = [aModelStops[index], aModelStops[index - 1]];
							}
						});
						
						break;
					case "bDown":
						// Elemente eins nach unten verschieben
						for (let i = aSelectedStopModelItems.length - 1; i >= 0; i--) {
							let item = aSelectedStopModelItems[i];
							let index = aModelStops.indexOf(item);
							if (index < aModelStops.length - 1 && !aSelectedStopModelItems.includes(aModelStops[index + 1])) {
								[aModelStops[index], aModelStops[index + 1]] = [aModelStops[index + 1], aModelStops[index]];
							}
						}

						break;
					case "bStart":
						// Hinzufuegen der Elemente (erste Position)
						aSelectedStopModelItems.forEach(item => {
							let index = aModelStops.indexOf(item);
							if (index > -1) {
								aModelStops.splice(index, 1); // Item entfernen
							}
						});
						// Hinzufuegen der Elemente in richtiger Reihenfolge
    					aModelStops.unshift(...aSelectedStopModelItems);
						
						break;
					case "bEnd":
						// Elemente an das Ende schieben (letzte Position)
						for (let i = aSelectedStopModelItems.length - 1; i >= 0; i--) {
							let item = aSelectedStopModelItems[i];
							let index = aModelStops.indexOf(item);
							if (index > -1) {
								aModelStops.splice(index, 1); // Item entfernen
							}
						}
						// Hinzufuegen der Elemente in richtiger Reihenfolge
    					aModelStops.push(...aSelectedStopModelItems);

						break;
					case "btnReverse":
						// Listenreihenfolge umdrehen
						aModelStops.reverse();
						break;
				
					default:
						break;
				}
				
				this.adjustStopSequence(aModelStops); // Stoppreihenfolge Nummern werden angepasst

				// Hier update notwendig, da sonst Model-referenz der Elemente fuer erneute Auswahl nicht stimmt
				this.updateModelBindings("StopModel");

				this.selectSameItemsAgain(aSelectedStopModelItems);
			},

			selectSameItemsAgain:function(aSelectedStopModelItems){// Erneute Auswahl der Elemente basierend auf den verschobenen Objekten
				let oList = this.byId("stopSelectionList"); // Die ID der Liste

				if (oList && oList.getItems()) {
					oList.removeSelections(true); // Vorherige Selektionen löschen
					oList.getItems().forEach(oItem => {
						let oContext = oItem.getBindingContext("StopModel");
						let oObject = oContext.getObject();
			
						if (aSelectedStopModelItems.includes(oObject)) {
							oList.setSelectedItem(oItem, true);
						}
					});
				}
			},

			adjustStopSequence: function(aModelStops) { // Stopp-sequence anpassen
				let sequenceValues = aModelStops.map(item => item.sequence); // Extrahiere die sequence-Werte der Stopps

				sequenceValues.sort((a, b) => b - a); // Sortiere die sequence-Werte in absteigender Reihenfolge
			
				// Weise die sortierten sequence-Werte den Stopps in der neuen Reihenfolge zu
				aModelStops.forEach((item, index) => {
					item.sequence = sequenceValues[index];
				});
			},

			getStoppSequenceChangeable:function(){ //Erhalten des Wertes für Änderbarkeit der Stoppreihenfolge
				return this.getOwnerComponent().getModel("settings").getProperty("/bStoppSequenceChangeable");
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

			customStopPostitionFragmentOpen:function(){

				this.oCustomStopPostitionFragment ??= this.loadFragment({
					name: "podprojekt.view.fragments.customStopPosition",
				});

				this.oCustomStopPostitionFragment.then((oDialog) => {
					oDialog.open();
				});
			},

			customStopPostitionFragmentClose:function(){
				this.byId("customStopPositionDialog").close();
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
