var app = angular.module('ApioApplication32', ['apioProperty'])
app.controller('defaultController', ['$scope', 'currentObject', function ($scope, currentObject) {
    console.log("Sono il defaultController e l'oggetto è")
    console.log(currentObject.get());
    $scope.object = currentObject.get();
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById('ApioApplication32'), ['ApioApplication32']);
}, 10);
