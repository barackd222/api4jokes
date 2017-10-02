// Create and start server on configured port
var config = require('./config');
var server = require('./server');


console.log("Configuration Parameters: ");
console.log("API_GW_ENABLED=" + config.API_GW_ENABLED); 
console.log("API_GW_SERVER=" + config.API_GW_SERVER); 
console.log("API_GW_BASEURL=" + config.API_GW_BASEURL); 
console.log("API_GW_PORT=" + config.API_GW_PORT);
console.log("API_GW_USERNAME=" + config.API_GW_USERNAME);
console.log("PORT=" + config.PORT);

 server.listen(config.PORT, function () {

     console.log('Anki-TapAndLearn API server running on port ' + config.PORT + "!!!");
 });