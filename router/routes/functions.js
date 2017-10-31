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

exports.sendNotification = function (jk, name, mobile, method, callback) {

	try {
		console.log("Sending joke [" + jk.joke + "] to [" + mobile + "] by [" + method + "]");

		var host = config.API_GW_SERVER;
		var port = config.API_GW_PORT;

		switch (method.toUpperCase()) {
			case "SMS":
				method = "sms";
				break;
			case "VOICE":
				method = "voicecall";
				break;
			default:
				method = "sms";
		}

		var fullText = (name == null || name == "" || name == undefined) ? 'A friend ' : name + ', a friend ';
		fullText += 'thinks you will like this joke: '
		fullText += jk.joke
		fullText += ' - For more information go to http://apismadeeasy.cloud.';

		var path = "/api/notifications/" + method;
		var method = "POST";
		var body = {
			'to': mobile,
			'msg': fullText
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
	}).then(res => {

		var transJoke = res.text;
		console.log("Translated joke is [" + transJoke + "]");

		// Substituting original joke by the translation:
		jk.joke = transJoke;

		// Executing callback:
		callback(jk);

		// More info: https://www.npmjs.com/package/google-translate-api
		// For full list of supported languages: https://github.com/matheuss/google-translate-api/blob/master/languages.js

	}).catch(err => {
		console.error("Oopss, something went wrong while attempting to translate. Error was [" + err + "]");

		// Callback with original joke:
		callback(jk);
	});
}

exports.getBulkJokes = function (page, callback) {

	try {
		page = page == null || page == undefined ? 1 : page;
		console.log("Inside getBulkJokes, page is [" + page + "]");

		var host = config.JOKES_SERVER;
		var port = config.JOKES_PORT;

		var path = "/search?limit=30" + "&page=" + page;
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

exports.sendBulkJokes = function () {

        // Invoke API:
        // Call the voicecall API:        
        var host = config.API_GW_SERVER;
        var port = config.API_GW_PORT;
        var path = config.API_GW_BASEURL + "/bulk/jokes/notification";
        var method = "POST";
        var body = "";

		// Invoke API and execute callback:
		sendBulkJokeRequest(host, port, path, method, body, true);// Secured, i.e. to be run on HTTPS
};

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
			var fullResponse = "";

			res.on('data', function (chunk) {
				fullResponse += chunk;
			});

			res.on('end', function () {

				console.log('Response: ', fullResponse);

				try {
					var result = JSON.parse(fullResponse);
				} catch (error) {

					console.log("An unexpected error just occured [" + error + "] - Please verify input and try again");
				}
				// Executing callback function:
				callback(result);
			});
		});

		post_req.on('error', function (e) {
			console.log('There was a problem with request: ' + e.message);
			return undefined;
		});

		post_req.write(body);
		post_req.end();

	} catch (error) {

		console.log("An unexpected error just occured [" + error + "] - Please verify input and try again");
	}

}

// TODO: Re-visit this funciton and merge with 'sendRequest'
// This is a temp function... Necessary to send POST bulk jokes.
// The generic function "sendRequest" varies in the ['Content-Length': post_data.length]
// Also the required res/on end - That caused troubles for the POST request.
function sendBulkJokeRequest(host, port, path, method, post_data, secured) {

	var post_req = null;

	var options = {
		host: host,
		port: port,
		path: path,
		method: method,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache',
			'Content-Length': post_data.length
		}
	};

	if (secured) {

		post_req = https.request(options, function (res) {

			console.log("Sending [" + host + ":" + port + path + "] under method [" + method + "]");
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('Response: ', chunk);
			});
		});

	} else {

		post_req = http.request(options, function (res) {

			console.log("Sending [" + host + ":" + port + path + "] under method [" + method + "]");
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				console.log('Response: ', chunk);
			});
		});

	}


	post_req.on('error', function (e) {
		console.log('There was a problem with request: ' + e.message);
	});

	post_req.write(post_data);
	post_req.end();

}