var app = angular.module("ApioApplication011822071411104", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", function ($scope, currentObject) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication011822071411104"), ["ApioApplication011822071411104"]);
}, 10);