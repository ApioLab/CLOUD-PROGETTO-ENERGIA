var app = angular.module("ApioApplication011042291251107", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", function ($scope, currentObject) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication011042291251107"), ["ApioApplication011042291251107"]);
}, 10);