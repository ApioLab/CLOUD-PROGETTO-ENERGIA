var app = angular.module('ApioApplication26', ['apioProperty'])
app.controller('defaultController',['$scope', 'currentObject', function($scope, currentObject){
	console.log("Sono il defaultController e l'oggetto è")
	console.log(currentObject.get());
	$scope.object = currentObject.get();
	/**
	* [myCustomListener description]
	* @return {[type]} [description]
	*/
	$scope.myCustomListener = function() {	
	}
}]);

	setTimeout(function(){
		angular.bootstrap(document.getElementById('ApioApplication26'), ['ApioApplication26']);
	},10);
