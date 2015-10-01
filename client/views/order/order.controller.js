var DocApps = angular.module('DocApps');

DocApps.factory('orderFactory', function($http) {
    var factory = {};
    // add a getstudents method to the object we defined
    factory.getOrders = function(callback) {
        $http.get('/orders').success(function(output) {
            callback(output);
        });
    };
    factory.addOrder = function(order, callback) {
        $http.post('/orders', order).success(function(output) {
            callback();
        });
    };
    factory.removeOrder = function(url, callback) {
        $http.delete(url).success(function(output) {
            callback();
        });
    };
    // most important step: return the object so it can be used by the rest of our angular code
    return factory;
});
// the .controller() method adds a controller to the module
DocApps.controller('ordersController', function(orderFactory) {
    //  initialize an empty array so this.orders maintains a consistent data type
    this.orders = [];
    this.newOrder = {};
    var _this = this;
    // run the getStudents method and set this data in the callback
    this.showOrders = function() {
        orderFactory.getOrders(function (data) {
            _this.orders = data;
        });
    };
    this.addOrder = function() {
        orderFactory.addOrder(_this.newOrder, function(){
            _this.newOrder = {};
            _this.showOrders();
        });
    };
    this.removeOrder = function(id) {
        orderFactory.removeOrder(order, function(){
            _this.showOrders();
        });
    };
    this.showOrders();
});