"use strict";
module.exports = function (libraries) {
    //var Apio = require("../apio.js")(require("../configuration/default.js"));
    //var bodyParser = require("body-parser");
    //var express = require("express");
    //var fs = require("fs");
    //
    //var app = express();
    //var http = require("http").Server(app);
    //var socketServer = require("socket.io")(http)

    var Apio = require("../apio.js")(require("../configuration/default.js"));
    var MongoClient = require("mongodb").MongoClient;
    var bodyParser = libraries["body-parser"];
    var configuration = require("../configuration/default.js");
    var express = libraries.express;
    var fs = libraries.fs;

    var app = express();
    var http = libraries.http.Server(app);
    var socketServer = libraries["socket.io"](http);

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        next();
    });

    app.use(bodyParser.json({
        limit: "50mb"
    }));

    app.use(bodyParser.urlencoded({
        limit: "50mb",
        extended: true
    }));

    process.on("SIGINT", function () {
        console.log("About to exit");
        Apio.Database.db.close();
        process.exit();
    });

    var port = 8101;

    if (process.argv.indexOf("--http-port") > -1) {
        port = Number(process.argv[process.argv.indexOf("--http-port") + 1]);
    }

    MongoClient.connect("mongodb://" + configuration.database.hostname + ":" + configuration.database.port + "/" + configuration.database.database, function (error, db) {
        if (error) {
            console.log("Unable to get database");
        } else if (db) {
            db.collection("Services").findOne({name: "autoInstall"}, function (err, service) {
                if (err) {
                    console.log("Error while getting service autoInstall: ", err);
                    console.log("Unable to find service autoInstall");
                    db.collection("Services").insert({
                        name: "autoInstall",
                        show: "AutoInstall",
                        url: "https://github.com/ApioLab/Apio-Services",
                        username: "",
                        password: "",
                        port: String(port)
                    }, function (err) {
                        if (err) {
                            console.log("Error while creating service Notification on DB: ", err);
                        } else {
                            console.log("Service Notification successfully created");
                        }
                    });
                } else if (service) {
                    console.log("Service autoInstll exists");
                } else {
                    console.log("Unable to find service Notification");
                    db.collection("Services").insert({
                        name: "autoInstall",
                        show: "AutoInstall",
                        url: "https://github.com/ApioLab/Apio-Services",
                        username: "",
                        password: "",
                        port: String(port)
                    }, function (err) {
                        if (err) {
                            console.log("Error while creating service Notification on DB: ", err);
                        } else {
                            console.log("Service Notification successfully created");
                        }
                    });
                }
            });
            console.log("Database correctly initialized");
        }
    });

    //Apio.io = require("socket.io-client")("http://localhost:" + Apio.Configuration.http.port);
    //Apio.io = libraries["socket.io-client"]("http://localhost:" + Apio.Configuration.http.port, {query: "apioId=" + Apio.System.getApioIdentifier()});
    //Apio.io = libraries["socket.io-client"]("http://localhost:" + Apio.Configuration.http.port, {query: "associate=autoInstall"});
    Apio.io = libraries["socket.io-client"]("http://localhost:" + Apio.Configuration.http.port, {query: "associate=autoInstall&token=" + Apio.Token.getFromText("autoInstall", fs.readFileSync("./" + Apio.Configuration.type + "_key.apio", "utf8"))});

    app.post("/installNew", function (req, res) {
        console.log("-------------SERVICE AUTOINSTALL ROUTE INSTALLNEW---------");
        if (Apio.Configuration.autoinstall.default == false) {

            Apio.Database.getMaximumObjectId(function (error, data) {
                if (error) {
                    console.log('error: ' + error);
                }
                else if (data) {
                    console.log('data is: ' + data);
                    var dummy = (parseInt(data) + 1).toString();

                    //qui rinomino i cazzetti nell'id attuale

                    var id = '*_TMP_*';
                    var path = 'public/applications/newfile/' + req.body.appId + '/' + id;
                    //var path = '../public/applications/newfile/' + req.body.appId + '/' + id;
                    var object = {};
                    var jsonObject = {};
                    if (fs.existsSync(path + '/adapter.js')) {
                        object.adapter = fs.readFileSync(path + '/adapter.js')
                    }
                    object.icon = fs.readFileSync(path + '/icon.png');
                    object.js = fs.readFileSync(path + '/' + id + '.js', {encoding: 'utf8'});
                    object.html = fs.readFileSync(path + '/' + id + '.html', {encoding: 'utf8'});
                    //object.json = fs.readFileSync(path+'.json', {encoding: 'utf8'});
                    object.mongo = fs.readFileSync(path + '/' + id + '.mongo', {encoding: 'utf8'});
                    console.log("percorso: ", path + '/' + id + '.mongo');
                    jsonObject = JSON.parse(object.mongo);
                    console.log("JSONOBJECT", jsonObject)
                    if (jsonObject.hasOwnProperty('subapps')) {
                        if (jsonObject.subapps.hasOwnProperty('log')) {
                            object.subapps = {
                                log: {}
                            };
                            console.log("primoIF")
                            object.subapps.log.html = fs.readFileSync(path + '/subapps/log.html', {encoding: 'utf8'});
                            object.subapps.log.js = fs.readFileSync(path + '/subapps/log.js', {encoding: 'utf8'});
                        }
                    }


                    path = path + '/_' + id;
                    object.ino = fs.readFileSync(path + '/_' + id + '.ino', {encoding: 'utf8'});
                    object.makefile = fs.readFileSync(path + '/Makefile', {encoding: 'utf8'});
                    var numberName = ""
                    //jsonObject = JSON.parse(object.json);

                    console.log(jsonObject._id);
                    jsonObject._id = "";
                    //Per contare i numeri
                    jsonObject.type = req.body.appId;
                    Apio.Database.db.collection('Objects').find({appId: req.body.appId}).toArray(function (err, result) {
                        if (err) {
                            console.log("Error")
                        } else {

                            var dummy = (parseInt(data) + 1).toString();
                            console.log('new dummy is: ' + dummy)


                            object.js = object.js.replace('ApioApplication' + id, 'ApioApplication' + dummy + '');
                            object.js = object.js.replace('ApioApplication' + id, 'ApioApplication' + dummy + '');
                            object.js = object.js.replace('ApioApplication' + id, 'ApioApplication' + dummy + '');

                            object.html = object.html.replace('ApioApplication' + id, 'ApioApplication' + dummy + '');
                            object.html = object.html.replace('ApioApplication' + id, 'ApioApplication' + dummy + '');
                            object.html = object.html.replace('applications/' + id + '/' + id + '.js', 'applications/' + dummy + '/' + dummy + '.js');
                            if (object.hasOwnProperty('subapps')) {
                                if (object.hasOwnProperty('log')) {
                                    object.subapps.log.html = object.subapps.log.html.replace(id, dummy);
                                }
                            }


                            //object.json=object.json.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"');
                            //object.mongo=object.mongo.replace('"objectId":"'+id+'"','"objectId":"'+dummy+'"')
                            object.mongo = JSON.parse(object.mongo);
                            console.log('"objectId before":"' + object.mongo.objectId + '"')
                            object.mongo.objectId = dummy;
                            console.log("Result: ");
                            console.log(result.length.toString())
                            console.log('object.mongo.name prima: ' + object.mongo.name);

                            object.mongo.name = req.body.appId + " " + parseInt(result.length + 1).toString();

                            console.log('object.mongo.name dopo: ' + object.mongo.name);

                            var date = new Date();
                            var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
                            var month = date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
                            var year = date.getFullYear() < 10 ? "0" + date.getFullYear() : date.getFullYear();

                            object.mongo.address = dummy;
                            var theAddress = dummy;
                            object.mongo.type = "object";
                            object.mongo.installation = "autoinstalled";
                            object.mongo.created = year + "-" + month + "-" + day;
                            object.mongo.data = req.body.data
                            if (req.hasOwnProperty('session')) {
                                if (req.hasOwnProperty('email')) object.mongo.user = [{email: req.session.email}];
                            }

                            object.mongo.appId = req.body.appId;
                            object.mongo.user = [{email: "admin"}]
                            //object.mongo.user.push("admin")
                            object.mongo.apioId = Apio.System.getApioIdentifier();
                            delete object.mongo._id;
                            console.log('"objectId after":"' + object.mongo.objectId + '"')


                            Apio.Database.db.collection('Objects').insert(object.mongo, function (err, data) {
                                if (err)
                                    console.log(err);
                                else {
                                    //var path = '../public/applications/';
                                    var path = 'public/applications/';
                                    console.log('path + dummy:' + path + dummy);

                                    fs.mkdirSync(path + '/' + dummy);
                                    fs.mkdirSync(path + '/' + dummy + '/_' + dummy);
                                    fs.mkdirSync(path + '/' + dummy + '/subapps');
                                    if (object.hasOwnProperty('adapter')) {
                                        fs.writeFileSync(path + '/' + dummy + '/adapter.js', object.adapter);
                                    }
                                    fs.writeFileSync(path + '/' + dummy + '/icon.png', object.icon);
                                    fs.writeFileSync(path + '/' + dummy + '/' + dummy + '.html', object.html);
                                    fs.writeFileSync(path + '/' + dummy + '/' + dummy + '.js', object.js);
                                    fs.writeFileSync(path + '/' + dummy + '/' + dummy + '.mongo', JSON.stringify(object.mongo));
                                    fs.writeFileSync(path + '/' + dummy + '/_' + dummy + '/_' + dummy + '.ino', object.ino);
                                    fs.writeFileSync(path + '/' + dummy + '/_' + dummy + '/Makefile', object.makefile);
                                    for (var i in object.subapps) {
                                        fs.writeFileSync(path + '/' + dummy + '/subapps/' + i + ".html", object.subapps[i].html);
                                        fs.writeFileSync(path + '/' + dummy + '/subapps/' + i + ".js", object.subapps[i].js);
                                    }
                                    //fs.writeFileSync(path+'/'+dummy+'/' + dummy + '.json',object.json);
                                    //
                                    //deleteFolderRecursive('newfile');
                                    //fs.unlinkSync('newfile.tar.gz');
                                    var o = {}
                                    o.name = "apio_server_new"
                                    o.data = dummy
                                    Apio.io.emit("socket_service", o);

                                    var cloudNewData = {
                                        apioId: Apio.System.getApioIdentifier(),
                                        html: object.html,
                                        icon: "data:image/png;base64," + fs.readFileSync("public/applications/newfile/" + req.body.appId + "/*_TMP_*/icon.png", {encoding: "base64"}),
                                        ino: object.ino,
                                        js: object.js,
                                        makefile: object.makefile,
                                        mongo: JSON.stringify(object.mongo),
                                        obj: object.mongo
                                    };

                                    if (object.subapps) {
                                        cloudNewData.subapps = {};
                                        for (var i in object.subapps) {
                                            cloudNewData.subapps[i] = {
                                                html: object.subapps[i].html,
                                                js: object.subapps[i].js
                                            };
                                        }
                                    }

                                    if (Apio.Configuration.type === "gateway" && Apio.Configuration.remote.enabled) {
                                        Apio.Remote.socket.emit("apio.create.new.app", cloudNewData);
                                    }
									console.log('SET-MESH1');
                                    if (theAddress < 10) {
                                        theAddress = "000" + theAddress + "01";
                                    }
                                    else if (theAddress > 9 && theAddress < 100) {
                                        theAddress = "00" + theAddress + "01";

                                    } else if (theAddress > 99 && theAddress < 1000) {
                                        theAddress = "0" + theAddress + "01";

                                    } else {
                                        theAddress = theAddress + "01";
                                    }
                                    
                                    var c = {}
                                    c.name = "apio_serial_send"
                                    c.data = "l9999:setmesh:" + theAddress + "-"
                                    console.log('SET-MESH2', c);
                                    Apio.io.emit("socket_service", c);
									console.log('SET-MESH3 LANCIATO SOCKET SERVICE');
                                    res.send({id: dummy});


                                }
                            });

                        }
                    })
                }
            });
        }
    });

    var log = function (data) {
        console.log(data);
        //socketServer.emit("autoinstall_update", data);
        socketServer.emit("send_to_client", {
            message: "autoinstall_update",
            data: data
        });
    };

    Apio.io.on("apio_autoinstall_service", function (data) {
        //var host = $location.host();
        //log("SONO DENTRO ALL'EVENTO SULLA SOCKET APIO_AUTOINSTALL_SERVICE");
        if (data) {
            var appId = data;
            //log("-------------AUTO-INSTALLAZIONE-----------------");
            Apio.Database.getMaximumObjectId(function (error, objectId) {
                if (error) {
                    //log("error: " + error);
                } else if (objectId) {
                    var flagAddressOk = 0;
                    objectId = Number(objectId) + 1;
                    //log(objectId);
                    Apio.Database.db.collection("Objects").findOne({
                        address: objectId
                    }, function (err, res) {
                        if (res == null) {
                            log("Address OK!")
                            flagAddressOk = 1;
                            var address = objectId;
                            var o = {}
                            o.name = "apio_new_object";
                            o.data = {}
                            o.data.address = address;
                            o.data.appId = appId;
                            //var path = '../public/applications/newfile/' + appId;
                            var path = 'public/applications/newfile/' + appId;
                            console.log('appID', appId)
                            fs.readFile(path + '/autoInstall.html', function (err, result) {
                                if (err) {
                                    console.log("ERRORE")
                                    //o.data.autoInstall = fs.readFileSync('../public/applications/newfile/defaultAutoinstall.html', {encoding: 'utf8');
                                    o.data.autoInstall = "false";
                                    Apio.io.emit("socket_service", o);
                                } else {
                                    o.data.autoInstall = fs.readFileSync(path + '/autoInstall.html', {encoding: 'utf8'});
                                    Apio.io.emit("socket_service", o);
                                }
                            });
                        } else {
                            log("Address Not OK");
                            flagAddressOk = 0;
                        }
                    });
                }
            });
        }
    });

    process.on("uncaughtException", function (err) {
        log("Caught exception: " + err);
    });

    socketServer.on("connection", function (socket) {
        console.log("client connected");
        //SERVE DOPO QUANDO SI DEFINISCONO I DATI DEL SERVICE
        socket.on("apio_install_new_object_final", function (data) {
            if (data.protocol === "enocean") {
                if (data.hasOwnProperty("eep") && data.hasOwnProperty("address")) {
                    Apio.Database.getMaximumObjectId(function (error, objectId) {
                        if (error) {
                            console.log("Error while getting maximum objectId: ", error);
                        } else if (objectId) {
                            objectId = String(Number(objectId) + 1);
                            fs.stat("public/applications/newfile/" + data.eep, function (err, stats) {
                                if (err) {
                                    console.log("Does not exist any template for the eep: ", data.eep);
                                } else if (stats && stats.isDirectory()) {
                                    fs.mkdir("public/applications/" + objectId, function (e_mkdir) {
                                        if (e_mkdir) {
                                            console.log("Error while creating directory public/applications/" + objectId + ": ", e_mkdir);
                                        } else {
                                            fs.readFile("public/applications/newfile/" + data.eep + "/application.mongo", "utf8", function (e_f1, collection) {
                                                if (e_f1) {
                                                    console.log("Error while reading file public/applications/newfile/" + data.eep + "/application.mongo: ", e_f1);
                                                } else if (collection) {
                                                    collection = JSON.parse(collection);
                                                    collection.objectId = objectId;
                                                    collection.apioId = Apio.System.getApioIdentifier();
                                                    Apio.Database.db.collection("Objects").insert(collection, function (err_db) {
                                                        if (err_db) {
                                                            console.log("Error while adding object " + objectId + " to the DB: ", err_db);
                                                        } else {
                                                            console.log("Object " + objectId + " successfully inserted to the DB");
                                                        }
                                                    });

                                                    var to_add = {};
                                                    to_add["enocean." + data.address] = {
                                                        type: data.eep,
                                                        objectId: objectId
                                                    };

                                                    for (var prop in collection.properties) {
                                                        to_add["enocean." + data.address][prop] = {};

                                                        Apio.io.emit("apio_change_bind_to_property", {
                                                            command: "add",
                                                            addData: {
                                                                protocol: "enocean",
                                                                address: data.address,
                                                                objectId: objectId,
                                                                type: data.eep,
                                                                originalProperty: prop
                                                            }
                                                        });
                                                    }

                                                    Apio.Database.db.collection("Communication").update({name: "addressBindToProperty"}, {$set: to_add}, function (err_comm_updt) {
                                                        if (err_comm_updt) {
                                                            console.log("Error while updating communication addressBindToProperty: ", err_comm_updt);
                                                        } else {
                                                            console.log("Successfully added data to communication addressBindToProperty");
                                                        }
                                                    });
                                                }
                                            });

                                            fs.readFile("public/applications/newfile/" + data.eep + "/application.html", "utf8", function (e_f1, data) {
                                                if (e_f1) {
                                                    console.log("Error while reading file public/applications/newfile/" + data.eep + "/application.html: ", e_f1);
                                                } else if (data) {
                                                    data = data.replace(/_TMP_/g, objectId);
                                                    fs.writeFile("public/applications/" + objectId + "/" + objectId + ".html", data, function (e_w) {
                                                        if (e_w) {
                                                            console.log("Error writing file public/applications/" + objectId + ".html: ", e_w);
                                                        } else {
                                                            console.log("File public/applications/" + objectId + "/" + objectId + ".html succesfully written");
                                                        }
                                                    });
                                                }
                                            });

                                            fs.readFile("public/applications/newfile/" + data.eep + "/application.js", "utf8", function (e_f2, data) {
                                                if (e_f2) {
                                                    console.log("Error while reading file public/applications/newfile/" + data.eep + "/application.js: ", e_f2);
                                                } else if (data) {
                                                    data = data.replace(/_TMP_/g, objectId);
                                                    fs.writeFile("public/applications/" + objectId + "/" + objectId + ".js", data, function (e_w) {
                                                        if (e_w) {
                                                            console.log("Error writing file public/applications/" + objectId + ".js: ", e_w);
                                                        } else {
                                                            console.log("File public/applications/" + objectId + "/" + objectId + ".js succesfully written");
                                                        }
                                                    });
                                                }
                                            });

                                            fs.readFile("public/applications/newfile/" + data.eep + "/icon.png", function (e_f2, data) {
                                                if (e_f2) {
                                                    console.log("Error while reading file public/applications/newfile/" + data.eep + "/icon.png: ", e_f2);
                                                } else if (data) {
                                                    fs.writeFile("public/applications/" + objectId + "/icon.png", data, function (e_w) {
                                                        if (e_w) {
                                                            console.log("Error writing file public/applications/icon.png: ", e_w);
                                                        } else {
                                                            console.log("File public/applications/" + objectId + "/icon.png succesfully written");
                                                        }
                                                    });
                                                }
                                            });

                                            Apio.io.emit("socket_service", {
                                                name: "apio_server_new",
                                                data: objectId
                                            });
                                        }
                                    });
                                } else {
                                    console.log("Error!! public/applications/newfile/" + data.eep + " is not a directory");
                                }
                            });
                        }
                    });
                }
            }
        });

        socket.on("apio_install_new_object", function (data) {
            Apio.io.emit("send_to_client", {
                message: "auto_install_modal",
                data: data
            });
        });
    });

    http.listen(port, function () {
        Apio.Database.connect(function () {});
    });
};