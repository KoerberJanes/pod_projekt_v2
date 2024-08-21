sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox", "podprojekt/utils/StatusSounds", "podprojekt/utils/HashManager"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, MessageToast, MessageBox, StatusSounds, HashManager) {
		"use strict";

		const REGEX_TOUR_MILEAGE = /^[0-9]{2,}$/; //es sind nur Ziffern erlaubt mit einer Mindestlaenge von 2

		return Controller.extend("podprojekt.controller.Overview", {
			onInit: function () {
				HashManager.init(this.getView());
			},

			onAfterRendering: function () {
				this._oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle(); //Globales Model für die i18n
				this.simulateBackendCallForTours(true);
			},

			getUrlParameters() {
				let oCustomerModel = this.getOwnerComponent().getModel("CustomerModel");
				let sIdEumDev;

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
				let aFilteredTours = this.filterFinishedStops(aRecievedTours);

				oTourModel.setProperty("/results", aFilteredTours);
			},

			filterFinishedStops: function (aRecievedTours) {
				//Beendete oder Abgeschlossene Touren werden gefiltert

				return aRecievedTours.filter((tour) => tour.routeStatus !== "90" && tour.routeStatus !== "70");
			},

			setPressedTour: function (oEvent) {
				//Ausgewählte Tour-Infos in Model für Fragment setzen
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

			onTourStartDialogButtonCallback: function (oEvent) {
				//Callback vom TourStartFrtagment um Buttons zu unterscheiden
				let sButtonId = oEvent.getSource().getId().split("-").pop();

				if (sButtonId === "TourstartFragmentButtonConfirm") {
					//Bestätigen
					this.checkIfInputConstraintsComply();
				}

				if (sButtonId === "TourstartFragmentButtonAbort") {
					//Abbrechen
					this.onCloseTourStartFragment(); //Dialog Schließen
				}
			},

			resetMileageUserInput: function () {
				//Sowohl Model als auch Input leeren
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

			onMileageInputLiveChange: function (oEvent) {
				//Leider notwendig, weil das 'clearIcon' nicht das Model aktualisiert
				let oInput = oEvent.getSource();
				this.handleRequiredField(oInput);
				this.checkInputConstraints(oInput);
			},

			handleRequiredField: function (oInput) {
				//Wenn kein Wert im Inputfeld vorliegt, Rot markieren
				oInput.setValueState(oInput.getValue() ? "None" : "Error");
			},

			checkInputConstraints: function (oInput) {
				//Wenn Wert nicht der Regex entspricht, Rot markieren
				let oBinding = oInput.getBinding("value");
				let sValueState = "None";

				try {
					oBinding.getType().validateValue(oInput.getValue());
				} catch (oException) {
					sValueState = "Error";
				}
				oInput.setValueState(sValueState);
			},

			checkIfInputConstraintsComply: function () {
				//Werteeingabe gegen regex pruefen
				let sTourStartFragmentInput = this.getOwnerComponent().getModel("TourStartFragmentModel").getProperty("/mileage"); // User-Eingabe

				if (REGEX_TOUR_MILEAGE.test(sTourStartFragmentInput)) {
					//Eingabe-Parameter passen
					this.checkIfEnteredValueInRange();
				} else {
					//Eingabe-Parameter passen nicht
					this._showErrorMessageBox("nameNotMatchingRegex", () => this.scrollToInputAfterError());
				}
			},

			checkIfEnteredValueInRange: function () {
				//Pruefen ob Tolleranz eingehalten wurde
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel"); //Ausgewaehlte Tour-Infos
				let iTourStartFragmentInput = oTourStartFragmentModel.getProperty("/mileage"); //User-Eingabe

				let iRespectiveTourMileage = oTourStartFragmentModel.getProperty("/tour/mileage");
				let iRespectiveTourMileageTolerance = oTourStartFragmentModel.getProperty("/tour/mileageTolerance");

				// Berechnung der Toleranzgrenzen
				const iMinRange = iRespectiveTourMileage - iRespectiveTourMileageTolerance;
				const iMaxRange = iRespectiveTourMileage + iRespectiveTourMileageTolerance;

				if (iTourStartFragmentInput >= iMinRange && iTourStartFragmentInput <= iMaxRange) {
					//Eingabe in Tolleranz
					this.setStopInformationModelData();
				} else {
					//Eingabe nicht in Tolleranz
					this._showErrorMessageBox("tolleranceNotAccepted", () => this.scrollToInputAfterError());
				}
				this.resetMileageUserInput(); //Bei akzeptierter Eingabe das Feld leeren
			},

			setStopInformationModelData: function () {
				//Tolleranz eingehalten und Stops der Tour in entsprechendes Model setzen
				let oStopInformationModel = this.getOwnerComponent().getModel("StopModel"); //Stop Model
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
				let aRespectiveTourStops = oTourStartFragmentModel.getProperty("/tour/stops"); //Array an Stops der ausgewaehlten Tour

				oStopInformationModel.setProperty("/results", aRespectiveTourStops); //Setzen der Stops
				this.createDeliveryNotes();
			},

			createDeliveryNotes: function () {
				let oTourStartFragmentModel = this.getOwnerComponent().getModel("TourStartFragmentModel");
				let aRespectiveTourStops = oTourStartFragmentModel.getProperty("/tour/stops"); // Array an Stops der ausgewählten Tour

				aRespectiveTourStops.forEach((stop) => {
					let {orders} = stop;
					let order = orders[0];
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
					};

					// Füge das neue Delivery Note zu den bestehenden hinzu
					order.aDeliveryNotes = [...order.aDeliveryNotes, oNewDeliveryNote];
				});

				this.linkNvesToDeliveryNote(aRespectiveTourStops);
			},

			linkNvesToDeliveryNote: function (aRespectiveTourStops) {
				//NVEs bekommen zusaetzliches Attribut um DeliveryNote zuordnen zu koennen

				aRespectiveTourStops.forEach((stop) => {
					// Extrahiere das Array der ungeordneten NVEs und die zugehörige Sendungsnummer
					let aUnprocessedNves = stop.orders[0].aDeliveryNotes[0].aUnprocessedNumberedDispatchUnits;

					// Setze die Sendungsnummer für alle NVEs
					aUnprocessedNves.forEach((nve) => {
						nve.deliveryNoteShipmentNumber = stop.orders[0].aDeliveryNotes[0].shipmentNumber;
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
				let oInput = this.getView().byId("kilometerInput");
				if (oInput && oInput.getDomRef()) {
					requestAnimationFrame(() => {
						oInput.focus();
					});
				}
			},

			scrollToInputAfterError: function () {
				this.resetMileageUserInput();
				let oInputField = this.getView().byId("kilometerInput");

				oInputField.setValueState("Error");
				requestAnimationFrame(() => {
					// Stelle sicher, dass das DOM bereit ist, bevor du den Fokus setzt
					if (oInputField && oInputField.getDomRef()) {
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

			onCloseTourStartFragment: function () {
				//Tourstart Fragment schließen
				this.resetMileageUserInput();
				this.byId("TourstartDialog").close();
			},

			onNavToActiveTour: function () {
				//Navigation zu den Stops der derzeitgen Tour
				StatusSounds.playBeepSuccess();
				let oRouter = this.getOwnerComponent().getRouter();

				oRouter.navTo("ActiveTour");
			},
		});
	}
);
