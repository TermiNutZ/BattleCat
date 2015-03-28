#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');


var app = express();

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}
// Configure express with the settings found in
// our config.js file

require('./config')(app);


// Add the routes that the app will react to,
// as defined in our routes.js file

require('./routes')(app);

// This file has been called directly with
// `node index.js`. Start the server!

app.listen(port);