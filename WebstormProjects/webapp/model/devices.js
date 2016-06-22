var mongoose = require('mongoose');
var moment = require('moment');
var deviceSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true
    },
    version: {
        type : String,
        required : true
    },
    dob: { 
        type: Date, 
        default: Date.now,
        required : true
    },
    owner: {
        type : String,
        required : true
    }
});
mongoose.model('Device', deviceSchema);

