var app = angular.module('ApioApplication29', ['apioProperty'])
app.controller('defaultController', ['$scope', 'currentObject', function ($scope, currentObject) {
    console.log("Sono il defaultController e l'oggetto è")
    console.log(currentObject.get());
    $scope.object = currentObject.get();
}]);

setTimeout(function () {
    angular.bootstrap(document.getElementById('ApioApplication29'), ['ApioApplication29']);
}, 10);
