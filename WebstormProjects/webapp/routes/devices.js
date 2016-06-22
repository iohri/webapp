var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var moment = require('moment');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method
    }
}));

//build the REST operations at the base for devices
//this will be accessible from http://127.0.0.1:3000/devices if the default route for / is left unchanged
router.route('/')
//GET all devices
    .get(function(req, res, next) {
        //retrieve all devices from Mongo
        mongoose.model('Device').find({}, function (err, devices) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    //HTML response will render the index.jade file in the views/devices folder. We are also setting "devices" to be an accessible variable in our jade view
                    html: function(){
                        res.render('devices/index', {
                            title: 'All My Devices',
                            "devices" : devices
                        });
                    },
                    //JSON response will show all devices in JSON format
                    json: function(){
                        res.json(infophotos);
                    }
                });
            }
        });
    })
    //POST a new device
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var version = req.body.version;
        var dob = req.body.dob;
        var owner = req.body.owner;

        //call the create function for our database
        mongoose.model('Device').create({
            name : name,
            version : version,
            dob : dob,
            owner : owner
        }, function (err, device) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Device has been created
                console.log('POST creating new device: ' + device);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("devices");
                        // And forward to success page
                        res.redirect("/devices");
                    },
                    //JSON response will show the newly created device
                    json: function(){
                        res.json(device);
                    }
                });
            }
        })
    });

router.get('/new', function(req, res) {
    res.render('devices/new', { title: 'Add New Device' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Device').findById(id, function (err, device) {
        //if it isn't found, we are going to respond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                },
                json: function(){
                    res.json({message : err.status  + ' ' + err});
                }
            });
            //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(device);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});

router.route('/:id')
    .get(function(req, res) {
        mongoose.model('Device').findById(req.id, function (err, device) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                console.log('GET Retrieving ID: ' + device._id);
                var devicedob ;
                if(device.dob == null) {
                    devicedob = new Date();
                    device.dob = devicedob;
                    devicedob = devicedob.toString();
                } else {
                    devicedob = device.dob.toISOString();
                }
                devicedob = devicedob.substring(0, devicedob.indexOf('T'));
                res.format({
                    html: function(){
                        res.render('devices/show', {
                            "devicedob" : devicedob,
                            "device" : device
                        });
                    },
                    json: function(){
                        res.json(device);
                    }
                });
            }
        });
    });

//GET the individual device by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the device within Mongo
    mongoose.model('Device').findById(req.id, function (err, device) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the device
            console.log('GET Retrieving ID: ' + device._id);
            //format the date properly for the value to show correctly in our edit form
            var devicedob ;
            if(device.dob == null) {
                devicedob = new Date();
                device.dob = devicedob;
                devicedob = devicedob.toString();
            } else {
                devicedob = device.dob.toISOString();
            }
            devicedob = devicedob.substring(0, devicedob.indexOf('T'));
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                    res.render('devices/edit', {
                        title: 'Device' + device._id,
                        "devicedob" : devicedob,
                        "device" : device
                    });
                },
                //JSON response will return the JSON output
                json: function(){
                    res.json(device);
                }
            });
        }
    });
});

//PUT to update a device by ID
router.put('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var version = req.body.version;
    var dob = req.body.dob;
    var owner = req.body.owner;

    //find the document by ID
    mongoose.model('Device').findById(req.id, function (err, device) {
        //update it
        device.update({
            name : name,
            version : version,
            dob : dob,
            owner : owner
        }, function (err, deviceID) {
            if (err) {
                res.send("There was a problem updating the information to the database: " + err);
            }
            else {
                //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                res.format({
                    html: function(){
                        res.redirect("/devices/" + device._id);
                    },
                    //JSON responds showing the updated values
                    json: function(){
                        res.json(device);
                    }
                });
            }
        })
    });
});

//DELETE a device by ID
router.delete('/:id/edit', function (req, res){
    //find device by ID
    mongoose.model('Device').findById(req.id, function (err, device) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            device.remove(function (err, device) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + device._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                        html: function(){
                            res.redirect("/devices");
                        },
                        //JSON returns the item with the message that is has been deleted
                        json: function(){
                            res.json({message : 'deleted',
                                item : device
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;