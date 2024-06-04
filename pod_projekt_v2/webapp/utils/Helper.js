sap.ui.define([
    
], function() {
	"use strict";
	return {
        findListObject:function(sObjectId, aListItems){
            var oListItem;

            for(var i in aListItems){
                if(sObjectId===aListItems[i].sId){
                    oListItem=aListItems[i];
                }
            }

            return oListItem; //Methode gibt nur das Listen-Item zurück
        },
        findListObjectIndex:function(sObjectId, aListItems){
            var iIndexOfItem;

            for(var i in aListItems){
                if(sObjectId===aListItems[i].sId){
                    iIndexOfItem=i;
                }
            }

            return iIndexOfItem; //Methode gibt nur den Index vom List-Item zurück
        },

        findModelObject:function(sObjectId, aListItems, oOwnerComponent, sModelName, sPropertyName){
            var oListObject;
            var oModelItems=oOwnerComponent.getModel(sModelName).getProperty("/" + sPropertyName);

            for(var i in aListItems){
                if(sObjectId===aListItems[i].sId){
                    oListObject=aListItems[i];
                }
            }

            return oModelItems[aListItems.indexOf(oListObject)]; //Methode gibt das Model-Objekt zurück
        },
        findModelObjectSlimm:function(sObjectId, aListItems, aModelItems){
            var oListObject;

            for(var i in aListItems){
                if(sObjectId===aListItems[i].sId){
                    oListObject=aListItems[i];
                }
            }

            return aModelItems[aListItems.indexOf(oListObject)]; //Methode gibt das Model-Objekt zurück
        }
	};
});