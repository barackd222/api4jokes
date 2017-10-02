var config = require("../../config");
var http = require('http');
var https = require('https');
const translate = require('google-translate-api');


exports.getJoke = function (id, callback) {

	try {
		id = id == null || id == undefined ? "" : "j/" + id;
		console.log("Inside getJoke, id is [" + id + "]");

		var host = config.JOKES_SERVER;
		var port = config.JOKES_PORT;



		var path = "/" + id;
		var method = "GET";
		var body = {};

		body = JSON.stringify(body);

		var secured = true; // Default to secured HTTPS endpoint.

		console.log("Calling (host, port, path, method, body) [" +
			host + ", " + port + ", " + path + ", " + method +
			", " + body + "]");

		// Invoke API and execute callback:
		sendRequest(host, port, path, method, body, secured, callback);

	} catch (error) {

		console.log("An unexpected error just occured [" + error + "] - Please verify input and try again");
	}
};

exports.sendNotification = function (jk, mobile, method, callback) {

	try {
		console.log("Sending joke [" + jk.joke + "] to [" + mobile + "] by [" + method + "]");

		var host = config.API_GW_SERVER;
		var port = config.API_GW_PORT;

		switch(method.toUpperCase()){
			case "SMS":
				method = "sms";
				break;
			case "VOICE":
				method = "voicecall";
				break;
			default:
				method = "sms";
		}

		var path = "/api/notifications/" + method;
		var method = "POST";
		var body = {
			'to': mobile,
			'msg': 'A friend thinks you will like this joke: ' + jk.joke + ' - For more information go to http://apismadeeasy.cloud.'
		};

		body = JSON.stringify(body);

		var secured = true; // Default to secured HTTPS endpoint.

		console.log("Calling (host, port, path, method, body) [" +
			host + ", " + port + ", " + path + ", " + method +
			", " + body + "]");

		// Invoke API and execute callback:
		sendRequest(host, port, path, method, body, secured, callback);
	} catch (error) {

		console.log("An unexpected error just occured [" + error + "] - Please verify input and try again");
	}
};

exports.translateJoke = function (jk, lang, callback) {

	translate(jk.joke, {
		from: 'en',
		to: lang
	}).then(function(res){

		var transJoke = res.text;
		console.log("Translated joke is [" + transJoke + "]");

		// Substituting original joke by the translation:
		jk.joke = transJoke;

		// Executing callback:
		callback(null, jk);

		// More info: https://www.npmjs.com/package/google-translate-api
		// For full list of supported languages: https://github.com/matheuss/google-translate-api/blob/master/languages.js

	}).catch(function(err){
		console.error("Oops, something went wrong while attempting to translate. Error was [" + err + "]");

		// Callback with original joke:
		callback(err, jk);
	});
}

function sendRequest(host, port, path, method, body, secured, callback) {

	try {
		var post_req = null;

		var options = {
			host: host,
			port: port,
			path: path,
			method: method,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache'
			}
		};

		var transport = secured ? https : http;

		post_req = transport.request(options, function (res) {

			console.log("Sending [" + host + ":" + port + path + "] under method [" + method + "]");
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('Response: ', chunk);

				try{
					var result = JSON.parse(chunk);
				}catch(err){
					console.log("An unexpected error just occured [" + err + "] - Please verify input and try again");
					callback(err);
					return;
				}
				// Executing callback function:
				callback(null, result);
			});
		});

		post_req.on('error', function (e) {
			console.log('There was a problem with request: ' + e.message);
			callback(e);
			return;
		});

		post_req.write(body);
		post_req.end();

	} catch (error) {

		console.log("An unexpected error just occured [" + error + "] - Please verify input and try again");
		callback(err);
	}

}