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

        funct.getJoke(null, function (jk) {

            res.send({
                "id": jk.id,
                "joke": jk.joke
            });

        })

    });


    /* Translate a Joke. */
    app.get('/jokes/:id/translate', function (req, res) {

        // Retrieving parameters:
        var id = req.params.id;
        var lang = req.query.language;


        if (id == null || id == undefined ||
            lang == null || lang == undefined) {
            log("GET", "/jokes/:id", "Id or language are empty or invalid... Nothing to do...");
            res.status(400).end("Id or mobile are empty or invalid... Nothing to do..."); //Bad request...
            return;
        }

        log("GET", "/jokes/:id/translate", "Parameters used are joke id [" + id + "], language is [" + lang +
            "]");

        try {

            // 1) Retrieve joke by id:
            funct.getJoke(id, function (jk) {

                if (jk.id == null || jk.id == undefined ||
                    jk.joke == null || jk.joke == undefined) {

                    console.log("Joke not found, verify Id and try again.");

                    // Something wrong happened, we should not have reached this point...                    
                    res.status(400).end("Joke not found, verify Id and try again."); //Bad request...

                    return;
                }


                console.log("Retrieved joke is [" + JSON.stringify(jk) + "]");

                // 2) Translate joke:
                console.log("Language to be used is [" + lang + "]");

                funct.translateJoke(jk, lang, function (jk) {

                    console.log("Translated joke is [" + JSON.stringify(jk) + "]");

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

        } catch (err) {

            console.log("There was a critical error [" + err + "] - Let's make sure the server does not crash.");

            // Something wrong happened, we should not have reached this point...
            res.status(400).end("Oops, something wrong happened, please validate your parameters " +
                "and try it again."); //Bad request...
        }


    });

    /* POST jokes to translate and share */
    app.post('/jokes/:id', function (req, res) {

        // Retrieving parameters:
        var id = req.params.id;
        var lang = req.query.language;
        var mobile = req.query.mobile;
        var method = req.query.method
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
            funct.getJoke(id, function (jk) {

                if (jk.id == null || jk.id == undefined ||
                    jk.joke == null || jk.joke == undefined) {

                    console.log("Joke not found, verify Id and try again.");

                    // Something wrong happened, we should not have reached this point...
                    res.status(400).end("Joke not found, verify Id and try again."); //Bad request...

                    return;
                }


                console.log("Retrieved joke is [" + JSON.stringify(jk) + "]");

                // 2) Translate joke if required:
                if (lang != null && lang != undefined) {

                    console.log("Language to be used is [" + lang + "]");

                    funct.translateJoke(jk, lang, function (jk) {

                        console.log("Translated joke is [" + JSON.stringify(jk) + "]");

                        // 2.2 Send joke by decided method:
                        console.log("Mobile to be used is [" + mobile + "], method is [" + method + "]");

                        funct.sendNotification(jk, null, mobile, method, function (msg) {

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

                        funct.sendNotification(jk, null, mobile, method, function (msg) {

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


    /**
     *  HIDDEN APIs FROM DOCUMENTATION... USED ONLY FOR DEMO PURPOSES...
     * 
     */

    /**
     * This API is going to be used by Alexa. It simply facades the 
     * POST /bulk/jokes/notification as a GET operation.
     */
    app.get('/bulk/jokes/notification', function (req, res) {

        funct.sendBulkJokes();

        // Return successfully Accepted call.
        res.sendStatus(202).end();

    });


    /* POST jokes to translate and share */
    app.post('/load/jokes2db', function (req, res) {

        log("GET", "load/jokes2db", "Inside load/jokes2db POST API call...");

        // At the time of writing this code, there were 13 pages availabel with 30 jokes per page.
        // I am grabbing them all...
        for (var i = 1; i <= 13; ++i) {

            // 1) Retrieve list of jokes:
            funct.getBulkJokes(i, function (jk) {

                if (jk == null || jk == undefined || jk.results == null ||
                    jk.results == undefined) {

                    console.log("Jokes not found, read logs and try again.");

                    // Something wrong happened, we should not have reached this point...
                    res.status(400).end("Jokes not found, read logs and try again."); //Bad request...
                    return;
                }


                console.log("Retrieved jokes are [" + JSON.stringify(jk.results) + "]");

                // Set our internal DB variable
                var db = req.db;
                var arrJokes = jk.results;

                // Set collection
                var collection = db.get('jokescollection');

                // Insert row to MongoDB
                collection.insert(arrJokes, function (err, doc) {
                    if (err) {
                        res.send("Oops, something wrong just happened while attempting to store array of Jokes.");
                    } else {
                        // Return succes answer
                        res.send({
                            message: 'Joke records were added successfully...'
                        });
                    }
                });
            });

            // Waiting 1 sec to iterate to next page
            setTimeout(function () {
                console.log("Ready to iterate again!!!");
            }, 1000); //1 second delayed between API calls.
        }

    });


    // Processing Bulk Jokes Notifications

    /**
     * 1. Get list of Jokes
     * 2. Get list of Contacts
     * 3. For each contact, get a random joke
     * 4. Send by SMS Notification service
     */
    app.post('/bulk/jokes/notification', function (request, response) {

        console.log("Processing bulk jokes notifications...");

        // Retrieving List from MongoDB:        
        var db = request.db;
        var users = {};
        var arrJokes = {};


        console.log("Req usercollection and jokescollection");
        var userCollection = db.get('usercollection');
        var jokesCollection = db.get('jokescollection');

        console.log("Retrieving list of Jokes");

        jokesCollection.find({}, {}, function (e, docs) {

            arrJokes = {
                "jokes": docs
            };

            //console.log("Jokes found are [" + JSON.stringify(jokes) + "]");

            console.log("Jokes found [" + arrJokes.jokes.length + "]");

            userCollection.find({}, {}, function (e, docs) {

                if (docs == null || docs == undefined) {
                    res.status(400).end("usercollection null or undefined... Validate and try again."); //Bad request...
                    return;
                }

                // Iterating through DOC JSON array:
                users = {
                    "contacts": docs
                };

                //console.log("usrs found [" + JSON.stringify(users) + "]");

                console.log("List of contacts found [" + users.contacts.length + "]");
                console.log("Iterating through contacts JSON array");
                var i = 0;

                for (; i < users.contacts.length; ++i) {

                    // Get current key:
                    currentValue = users.contacts[i];

                    if (currentValue != null) {

                        console.log("Current contact found [" + JSON.stringify(currentValue) + "]");

                        // Do something here with the value...
                        to = currentValue.mobile;
                        to = to.indexOf("+") != -1 ? to : "+" + to;

                        name = currentValue.name;

                        // Getting a random joke for this user:
                        x = Math.floor(Math.random() * arrJokes.jokes.length);
                        msg = arrJokes.jokes[x];

                        if (msg == null || msg == undefined) {
                            console.log("Joke not retrieved properly. Bad request found, thus nothing to do with this contact...");
                            //response.sendStatus(400);//Bad request...
                            return;
                        }

                        if (msg.joke == null ||
                            msg.joke == undefined || to == null || to == undefined ||
                            name == null || name == undefined) {

                            console.log("NAME, Joke Message or To number are not defined. Bad request found, thus nothing to do with this contact...");
                            //response.sendStatus(400);//Bad request...
                            return;
                        }

                        console.log("*** Random Joke obtained is [" + msg.joke + "], at index [" + x + "]");

                        funct.sendNotification(msg, name, to, "sms", function (msg) {

                            console.log("Notification to [" + name + "] sent successfully!");

                        });
                        // Waiting 0.5 secs to iterate
                        setTimeout(function () {
                            //console.log("Ready to iterate again!!!");
                        }, 500); //0.5 seconds delayed between API calls.


                    } else {
                        db.close();
                    }
                };

                console.log("It is done iterating... Finished processing [" + i + "] number of bulk jokes. Good bye!");
            });

        });

        // Return successfully Accepted call.
        response.sendStatus(202).end();

    });



    /**
     * Adding MongoDB Admin API Tasks:
     * 
     */

    /* GET myTestDB page. */
    app.get('/contacts', function (req, res) {


        console.log("Req db");
        var db = req.db;

        console.log("Req collection");
        var collection = db.get('usercollection');

        console.log("Collection find");
        collection.find({}, {}, function (e, docs) {

            res.send({
                "contacts": docs
            });

        });
    });

    /* POST Add multiple Contacts */
    app.post('/contacts', function (req, res) {

        // Set our internal DB variable
        var db = req.db;
        var contacts = req.body.contacts;

        if (contacts == null || contacts == undefined) {
            console.log("contacts payload detected but no contacts on it... Nothing to do...");
            //response.sendStatus(400);//Bad request...
            return;
        }

        console.log("Array of contacts to be inserted is [" + JSON.stringify(contacts) + "]");

        // Set collection
        var collection = db.get('usercollection');

        // Insert row to MongoDB
        collection.insert(contacts, function (err, doc) {
            if (err) {
                res.send("Oops, something wrong just happened.");
            } else {
                // Return succes answer
                res.send({
                    message: 'Records were added successfully...'
                });
            }
        });
    });

    /* POST to Add User */
    app.post('/contact', function (req, res) {

        // Set our internal DB variable
        var db = req.db;

        // Get post values. These rely on the "name" attributes		
        var name = req.body.name;
        var mobile = req.body.mobile;
        var msg = req.body.msg;

        console.log("Contact to be inserted is Name [" + name + "], Mobile [" + mobile + "], msg [" + msg + "]");

        if (name == null || name == undefined || mobile == null || mobile == undefined || msg == null || msg == undefined) {
            console.log("Name, To or Message were not defined. Bad request found, thus nothing to do...");
            res.status(400).end("Name, To or Message were not defined. Bad request found, thus nothing to do..."); //Bad request...
        }


        // Set collection
        var collection = db.get('usercollection');

        // Insert row to MongoDB
        collection.insert({
            "name": name,
            "mobile": mobile,
            "msg": msg
        }, function (err, doc) {
            if (err) {
                res.send("Oops, something wrong just happened.");
            } else {
                // Return succes answer
                res.send({
                    message: 'Record was added successfully...'
                });
            }
        });
    });

    app.delete('/contacts', function (req, res) {


        console.log("Req db");
        var db = req.db;

        console.log("Req collection");
        var collection = db.get('usercollection');

        console.log("Collection find");

        //Remove all documents:
        collection.remove();

        // Return succes answer
        res.send({
            message: 'Records were  deleted successfully...'
        });
    });



    /** Note: This following APIs are hidden to documentation.
     *  It is only to be used by Administrators with responsibility.
     **/

    /* Get All Collections by Name */
    app.get('/collection/:cname', function (req, res) {

        var collectionName = req.params.cname;

        if (collectionName == null || collectionName == undefined) {
            log("GET", "/collection/:cname", "collection name empty or invalid... Nothing to do...");
            res.status(400).end("Collection name empty or invalid... Nothing to do..."); //Bad request...
            return;
        }


        var DB_COLLECTION_NAME = collectionName;
        var db = req.db;

        log("GET", "/collection/:cname", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);

        collection.find({}, {}, function (e, docs) {

            log("GET", "/collection/:cname", "Found:" + JSON.stringify({
                docs
            }));
            res.send({
                docs
            });

        });
    });
    /* Delete All Collections by Name*/
    app.delete('/collection/:cname', function (req, res) {

        var collectionName = req.params.cname;

        if (collectionName == null || collectionName == undefined) {
            log("DELETE", "/collection/:cname", "collection name empty or invalid... Nothing to do...");
            res.status(400).end("Collection name empty or invalid... Nothing to do..."); //Bad request...
            return;
        }


        var DB_COLLECTION_NAME = collectionName;

        var db = req.db;
        log("DELETE", "/collection/:cname", "DB_COLLECTION_NAME [" + DB_COLLECTION_NAME + "]");
        var collection = db.get(DB_COLLECTION_NAME);



        //Remove all documents:
        collection.remove();

        // Return succes answer
        log("DELETE", "/collection/:cname", "All [" + DB_COLLECTION_NAME + "] Records were  deleted successfully...");
        res.send({
            Message: 'Records were  deleted successfully...'
        });
    });


};