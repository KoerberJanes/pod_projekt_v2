sap.ui.define(
	["sap/ui/core/mvc/Controller", 
	"sap/m/MessageBox", 
	"podprojekt/utils/StatusSounds",
	"sap/m/MessageToast",
	"sap/gantt/def/gradient/Stop",],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageBox, StatusSounds, MessageToast) {
		"use strict";

		const STOP_STATUS_PROCESSED = "70"; // Konstanten fuer Statuscodes
		const REGEX_CUSTOM_POSITION = /^[0-9]+$/; //Es sind nur Ziffern erlaubt mit einer Mindestlaenge von 1

		return Controller.extend("podprojekt.controller.ActiveTour", {
			onInit: function () {},

			onAfterRendering: function () {
				this._oBundle = this.getView().getModel("i18n").getResourceBundle();				
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			simulateBackendCallForStoppOrderChange: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten ggf. nicht notwendig, da nur gesendet wird
				//Methoden und Filter koennen hier erstellt werden.
			
				let sPath = "/ABAP_FUNKTIONSBAUSTEIN"; //Pfad zu OData-EntitySet
				let oODataModel = this.getOwnerComponent().getModel("ABC"); //O-Data Model aus der View
				//let oFilter1 = new Filter(); //Filter Attribut 1
				//let oFilter2 = new Filter(); //Filter Attribut 2
				//let oFilter3 = new Filter(); //Filter Attribut 3
				//let aFilters = [oFilter1, oFilter2, oFilter3]; //Array an Filtern, die an das Backend uebergeben werden
			
				/*
				oODataModel.read(sPath, {
				filters: aFilters,
			
				success: (oData) => {
					this.busyDialogClose();
					StatusSounds.playBeepSuccess();
					
				},
				error: (oError) => {
					this.busyDialogClose();
					//Bisher keine Funktion
				}
				});
				*/

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						//this.closeBusyDialog();
						if (bTestCase) { //Success-Fall simulieren
							return resolve();
						} else { //Error-Fall simulieren
							return reject("Fehler beim absenden der Soppreihenfolge.");
						}
					}, 1000);
				});
				
			},

			simulateBackendCallToGetNVEs: function (bTestCase, oPressedModelObject) {
				//Methoden und Filter koennen hier erstellt werden.
			
				let sPath = "/ABAP_FUNKTIONSBAUSTEIN"; //Pfad zu OData-EntitySet
				let oODataModel = this.getOwnerComponent().getModel("ABC"); //O-Data Model aus der View
				//let oFilter1 = new Filter(); //Filter Attribut 1
				//let oFilter2 = new Filter(); //Filter Attribut 2
				//let oFilter3 = new Filter(); //Filter Attribut 3
				//let aFilters = [oFilter1, oFilter2, oFilter3]; //Array an Filtern, die an das Backend uebergeben werden
			
				/*
				oODataModel.read(sPath, {
				filters: aFilters,
			
				success: (oData) => {
					this.busyDialogClose();
					StatusSounds.playBeepSuccess();
					
				},
				error: (oError) => {
					this.busyDialogClose();
					//Bisher keine Funktion
				}
				});
				*/
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						if (bTestCase) { //Success-Fall simulieren
							return resolve();
						} else { //Error-Fall simulieren
							return reject("Fehler beim erhalten von NVEs.");
						}
					}, 1000);
				});
			},

			onCustomPositionInputChange: function (oEvent) {
				//Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oTourAndStopModel.setProperty("/oStop/sCustomPosition", oInput.getValue());
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

			onCheckIfStopOrderChangeableForButtons:function(oEvent){ //Pruefen ob Stoppreihenfolge veraendert werden darf
				let oPressedEventId = oEvent.getSource().getId().split("-").pop();

				if(this.getStoppSequenceChangeable()){
					this.checkIfNvesAreProcessed(oPressedEventId);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("stopOrderNotChangeable"), () => {});
				}
			},

			getModelStops:function(){ //Gibt Array der Stops zurueck
				let aStops = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/stops");

				return aStops;
			},

			getIfNvesAreUnprocessed:function(){ //Gibt boolschen Wertes ob NVEs unberarbeitet sind zurueck
				let bNvesAreUnprocessed = true;
				let aStops = this.getModelStops();

				// Pruefen, ob alle NVEs verarbeitet wurden
				bNvesAreUnprocessed = aStops.every(stop => //geht jeden Stopp durch
					stop.orders?.every(order => //geh jede order durch
						order.aDeliveryNotes?.every(deliveryNote => //geh jede deliveryNote durch
							deliveryNote.aTempLoadedNVEs.length === 0 &&
							deliveryNote.aTotalLoadedNVEs.length === 0
						)
					)
				); //Solange bis bedingung nicht mehr zutrifft oder alles getestet wurde

				return bNvesAreUnprocessed;
			},

			checkIfNvesAreProcessed:function(oPressedEventId){ //Pruefen ob bisher keine NVE verladen wurde

				if(this.getIfNvesAreUnprocessed()){ //pruefen ob Reihenfolge veraendert werden darf
					this.checkIfOrderReverseBtnIsPressed(oPressedEventId);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("stopNvesAreProcessed"), () => {});
				}
			},

			checkIfOrderReverseBtnIsPressed:function(oPressedEventId){ //Abfangen ob es sich um einen spezial-Button handelt
				if(oPressedEventId === "btnReverse"){ //Wenn ja, spezielle Methode aufrufen
					this.differanciateStopOrderChangeEvents(oPressedEventId, []);
				} else{ //Wenn nicht, dann standard-Button unterscheiden
					this.checkIfNvesAreSelected(oPressedEventId);
				}
			},

			checkIfNvesAreSelected:function(oPressedEventId){ //Fuer standard-Button muessen Stops ausgewaehlt sein
				let aSelectedStopModelItems = this.getSelectedStops();

				if(aSelectedStopModelItems.length > 0){ //Wenn Stopps ausgewaehlt pruefen ob spezial-Button verwendet wurde
					this.checkIfCustomOrderButton(oPressedEventId, aSelectedStopModelItems);
				} else{
					this._showErrorMessageBox(this._oBundle.getText("noStopsSelected"), () => {});
				}
			},

			checkIfCustomOrderButton:function(oPressedEventId, aSelectedStopModelItems){ //Abfangen ob es sich um einen spezial-Button handelt
				if(oPressedEventId === "btnCustomOrder"){ //Spezial-Button
					this.customStopPostitionFragmentOpen();
				} else{ //Standard-Button
					this.differanciateStopOrderChangeEvents(oPressedEventId, aSelectedStopModelItems);
				}
			},

			getSelectedStops:function(){ //Erhalten der Selektierten Stopps und Mapping auf Model
				let aSelectedItems = this.getView().byId("stopSelectionList").getSelectedItems();

				let aSelectedStopModelItems = aSelectedItems.map(oItem => {
					let oContext = oItem.getBindingContext("TourAndStopModel");
					return oContext ? oContext.getObject() : null;
				}).filter(oData => oData !== null);

				return aSelectedStopModelItems;
			},

			onCustomStopPositionAccept:function(){ //Custom-Position wurde aus Dialog bestaetigt
				this.checkIfInputConstraintsComply();
			},

			checkIfInputConstraintsComply: function () { //Werteeingabe gegen regex pruefen
				let sCustomPositionInput = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oStop/sCustomPosition"); // User-Eingabe

				if (REGEX_CUSTOM_POSITION.test(sCustomPositionInput)) { //Eingabe-Parameter passen
					this.checkIfEnteredValueInRange();
				} else { //Eingabe-Parameter passen nicht
					this._showErrorMessageBox("notMatchingRegex", () => {});
				}
			},

			checkIfEnteredValueInRange:function(){ //Pruefen ob Custom-Position innerhab des Stop-Intervals ist
				let aStops = this.getModelStops();
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sCustomPosition = oTourAndStopModel.getProperty("/oStop/sCustomPosition");
				let iCustomPosition = parseInt(sCustomPosition);
				let iMaxSequenceNumber = this.getMaxSequence(aStops);
				let iMinSequenceNumber = this.getMinSequence(aStops);

				if(iCustomPosition <= iMaxSequenceNumber && iCustomPosition >= iMinSequenceNumber){ //Nummer ist im Intervall
					this.moveSelectedStopsToCustomPosition(iCustomPosition);
				} else{ //Nummer ist nicht im Intervall
					this._showErrorMessageBox("notMatchingRegex", () => this._setFocus());
				}
			},

			moveSelectedStopsToCustomPosition:function(iCustomPosition){ //Aufbauen der neuen Stoppreihenfolge, selektierung und aktualisierung der Models
				let aSelectedStopModelItems = this.getSelectedStops();
    			let aStops = this.getModelStops();

				// Alle ausgewaehlten Items aus der aktuellen Liste entfernen
				aSelectedStopModelItems.forEach(item => {
					let index = aStops.indexOf(item);
					if (index > -1) {
						aStops.splice(index, 1); // Entfernen des Items aus der Liste
					}
				});

				// Neue position ermitteln
				//let iValidPosition = aStops.findIndex(stop => stop.sequence <= iCustomPosition);
				let iValidPosition = this.calculateInsertPosition(iCustomPosition, aStops, aSelectedStopModelItems);
				aStops.splice(iValidPosition, 0, ...aSelectedStopModelItems); // Items an der benutzerdefinierten Position einfuegen

				this.adjustStopSequence(aStops);// Stoppreihenfolge Nummern anpassen
				this.setStopOrderChangedToTrue();
				this.updateModelBindings("TourAndStopModel"); // Model-Bindings aktualisieren, um die UI zu synchronisieren
				this.selectSameItemsAgain(aSelectedStopModelItems); // Die gleichen Items erneut selektieren
				this.customStopPostitionFragmentClose(); //Schliessen des Dialoges
			},

			calculateInsertPosition: function (iCustomPosition, aStops, aSelectedStopModelItems) { //Berechnung der neuen Position anhand der Stopp-Position aus dem Dialog und delektierter Stopps
				// Kombiniere aStops und aSelectedStopModelItems, um vollständige Liste zu erhalten
				let aAllStops = [...aStops, ...aSelectedStopModelItems];

				// Sortiere Liste absteigend nach 'sequence'
				let sortedStops = aAllStops.sort((a, b) => b.sequence - a.sequence);
				let minSequence = Math.min(...sortedStops.map(stop => stop.sequence));
			
				// Ermittle die Position in der sortierten Liste, falls iCustomPosition nicht kleiner als minSequence ist
				let targetIndexInSortedStops = iCustomPosition <= minSequence ? -1 : sortedStops.findIndex(stop => stop.sequence <= iCustomPosition);
			
				// Hole den Zielstop aus sortedStops, um die Position zu bestimmen
				let targetStop = sortedStops[targetIndexInSortedStops]; //-1 ist kein Fehler, sonder der Indikator fuer den fallback-Fall
			
				// Um die Position zu finden, aStops mit der Position in aAllStops abgleichen
				let targetIndexInAStops = aAllStops.findIndex(stop => stop.sequence === targetStop?.sequence);

				return targetIndexInAStops === -1 ? aStops.length : targetIndexInAStops;
			},

			_setFocus:function(){ //Fokus fuer Custom-Position
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
				return this.getOwnerComponent().getModel("oTourAndStopModel").getProperty("/position");
			},

			onCustomStopPositionReject:function(){ //Abbrechen auf dem Custom-Stop-Position Dialog gedrueckt
				this.customStopPostitionFragmentClose();
			},

			differanciateStopOrderChangeEvents:function(oPressedEventId, aSelectedStopModelItems){ //Faelle fuer die Standard-Buttons
				let aStops = this.getModelStops();

				switch (oPressedEventId) {
					case "bUp": // Elemente eins nach oben verschieben
						aSelectedStopModelItems.forEach(item => {
							let index = aStops.indexOf(item);
							if (index > 0 && !aSelectedStopModelItems.includes(aStops[index - 1])) {
								[aStops[index - 1], aStops[index]] = [aStops[index], aStops[index - 1]];
							}
						});
						
						break;
					case "bDown": // Elemente eins nach unten verschieben
						for (let i = aSelectedStopModelItems.length - 1; i >= 0; i--) {
							let item = aSelectedStopModelItems[i];
							let index = aStops.indexOf(item);
							if (index < aStops.length - 1 && !aSelectedStopModelItems.includes(aStops[index + 1])) {
								[aStops[index], aStops[index + 1]] = [aStops[index + 1], aStops[index]];
							}
						}

						break;
					case "bStart": // Hinzufuegen der Elemente (erste Position)
						aSelectedStopModelItems.forEach(item => {
							let index = aStops.indexOf(item);
							if (index > -1) {
								aStops.splice(index, 1); // Item entfernen
							}
						});
						// Hinzufuegen der Elemente in richtiger Reihenfolge
    					aStops.unshift(...aSelectedStopModelItems);
						
						break;
					case "bEnd": // Elemente an das Ende schieben (letzte Position)
						for (let i = aSelectedStopModelItems.length - 1; i >= 0; i--) {
							let item = aSelectedStopModelItems[i];
							let index = aStops.indexOf(item);
							if (index > -1) {
								aStops.splice(index, 1); // Item entfernen
							}
						}
						// Hinzufuegen der Elemente in richtiger Reihenfolge
    					aStops.push(...aSelectedStopModelItems);

						break;
					case "btnReverse": // Listenreihenfolge umdrehen
						aStops.reverse();
						break;
				
					default:
						break;
				}

				this.setStopOrderChangedToTrue(); //Flag setzen, dass Reihenfolge im Backend geaendert wurde
				this.adjustStopSequence(aStops); // Stoppreihenfolge Nummern werden angepasst
				// Update bevor neu selektiert werden soll
				this.updateModelBindings("TourAndStopModel");
				this.selectSameItemsAgain(aSelectedStopModelItems);
			},

			selectSameItemsAgain:function(aSelectedStopModelItems){// Erneute Auswahl der Elemente basierend auf den verschobenen Objekten
				let oList = this.byId("stopSelectionList"); // Die ID der Liste

				if (oList && oList.getItems()) {
					oList.removeSelections(true); // Vorherige Selektionen loeschen
					oList.getItems().forEach(oItem => {
						let oContext = oItem.getBindingContext("TourAndStopModel");
						let oObject = oContext.getObject();
			
						if (aSelectedStopModelItems.includes(oObject)) {
							oList.setSelectedItem(oItem, true);
						}
					});
				}
			},

			adjustStopSequence: function(aStops) { // Stopp-sequence Attribut neu zuweisen
				let sequenceValues = aStops.map(item => item.sequence); // Extrahiere die sequence-Werte der Stopps

				sequenceValues.sort((a, b) => b - a); // Sortiere die sequence-Werte in absteigender Reihenfolge
				// Weise die sortierten sequence-Werte den Stopps in der neuen Reihenfolge zu
				aStops.forEach((item, index) => {
					item.sequence = sequenceValues[index];
				});
			},

			getStoppSequenceChangeable:function(){ //Erhalten des Wertes fuer Aenderbarkeit der Stoppreihenfolge
				let bStopSequenceChangeable = this.getOwnerComponent().getModel("ConfigModel").getProperty("/generalSettings/bStopSequenceChangeable");
				
				return bStopSequenceChangeable;
			},

			checkIfStoppAlreadyDealtWith: function (oEvent) { //pruefen ob Stopp bereits verarbeitet ist
				//!Statuscodes muessen abgesprochen werden
				let oPressedModelStop = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();
				let iNumberOfUnprocessedNves = oPressedModelStop.orders[0].aDeliveryNotes[0].aUnprocessedNumberedDispatchUnits.length;
				let sStopStatus = oPressedModelStop.stopStatus; //in Kombination mit der Methode: 'setCurrentStopAsFinished'

				if (iNumberOfUnprocessedNves === 0 && sStopStatus === STOP_STATUS_PROCESSED) { //Keine unbearbeiteten NVEs und Stopp hat status erledigt
					this.setPressedStopInformation(oPressedModelStop); //Setzen des Stopps fuer Anzeige
					this.viewerModeFragmentOpen(oPressedModelStop); //Oeffnen des Dialoges fuer den Anzeigemodus
				} else { //Stopp nicht beendet, daher pruefen ob Stoppreihenfolge geupdatet werden muss
					this.checkIfStopOrderChanged(oPressedModelStop);
				}
			},

			setPressedStopInformation:function(oPressedModelStop){ //Setzen der Infos im Viewer-Modus
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let oDeliveryNote = oPressedModelStop.orders[0].aDeliveryNotes[0];

				oTourAndStopModel.setProperty("/oCurrentStop", oPressedModelStop); //setzen des Stops fuer Stopp-Info
				//Setzen der DeliveryNote fuer Anzeige, da ja bereits alles abgehandelt wurde
				oTourAndStopModel.setProperty("/oDeliveryNote/note", oDeliveryNote);
				this.updateModelBindings("TourAndStopModel");
			},

			saveStopOrderChanges:function(){ //Vorbereiten fuer das Update der Reihenfolge am Backend
				this.openBusyDialog();
				let aPromises = [];
				aPromises.push(this.simulateBackendCallForStoppOrderChange(true)); // senden der neuen Stoppreihenfolge an das Backend

				Promise.all(aPromises)
				.then(() => { //Wenn alle Versprechen eingehalten wurden
					this.closeBusyDialog();
					this.setStopOrderChangedToFalse();
				})
				.catch((error) =>{
					this.closeBusyDialog();
					console.error("Error during backend calls:", error);
				});
			},

			getIfStopOrderChanged:function(){ //Gibt Status zurueck ob Reihenfolge geaendert wurde
				let bStopOrderChanged = this.getOwnerComponent().getModel("ConfigModel").getProperty("/generalSettings/bStopOrderChanged");

				return bStopOrderChanged;
			},

			checkIfStopOrderChanged:function(oPressedModelStop){ //Objekt muss fuer NVEs mitgegeben werden
				let bStopOrderChanged = this.getIfStopOrderChanged();

				if(bStopOrderChanged){ //reihenfolge wurde geaendert
					this.showStopOrderChangedMessage(oPressedModelStop);
				} else{ //Stoppreihenfolge wurde nicht geaendert, vorbereiten fuer Update am Backend
					this.prepareUpdateForStopOrder(oPressedModelStop);
				}
			},

			prepareUpdateForStopOrder:function(oPressedModelStop){
				this.openBusyDialog();
				let aPromises = [];

				aPromises.push(this.simulateBackendCallForStoppOrderChange(true)); // senden der neuen Stoppreihenfolge an das Backend
				aPromises.push(this.simulateBackendCallToGetNVEs(true, oPressedModelStop));

				Promise.all(aPromises)
				.then(() => { //Wenn alle Versprechen eingehalten wurden
					this.closeBusyDialog();
					this.onSetStoppInformation(oPressedModelStop);
					this.setStopOrderChangedToFalse();
				})
				.catch((error) =>{
					this.closeBusyDialog();
					console.error("Error during backend calls:", error);
				});
			},

			showStopOrderChangedMessage:function(oPressedModelStop){ //Reihenfolge geaendert Popup vorbereiten
				MessageBox.show(this._oBundle.getText("saveChangedStopOrder"), {
					icon: MessageBox.Icon.INFORMATION,
					title: this._oBundle.getText("changedStopOrder"),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: (oAction) => {
						if (oAction === "YES") { //User bestaetigt Update am Backend
							this.prepareUpdateForStopOrder(oPressedModelStop);
						} else { //Abbrechen
							//NOP
						}
					},
				});
			},

			onSetStoppInformation: function (oPressedModelObject) { //Setzen des Stopps fuer weitere Verarbeitung
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");

				oTourAndStopModel.setProperty("/oCurrentStop", oPressedModelObject);
				this.createLoadingUnitsDetailedDescription(oPressedModelObject.orders[0]);
				this.updateModelBindings("TourAndStopModel");
			},

			createLoadingUnitsDetailedDescription: function (oPressedModelObjectDetails) { //Anzeige der Nves im Tree wird hier gemacht
				//!Kann bisher nicht durch expressionBindung substituiert werden
				let aLoadingUnits = oPressedModelObjectDetails.loadingUnits;
				//Bennenung beier Texte mit dem gleichen Attributnamen in verschiedener Tiefe sorgt fuer korrekte Anzeige im Tree
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

			emptyCustomInputPosition:function(){ //Custom position Feld wird geleert
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oTourAndStopModel.setProperty("/oStop/sCustomPosition", "");
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) { //Generische Loesung fuer alle Fehlermeldungen
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},
			
			onStopDisplayModeAccept:function(){ //User mochte Viewer-Modus anschalten
				this.setUserViewerSettingToTrue();
				this.onNavToStopInformation();
			},

			setUserViewerSettingToTrue:function(){ //Viewer-Modus Attribut auf true Setzen
				let oSettingsModel = this.getOwnerComponent().getModel("ConfigModel");
				oSettingsModel.setProperty("/generalSettings/bViewerMode", true);
			},

			setUserViewerSettingToFalse:function(){ //Viewer-Modus Attribut auf false Setzen
				let oSettingsModel = this.getOwnerComponent().getModel("ConfigModel");
				oSettingsModel.setProperty("/generalSettings/bViewerMode", false);
			},

			setStopOrderChangedToTrue:function(){ //Stoppreihenfolge Attribut auf true Setzen
				let oSettingsModel = this.getOwnerComponent().getModel("ConfigModel");
				oSettingsModel.setProperty("/generalSettings/bStopOrderChanged", true);
			},

			setStopOrderChangedToFalse:function(){ //Stoppreihenfolge Attribut auf false Setzen
				let oSettingsModel = this.getOwnerComponent().getModel("ConfigModel");
				oSettingsModel.setProperty("/generalSettings/bStopOrderChanged", false);
				this.showStopOrderSavingSuccessfullMessage();
			},

			onStopDisplayModeReject:function(){ //User mochte Viewer-Modus nicht anschalten
				this.viewerModeFragmentClose();
			},

			showStopOrderSavingSuccessfullMessage: function () { //Reihenfolge erfolgreich gesichert
				MessageToast.show(this._oBundle.getText("stopOrderChangedSuccessfull"), {
					duration: 1000,
					width: "15em",
				});
			},

			openBusyDialog: async function () {
				//Lade-Dialog oeffnen
				if (!this.oBusyDialog) {
					try { // Lade das Fragment, wenn es noch nicht geladen wurde
						this.oBusyDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.BusyDialog",
						});
					} catch (error) { // Fehlerbehandlung bei Problemen beim Laden des Fragments
						console.error("Fehler beim Laden des BusyDialogs:", error);
						MessageBox.error(this._oBundle.getText("errorLoadingBusyDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// Öffne das Dialog, wenn es erfolgreich geladen wurde
				this.oBusyDialog.open();
			},
			
			closeBusyDialog: function () {
				this.byId("BusyDialog").close();
			},

			viewerModeFragmentOpen:function(){ //Oeffnen des Dialoges fuer den Viewer-Modus
				this.oViewerModeFragment ??= this.loadFragment({
					name: "podprojekt.view.fragments.displayStoppInViewerMode",
				});

				this.oViewerModeFragment.then((oDialog) => {
					oDialog.open();
				});
			},

			viewerModeFragmentClose:function(){ //Schliessen des Viewer-Modus Dialoges
				this.byId("stopDisplayModeDialog").close();
			},

			customStopPostitionFragmentOpen:function(){ //Oeffnen des Dialoges fuer die Custom-Position

				this.oCustomStopPostitionFragment ??= this.loadFragment({
					name: "podprojekt.view.fragments.customStopPosition",
				});

				this.oCustomStopPostitionFragment.then((oDialog) => {
					oDialog.open();
				});
			},

			customStopPostitionFragmentClose:function(){ //Schliessen des Dialoges fuer die Custom-Position
				this.emptyCustomInputPosition();
				this.byId("customStopPositionDialog").close();
			},

			onNavToStopInformation: function () { //Navigation zur StopInformation View
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("StopInformation");
			},

			onNavToOverview: function () { //Navigation zur Overview
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("Overview");
			},
		});
	}
);
