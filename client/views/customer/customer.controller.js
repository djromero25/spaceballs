var DocApps = angular.module('DocApps');

DocApps.factory('customerFactory', function ($http) {
    var factory = {};
    // add a getstudents method to the object we defined
    factory.getCustomers = function(callback) {
        $http.get('/customers').success(function(output) {
            callback(output);
        });
    };
    factory.addCustomer = function(customer, callback) {
        $http.post('/customers', customer).success(function (output) {
            callback();
        });
        return false;
    };
    factory.removeCustomer = function(url, callback) {
        $http.delete(url).success(function (output) {
            callback();
        });
    };
    // most important step: return the object so it can be used by the rest of our angular code
    return factory;
});
// the .controller() method adds a controller to the module
DocApps.controller('customersController', function (customerFactory) {
    //  initialize an empty array so this.customers maintains a consistent data type
    this.customers = [];
    this.newCustomer = {};
    var _this = this;
    // run the getStudents method and set this data in the callback
    this.getCustomers = function() {
        customerFactory.getCustomers(function (data) {
            _this.customers = data;
        });
    };
    this.addCustomer = function() {
        var error = customerFactory.addCustomer(_this.newCustomer, function () {
            _this.getCustomers();
            _this.newCustomer = {};
        });
        if (error) _this.error = "That customer already exists";
        else _this.error = null;
    };
    this.removeCustomer = function(id) {
        customerFactory.removeCustomer('/customers/'+id+'/destroy', function () {
            _this.getCustomers();
        });
    };
    this.getCustomers();
});