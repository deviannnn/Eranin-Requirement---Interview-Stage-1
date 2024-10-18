var app = angular.module('myApp');

app.factory('AuthService', ['$http', '$window', function ($http, $window) {
    var authService = {};

    // Địa chỉ API
    var apiBaseUrl = 'http://localhost:3000/api/auth';

    authService.login = function (gmail, password) {
        return $http.post(apiBaseUrl + '/login', { gmail, password })
            .then(function (response) {
                // Kiểm tra xem MFA có được bật không
                if (response.data.data.enableMFA) {
                    // Trả về thông tin rằng MFA được bật
                    return { enableMFA: true };
                } else {
                    // Nếu không, lưu token và trả về thông tin bình thường
                    console.log(response.data.data);
                    $window.localStorage.setItem('accessToken', response.data.data.accessToken);
                    $window.localStorage.setItem('refreshToken', response.data.data.refreshToken);
                    return { enableMFA: false }; // không cần MFA
                }
            })
            .catch(function (error) {
                console.error('Error during login:', error);
                throw error;
            });
    };


    authService.isLoggedIn = function () {
        return !!$window.localStorage.getItem('accessToken');
    };

    authService.logout = function () {
        $window.localStorage.removeItem('accessToken');
    };

    return authService;
}]);
