var app = angular.module('ApioApplication35', ['apioProperty'])
app.controller('defaultController', ['$scope', 'currentObject', "$http", function ($scope, currentObject, $http) {
    console.log("Sono il defaultController e l'oggetto è")
    console.log(currentObject.get());
    $scope.object = currentObject.get();
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById('ApioApplication35'), ['ApioApplication35']);
}, 10);
