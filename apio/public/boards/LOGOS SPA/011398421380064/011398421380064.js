var app = angular.module("ApioApplication011398421380064", ["apioProperty"]);
app.controller("defaultController", ["$scope", "currentObject", function ($scope, currentObject) {
    $scope.object = currentObject.get();
    console.log("Sono il defaultController e l'oggetto è: ", $scope.object);
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById("ApioApplication011398421380064"), ["ApioApplication011398421380064"]);
}, 10);