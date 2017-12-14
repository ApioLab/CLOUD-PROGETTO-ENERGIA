//Copyright 2014-2015 Alex Benfaremo, Alessandro Chelli, Lorenzo Di Berardino, Matteo Di Sabatino

/********************************** LICENSE *********************************
 *                                                                          *
 * This file is part of ApioOS.                                             *
 *                                                                          *
 * ApioOS is free software released under the GPLv2 license: you can        *
 * redistribute it and/or modify it under the terms of the GNU General      *
 * Public License version 2 as published by the Free Software Foundation.   *
 *                                                                          *
 * ApioOS is distributed in the hope that it will be useful, but            *
 * WITHOUT ANY WARRANTY; without even the implied warranty of               *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the             *
 * GNU General Public License version 2 for more details.                   *
 *                                                                          *
 * To read the license either open the file COPYING.txt or                  *
 * visit <http://www.gnu.org/licenses/gpl2.txt>                             *
 *                                                                          *
 ****************************************************************************/

angular.module("ApioApplication").controller("modalamanualInsert", ["$scope", "$mdDialog", "socket", function ($scope, $mdDialog, socket) {
    $scope.newEep = "";

    $scope.cancel = function () {
        $mdDialog.hide();
    };

    $scope.confirm = function () {
        var isEEPWellFormed = /^[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}-[0-9A-Fa-f]{2}$/;
        if (isEEPWellFormed.test($scope.newEep)) {
            $scope.modalData.eep = $scope.newEep;
            socket.emit("send_to_service", {
                service: "autoInstall",
                message: "apio_install_new_object_final",
                data: $scope.modalData
            });

            $mdDialog.hide();
        } else {
            alert("Please insert a valid EEP, a well-formed EEP is like XX-YY-ZZ where XX, YY and ZZ are 2-digits hexadecimal numbers");
        }
    };
}]);