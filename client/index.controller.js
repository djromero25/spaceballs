var SpaceBalls = angular.module('SpaceBalls', ['ngRoute']);

SpaceBalls.config(function ($routeProvider) {
    $routeProvider
        .when('/gameover',{
        templateUrl: '/views/gameover.html'
    })
        .when('/start',{
        templateUrl: '/views/game.html'
    })
        .when('/',{
        templateUrl: '/views/main.html'
    })
    .otherwise({
        redirectTo: '/'
    });
});