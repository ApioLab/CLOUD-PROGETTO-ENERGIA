//Copyright 2014-2015 Alex Benfaremo, Alessandro Chelli, Lorenzo Di Berardino, Matteo Di Sabatino

/********************************** LICENSE **********************************
 *                                                                           *
 * This file is part of ApioOS.                                              *
 *                                                                           *
 * ApioOS is free software released under the GPLv2 license: you can         *
 * redistribute it and/or modify it under the terms of the GNU General       *
 * Public License version 2 as published by the Free Software Foundation.    *
 *                                                                           *
 * ApioOS is distributed in the hope that it will be useful, but             *
 * WITHOUT ANY WARRANTY; without even the implied warranty of                *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the              *
 * GNU General Public License version 2 for more details.                    *
 *                                                                           *
 * To read the license either open the file COPYING.txt or                   *
 * visit <http://www.gnu.org/licenses/gpl2.txt>                              *
 *                                                                           *
 *****************************************************************************/

angular.module("apioProperty").directive("new", ["currentObject", "$http", function (currentObject, $http) {
    return {
        restrict: "E",
        replace: true,
        scope: {
            model: "=propertyname"
        },
        templateUrl: "apioProperties/New/new.html",
        link: function (scope, elem, attrs) {
            scope.label = attrs.label;
            scope.propertyname = attrs.propertyname;
        }
    };
}]);