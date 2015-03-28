#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');


var app = express();

var port= process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ipaddr= process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
// Configure express with the settings found in
// our config.js file

require('./config')(app);


// Add the routes that the app will react to,
// as defined in our routes.js file

require('./routes')(app);

// This file has been called directly with
// `node index.js`. Start the server!

app.listen(port, ipaddr);