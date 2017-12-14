//Copyright 2014-2015 Alex Benfaremo, Alessandro Chelli, Lorenzo Di Berardino, Matteo Di Sabatino

/********************************** LICENSE *********************************
 *                                                                          *
 * This file is part of ApioOS.                                             *
 *                                                                          *
 * ApioOS is free software released under the GPLv2 license: you can        *
 * redistribute it and/or modify it under the terms of the GNU General      *
 * Public License version 2 as published by the Free Software Foundation.   *
 *                                                                          *
 * ApioOS is distributed in the hope that it will be useful, but            *
 * WITHOUT ANY WARRANTY; without even the implied warranty of               *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the             *
 * GNU General Public License version 2 for more details.                   *
 *                                                                          *
 * To read the license either open the file COPYING.txt or                  *
 * visit <http://www.gnu.org/licenses/gpl2.txt>                             *
 *                                                                          *
 ****************************************************************************/

var apioProperty = angular.module("apioProperty");
apioProperty.directive("unclickabletrigger", ["currentObject", "socket", "$http", function (currentObject, socket, $http) {
    return {
        restrict: "E",
        replace: true,
        scope: {
            changeExpr: "@ngChange",
            model: "=propertyname"
        },
        templateUrl: "apioProperties/UnclickableTrigger/unclickabletrigger.html",
        link: function (scope, elem, attrs) {
            scope.valueon = attrs["valueon"] ? attrs["valueon"] : "1";
            scope.valueoff = attrs["valueoff"] ? attrs["valueoff"] : "0";

            scope.object = currentObject.get();
            $http.get("/apio/getPlatform").success(function (data) {
                if (data.type == "gateway") {
                    scope.object.apioId = data.apioId;
                }
            });

            scope.currentObject = currentObject;

            scope.isRecorded = function () {
                return scope.currentObject.record(attrs["propertyname"]);
            };
            scope.addPropertyToRecording = function ($event) {
                $event.stopPropagation();
                scope.currentObject.record(attrs["propertyname"], scope.model);
            };
            scope.removePropertyFromRecording = function ($event) {
                $event.stopPropagation();
                scope.currentObject.removeFromRecord(attrs["propertyname"]);
            };
            //Serve per il cloud: aggiorna in tempo reale il valore di una proprietà che è stata modificata da un"altro utente
            socket.on("apio_server_update", function (data) {
                console.log(data.apioId + " " + scope.object.apioId)
                if (data.apioId === scope.object.apioId && data.objectId === scope.object.objectId && !currentObject.isRecording()) {
                    //alert("OK")
                    if (data.properties.hasOwnProperty(attrs["propertyname"])) {

                        scope.$parent.object.properties[attrs["propertyname"]] = data.properties[attrs["propertyname"]];
                        //Se è stata definita una funzione di push viene chiama questa altrimenti vengono fatti i settaggi predefiniti
                        if (attrs["push"]) {
                            scope.$parent.$property = {
                                name: attrs["propertyname"],
                                value: data.properties[attrs["propertyname"]]
                            };
                            scope.$parent.$eval(attrs["push"]);

                            /*var fn = scope.$parent[attrs["push"]];
                             if(typeof fn === "function"){
                             var params = [$property];
                             fn.apply(scope.$parent,params);
                             }
                             else {
                             throw new Error("The Push attribute must be a function name present in scope")
                             }*/
                        }
                        else {
                            scope.model = data.properties[attrs["propertyname"]];
                            scope.label = parseInt(data.properties[attrs["propertyname"]]) === parseInt(scope.valueoff) ? attrs["labeloff"] : attrs["labelon"];
                            //Aggiorna lo scope globale con il valore che è stato modificato nel template
                            scope.object.properties[attrs["propertyname"]] = data.properties[attrs["propertyname"]];
                            //
                        }
                        //

                        //In particolare questa parte aggiorna il cloud nel caso siano state definite delle correlazioni
                        /*if(attrs["correlation"]){
                         scope.$parent.$eval(attrs["correlation"]);
                         }*/
                        //
                    }
                }
            });
            socket.on("apio_server_update_", function (data) {
                if (data.objectId === scope.object.objectId && !scope.currentObject.isRecording()) {
                    scope.model = data.properties[attrs["propertyname"]];
                    scope.label = parseInt(data.properties[attrs["propertyname"]]) === parseInt(scope.valueoff) ? attrs["labeloff"] : attrs["labelon"];
                    scope.object.properties[attrs["propertyname"]] = data.properties[attrs["propertyname"]];
                }
            });

            scope.$on("propertyUpdate", function () {
                scope.object = currentObject.get();
            });

            //Se il controller modifica l'oggetto allora modifico il model;
            scope.$watch("object.properties." + attrs["propertyname"], function () {
                scope.model = scope.object.properties[attrs["propertyname"]];
                scope.label = parseInt(scope.model) === parseInt(scope.valueoff) ? attrs["labeloff"] : attrs["labelon"];
            });
            //

            //Inizializzo la proprietà con i dati memorizzati nel DB
            scope.model = scope.object.properties[attrs["propertyname"]];
            scope.label = parseInt(scope.model) === parseInt(scope.valueoff) ? attrs["labeloff"] : attrs["labelon"];
            scope.propertyname = attrs["propertyname"];
            //
        }
    };
}]);
