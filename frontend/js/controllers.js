var app = angular.module('myApp');

app.controller('LoginController', ['$scope', 'AuthService', '$location', function ($scope, AuthService, $location) {
    $scope.gmail = '';
    $scope.password = '';
    $scope.errorMessage = '';

    function validateInput() {
        if (!$scope.gmail || !validateGmail($scope.gmail)) {
            $scope.errorMessage = 'Please enter a valid Gmail address (must be @gmail.com).';
            return false;
        }
        if (!$scope.password) {
            $scope.errorMessage = 'Password is required.';
            return false;
        }
        return true;
    }

    function validateGmail(email) {
        var re = /^[^\s@]+@gmail\.com$/;
        return re.test(String(email).toLowerCase());
    }

    // Hàm xử lý đăng nhập
    $scope.login = function () {
        if (!validateInput()) {
            return;
        }

        AuthService.login($scope.gmail, $scope.password)
            .then(function (result) {
                if (result.enableMFA) {
                    $location.path('/verify-first');
                } else {
                    $location.path('/');
                }
            })
            .catch(function (error) {
                console.error('Error logging in:', error);
                if (error.status === -1) {
                    $scope.errorMessage = 'Unable to connect to the server. Please try again later.';
                } else {
                    $scope.errorMessage = error.data.error.message;
                }
                $scope.$apply();
            });
    };
}]);


app.controller('VerifyLoginController', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    $scope.message = 'Verifying your login...';

    // Lấy token từ URL
    var token = $location.search().token;

    if (token) {
        // Gửi yêu cầu xác thực đến backend
        $http.post('http://localhost:3000/api/auth/verify-login', {}, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(function (response) {
                // Lưu accessToken và refreshToken vào localStorage
                localStorage.setItem('accessToken', response.data.data.accessToken);
                localStorage.setItem('refreshToken', response.data.data.refreshToken);
                // Chuyển hướng đến trang home
                $location.path('/');
                $location.search({});
            })
            .catch(function (error) {
                console.error('Error verifying token:', error);
                $scope.message = error.data.error.message + ' - Please try again.';
            });
    } else {
        $scope.message = 'No token provided!';
    }
}]);


// Controller cho trang Home
app.controller('HomeController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    $scope.title = 'Home Page';
    $scope.message = 'Welcome to the AngularJS Home Page!';
    $scope.products = [];

    // Lấy accessToken và refreshToken từ localStorage
    var accessToken = localStorage.getItem('accessToken');
    var refreshToken = localStorage.getItem('refreshToken');

    function fetchProducts(token) {
        // Gọi API để lấy danh sách products với token được truyền vào
        $http.get('http://localhost:3000/api/products', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
            .then(function (response) {
                // Lưu dữ liệu products vào scope để hiển thị
                $scope.products = response.data.data;
            })
            .catch(function (error) {
                if (error.status === 401 && refreshToken) {
                    // Nếu token hết hạn (401), thử làm mới accessToken
                    refreshAccessToken();
                } else {
                    console.error('Error fetching products:', error);
                    $scope.message = 'Failed to load products: ' + error.data.error.message + '. Please try again.';
                }
            });
    }

    function refreshAccessToken() {
        // Gọi API để làm mới accessToken bằng refreshToken trong header
        $http.post('http://localhost:3000/api/auth/refresh-token', {}, {
            headers: {
                'Authorization': 'Bearer ' + refreshToken
            }
        })
            .then(function (response) {
                // Lưu cặp token mới vào localStorage
                localStorage.setItem('accessToken', response.data.data.accessToken);
                localStorage.setItem('refreshToken', response.data.data.refreshToken);

                // Gọi lại hàm fetchProducts với accessToken mới
                fetchProducts(response.data.data.accessToken);
            })
            .catch(function (error) {
                console.error('Error refreshing access token:', error);
                $scope.message = 'Session expired. Please log in again.';
                $location.path('/login');
            });
    }


    // Kiểm tra xem có accessToken không
    if (accessToken) {
        fetchProducts(accessToken);
    } else {
        $location.path('/login');
    }
}]);

