var app = angular.module('myApp', ['ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/verify-login', {
            templateUrl: 'verify-login.html',
            controller: 'VerifyLoginController'
        })
        .when('/verify-first', {
            templateUrl: 'verify-email.html'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginController'
        })
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'HomeController',
            resolve: {
                auth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isLoggedIn()) {
                        $location.path('/login');
                    }
                }]
            }
        })
        .otherwise({
            redirectTo: '/'
        });
}]);