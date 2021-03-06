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
apioProperty.directive("unlimitedsensor", ["currentObject", "socket", "$http", function (currentObject, socket, $http) {
    return {
        restrict: "E",
        replace: true,
        scope: {
            model: "=propertyname"
        },
        templateUrl: "apioProperties/UnlimitedSensor/unlimitedsensor.html",
        link: function (scope, elem, attrs) {
            scope.object = currentObject.get();
            $http.get("/apio/getPlatform").success(function (data) {
                //console.log(data);
                //alert(data.apioId);
                //alert(data.apioId);


                if (data.type == "gateway") {
                    scope.object.apioId = data.apioId;
                    //return obj;

                    //scope.continueToCloud = true;
                    //$scope.currentUserEmail();
                }
                if (data.type == "cloud") {
                    //$scope.cloudShowBoard = true;
                    //$scope.currentUserEmail();
                }

            });

            scope.currentObject = currentObject;
            scope.isRecorded = function () {
                return scope.currentObject.record(attrs["propertyname"]);
            };
            scope.addPropertyToRecording = function () {
                scope.currentObject.record(attrs["propertyname"], scope.model);
            };
            scope.removePropertyFromRecording = function () {
                scope.currentObject.removeFromRecord(attrs["propertyname"]);
            };
            //Serve per il cloud: aggiorna in tempo reale il valore di una proprietà che è stata modificata da un"altro utente
            socket.on("apio_server_update", function (data) {
                if (data.apioId === scope.object.apioId && data.objectId === scope.object.objectId && currentObject.isRecording() == false) {
                    if (data.properties.hasOwnProperty(attrs["propertyname"])) {
                        scope.$parent.object.properties[attrs["propertyname"]] = data.properties[attrs["propertyname"]];
                        //Se è stata definita una funzione di push viene chiama questa altrimenti vengono fatti i settaggi predefiniti
                        if (attrs["push"]) {
                            scope.$parent.$eval(attrs["push"]);
                            $property = {
                                name: attrs["propertyname"],
                                value: data.properties[attrs["propertyname"]]
                            }
                            var fn = scope.$parent[attrs["push"]];
                            if (typeof fn === "function") {
                                var params = [$property];
                                fn.apply(scope.$parent, params);
                            }
                            else {
                                throw new Error("The Push attribute must be a function name present in scope")
                            }
                        }
                        else {
                            scope.model = data.properties[attrs["propertyname"]];
                        }
                        //In particolare questa parte aggiorna il cloud nel caso siano state definite delle correlazioni
                        /*if(attrs["correlation"]){
                         scope.$parent.$eval(attrs["correlation"]);
                         }*/
                        //
                    }
                }
            });
            //
            socket.on("apio_server_update_", function (data) {
                if (data.objectId === scope.object.objectId && !scope.currentObject.isRecording()) {
                    scope.model = data.properties[attrs["propertyname"]];
                }
            });

            //Se il controller modifica l'oggetto allora modifico il model;
            scope.$watch("object.properties." + attrs["propertyname"], function (newValue, oldValue) {
                scope.model = newValue;
            });
            //

            scope.$on("propertyUpdate", function () {
                scope.object = currentObject.get();
            });

            //Inizializzo la proprietà con i dati memorizzati nel DB
            scope.label = attrs["label"];
            scope.model = scope.object.properties[attrs["propertyname"]];
            scope.propertyname = attrs["propertyname"];
            scope.show_sensor = false;
            //

            /*scope.$watch("model", function(){
             setValue();
             });*/


            function setValue() {
                var el = $(elem).find("input");
                if (angular.isDefined(scope.model)) {
                    el.val(scope.model);
                }
            }

            function read() {
                var el = $(elem).find("input");
                scope.model = el.val();
            }

            //

            $(elem).find("input").on("blur", function () {
                setValue();
            });

            var event = attrs["event"] ? attrs["event"] : "keyup";
            elem.on(event, function () {
                //Aggiorna lo scope globale con il valore che è stato modificato nel template

                scope.object.properties[attrs["propertyname"]] = scope.model;
                scope.$apply();
                //

                if (!currentObject.isRecording()) {
                    //Se è stato definito un listener da parte dell'utente lo eseguo altrimenti richiamo currentObject.update che invia i dati al DB e alla seriale
                    scope.$parent.$eval(attrs["listener"]);
                    //

                    //Se è stata definita una correlazione da parte dell'utente la eseguo
                    if (attrs["correlation"]) {
                        scope.$parent.$eval(attrs["correlation"]);
                    }

                    //Esegue codice javascript contenuto nei tag angular; dovendo modificare i valori dell'input bisogna dare a scope.$apply la funzione read
                    scope.$apply(read);
                    //scope.$apply();
                    //
                }
            });
            //
        }
    };
}]);
