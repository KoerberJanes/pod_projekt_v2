sap.ui.define(
	["sap/ui/core/mvc/Controller", 
		"sap/m/MessageToast", 
		"sap/m/MessageBox", 
		"podprojekt/utils/StatusSounds"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast, MessageBox, StatusSounds) {
		"use strict";

		const REGEX_TOUR_MILEAGE = /^[0-9]{2,}$/; //es sind nur Ziffern erlaubt mit einer Mindestlaenge von 2

		return Controller.extend("podprojekt.controller.Overview", {
			onInit: function () {
				
			},

			onAfterRendering: function () {
				this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle(); //Globales Model fuer die i18n
				
				this.getUrlParameters();
			},

			getUrlParameters() {
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sIdEumDev;
				let userRoleDispo = 'dispo';
				let userRoleDefault = '';
				let sDriverName = "Test Driver";

				// Abfragen der Startup-Parameter, wenn verfuegbar
				/*const startupParams = this.getOwnerComponent().getComponentData()?.startupParameters;
				if (startupParams && startupParams.IdEumDev) {
					sIdEumDev = startupParams.IdEumDev[0];
				} else {
					// URL-Parameter abfragen, falls keine Startup-Parameter verfuegbar sind
					sIdEumDev = jQuery.sap.getUriParameters().get("IdEumDev") || "3";
				}*/

				oTourAndStopModel.setProperty("/customerInformation/driverId", sIdEumDev);
				//Hier werden Test-Daten verwendet
				oTourAndStopModel.setProperty("/customerInformation/role", userRoleDispo);
				oTourAndStopModel.setProperty("/customerInformation/driverName", sDriverName);

				this.simulateBackendCallForTours(true); //Simulation fuer den Backend-Call nachdem Fahrerdaten gesetzt wurden
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

			simulateBackendCallForTours: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten.
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
					let aRecievedTours=oData.getProperty("/results");

					if(aRecievedTours.length===0){
						this._showErrorMessageBox("noToursLoaded", () => {}); //Fahrer hat keine Touren
					} else{
						this.handleRecievedTours(aRecievedTours); //Setzen der Touren in Model
					}

				},
				error: (oError) => {
					this.busyDialogClose();
					//Bisher keine Funktion
				}
				});
        		*/

				
				setTimeout(() => { //Simulation der response-time
					if (bTestCase) {//Success-Fall simulieren
						let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel"); //Demo Model bereits vorab gefuellt
						let aTourAndStopModelItems = oTourAndStopModel.getProperty("/aAllToursOfDriver"); //Inhalt fuer Abfrage benoetigt. Wird spaeter durch das oData Model ersetzt

						let oConfigModel = this.getOwnerComponent().getModel("ConfigModel");
						let userRole = 'dispo'; //Disponent oder eben nicht
						oConfigModel.setProperty("/customerInformation/role", userRole);
						this.updateModelBindings("ConfigModel");
						
						if (aTourAndStopModelItems.length === 0) {//Keine Tour vorhanden
							this._showErrorMessageBox("noToursLoaded", () => {});
						} else {
							this.handleRecievedTours(aTourAndStopModelItems);
						}
					} else {
						//Error-Fall simulieren
					}
				}, 1000);

			},

			simulateBackendCallForStopps: function (bTestCase) {
				//this.openBusyDialog() //Dialog oeffnen um Backend-Call abzuwarten.
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
					let aRecievedTours=oData.getProperty("/results");
			
					if(aRecievedTours.length===0){
						this._showErrorMessageBox("noToursLoaded", () => {}); //Fahrer hat keine Touren
					} else{
						this.handleRecievedTours(aRecievedTours); //Setzen der Touren in Model
					}
			
				},
				error: (oError) => {
					this.busyDialogClose();
					//Bisher keine Funktion
				}
				});
				*/
			
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						if (bTestCase) {
							//Success-Fall simulieren
							//this.setStopInformationModelData();
							return resolve();
						} else {
							//Error-Fall simulieren
							return reject("Fehler beim erhalten von Stopps");
						}
					}, 1000);
				});
				
			},

			handleRecievedTours: function (aRecievedTours) { //Verarbeiten der erhaltenen Touren
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aFilteredTours = this.getFilteredStops(aRecievedTours);

				oTourAndStopModel.setProperty("/aAllToursOfDriver", aFilteredTours);
				//Muss ind er fertigen App wieder einkommentiert werden
				//this.updateModelBindings("TourAndStopModel");
			},

			getFilteredStops: function (aRecievedTours) { //Zurueckgeben von gefilterten Touren anhand der Tour-Stati
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let sCustomerRole = oTourAndStopModel.getProperty(("/customerInformation/role"));

				return sCustomerRole !== 'dispo' ? aRecievedTours.filter((tour) => !["90", "70", "10"].includes(tour.routeStatus)) : aRecievedTours;
			},

			onFilterSearch: function(oEvent) { //Filtersuche, wenn User die Rolle 'dispo' hat
				let oFilterBar = this.byId("filterBar");
				let oList = this.byId("tourSelectionList"); // Deine Liste
				let oBinding = oList.getBinding("items"); // Die Bindung der "items"-Aggregation der Liste
			
				let aGroupItems = oFilterBar.getFilterGroupItems();
			
				// Durch alle FilterGroupItems iterieren und das Steuerelement fuer RouteStatus finden
				let aSelectedRouteStatus = [];
				aGroupItems.forEach(function(oGroupItem) {
					if (oGroupItem.getName() === "RouteStatus") { // Pruefen, ob die Gruppe "RouteStatus" heißt (fuer den Fall, dass es mehrere geben kann)
						let oControl = oGroupItem.getControl(); // Das Steuerelement (MultiComboBox) fuer RouteStatus holen
						aSelectedRouteStatus = oControl.getSelectedKeys(); // Gibt ein Array von ausgewaehlten Schluesseln zurueck
					}
				});
			
				
				if (aSelectedRouteStatus.length > 0) { // Sicherstellen, dass es ausgewaehlte Werte gibt
					let aFilters = [];
			
					aSelectedRouteStatus.forEach(function(statusKey) {// Fuer jedes Element in aSelectedRouteStatus einen Filter erstellen
						let oRouteStatusFilter = new sap.ui.model.Filter(// Filter fuer "routeStatus" erstellen, der mit einem der ausgewaehlten Status uebereinstimmt
							"routeStatus", // Das Feld im TourAndStopModel, nach dem gefiltert wird
							sap.ui.model.FilterOperator.EQ, // Der "Equal"-Operator fuer jedes einzelne Element
							statusKey // Der einzelne Wert
						);
						aFilters.push(oRouteStatusFilter); // Filter zur Filter-Liste hinzufuegen
					});

					let oFinalFilter = new sap.ui.model.Filter(aFilters, false); // Kombiniert alle Filter mit "OR"-Verknuepfung
					oBinding.filter(oFinalFilter); // Die Tourenliste wird jetzt nach dem Status gefiltert
				} else{ // Sofern kein Filter ausgewaehlt wurde, alle Datensaetze anzeigen
					oBinding.filter([]); // Leere Filter anwenden, um alle Datensaetze anzuzeigen
				}
				this.updateModelBindings("TourAndStopModel");
			},

			_applyFilters: function(aTours, oFilterData) { // Beispielhafte Filterlogik anwenden (kann nach Bedarf erweitert werden)
				let aFilteredTours = aTours.filter(function(tour) {
					// Beispiel: Filter auf 'routeStatuses' anwenden
					let status = tour.routeStatus; // Angenommen, die Touren haben ein "routeStatus"-Feld
			
					// ueberpruefen, ob der Tour-Status im Filter enthalten ist
					return oFilterData.routeStatuses.some(function(filterStatus) {
						return filterStatus.key === status;
					});
				});
			
				// Die gefilterte Liste der Touren wieder ins Model setzen
				this.getOwnerComponent().getModel("TourAndStopModel").setProperty("/aAllToursOfDriver", aFilteredTours);
			},

			onSelectionChange: function(oEvent) { //In der kombobox wurde etwas geaendert
				let aSelectedItems = oEvent.getSource().getSelectedItems(); // Alle ausgewaehlten Items in der MultiComboBox
				let aSelectedKeys = aSelectedItems.map(function(item) {
					return item.getKey(); // Alle ausgewaehlten "key"-Werte holen
				});

				let oFilterData = this.getOwnerComponent().getModel("FiltersModel").getData(); // Zugriff auf das Model
				// Filter auf das Model anwenden
				oFilterData.selectedRouteStatuses = aSelectedKeys; // Eine neue Eigenschaft fuer die selektierten Filter hinzufuegen
				// Filterdaten im Model aktualisieren
				this.getOwnerComponent().getModel("FiltersModel").setData(oFilterData);

				// Optional: Touren mit dem neuen Filter anwenden
				// this._applyFilters(aTours, oFilterData);
			},

			onResetFilters: function() { //Filter zuruecksetzen, bisher nicht verwendet
				let oFilterData = this.getOwnerComponent().getModel("filtersModel").getData();// Zugriff auf das Model

				// Zuruecksetzen des Filterstatus auf leeren Wert oder Standardwert
				oFilterData.selectedRouteStatuses = [];
				// Filterdaten im Model zuruecksetzen
				this.getOwnerComponent().getModel("filtersModel").setData(oFilterData);
			
				// Optional: Alle Touren wieder anzeigen, ohne Filter
				// this._applyFilters(aTours, oFilterData);
			},

			setPressedTour: function (oEvent) { //Ausgewaehlte Tour-Infos in Model fuer Fragment setzen
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let oPressedModelObject = oEvent.getSource().getBindingContext("TourAndStopModel").getObject();

				oTourAndStopModel.setProperty("/oCurrentTour", oPressedModelObject);
				this.openTourStartFragment();
			},

			openTourStartFragment: function () { //Tourstart Fragment oeffnen
				this.oTourstartDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.Tourstart",
				});

				this.oTourstartDialog.then((oDialog) => {
					oDialog.open();
				});
			},

			onTourStartDialogButtonAccept:function(oEvent){ //Fuer weitere Logik
				this.checkIfInputConstraintsComply();
			},

			onTourStartDialogButtonReject:function(oEvent){ //Fuer weitere Logik
				this.onCloseTourStartFragment();
			},

			resetMileageUserInput: function () { //Sowohl Model als auch Inputfeld leeren
				this.getView().byId("kilometerInput").setValue("");
				this.getOwnerComponent().getModel("TourAndStopModel").setProperty("/oTourStartUserInput/sMileage", "");
			},

			onMileageInputChange: function (oEvent) { //Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet, ergebnis steht aus)
				let oInput = oEvent.getSource();
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				oTourAndStopModel.setProperty("/oTourStartUserInput/sMileage", oInput.getValue());
			},

			onMileageInputLiveChange: function (oEvent) { //Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
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

			checkIfInputConstraintsComply: function () { //Werteeingabe gegen regex pruefen
				let sTourStartFragmentInput = this.getUserTourDistanceInput(); // User-Eingabe

				if (REGEX_TOUR_MILEAGE.test(sTourStartFragmentInput)) { //Eingabe-Parameter passen
					this.checkIfEnteredValueInRange();
				} else { //Eingabe-Parameter passen nicht
					this._showErrorMessageBox("notMatchingRegex", () => this.scrollToInputAfterError());
				}
			},

			getUserTourDistanceInput:function(){ //Zurueckgeben des Userinputs fuer die Kilometerzahl des Tourstart-Fragments
				let iTourStartFragmentInput = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oTourStartUserInput/sMileage"); //User-Eingabe

				return iTourStartFragmentInput;
			},

			getTourTolerance:function(){ //Zurueckgeben der Tolleranz einer Tour
				let iRespectiveTourMileageTolerance = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/mileageTolerance"); //Aktuelle tolleranz fuer Tour-Mileage

				return iRespectiveTourMileageTolerance;
			},

			getCurrentTourMileage:function(){ //Zurueckgeben der aktuellen Kilometerzahl der Tour
				let iRespectiveTourMileageTolerance = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/mileage"); //Aktuelle tolleranz fuer Tour-Mileage

				return iRespectiveTourMileageTolerance;
			},

			checkIfEnteredValueInRange: function () { //Pruefen ob Tolleranz eingehalten wurde
				let iTourStartFragmentInput = this.getUserTourDistanceInput(); //User-Eingabe
				let iRespectiveTourMileage = this.getCurrentTourMileage(); //Aktuelle Tour-Mileage
				let iRespectiveTourMileageTolerance = this.getTourTolerance(); //Aktuelle tolleranz fuer Tour-Mileage

				// Berechnung der Toleranzgrenzen
				const iMinRange = iRespectiveTourMileage - iRespectiveTourMileageTolerance;
				const iMaxRange = iRespectiveTourMileage + iRespectiveTourMileageTolerance;

				if (iTourStartFragmentInput >= iMinRange && iTourStartFragmentInput <= iMaxRange) { //Eingabe in Tolleranz
					this.openBusyDialog();
					let aPromises = [];

					aPromises.push(this.simulateBackendCallForStopps(true)); //Simulation vom erhalten der Stopps

					Promise.all(aPromises)
					.then(() => { //Wenn alle Versprechen eingehalten werden
						this.closeBusyDialog();
						this.setStopInformationModelData(); 
					})
					.catch((error) => {
						this.closeBusyDialog();
						console.error("Error during backend calls:",error);
					});
				} else { //Eingabe nicht in Tolleranz
					this._showErrorMessageBox("tolleranceNotAccepted", () => this.scrollToInputAfterError());
				}
				this.resetMileageUserInput(); //Bei akzeptierter Eingabe das Feld leeren
			},

			getTourstartStops:function(){ //Zurueckgeben der Stopps der Tour
				let aRespectiveTourStops = this.getOwnerComponent().getModel("TourAndStopModel").getProperty("/oCurrentTour/stops"); //Array an Stops der ausgewaehlten Tour

				return aRespectiveTourStops;
			},

			setStopInformationModelData: function () { //Tolleranz eingehalten und Stops der Tour in entsprechendes Model setzen
				//TODO: Anzeigen wie viele Stopps selektiert (moeglichst)
				let oTourAndStopModel = this.getOwnerComponent().getModel("TourAndStopModel");
				let aRespectiveTourStops = this.getTourstartStops(); //Array an Stops der ausgewaehlten Tour

				let aDescendingStopOrder = this.sortStopsDescending(aRespectiveTourStops);
				oTourAndStopModel.setProperty("/oCurrentTour/stops", aDescendingStopOrder); //Setzen der Stops

				if (this.validateDeliveryNotesForStops(aRespectiveTourStops)) { // Pruefung ob DeliveryNotes und NVEs bereits gesetzt wurden
					this.onNavToActiveTour();
				} else {
					this.createDeliveryNotes();
				}
			},

			sortStopsDescending:function(aStops){ //Sortieren und zurueckgeben der Stopps in absteigender Reihenfolge nach 'sequence'
				return aStops.sort((stopA, stopB) => {
					let sequenceA = stopA.sequence || 0; // Falls 'sequence' fehlt, Standardwert 0
					let sequenceB = stopB.sequence || 0;
					
					return sequenceB - sequenceA; // Absteigend sortieren
				});
			},

			validateDeliveryNotesForStops: function (aRespectiveTourStops) { //Prueft ob ein lieferschein erstellt werden muss oder ob schon einer existiert
				//!Kann ggf. durch den erhalt eines Lieferscheins aus dem Backend komplett abgeloest werden bzw. einfahc nur notwendige NVEs hinzugefuegt werden
				let isValid = true;  // Statusparameter, der die Gueltigkeit speichert

    			// Hilfsfunktion, die ueberprueft, ob ein NVE in einem der Arrays im Lieferschein enthalten ist
				const isNveInNote = (nve, note) => {
					return (
						note.aTempClearedNVEs.includes(nve) ||
						note.aTempLoadedNVEs.includes(nve) ||
						note.aTotalClearedNVEs.includes(nve) ||
						note.aTotalLoadedNVEs.includes(nve) ||
						note.aUnprocessedNumberedDispatchUnits.includes(nve)
					);
				};

				// Iteriere ueber alle Tour Stops
				aRespectiveTourStops.forEach((stop) => {
					const orders = stop.orders;

					// Falls keine Bestellungen fuer den Stop vorhanden sind, sollte ein neuer Lieferschein erstellt werden
					if (!orders || orders.length === 0) {
						isValid = false;
						return;
					}

					// Flag, um zu erkennen, ob fuer eine Bestellung ein Lieferschein erstellt werden muss
					let shouldCreateNewDeliveryNote = false;

					// Iteriere durch die Orders des Stops
					orders.forEach((order) => {
						const deliveryNotes = order.aDeliveryNotes;
						const newNVEs = order.loadingUnits;

						// Falls keine Lieferscheine existieren, wird ein neuer Lieferschein benoetigt
						if (!Array.isArray(deliveryNotes) || deliveryNotes.length === 0) {
							shouldCreateNewDeliveryNote = true;
						} else {
							// ueberpruefen, ob alle NVEs im Lieferschein enthalten sind
							const allNVEsCovered = newNVEs.every((nve) =>
								deliveryNotes.some((note) => isNveInNote(nve, note))
							);

							// Falls eine NVE nicht abgedeckt ist, muss ein neuer Lieferschein erstellt werden
							if (!allNVEsCovered) {
								shouldCreateNewDeliveryNote = true;
							}
						}
					});

					// Wenn fuer einen Stop ein Lieferschein benoetigt wird, setzen wir den Status auf false
					if (shouldCreateNewDeliveryNote) {
						isValid = false;
					}
				});

				return isValid;  // Gibt true zurueck, wenn alle NVEs abgedeckt sind und kein neuer Lieferschein benoetigt wird
			},

			createDeliveryNotes: function () { //Erstellen eines Lieferscheins mit den zugehoerigen Nves
				let aRespectiveTourStops = this.getTourstartStops(); // Array an Stops der ausgewaehlten Tour

				aRespectiveTourStops.forEach((stop) => {
					let {orders} = stop;

					// Schleife ueber alle Bestellungen eines Stops
					orders.forEach((order) => {
						let {shipmentNumber, shipmentCondition, shipmentConditionCaption, loadingUnits, aDeliveryNotes} = order;

						if (!Array.isArray(order.aDeliveryNotes)) {
							order.aDeliveryNotes = [];
						}

						let oNewDeliveryNote = {
							shipmentNumber,
							shipmentCondition,
							shipmentConditionCaption,
							aTempClearedNVEs: [],
							aTotalClearedNVEs: [],
							aTempLoadedNVEs: [],
							aTotalLoadedNVEs: [],
							aUnprocessedNumberedDispatchUnits: loadingUnits,
							bRetoure: false //muss geschaut werden woran das festgemacht werden kann
						};

						// Fuege den neuen Delivery Note zu den bestehenden hinzu
						order.aDeliveryNotes = [...order.aDeliveryNotes, oNewDeliveryNote];
					});
				});

				this.linkNvesToDeliveryNote(aRespectiveTourStops);
			},

			linkNvesToDeliveryNote: function (aRespectiveTourStops) {//NVEs bekommen zusaetzliches Attribut um DeliveryNote zuordnen zu koennen
				aRespectiveTourStops.forEach((stop) => {
					// Iteriere durch alle Bestellungen des Stops
					stop.orders.forEach((order) => {
						// Extrahiere das Array der ungeordneten NVEs und die zugehoerige Sendungsnummer
						let aUnprocessedNves = order.aDeliveryNotes[0].aUnprocessedNumberedDispatchUnits;
			
						// Setze die Sendungsnummer fuer alle NVEs
						aUnprocessedNves.forEach((nve) => {
							nve.deliveryNoteShipmentNumber = order.aDeliveryNotes[0].shipmentNumber;
						});
					});
				});
				this.onNavToActiveTour();
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) { //Generische Loesung fuer Fehlermeldungen
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			onDialogAfterOpen: function (oEvent) {
				const oInput = this.getView()?.byId("kilometerInput");

				if (oInput?.getDomRef()) {
					requestAnimationFrame(() => oInput.focus());
				}
			},

			scrollToInputAfterError: function () {
				this.resetMileageUserInput();
				const oInputField = this.getView()?.byId("kilometerInput");

				oInputField?.setValueState("Error");

				requestAnimationFrame(() => {
					// Stelle sicher, dass das DOM bereit ist, bevor du den Fokus setzt
					if (oInputField?.getDomRef()) {
						oInputField.focus();
					}
				});
			},

			onRefreshTours: function () {//Refresh der Touren, bisher ein Dummy
				//Abfragen der Touren aus dem Backen muesste das abloesen
				MessageToast.show(this._oBundle.getText("dummyRefresh"), {
					duration: 1000,
					width: "15em",
				});
				this.simulateBackendCallForTours();
			},

			TourStatisticsDialogOpen:function(){ //Uebersicht der verschiedenen Stati von Touren des Users

				this.oTourStatisticsDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.TourStatistics",
				});

				this.oTourStatisticsDialog.then((oDialog) => {
					this.MapTourStatisticsForDiagram();
					oDialog.open();
				});
			},

			MapTourStatisticsForDiagram:function(){ //Mapping des Namens und der Farben fuer die Touren des Users 
				const oTourAndStopModel = this.getView().getModel("TourAndStopModel");
				const aResults = oTourAndStopModel.getProperty("/aAllToursOfDriver");

				// Status zaehlen
				const oStatusCount = {};
				aResults.forEach(oResult => {
					const sStatus = oResult.routeStatus;
					oStatusCount[sStatus] = (oStatusCount[sStatus] || 0) + 1;
				});

				// Farbzuordnung: Status -> Farbe
				const oColorMapping = {
					"10": "#6dbd73", // Freigegeben
					"50": "#e57373", // Beladen
					"70": "#5aaafa", // Beendet
					"90": "#6dbd73"  // Abgeschlossen
				};

				// Map fuer Diagrammdaten
				const aMappedResults = Object.entries(oStatusCount).map(([sStatus, iCount]) => {
					let sStatusLabel, sColor;
					switch (sStatus) {
						case "10":
							sStatusLabel = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invoiceStatusApproved");
							break;
						case "50":
							sStatusLabel = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invoiceStatusLoaded");
							break;
						case "70":
							sStatusLabel = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invoiceStatusFinished");
							break;
						case "90":
							sStatusLabel = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invoiceStatusCompleted");
							break;
						default:
							sStatusLabel = "Unbekannt";
					}
					sColor = oColorMapping[sStatus]; // Farbe aus Mapping holen
					return {
						routeStatusLabel: sStatusLabel,
						Anzahl: iCount,
						Farbe: sColor
					};
				});

				oTourAndStopModel.setProperty("/resultsForDiagram", aMappedResults);

				// Farben setzen im VizFrame
				const aColors = aMappedResults.map(item => item.Farbe);
				const oVizFrame = this.byId("idVizFrame");
				if (oVizFrame) {
					oVizFrame.setVizProperties({
						title: {
							visible: false  // Titel des Diagramms ausblenden
						},
						plotArea: {
							colorPalette: aColors,
							dataLabel: {
								visible: true
							}
						},
						legend: {
							visible: true,
							isScrollable: false, // Keine Scrollbars, sorgt fuer gute Formatierung
							title: {
								visible: false //Titel der Legende ausblenden
							}
						},
						interaction: {
							selectability: {
								mode: "SINGLE"  // Nur ein Element kann ausgewaehlt werden
								//Alternativ gibt es "MULTIPLE", "NONE"
							}
						}
					});

					// Popover verbinden
					const oPopOver = this.byId("idPopOver");
					oPopOver.connect(oVizFrame.getVizUid());
				}

				this.updateModelBindings("TourAndStopModel");
			},

			updateModelBindings:function(sModelName){ //Update des Models in allen Views
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			TourStatisticsDialogClose:function(){ //Tourstatistics Fragment schließen
				this.byId("TourStatisticsDialog").close();
			},

			onVizFrameSelectData: function (oEvent) { //offen fuer weitere FizFrame logik
				let oSelectedItem = oEvent.getParameter("data"); //Das ausgewaehlte Diagrammelement
			},

			onCloseTourStartFragment: function () { //Tourstart Fragment schließen
				this.resetMileageUserInput();
				this.byId("TourstartDialog").close();
			},

			onNavToActiveTour: function () { //Navigation zu den Stops der derzeitgen Tour
				this.updateModelBindings("TourAndStopModel");
				
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("ActiveTour");
			},

			onNavToLogin: function () { //Navigation zur Login Seite
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("RouteMain");
			},
		});
	}
);
