var app = angular.module("ApioApplication010780411231044", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", function ($scope, currentObject) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication010780411231044"), ["ApioApplication010780411231044"]);
}, 10);