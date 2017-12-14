var app = angular.module("ApioApplication23", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", function ($scope, currentObject) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);

    $scope.addNode = function () {
        alert($scope.object.properties.addNode)
    };

    $scope.removeNode = function () {
        alert($scope.object.properties.removeNode)
    };

    $scope.hardReset = function () {
        alert($scope.object.properties.hardReset)
    };
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication23"), ["ApioApplication23"]);
}, 10);