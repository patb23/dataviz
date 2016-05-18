'use strict';

/**
 * @ngdoc function
 * @name uwApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the uwApp
 */
angular.module('uwApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
