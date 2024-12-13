sap.ui.define(
	["sap/ui/core/mvc/Controller"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller) {
		"use strict";

		return Controller.extend("podprojekt.controller.Main", {
			onInit: function () {
				this.saftyPig();
			},
			onNavToOverview: function () {
				let oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Overview");
			},

			saftyPig: function(){
				//Formatierung ist leider nicht besser möglich gewesen
				console.log("Vorsicht vor wildem Code, daher das Safty Pig:");
				console.log(`
                         _
 _._ _..._ .-',     _.._(\`))
'-. \`     '  /-._.-'    ',/
   )                     '.
  / _    _    |             "
 |  a    a    /              |
    .-.                     ;  
  '-('' ).-'       ,'       ;
     '-;           |      .'
                       /
        | 7  .__  _.-   "
        | |  |  \`\`/  /\`  /
       /,_|  |   /,_/   /
          /,_/      '\`-'
`);
			},

		});
	}
);
