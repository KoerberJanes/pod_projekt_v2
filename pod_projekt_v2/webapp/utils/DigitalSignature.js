sap.ui.define(
    ["sap/ui/core/Control"],
    function (Control) {
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
                    this._initializeCanvas();
                    this._attachEventHandlers();
                    sap.ui.core.ResizeHandler.register(this, this._initializeCanvas.bind(this));
                }
            },

            clearArea: function () {
                this._initializeCanvas();
            },

            getSignatureAsPng: function () {
                return this._getCanvasAsImage("image/png");
            },

            getSignatureAsString: function () {
                return this._getCanvasAsImage("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
            },

            _getCanvasAsImage: function (sMimetype) {
                var canvas = document.getElementById(this.getId());
                return canvas.getContext("2d").signDoneTrue ? canvas.toDataURL(sMimetype) : "";
            },

            _initializeCanvas: function () {
                var canvas = document.getElementById(this.getId());
                var context = canvas.getContext("2d");
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                context.fillStyle = this.getFillColor();
                context.strokeStyle = this.getSignatureColor();
                context.lineWidth = this.getLineWidth();
                context.lineCap = this.getLineCap();
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.signDoneTrue = this.getSignDoneTrue();
            },

            _attachEventHandlers: function () {
                var canvas = document.getElementById(this.getId());
                var context = canvas.getContext("2d");
                var isDrawing = false;
                var lastPos = null;

                var getMousePos = function (event) {
                    var rect = canvas.getBoundingClientRect();
                    return {
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top
                    };
                };

                var draw = function (position) {
                    if (!isDrawing) return;
                    context.lineTo(position.x, position.y);
                    context.stroke();
                    context.beginPath();
                    context.moveTo(position.x, position.y);
                };

                var startDrawing = function (event) {
                    isDrawing = true;
                    var mousePos = getMousePos(event);
                    context.beginPath();
                    context.moveTo(mousePos.x, mousePos.y);
                    draw(mousePos);
                };

                var stopDrawing = function () {
                    isDrawing = false;
                    context.beginPath();
                    if (context.signDoneTrue === false) {
                        context.signDoneTrue = true;
                    }
                };

                canvas.addEventListener("mousedown", startDrawing);
                canvas.addEventListener("mousemove", function (event) { draw(getMousePos(event)); });
                canvas.addEventListener("mouseup", stopDrawing);
                canvas.addEventListener("mouseout", stopDrawing);

                canvas.addEventListener("touchstart", function (event) {
                    event.preventDefault();
                    startDrawing(event.touches[0]);
                });
                canvas.addEventListener("touchmove", function (event) {
                    event.preventDefault();
                    draw(getMousePos(event.touches[0]));
                });
                canvas.addEventListener("touchend", function (event) {
                    event.preventDefault();
                    stopDrawing();
                });
            }
        });
    }
);
