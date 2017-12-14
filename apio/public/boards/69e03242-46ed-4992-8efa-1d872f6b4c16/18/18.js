var app = angular.module("ApioApplication18", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", "socket", "$http", "$location", "$timeout", function ($scope, currentObject, socket, $http, $location, $timeout) {
    console.log("Sono il defaultController e l'oggetto è");
    console.log(currentObject.get());
    $scope.object = currentObject.get();

    $scope.$on("$destroy", function () {
        console.log("ENERGY METER DESTROY");
    });

    var d = new Date(), day = 10, month = 11, year = 2015, graphicsData = [], timestampArr = [];
    //var d = new Date(), day = d.getDate(), month = d.getMonth(), year = d.getFullYear(), graphicsData = [], timestampArr = [];

    //var isInArray = function (timestamp) {
    //    var date = new Date(Number(timestamp));
    //    var time = date.getHours() + ":00";
    //    for (var i in graphicsData) {
    //        if (graphicsData[i].date === time) {
    //            return i;
    //        }
    //    }
    //    return -1;
    //};

    //var parseDate = function (d) {
    //    var date = new Date(Number(d));
    //    var date_ = date.getHours() < 10 ? "0" + date.getHours() + ":" : date.getHours() + ":";
    //    date_ += date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    //    return date_;
    //};

    //socket.on("apio_log_update", function (data) {
    //    if (Number(data.objectId) === Number($scope.object.objectId)) {
    //        var keys = Object.keys(data.logs);
    //        for (var i in keys) {
    //            //BUILDING OBJECT
    //            var arr = keys[i].split(".");
    //            var arrKeys = Object.keys(arr);
    //            var obj = {};
    //            for (var j = arrKeys.length - 1; j >= 0; j--) {
    //                if (j === arrKeys.length - 1) {
    //                    obj[arr[arrKeys[j]]] = data.logs[keys[i]];
    //                } else {
    //                    obj[arr[arrKeys[j]]] = {};
    //                    obj[arr[arrKeys[j]]][arr[arrKeys[j + 1]]] = JSON.parse(JSON.stringify(obj[arr[arrKeys[j + 1]]]));
    //                    delete obj[arr[arrKeys[j + 1]]];
    //                }
    //            }
    //
    //            //APPENDING OBJECT
    //            for (var i in obj.log) {
    //                for (var j in obj.log[i]) {
    //                    var index = isInArray(j);
    //                    if (index > -1) {
    //                        graphicsData[index][i] = (graphicsData[index][i] * graphicsData[index]["count" + i] + Number(obj.log[i][j])) / (graphicsData[index]["count" + i] + 1);
    //                        graphicsData[index]["count" + i]++;
    //                    } else {
    //                        var obj_ = {
    //                            date: parseDate(j),
    //                            timestamp: j
    //                        };
    //                        obj_[i] = obj.log[i][j];
    //                        graphicsData.push(obj_);
    //                        obj_ = {};
    //                    }
    //                }
    //            }
    //        }
    //
    //        $scope.graph.setData(graphicsData);
    //    }
    //});

    //for (var i = 0; i < 24; i++) {
    //    timestampArr.push(new Date(year, month, day, i, 0, 0, 0).getTime());
    //    graphicsData.push({
    //        date: parseDate(timestampArr[i])
    //    });
    //}

    //for (var i in $scope.object.log) {
    //    if (i !== "date" && i !== "finish" && i !== "hi") {
    //        for (var j in $scope.object.log[i]) {
    //            for (var k = 0; k < timestampArr.length; k++) {
    //                if (k === timestampArr.length - 1) {
    //                    var nextDay = new Date(year, month, day + 1, 0, 0, 0, 0).getTime();
    //                    if (Number(j) >= Number(timestampArr[k]) && Number(j) < Number(nextDay)) {
    //                        if (typeof graphicsData[k][i] === "undefined") {
    //                            graphicsData[k][i] = Number($scope.object.log[i][j].replace(",", "."));
    //                            graphicsData[k]["count" + i] = 1;
    //                        } else {
    //                            graphicsData[k][i] += Number($scope.object.log[i][j].replace(",", "."));
    //                            graphicsData[k]["count" + i]++;
    //                        }
    //                    }
    //                } else {
    //                    if (Number(j) >= Number(timestampArr[k]) && Number(j) < Number(timestampArr[k + 1])) {
    //                        if (typeof graphicsData[k][i] === "undefined") {
    //                            graphicsData[k][i] = Number($scope.object.log[i][j].replace(",", "."));
    //                            graphicsData[k]["count" + i] = 1;
    //                        } else {
    //                            graphicsData[k][i] += Number($scope.object.log[i][j].replace(",", "."));
    //                            graphicsData[k]["count" + i]++;
    //                        }
    //                    }
    //                }
    //            }
    //        }
    //    }
    //}

    //$http.get("applications/" + $scope.object.objectId + "/logs " + year + "-" + (month + 1) + "-" + day + ".json").success(function (data) {
    //    for (var i in data) {
    //        if (i !== "date" && i !== "finish" && i !== "hi") {
    //            for (var j in data[i]) {
    //                for (var k = 0; k < timestampArr.length; k++) {
    //                    if (k === timestampArr.length - 1) {
    //                        var nextDay = new Date(year, month, day + 1, 0, 0, 0, 0).getTime();
    //                        if (Number(j) >= Number(timestampArr[k]) && Number(j) < Number(nextDay)) {
    //                            if (typeof graphicsData[k][i] === "undefined") {
    //                                graphicsData[k][i] = Number(data[i][j].replace(",", "."));
    //                                graphicsData[k]["count" + i] = 1;
    //                            } else {
    //                                graphicsData[k][i] += Number(data[i][j].replace(",", "."));
    //                                graphicsData[k]["count" + i]++;
    //                            }
    //                        }
    //                    } else {
    //                        if (Number(j) >= Number(timestampArr[k]) && Number(j) < Number(timestampArr[k + 1])) {
    //                            if (typeof graphicsData[k][i] === "undefined") {
    //                                graphicsData[k][i] = Number(data[i][j].replace(",", "."));
    //                                graphicsData[k]["count" + i] = 1;
    //                            } else {
    //                                graphicsData[k][i] += Number(data[i][j].replace(",", "."));
    //                                graphicsData[k]["count" + i]++;
    //                            }
    //                        }
    //                    }
    //                }
    //            }
    //        }
    //    }
    //
    //    for (var i in graphicsData) {
    //        var keys = Object.keys(graphicsData[i]);
    //        for (var j in keys) {
    //            var key = Object.keys(graphicsData[i])[j];
    //            if (key.indexOf("count") === -1 && key !== "date") {
    //                graphicsData[i][key] /= graphicsData[i]["count" + key];
    //            }
    //        }
    //    }
    //
    //    $timeout(function () {
    //        if (window.innerWidth < 768) {
    //            document.getElementById("analytics").style.width = window.innerWidth + "px";
    //        } else {
    //            document.getElementById("analytics").style.width = (parseInt(window.innerWidth * 33 / 100) - 20) + "px";
    //        }
    //
    //        $scope.graph = Morris.Area({
    //            data: graphicsData,
    //            element: "analytics",
    //            labels: ["Potenza"],
    //            parseTime: false,
    //            postUnits: " W",
    //            smooth: false,
    //            xkey: "date",
    //            ykeys: ["power"]
    //        });
    //
    //        document.getElementById("analytics").onclick = function () {
    //            $location.path("/home/12/" + $scope.object.objectId);
    //            // Avvio content_loader
    //
    //            //document.getElementById("apioWaitLoading").classList.remove("apioWaitLoadingOff");
    //            //document.getElementById("apioWaitLoading").classList.add("apioWaitLoadingOn");
    //        };
    //    });
    //    $scope.ready = true;
    //}).error(function () {
    //    $scope.ready = true;
    //});

	//listener viene usato SOLO per max_power, attualmente questo tag è commentato.
    /*$scope.listener = function () {
        currentObject.update("max_power", $scope.object.properties.max_power, true, false);
        if (Number($scope.object.properties.max_power) === 20){
            currentObject.update("voltage", "227", true, false);
            currentObject.update("current", "0.125", true, false);
            currentObject.update("power", "20", true, false);
            $http.put("/apio/object/2", {
                object: {
                    properties: {
                        onoff: "0"
                    },
                    objectId: "2"
                }
            }).success(function () {
                console.log("Object with objectId 2 successfully updated");
            });

            $http.put("/apio/object/8", {
                object: {
                    properties: {
                        onoff: "0"
                    },
                    objectId: "8"
                }
            }).success(function () {
                console.log("Object with objectId 8 successfully updated");
            });

            $http.post("/apio/serial/send", {
                data: "l2:onoff:0-"
            }).success(function () {
                console.log("Object with objectId 2 successfully shutdowned");
            });

            $http.post("/apio/serial/send", {
                data: "l8:onoff:0-"
            }).success(function () {
                console.log("Object with objectId 8 successfully shutdowned");
            });
        }
    };*/
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication18"), ["ApioApplication18"]);
}, 10);