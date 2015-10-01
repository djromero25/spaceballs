var DocApps = angular.module('DocApps');

DocApps.factory('appointmentFactory', function ($http) {
    var factory = {};
    // add a getstudents method to the object we defined
    factory.getAppointments = function(callback) {
        $http.get('/appointments').success(function(output) {
            callback(output);
        });
    };
    factory.addAppointment = function(appointment, callback) {
        $http.post('/appointments', appointment).success(function (output) {
            callback(output);
        });
        return false;
    };
    factory.removeAppointment = function(url, callback) {
        $http.delete(url).success(function (output) {
            callback();
        });
    };
    // most important step: return the object so it can be used by the rest of our angular code
    return factory;
});
// the .controller() method adds a controller to the module
DocApps.controller('appointmentsController', function ($window, appointmentFactory, User) {
    //  initialize an empty array so this.appointments maintains a consistent data type
    this.appointments = [];
    this.newAppointment = {};
    this.timeSlots = ['8:00 AM', '12:00 PM', '3:00 PM'];
    this.user = User.name;
    var _this = this;
    // run the getStudents method and set this data in the callback
    this.getAppointments = function() {
        appointmentFactory.getAppointments(function (data) {
            _this.appointments = data;
        });
    };
    this.addAppointment = function() {
        var errors = [];
        console.log(this.date);
        if(this.time === undefined) errors.push("TIME ERROR: You must choose an appointment time");
        this.newAppointment['dateTime'] = new Date(this.date + ' ' + this.time);
        console.log(this.time, this.newAppointment['dateTime']);
        if(this.newAppointment['dateTime'] == 'Invalid Date') errors.push("DATE/TIME ERROR: The date is invalid");
        this.newAppointment['name'] = this.user;
        this.date = null;
        this.time = null;
        for (var i in this.appointments){
            if((new Date(this.appointments[i]['dateTime'])).toString() == this.newAppointment['dateTime'].toString()) errors.push("DATE/TIME ERROR: The time slot on that date is taken");
        }
        if(this.newAppointment['complaint'] && this.newAppointment['complaint'].length < 10) errors.push("COMPLAIN ERROR: The complaint must be at least 10 characters");
        if (errors.length > 0) _this.errors = errors;
        else{
            appointmentFactory.addAppointment(_this.newAppointment, function (err) {
                var errors = [];
                _this.getAppointments();
                _this.newAppointment = {};
                if(err){
                    console.log(err,err.errors);
                    for(var i in err.errors){
                        errors.push(err.errors[i].message);
                    }
                    console.log(errors);
                    _this.errors = errors;
                }
                else{
                    _this.errors = null;
                    $window.location.href = "#/";
                }
            });
        }
    };
    this.removeAppointment = function(id) {
        appointmentFactory.removeAppointment('/appointments/'+id+'/destroy', function () {
            _this.getAppointments();
        });
    };
    this.logout = function() {
        $window.location.reload();
    };
    this.getAppointments();
});