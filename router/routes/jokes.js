var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require("../../config");
var funct = require('./functions');


//CRI change:
var bodyParser = require('body-parser');

// Configure application routes
module.exports = function (app) {

    // CRI change to allow JSON parsing from requests:    
    app.use(bodyParser.json()); // Support for json encoded bodies 
    app.use(bodyParser.urlencoded({
        extended: true
    })); // Support for encoded bodies

    function log(apiMethod, apiUri, msg) {
        console.log("[" + apiMethod + "], [" + apiUri + "], [" + msg + "], [UTC:" +
            new Date().toISOString().replace(/\..+/, '') + "]");
    }

    /**
     * Adding APIs:
     * 
     */

    /* GET Jokes. */
    app.get('/jokes', function (req, res) {

        funct.getJoke(null, function(err, jk) {

            res.send({
                "id": jk.id,
                "joke": jk.joke
            });

        })

    });


    /* Get a Joke, optionally translating. */
    app.get('/jokes/:id', function (req, res) {

        // Retrieving parameters:
        var id = req.params.id;
        var lang = req.query.language;


        if (id == null || id == undefined) {
            log("GET", "/jokes/:id", "Id empty or invalid... Nothing to do...");
            res.status(400).end("Id empty or invalid... Nothing to do..."); //Bad request...
            return;
        }

        log("GET", "/jokes/:id", "Parameters used are joke id [" + id + "]" +(lang ? ", language is [" + lang +"]" : ""));

        try {

            // 1) Retrieve joke by id:
            funct.getJoke(id, function (err, jk) {

                if (jk.id == null || jk.id == undefined ||
                    jk.joke == null || jk.joke == undefined) {

                    console.log("Joke not found, verify Id and try again.");

                    // Something wrong happened, we should not have reached this point...
                    res.status(404).send("Joke not found, verify Id and try again."); //Bad request...
                    return;
                }


                console.log("Retrieved joke is [" + JSON.stringify(jk) + "]");
                var joke = {
                            id: jk.id,
                            joke: jk.joke
                            };
                if(lang){
                    // 2) Translate joke:
                    console.log("Language to be used is [" + lang + "]");

                    funct.translateJoke(joke, lang, function (err, transJk) {

                        console.log("Translated joke is [" + JSON.stringify(transJk) + "]");
                        var transJoke = {
                            id: transJk.id,
                            joke: transJk.joke
                            };
                        try {
                            res.json(transJoke);
                        } catch (error) {
                            console.log("There was a critical error [" + error + "] - Let's make sure the server does not crash.");
                            // Something wrong happened, we should not have reached this point...
                            res.status(400).end("Oops, something wrong happened, please validate your parameters " +
                                "and try it again."); //Bad request...
                        }
                    });
                }else{
                    //return as is
                    res.status(200).json(joke);
                }
                

            });

        } catch (err) {

            console.log("There was a critical error [" + err + "] - Let's make sure the server does not crash.");

            // Something wrong happened, we should not have reached this point...
            res.status(400).end("Oops, something wrong happened, please validate your parameters " +
                "and try it again."); //Bad request...
        }


    });

    /* POST jokes to translate and share */
    app.post('/jokes/:id', function (req, res) {

        var host = config.API_GW_SERVER;
        var port = config.API_GW_PORT;
        if(!config.API_GW_PORT || isNaN(config.API_GW_PORT) 
            || !config.API_GW_SERVER || config.API_GW_SERVER === "NA"){
            res.status(405).send("Server has not been configured with details of the notification service.");
            return;
        }

        // Retrieving parameters:
        var id = req.params.id;
        var lang = req.query.language;
        var mobile = req.query.mobile;
        var method = req.query.method;
        method = (method == null || method == undefined ? "sms" : method); // SMS is default method


        if (id == null || id == undefined ||
            mobile == null || mobile == undefined) {
            log("GET", "/jokes/:id", "Id or mobile are empty or invalid... Nothing to do...");
            res.status(400).end("Id or mobile are empty or invalid... Nothing to do..."); //Bad request...
            return;
        }

        log("GET", "/jokes", "Parameters used are joke id is [" + id + "], language is [" + lang +
            "], mobile is [" + mobile + "]");

        try {
            // 1) Retrieve joke by id:
            funct.getJoke(id, function(err, jk) {
                if (jk.id == null || jk.id == undefined ||
                    jk.joke == null || jk.joke == undefined) {

                    console.log("Joke not found, verify Id and try again.");

                    // Something wrong happened, we should not have reached this point...
                    res.send("Joke not found, verify Id and try again."); //Bad request...

                    return;
                }
                console.log("Retrieved joke is [" + JSON.stringify(jk) + "]");
                // 2) Translate joke if required:
                if (lang != null && lang != undefined) {

                    console.log("Language to be used is [" + lang + "]");

                    funct.translateJoke(jk, lang, function(err, jk) {

                        console.log("Translated joke is [" + JSON.stringify(jk) + "]");

                        // 2.2 Send joke by decided method:
                        console.log("Mobile to be used is [" + mobile + "], method is [" + method + "]");

                        funct.sendNotification(jk, mobile, method, function (msg) {

                            console.log("Notification sent successfully!");
                            // 2.3) Return final joke:
                            try {
                                res.send({
                                    "id": jk.id,
                                    "joke": jk.joke
                                });
                            } catch (error) {
                                console.log("There was a critical error [" + err + "] - Let's make sure the server does not crash.");

                                // Something wrong happened, we should not have reached this point...
                                res.status(400).end("Oops, something wrong happened, please validate your parameters " +
                                    "and try it again."); //Bad request...
                            }

                        });

                    });

                } else {

                    // 3) Translation is not required, let's just send joke by required method:
                    if (mobile != null && mobile != undefined) {

                        console.log("Mobile to be used is [" + mobile + "], method is [" + method + "]");

                        funct.sendNotification(jk, mobile, method, function (err, msg) {

                            // 4) Return final joke:
                            res.send({
                                "id": jk.id,
                                "joke": jk.joke
                            });

                        });
                    }
                }
            });
        } catch (err) {
            console.log("There was a critical error [" + err + "] - Let's make sure the server does not crash.");
            // Something wrong happened, we should not have reached this point...
            res.status(400).end("Oops, something wrong happened, please validate your parameters " +
                "and try it again."); //Bad request...
        }
    });
};