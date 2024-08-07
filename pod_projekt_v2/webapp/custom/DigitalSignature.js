sap.ui.define(
	["sap/ui/core/Control"],
	function (Control) {
		return Control.extend("podprojekt.custom.DigitalSignature", {
			metadata: {
				properties: {
					width: {
						type: "sap.ui.core.CSSSize",
						defaultValue: "auto"
					},
					height: {
						type: "sap.ui.core.CSSSize",
						defaultValue: "auto"
					},
					borderColor: {
						type: "sap.ui.core.CSSColor",
						defaultValue: "#000000"
					},
					borderSize: {
						type: "sap.ui.core.CSSSize",
						defaultValue: "1px"
					},
					borderStyle: {
						type: "string",
						defaultValue: "none" //none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset, initial, inherit
					},
					fillColor: {
						type: "sap.ui.core.CSSColor",
						defaultValue: "#bdbdb5"
					},
					signatureColor: {
						type: "sap.ui.core.CSSColor",
						defaultValue: "#000000"
					},
					lineWidth: {
						type: "float",
						defaultValue: 1.5
					},
					lineCap: {
						type: "string",
						defaultValue: "round" //round, butt, square
					},
					signDoneTrue: {
						type: "boolean",
						defaultValue: false
					}
				},
				aggregations: {}
			},

			/**
			 * Hook method renderer
			 * @public
			 */
			renderer: function (oRm, oControl) {
				oRm.write("<canvas class='signature-pad' ");
				oRm.writeControlData(oControl);
				oRm.addStyle("width", oControl.getWidth());
				oRm.addStyle("height", oControl.getHeight());
				oRm.addStyle("border", oControl.getBorderSize() + " " + oControl.getBorderStyle() + " " + oControl.getBorderColor());
				oRm.writeStyles();
				oRm.write("/>");
			},

			/**
			 * Hook methode onAfterRendering
			 * @public
			 */
			onAfterRendering: function (oEvent) {
				//if I need to do any post render actions, it will happen here
				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
					this._drawSignatureArea(this);
					this._makeAreaDrawable(this);
					var that = this; //make the control resizable and redraw when something changed
					sap.ui.core.ResizeHandler.register(this, function () {
						that._drawSignatureArea(that);
					});
				}
			},

			/**
			 * Clear signature canvas
			 * @private
			 */
			clearArea: function () {
				this._drawSignatureArea(this);
			},

			/**
			 * Get signature as png
			 * @private
			 */
			getSignatureAsPng: function () {
				return this._getCanvasAsPicture("image/png");
			},

			/**
			 * Get canvas as picture
			 * @private
			 */
			_getCanvasAsPicture: function (sMimetype) {
				var canvas = $("#" + this.getId())[0];
				//Check if signature was made
				var context = canvas.getContext("2d");
				var image = "";
				if (context.signDoneTrue === true) {
					image = canvas.toDataURL(sMimetype);
				}
				return image;
			},

			/**
			 * Draw signature canvas
			 * @private
			 */
			_drawSignatureArea: function (oControl) {
				var canvas = $("#" + oControl.getId())[0]; //This get´s our canvas-element by jQuery
				var context = canvas.getContext("2d"); //Getitng the context of our canvas-area
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientHeight;
				context.fillStyle = oControl.getFillColor(); //Setting the FillColor/FillStyle
				context.strokeStyle = oControl.getSignatureColor(); //Setting the SignaturColor/StrokeStyle
				context.lineWidth = oControl.getLineWidth(); //Setting the SignatureLineWidth
				context.lineCap = oControl.getLineCap(); //Setting the LineCap of the Signature
				context.fillRect(0, 0, canvas.width, canvas.height);
				context.signDoneTrue = oControl.getSignDoneTrue();
			},

			/**
			 * Making signature drawable
			 * @private
			 */
			_makeAreaDrawable: function (oControl) {
				var canvas = $("#" + oControl.getId())[0]; //This get´s our canvas-element by jQuery
				var context = canvas.getContext("2d"); //Getitng the context of our canvas-area
				var pixels = [];
				var xyLast = {};
				var xyAddLast = {};
				var calculate = false;

				function getCoords(oEvent) {
					var x, y;
					if (oEvent.changedTouches && oEvent.changedTouches[0]) {
						var offsety = canvas.getBoundingClientRect().y;
						var offsetx = canvas.getBoundingClientRect().x;
						x = oEvent.changedTouches[0].pageX - offsetx;
						y = oEvent.changedTouches[0].pageY - offsety;
					} else if (oEvent.layerX || oEvent.layerX === 0) {
						x = oEvent.offsetX;
						y = oEvent.offsetY;
					} else if (oEvent.offsetX || oEvent.offsetX === 0) {
						x = oEvent.offsetX;
						y = oEvent.offsetY;
					}
					return {
						x: x,
						y: y
					};
				}
				/**
				 * Eventhandler for when the mouse moves on the specific area without pushing
				 * */
				function onMouseMove(oEvent) {
					oEvent.preventDefault();
					oEvent.stopPropagation();
					var xy = getCoords(oEvent);
					xyAdd = xy;
					var xyAdd = {
						x: (xyLast.x + xy.x) / 2,
						y: (xyLast.y + xy.y) / 2
					};
					if (calculate) {
						var xLast = (xyAddLast.x + xyLast.x + xyAdd.x) / 3;
						var yLast = (xyAddLast.y + xyLast.y + xyAdd.y) / 3;
						pixels.push([xLast, yLast]);
					} else {
						calculate = true;
					}
					context.quadraticCurveTo(xyLast.x, xyLast.y, xyAdd.x, xyAdd.y);
					pixels.push([xyAdd.x, xyAdd.y]);
					context.stroke();
					context.beginPath();
					context.moveTo(xyAdd.x, xyAdd.y);
					xyAddLast = xyAdd;
					xyLast = xy;
				}

				/**
				 * Eventhandler for when the mouse moves is pressed on the specific area
				 * */
				function onMouseDown(oEvent) {
					oEvent.preventDefault();
					oEvent.stopPropagation();
					canvas.addEventListener("mouseup", onMouseUp, false);
					canvas.addEventListener("mousemove", onMouseMove, false);
					canvas.addEventListener("touchend", onMouseUp, false);
					canvas.addEventListener("touchmove", onMouseMove, false);
					var xy = getCoords(oEvent);
					context.beginPath();
					pixels.push("moveStart");
					context.moveTo(xy.x, xy.y);
					pixels.push([xy.x, xy.y]);
					xyLast = xy;

					if (context.signDoneTrue === false) {
						//set true since a click was made
						context.signDoneTrue = true;
					}
				}

				/**
				 * removes the eventhandlers
				 * */
				function removeEventListeners() {
					canvas.removeEventListener("mousemove", onMouseMove, false);
					canvas.removeEventListener("mouseup", onMouseUp, false);
					canvas.removeEventListener("touchmove", onMouseMove, false);
					canvas.removeEventListener("touchend", onMouseUp, false);
				}

				/**	
				 * Eventhandler for when the mouse stops pushing on the specific area
				 * */
				function onMouseUp(oEvent) {
				//	removeEventListeners();
					context.stroke();
					pixels.push("e");
					calculate = false;
				}

				canvas.addEventListener("touchstart", onMouseDown, false);
				canvas.addEventListener("mousedown", onMouseDown, false);
			}
		});
	});