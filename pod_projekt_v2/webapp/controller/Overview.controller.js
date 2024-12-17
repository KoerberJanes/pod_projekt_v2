sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "podprojekt/utils/StatusSounds",],
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
				this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle(); //Globales Model für die i18n
				this.simulateBackendCallForTours(true);
			},

			getUrlParameters() {
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel");
				let sIdEumDev;
				let userRole = '';

				// Abfragen der Startup-Parameter, wenn verfügbar
				const startupParams = this.getOwnerComponent().getComponentData()?.startupParameters;
				if (startupParams && startupParams.IdEumDev) {
					sIdEumDev = startupParams.IdEumDev[0];
				} else {
					// URL-Parameter abfragen, falls keine Startup-Parameter verfügbar sind
					sIdEumDev = jQuery.sap.getUriParameters().get("IdEumDev") || "3";
				}

				//Vielleicht noch das Setzen des Namens
				oCustomerModel.setProperty("/driverId", sIdEumDev);
				oCustomerModel.setProperty("/role", userRole);
			},

			simulateBackendCallForTours: function (bTestCase) {
				this.onBusyDialogOpen(); //Dialog oeffnen um Backend-Call abzuwarten.
				//Methoden und Filter können hier erstellt werden.

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

				if (bTestCase) {
					//Success-Fall simulieren
					this.onBusyDialogClose();
					let oTourModel = this.getOwnerComponent().getModel("TourModel"); //Demo Model bereits vorab gefüllt
					let aTourModelItems = oTourModel.getProperty("/results"); //Inhalt für Abfrage benoetigt. Wird später durch das oData Model ersetzt

					let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel");
					let userRole = 'dispo'; //Disponent oder eben nicht
					oCustomerModel.setProperty("/role", userRole);
					this.updateModelBindings("CustomerModel");
					
					if (aTourModelItems.length === 0) {
						//Keine Tour vorhanden
						this._showErrorMessageBox("noToursLoaded", () => {});
					} else {
						this.handleRecievedTours(aTourModelItems);
					}
				} else {
					//Error-Fall simulieren
					this.onBusyDialogClose();
				}
			},

			handleRecievedTours: function (aRecievedTours) {
				//Verarbeiten der erhaltenen Touren
				let oTourModel = this.getOwnerComponent().getModel("TourModel");
				let aFilteredTours = this.getFilteredStops(aRecievedTours);

				oTourModel.setProperty("/results", aFilteredTours);
			},

			getFilteredStops: function (aRecievedTours) { //Tour-Stati werden gefiltert
				
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel");
				let sCustomerRole = oCustomerModel.getProperty(("/role"));

				return sCustomerRole !== 'dispo' ? aRecievedTours.filter((tour) => !["90", "70", "10"].includes(tour.routeStatus)) : aRecievedTours;
			},

			onFilterSearch: function(oEvent) {
				let oFilterBar = this.byId("filterBar");
				let oList = this.byId("tourSelectionList"); // Deine Liste
				let oBinding = oList.getBinding("items"); // Die Bindung der "items"-Aggregation der Liste
			
				let aGroupItems = oFilterBar.getFilterGroupItems();
			
				// Durch alle FilterGroupItems iterieren und das Steuerelement für RouteStatus finden
				let aSelectedRouteStatus = [];
				aGroupItems.forEach(function(oGroupItem) {
					if (oGroupItem.getName() === "RouteStatus") { // Prüfen, ob die Gruppe "RouteStatus" heißt (für den Fall, dass es mehrere geben kann)
						let oControl = oGroupItem.getControl(); // Das Steuerelement (MultiComboBox) für RouteStatus holen
						aSelectedRouteStatus = oControl.getSelectedKeys(); // Gibt ein Array von ausgewählten Schlüsseln zurück
					}
				});
			
				
				if (aSelectedRouteStatus.length > 0) { // Sicherstellen, dass es ausgewählte Werte gibt
					let aFilters = [];
			
					aSelectedRouteStatus.forEach(function(statusKey) {// Für jedes Element in aSelectedRouteStatus einen Filter erstellen
						let oRouteStatusFilter = new sap.ui.model.Filter(// Filter für "routeStatus" erstellen, der mit einem der ausgewählten Status übereinstimmt
							"routeStatus", // Das Feld im TourModel, nach dem gefiltert wird
							sap.ui.model.FilterOperator.EQ, // Der "Equal"-Operator für jedes einzelne Element
							statusKey // Der einzelne Wert
						);
						aFilters.push(oRouteStatusFilter); // Filter zur Filter-Liste hinzufügen
					});

					let oFinalFilter = new sap.ui.model.Filter(aFilters, false); // Kombiniert alle Filter mit "OR"-Verknüpfung
					oBinding.filter(oFinalFilter); // Die Tourenliste wird jetzt nach dem Status gefiltert
				} else{ // Sofern kein Filter ausgewählt wurde, alle Datensätze anzeigen
					oBinding.filter([]); // Leere Filter anwenden, um alle Datensätze anzuzeigen
				}
				this.updateModelBindings("TourModel");
			},

			_applyFilters: function(aTours, oFilterData) { // Beispielhafte Filterlogik anwenden (kann nach Bedarf erweitert werden)
				let aFilteredTours = aTours.filter(function(tour) {
					// Beispiel: Filter auf 'routeStatuses' anwenden
					let status = tour.routeStatus; // Angenommen, die Touren haben ein "routeStatus"-Feld
			
					// Überprüfen, ob der Tour-Status im Filter enthalten ist
					return oFilterData.routeStatuses.some(function(filterStatus) {
						return filterStatus.key === status;
					});
				});
			
				// Die gefilterte Liste der Touren wieder ins Model setzen
				this.getOwnerComponent().getModel("TourModel").setProperty("/results", aFilteredTours);
			},

			onSelectionChange: function(oEvent) {
				let aSelectedItems = oEvent.getSource().getSelectedItems(); // Alle ausgewählten Items in der MultiComboBox
				let aSelectedKeys = aSelectedItems.map(function(item) {
					return item.getKey(); // Alle ausgewählten "key"-Werte holen
				});

				// Zugriff auf das Model
				let oFilterData = this.getOwnerComponent().getModel("filtersModel").getData();

				// Filter auf das Model anwenden
				oFilterData.selectedRouteStatuses = aSelectedKeys; // Eine neue Eigenschaft für die selektierten Filter hinzufügen

				// Filterdaten im Model aktualisieren
				this.getOwnerComponent().getModel("filtersModel").setData(oFilterData);

				// Optional: Touren mit dem neuen Filter anwenden
				// this._applyFilters(aTours, oFilterData);
			},

			onResetFilters: function() {
				// Zugriff auf das Model
				let oFilterData = this.getOwnerComponent().getModel("filtersModel").getData();

				// Zurücksetzen des Filterstatus auf leeren Wert oder Standardwert
				oFilterData.selectedRouteStatuses = [];
			
				// Filterdaten im Model zurücksetzen
				this.getOwnerComponent().getModel("filtersModel").setData(oFilterData);
			
				// Optional: Alle Touren wieder anzeigen, ohne Filter
				// this._applyFilters(aTours, oFilterData);
			},

			setPressedTour: function (oEvent) { //Ausgewählte Tour-Infos in Model für Fragment setzen
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
				let oPressedModelObject = oEvent.getSource().getBindingContext("TourModel").getObject();

				oTourStartFragmentModel.setProperty("/tour", oPressedModelObject);
				this.openTourStartFragment();
			},

			onBusyDialogOpen: async function () {
				//Lade-Dialog oeffnen
				if (!this.oBusyDialog) {
					try {
						// Lade das Fragment, wenn es noch nicht geladen wurde
						this.oBusyDialog = await this.loadFragment({
							name: "podprojekt.view.fragments.BusyDialog",
						});
					} catch (error) {
						// Fehlerbehandlung bei Problemen beim Laden des Fragments
						console.error("Fehler beim Laden des BusyDialogs:", error);
						MessageBox.error(this._oBundle.getText("errorLoadingBusyDialog"));
						return; // Beende die Methode, wenn das Fragment nicht geladen werden konnte
					}
				}

				// Öffne das Dialog, wenn es erfolgreich geladen wurde
				this.oBusyDialog.open();
			},

			onBusyDialogClose: function () {
				//Lade-Dialog schließen
				setTimeout(() => {
					this.byId("BusyDialog").close();
				}, 1000);
			},

			openTourStartFragment: function () {
				//Tourstart Fragment oeffnen
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
				this.getOwnerComponent().getModel("TourStartFragmentModel").setProperty("/mileage", "");
			},

			onMileageInputChange: function (oEvent) {
				//Bei jeder eingabe, wird der Wert des Inputs auch in das Model uebernommen
				//! Impliziter aufruf des Change events findet sonst nicht statt (wurde vor einem Jahr schon festgestellt und ein Ticket bei SAP eroeffnet)
				let oInput = oEvent.getSource();
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
				oTourStartFragmentModel.setProperty("/mileage", oInput.getValue());
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
				let sTourStartFragmentInput = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/mileage"); // User-Eingabe

				if (REGEX_TOUR_MILEAGE.test(sTourStartFragmentInput)) { //Eingabe-Parameter passen
					this.checkIfEnteredValueInRange();
				} else { //Eingabe-Parameter passen nicht
					this._showErrorMessageBox("notMatchingRegex", () => this.scrollToInputAfterError());
				}
			},

			checkIfEnteredValueInRange: function () { //Pruefen ob Tolleranz eingehalten wurde
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel"); //Ausgewaehlte Tour-Infos
				let iTourStartFragmentInput = oTourStartFragmentModel.getProperty("/mileage"); //User-Eingabe
				let iRespectiveTourMileage = oTourStartFragmentModel.getProperty("/tour/mileage"); //Aktuelle Tour-Mileage
				let iRespectiveTourMileageTolerance = oTourStartFragmentModel.getProperty("/tour/mileageTolerance"); //Aktuelle tolleranz für Tour-Mileage

				// Berechnung der Toleranzgrenzen
				const iMinRange = iRespectiveTourMileage - iRespectiveTourMileageTolerance;
				const iMaxRange = iRespectiveTourMileage + iRespectiveTourMileageTolerance;

				if (iTourStartFragmentInput >= iMinRange && iTourStartFragmentInput <= iMaxRange) { //Eingabe in Tolleranz
					this.setStopInformationModelData();
				} else { //Eingabe nicht in Tolleranz
					this._showErrorMessageBox("tolleranceNotAccepted", () => this.scrollToInputAfterError());
				}
				this.resetMileageUserInput(); //Bei akzeptierter Eingabe das Feld leeren
			},

			setStopInformationModelData: function () { //Tolleranz eingehalten und Stops der Tour in entsprechendes Model setzen
				//TODO: Stopreihenfolge absteigend sortieren
				//TODO: Verschieben der Stopps ueber buttons (moeglichst multi-select faehig)
				//TODO: Anzeigen wie viele Stopps selektiert (moeglichst)
				let oStopModel = this.getOwnerComponent().getModel("StopModel"); 
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel"); 
				let aRespectiveTourStops = oTourStartFragmentModel.getProperty("/tour/stops"); //Array an Stops der ausgewaehlten Tour

				let aDescendingStopOrder = this.sortStopsDescending(aRespectiveTourStops);
				oStopModel.setProperty("/results", aDescendingStopOrder); //Setzen der Stops

				if (this.validateDeliveryNotesForStops(aRespectiveTourStops)) { // Prüfung ob DeliveryNotes und NVEs bereits gesetzt wurden
					this.onNavToActiveTour();
				} else {
					this.createDeliveryNotes();
				}
			},

			sortStopsDescending:function(aStops){ // Sortieren der Stopps in absteigender Reihenfolge nach 'sequence'
				return aStops.sort((stopA, stopB) => {
					let sequenceA = stopA.sequence || 0; // Falls 'sequence' fehlt, Standardwert 0
					let sequenceB = stopB.sequence || 0;
					
					return sequenceB - sequenceA; // Absteigend sortieren
				});
			},

			validateDeliveryNotesForStops: function (aRespectiveTourStops) {
				let isValid = true;  // Statusparameter, der die Gültigkeit speichert

    			// Hilfsfunktion, die überprüft, ob ein NVE in einem der Arrays im Lieferschein enthalten ist
				const isNveInNote = (nve, note) => {
					return (
						note.aTempClearedNVEs.includes(nve) ||
						note.aTempLoadedNVEs.includes(nve) ||
						note.aTotalClearedNves.includes(nve) ||
						note.aTotalLoadedNVEs.includes(nve) ||
						note.aUnprocessedNumberedDispatchUnits.includes(nve)
					);
				};

				// Iteriere über alle Tour Stops
				aRespectiveTourStops.forEach((stop) => {
					const orders = stop.orders;

					// Falls keine Bestellungen für den Stop vorhanden sind, sollte ein neuer Lieferschein erstellt werden
					if (!orders || orders.length === 0) {
						isValid = false;
						return;
					}

					// Flag, um zu erkennen, ob für eine Bestellung ein Lieferschein erstellt werden muss
					let shouldCreateNewDeliveryNote = false;

					// Iteriere durch die Orders des Stops
					orders.forEach((order) => {
						const deliveryNotes = order.aDeliveryNotes;
						const newNVEs = order.loadingUnits;

						// Falls keine Lieferscheine existieren, wird ein neuer Lieferschein benötigt
						if (!Array.isArray(deliveryNotes) || deliveryNotes.length === 0) {
							shouldCreateNewDeliveryNote = true;
						} else {
							// Überprüfen, ob alle NVEs im Lieferschein enthalten sind
							const allNVEsCovered = newNVEs.every((nve) =>
								deliveryNotes.some((note) => isNveInNote(nve, note))
							);

							// Falls eine NVE nicht abgedeckt ist, muss ein neuer Lieferschein erstellt werden
							if (!allNVEsCovered) {
								shouldCreateNewDeliveryNote = true;
							}
						}
					});

					// Wenn für einen Stop ein Lieferschein benötigt wird, setzen wir den Status auf false
					if (shouldCreateNewDeliveryNote) {
						isValid = false;
					}
				});

				return isValid;  // Gibt true zurück, wenn alle NVEs abgedeckt sind und kein neuer Lieferschein benötigt wird
			},

			createDeliveryNotes: function () {

				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
				let aRespectiveTourStops = oTourStartFragmentModel.getProperty("/tour/stops"); // Array an Stops der ausgewählten Tour

				aRespectiveTourStops.forEach((stop) => {
					let {orders} = stop;

					// Schleife über alle Bestellungen eines Stops
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
							aTotalClearedNves: [],
							aTempLoadedNVEs: [],
							aTotalLoadedNVEs: [],
							aUnprocessedNumberedDispatchUnits: loadingUnits,
							bRetoure: false //muss geschaut werden woran das festgemacht werden kann
						};

						// Füge den neuen Delivery Note zu den bestehenden hinzu
						order.aDeliveryNotes = [...order.aDeliveryNotes, oNewDeliveryNote];
					});
				});

				this.linkNvesToDeliveryNote(aRespectiveTourStops);
			},

			linkNvesToDeliveryNote: function (aRespectiveTourStops) {//NVEs bekommen zusaetzliches Attribut um DeliveryNote zuordnen zu koennen
				aRespectiveTourStops.forEach((stop) => {
					// Iteriere durch alle Bestellungen des Stops
					stop.orders.forEach((order) => {
						// Extrahiere das Array der ungeordneten NVEs und die zugehörige Sendungsnummer
						let aUnprocessedNves = order.aDeliveryNotes[0].aUnprocessedNumberedDispatchUnits;
			
						// Setze die Sendungsnummer für alle NVEs
						aUnprocessedNves.forEach((nve) => {
							nve.deliveryNoteShipmentNumber = order.aDeliveryNotes[0].shipmentNumber;
						});
					});
				});
				this.onNavToActiveTour();
			},

			_showErrorMessageBox: function (sMessageKey, fnOnClose) {
				StatusSounds.playBeepError();
				MessageBox.error(this._oBundle.getText(sMessageKey), {
					onClose: fnOnClose || function () {}, // Verwende eine leere Funktion, wenn fnOnClose nicht definiert ist
				});
			},

			onDialogAfterOpen: function (oEvent) {
				// Der TourstartDialog ist geöffnet, setze den Fokus
				// Der TourstartDialog ist geöffnet, setze den Fokus
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

			onRefreshTours: function () {
				//Refresh der Touren, bisher ein Dummy
				MessageToast.show(this._oBundle.getText("dummyRefresh"), {
					duration: 1000,
					width: "15em",
				});
				this.simulateBackendCallForTours();
			},

			TourStatisticsDialogOpen:function(){

				this.oTourStatisticsDialog ??= this.loadFragment({
					name: "podprojekt.view.fragments.TourStatistics",
				});

				this.oTourStatisticsDialog.then((oDialog) => {
					this.MapTourStatisticsForDiagram();
					oDialog.open();
				});
			},

			MapTourStatisticsForDiagram:function(){
				const oModel = this.getView().getModel("TourModel");
				const aResults = oModel.getProperty("/results");

				// Status zählen
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

				// Map für Diagrammdaten
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

				oModel.setProperty("/resultsForDiagram", aMappedResults);

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
							isScrollable: false, // Keine Scrollbars, sorgt für gute Formatierung
							title: {
								visible: false //Titel der Legende ausblenden
							}
						},
						interaction: {
							selectability: {
								mode: "SINGLE"  // Nur ein Element kann ausgewählt werden
								//Alternativ gibt es "MULTIPLE", "NONE"
							}
						}
					});

					// Popover verbinden
					const oPopOver = this.byId("idPopOver");
					oPopOver.connect(oVizFrame.getVizUid());
				}

				this.updateModelBindings("TourModel");
			},

			updateModelBindings:function(sModelName){
				this.getOwnerComponent().getModel(sModelName).updateBindings(true);
			},

			TourStatisticsDialogClose:function(){
				this.byId("TourStatisticsDialog").close();
			},

			onVizFrameSelectData: function (oEvent) { //offen fuer weitere FizFrame logik
				let oSelectedItem = oEvent.getParameter("data"); //Das ausgewählte Diagrammelement
			},

			onCloseTourStartFragment: function () {
				//Tourstart Fragment schließen
				this.resetMileageUserInput();
				this.byId("TourstartDialog").close();
			},

			onNavToActiveTour: function () {
				this.updateModelBindings("StopModel");
				//Navigation zu den Stops der derzeitgen Tour
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("ActiveTour");
			},

			onNavToLogin: function () {
				//Navigation zur Login Seite
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("RouteMain");
			},
		});
	}
);
