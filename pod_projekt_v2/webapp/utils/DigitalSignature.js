sap.ui.define([
    "sap/ui/core/Control", 
    "sap/ui/core/ResizeHandler"
    ],
    function (Control, ResizeHandler) {
        return Control.extend("podprojekt.utils.DigitalSignature", {
            metadata: {
                properties: {
                    width: { type: "sap.ui.core.CSSSize", defaultValue: "auto" },
                    height: { type: "sap.ui.core.CSSSize", defaultValue: "auto" },
                    borderColor: { type: "sap.ui.core.CSSColor", defaultValue: "#000000" },
                    borderSize: { type: "sap.ui.core.CSSSize", defaultValue: "1px" },
                    borderStyle: { type: "string", defaultValue: "none" },
                    fillColor: { type: "sap.ui.core.CSSColor", defaultValue: "#bdbdb5" },
                    signatureColor: { type: "sap.ui.core.CSSColor", defaultValue: "#000000" },
                    lineWidth: { type: "float", defaultValue: 1.5 },
                    lineCap: { type: "string", defaultValue: "round" },
                    signDoneTrue: { type: "boolean", defaultValue: false }
                }
            },

            renderer: function (oRm, oControl) {
                oRm.write("<canvas class='signature-pad' ");
                oRm.writeControlData(oControl);
                oRm.addStyle("width", oControl.getWidth());
                oRm.addStyle("height", oControl.getHeight());
                oRm.addStyle("border", oControl.getBorderSize() + " " + oControl.getBorderStyle() + " " + oControl.getBorderColor());
                oRm.writeStyles();
                oRm.write("/>");
            },

            onAfterRendering: function () {
                if (sap.ui.core.Control.prototype.onAfterRendering) {
                    sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);
                    this.canvas = document.getElementById(this.getId());
                    this.context = this.canvas ? this.canvas.getContext("2d") : null;
                    if (!this.canvas || !this.context) {
                        console.error("Canvas or context could not be initialized.");
                        return;
                    }
                    this._initializeCanvas();
                    this._attachEventHandlers();
                    ResizeHandler.register(this, this._initializeCanvas.bind(this));
                }
            },

            clearArea: function () {
                this._initializeCanvas();
            },

            getSignatureAsPng: function () {
                return this._getCanvasAsImage("image/png");
            },

            getSignatureAsString: function () {
                return this.getSignatureAsPng().replace(/^data:image\/(png|jpg);base64,/, "");
            },

            getSignatureAsSvg: function () {
                var data = this._getCanvasAsImage("image/svg+xml");
                return data.replace(/^data:image\/svg\+xml;base64,/, "");
            },

            _getCanvasAsImage: function (sMimetype) {
                return this.context.signDoneTrue ? this.canvas.toDataURL(sMimetype) : "";
            },

            _initializeCanvas: function () {
                this.canvas.width = this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight;
                this.context.fillStyle = this.getFillColor();
                this.context.strokeStyle = this.getSignatureColor();
                this.context.lineWidth = this.getLineWidth();
                this.context.lineCap = this.getLineCap();
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.signDoneTrue = this.getSignDoneTrue();
            },

            _getPositionFromEvent: function (event) {
                var rect = this.canvas.getBoundingClientRect();
                return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
            },

            _attachEventHandlers: function () {
                var isDrawing = false;
                var self = this;

                var draw = function (position) {
                    if (!isDrawing) return;
                    self.context.lineTo(position.x, position.y);
                    self.context.stroke();
                    self.context.beginPath();
                    self.context.moveTo(position.x, position.y);
                };

                var startDrawing = function (event) {
                    isDrawing = true;
                    var position = self._getPositionFromEvent(event);
                    self.context.beginPath();
                    self.context.moveTo(position.x, position.y);
                    draw(position);
                };

                var stopDrawing = function () {
                    isDrawing = false;
                    self.context.beginPath();
                    if (!self.context.signDoneTrue) {
                        self.context.signDoneTrue = true;
                    }
                };

                // Mouse events
                self.canvas.addEventListener("mousedown", startDrawing);
                self.canvas.addEventListener("mousemove", function (event) { draw(self._getPositionFromEvent(event)); });
                self.canvas.addEventListener("mouseup", stopDrawing);
                self.canvas.addEventListener("mouseout", stopDrawing);

                // Touch events
                ["touchstart", "touchmove", "touchend"].forEach(function (eventName) {
                    self.canvas.addEventListener(eventName, function (event) {
                        event.preventDefault();
                        var touch = event.touches[0];
                        if (eventName === "touchstart") {
                            startDrawing(touch);
                        } else if (eventName === "touchmove") {
                            draw(self._getPositionFromEvent(touch));
                        } else if (eventName === "touchend") {
                            stopDrawing();
                        }
                    });
                });
            }
        });
    }
);
