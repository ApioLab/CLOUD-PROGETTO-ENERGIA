module.exports = function (libraries) {
    var MongoClient = libraries.mongodb.MongoClient;
    var bodyParser = libraries["body-parser"];
    var clone = libraries["git-clone"];
    var express = libraries.express;
    var fs = libraries.fs;
    var fse = libraries["fs-extra"];
    var crypto = libraries.crypto;
    var async = libraries.async;
    var easyimg = libraries.easyimg;
    var imageSize = libraries.imageSize;
    var mysql = libraries.mysql;
    var ncp = libraries.ncp;
    var request = libraries.request;
    var targz = libraries["tar.gz"];
    var uuidgen = libraries["node-uuid"];
    var validator = libraries.validator;
    var exec = libraries["child_process"].exec;
    var app = express();
    var http = libraries.http.Server(app);
    var configuration = require("../configuration/default.js");

    var Socket = undefined;
    var mailSocketConnected = false;
    var sql_db = mysql.createConnection("mysql://root:root@127.0.0.1/Logs");

    var socketServer = libraries["socket.io"](http); //CLoud socket

    socketServer.on("connection", function (socket) {
        socket.on("apio_cloud_reconnect", function () {
            //Apio = require("../apio.js")(configuration);
            //Apio.System.getApioIdentifierCloud = function () {
            //    if (null !== Apio.System.ApioIdentifier && 'undefined' !== typeof Apio.System.ApioIdentifier) {
            //        return Apio.System.ApioIdentifier
            //    } else {
            //        if (fs.existsSync('Identifier.apio')) {
            //            Apio.System.ApioIdentifier = fs.readFileSync('Identifier.apio', {
            //                encoding: 'utf-8'
            //            }).trim();
            //        } else {
            //            Apio.System.ApioIdentifier = uuidgen.v4();
            //            console.log("............................CLOUDJS CREO IDENTIFIER............")
            //            fs.writeFileSync('Identifier.apio', Apio.System.ApioIdentifier);
            //        }
            //        return Apio.System.ApioIdentifier;
            //    }
            //};
            //Apio.Database.connect(function () {
            //});
            //activate();
            request({
                json: true,
                method: "POST",
                uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/restartSystem"
            });
            //console.log("Apio.Remote.socket.io.opts: ", Apio.Remote.socket.io.opts);
        });
    });

    var Apio = require("../apio.js")(configuration);

    Apio.System.getApioIdentifierCloud = function () {
        if (null !== Apio.System.ApioIdentifier && 'undefined' !== typeof Apio.System.ApioIdentifier) {
            return Apio.System.ApioIdentifier
        } else {
            if (fs.existsSync('Identifier.apio')) {
                Apio.System.ApioIdentifier = fs.readFileSync('Identifier.apio', {
                    encoding: 'utf-8'
                }).trim();
            } else {
                Apio.System.ApioIdentifier = uuidgen.v4();
                console.log("............................CLOUDJS CREO IDENTIFIER............")
                fs.writeFileSync('Identifier.apio', Apio.System.ApioIdentifier);
            }
            return Apio.System.ApioIdentifier;
        }
    };
    //var socket = libraries["socket.io-client"]("http://localhost:" + configuration.http.port, {query: "apioId=" + Apio.System.getApioIdentifierCloud()});
    //var socket = libraries["socket.io-client"]("http://localhost:" + configuration.http.port, {query: "associate=cloud"});
    var socket = libraries["socket.io-client"]("http://localhost:" + configuration.http.port, {query: "associate=cloud&token=" + Apio.Token.getFromText("cloud", fs.readFileSync("./" + Apio.Configuration.type + "_key.apio", "utf8"))});

    //var launchInterval = function () {
    //    var pingInterval = setInterval(function () {
    //        exec("nmap -p 8086 apio.cloudapp.net | grep 8086 | awk '{print $2}'", function (error, stdout, stderr) {
    //            if (error || stderr) {
    //                console.log("Error while ping to cloud: ", error || stderr);
    //            } else if (stdout) {
    //                if (stdout === "open") {
    //
    //                } else if (stdout === "closed") {
    //
    //                }
    //            }
    //        });
    //    }, 10000);
    //};

    if (Apio.Configuration.remote.enabled) {
        Apio.Util.log("Setting up remote connection to " + Apio.Configuration.remote.uri);
        //Core Socket
        //var socket_cloud = libraries["socket.io-client"](Apio.Configuration.remote.uri);
        Apio.Remote.socket.on('error', function () {
            console.log("This apio instance cloudnt connect to remote host: " + Apio.Configuration.remote.uri)
        });

        Apio.Remote.socket.on('connect', function () {
            //Devo notificare il cloud che sono online
            console.log("Sending the handshake to the cloud (" + Apio.Configuration.remote.uri + "). My id is " + Apio.System.getApioIdentifierCloud());
            if (Apio.Configuration.type === "gateway") {
                //Apio.isBoardSynced = false;
                socket.emit("enableCloudUpdate", false);
            }

            var token = fs.existsSync("./token.apio") ? fs.readFileSync("./token.apio", "utf8").trim() : "";
            if (token) {
                Apio.Remote.socket.emit('apio.server.handshake', {
                    apioId: Apio.System.getApioIdentifierCloud()
                });
            }
        });

        Apio.Remote.socket.on('disconnect', function () {
            console.log("-------------DISCONNESSO");
        });

        Apio.Remote.socket.on("apio_first_sync", function (ts) {
            var interval = setInterval(function () {
                console.log("-----------------apio_first_sync----------------", mailSocketConnected);
                if (Apio.Database.db && mailSocketConnected) {
                    clearInterval(interval);
                    Apio.Database.db.collection("Users").find({role: "superAdmin"}).toArray(function (error, users) {
                        if (error) {
                            console.log("Error while getting users with role superAdmin: ", error);
                        } else if (users) {
                            var mails = [];
                            for (var i = 0; i < users.length; i++) {
                                if (!users[i].email || !validator.isEmail(users[i].email)) {
                                    users.splice(i--, 1);
                                } else {
                                    mails.push(users[i].email);
                                }
                            }

                            console.log("mails: ", mails);

                            if (mails.length) {
                                request({
                                    json: true,
                                    method: "POST",
                                    uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/service/notification/route/" + encodeURIComponent("/apio/mail/send") + "/data/" + encodeURIComponent(JSON.stringify({
                                        to: mails,
                                        subject: "Richiesta sincronizzazione",
                                        text: "La board con apioId " + Apio.System.getApioIdentifierCloud() + " ha richiesto la sincronizzazione, per abilitarla clicca sul link di seguito: " + Apio.Configuration.remote.uri + "/apio/enableSync/" + Apio.System.getApioIdentifierCloud() + "/" + ts
                                    }))
                                }, function (err, response, body) {
                                    if (err || !response || Number(response.statusCode) !== 200) {
                                        console.log("Error while sending mail: ", err);
                                    } else {
                                        console.log("Mail successfully sent: ", response.body);
                                    }
                                });
                            }
                        }
                    });
                }
            }, 0);
        });

        Apio.Remote.socket.on("get_apio_token", function (token) {
            fs.writeFile("./token.apio", token, function (error) {
                if (error) {
                    console.log("Error while registring new token: ", error);
                } else {
                    console.log("Token registered successfully");
                    console.log("--------------------------------RICONNESSIONE");
                    //Apio.Remote.socket.disconnect();
                    //Apio.Remote.socket.connect();
                    //console.log("Apio.Remote.socket.io.opts: ", Apio.Remote.socket.io.opts);
                    request({
                        json: true,
                        method: "POST",
                        uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/restartSystem"
                    });
                }
            });
        });

        Apio.Remote.socket.on("apio.update.apio.app", function (data) {
            fs.writeFileSync("public/applications/" + data.objectId + "/" + data.objectId + ".html", data.html);
            fs.writeFileSync("public/applications/" + data.objectId + "/" + data.objectId + ".js", data.js);
        });

        Apio.Remote.socket.on("apio.upload.app", function (data) {
            fs.mkdirSync("public/applications/" + data.file.mongo.objectId);
            fs.mkdirSync("public/applications/" + data.file.mongo.objectId + "/_" + data.file.mongo.objectId);

            if (data.hasOwnProperty("adapter")) {
                fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/adapter.js", data.adapter);
            }

            if (data.hasOwnProperty("services")) {
                var jsonServices = JSON.parse(String(data.services));
                var jsonServicesKeys = Object.keys(jsonServices);

                var next = true;

                var interval = setInterval(function () {
                    if (jsonServicesKeys[0]) {
                        if (next) {
                            next = false;
                            if (!fs.existsSync("services/" + jsonServicesKeys[0] + ".js")) {
                                var url = "";
                                if (jsonServices[jsonServicesKeys[0]].username) {
                                    var urlComponents = jsonServices[jsonServicesKeys[0]].url.split("/");
                                    url = urlComponents[0] + "//" + jsonServices[jsonServicesKeys[0]].username;
                                    if (jsonServices[jsonServicesKeys[0]].password) {
                                        url += ":" + jsonServices[jsonServicesKeys[0]].password;
                                    }
                                    url += "@";
                                    for (var j = 2; j < urlComponents.length; j++) {
                                        url += "/" + urlComponents[j];
                                    }
                                } else {
                                    url = jsonServices[jsonServicesKeys[0]].url;
                                }

                                clone(url, "temp_" + jsonServicesKeys[0], function (err) {
                                    if (err) {
                                        console.log("Error while cloning the repo " + url + ": ", err);
                                        deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                        next = true;
                                    } else {
                                        exec("sudo netstat -plnt | grep ':" + jsonServices[jsonServicesKeys[0]].port + "'", function (error, stdout, stderr) {
                                            if (error || stderr) {
                                                console.log("Error: ", error || stderr);
                                                deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                next = true;
                                            } else if (stdout) {
                                                exec("sudo netstat -anp | grep : | grep tcp | awk '{print $4}' | cut -d ':' -f2", function (error, stdout, stderr) {
                                                    if (error || stderr) {
                                                        console.log("Error: ", error || stderr);
                                                        deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                        next = true;
                                                    } else if (stdout) {
                                                        var notAvailablePorts = stdout.split("\n").map(function (x) {
                                                            return parseInt(x);
                                                        });
                                                        var maxPort = 0;
                                                        for (var i in notAvailablePorts) {
                                                            if (notAvailablePorts[i] > maxPort) {
                                                                maxPort = notAvailablePorts[i];
                                                            }
                                                        }

                                                        Apio.Database.db.collection("Services").find().toArray(function (err, result) {
                                                            if (err) {
                                                                console.log("Error while getting Services: ", err)
                                                            } else if (result) {
                                                                var maxServiceId = 0;
                                                                for (var i in result) {
                                                                    if (Number(result[i].objectId) > maxServiceId) {
                                                                        maxServiceId = Number(result[i].objectId);
                                                                    }
                                                                }

                                                                Apio.Database.db.collection("Services").insert({
                                                                    name: jsonServicesKeys[0],
                                                                    password: jsonServices[jsonServicesKeys[0]].password ? jsonServices[jsonServicesKeys[0]].password : "",
                                                                    port: String(maxPort + 1 + jsonServicesKeys.length),
                                                                    serviceId: String(maxServiceId + 1),
                                                                    url: jsonServices[jsonServicesKeys[0]].url,
                                                                    username: jsonServices[jsonServicesKeys[0]].username ? jsonServices[jsonServicesKeys[0]].username : ""
                                                                }, function (error, result1) {
                                                                    if (error) {
                                                                        console.log("Error while inserting new Service: ", error);
                                                                    } else if (result1) {
                                                                        console.log("Service " + jsonServicesKeys[0] + " correctly installed");
                                                                        exec("cd ./services && sudo forever start -s " + jsonServicesKeys[0] + ".js --http-port " + (maxPort + 1 + jsonServicesKeys.length), function (error, stdout, stderr) {
                                                                            if (error || stderr) {
                                                                                console.log("Error: ", error || stderr);
                                                                                deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                                                next = true;
                                                                            } else {
                                                                                console.log("Success: ", stdout);
                                                                                deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                                                jsonServicesKeys.shift();
                                                                                next = true;
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            } else {
                                                Apio.Database.db.collection("Services").find().toArray(function (err, result) {
                                                    if (err) {
                                                        console.log("Error while getting Services: ", err)
                                                    } else if (result) {
                                                        var maxServiceId = 0;
                                                        for (var i in result) {
                                                            if (Number(result[i].objectId) > maxServiceId) {
                                                                maxServiceId = Number(result[i].objectId);
                                                            }
                                                        }

                                                        Apio.Database.db.collection("Services").insert({
                                                            name: jsonServicesKeys[0],
                                                            password: jsonServices[jsonServicesKeys[0]].password ? jsonServices[jsonServicesKeys[0]].password : "",
                                                            port: jsonServices[jsonServicesKeys[0]].port,
                                                            serviceId: String(maxServiceId + 1),
                                                            url: jsonServices[jsonServicesKeys[0]].url,
                                                            username: jsonServices[jsonServicesKeys[0]].username ? jsonServices[jsonServicesKeys[0]].username : ""
                                                        }, function (error, result1) {
                                                            if (error) {
                                                                console.log("Error while inserting new Service: ", error);
                                                            } else if (result1) {
                                                                console.log("Service " + jsonServicesKeys[0] + " correctly installed");
                                                                exec("cd ./services && sudo forever start -s " + jsonServicesKeys[0] + ".js --http-port " + jsonServices[jsonServicesKeys[0]].port, function (error, stdout, stderr) {
                                                                    if (error || stderr) {
                                                                        console.log("Error: ", error || stderr);
                                                                        deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                                        next = true;
                                                                    } else {
                                                                        console.log("Success: ", stdout);
                                                                        deleteFolderRecursive("temp_" + jsonServicesKeys[0]);
                                                                        jsonServicesKeys.shift();
                                                                        next = true;
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                jsonServicesKeys.shift();
                                next = true;
                            }
                        }
                    } else {
                        clearInterval(interval);
                    }
                }, 0);
            }
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/icon.png", data.file.icon);
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/" + data.file.mongo.objectId + ".js", data.file.js);
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/" + data.file.mongo.objectId + ".html", data.file.html);
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/" + data.file.mongo.objectId + ".mongo", data.file.mongo);
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/_" + data.file.mongo.objectId + "/_" + data.file.mongo.objectId + ".ino", data.file.ino);
            fs.writeFileSync("public/applications/" + data.file.mongo.objectId + "/_" + data.file.mongo.objectId + "/Makefile", data.file.makefile);

            Apio.Database.db.collection("Objects").insert(data.file.mongo, function (err) {
                if (err) {
                    console.log("Error while inserting new object: ", err);
                } else {
                    console.log("New object successfully interted");
                    socketServer.emit("send_to_client", {
                        data: data.file.mongo.objectId,
                        message: "apio_server_new"
                    });
                }
            });
        });

        Apio.Remote.socket.on("apio.git.clone.app", function (data) {
            Apio.Database.db.collection("Objects").insert(data.mongo, function (err) {
                if (err) {
                    console.log("Error while inserting new object: ", err);
                } else {
                    console.log("New object successfully inserted: ", err);
                    fs.mkdirSync("public/applications/" + data.objectId);
                    fs.mkdirSync("public/applications/" + data.objectId + "/_" + data.objectId);
                    fs.writeFileSync("public/applications/" + data.objectId + "/icon.png", data.icon, {encoding: "base64"});
                    fs.writeFileSync("public/applications/" + data.objectId + "/" + data.objectId + ".js", data.js);
                    fs.writeFileSync("public/applications/" + data.objectId + "/" + data.objectId + ".html", data.html);
                    fs.writeFileSync("public/applications/" + data.objectId + "/" + data.objectId + ".mongo", data.mongo);
                    fs.writeFileSync("public/applications/" + data.objectId + "/_" + data.objectId + "/_" + data.objectId + ".ino", data.ino);
                    fs.writeFileSync("public/applications/" + data.objectId + "/_" + data.objectId + "/Makefile", data.makefile);
                    socketServer.emit("send_to_client", {
                        data: data.objectId,
                        message: "apio_server_new"
                    });
                }
            });
        });

        Apio.Remote.socket.on("apio_object_change_settings.fromcloud", function (data) {
            Apio.Database.db.collection("Objects").update({objectId: data.objectId}, {$set: data}, function (error) {
                if (error) {
                    console.log("Error while updating object with objectId " + data.objectId + ": ", error);
                } else {
                    console.log("Object with objectId " + data.objectId + " successfully updated");
                    socketServer.emit("send_to_client", {
                        data: data,
                        message: "apio_object_change_settings"
                    });
                }
            });
        });

        Apio.Remote.socket.on("apio_git_update", function (data) {
            if (Apio.System.getApioIdentifierCloud() === data.apioId) {
                if (Object.keys(data).length === 1) {
                    var pull = exec("git pull", function (error, stdout) {
                        if (error) {
                            console.log("Error occured while pulling: ", error);
                        } else if (stdout) {
                            if (stdout.indexOf("Already up-to-date.") === -1) {
                                socket.emit("send_to_client", {message: "apio_git_pull_msg", data: data.apioId});
                            }
                        } else {
                            console.log("Error occured while pulling");
                        }
                    });

                    setTimeout(function () {
                        exec("ps aux | awk '{print $2}'", function (error, stdout) {
                            if (error) {
                                res.status(500).send(error);
                            } else if (stdout) {
                                stdout = stdout.split("\n");
                                stdout.shift();
                                stdout.pop();
                                stdout = stdout.map(function (x) {
                                    return Number(x);
                                });
                                if (stdout.indexOf(Number(pull.pid)) > -1) {
                                    exec("sudo kill -9 " + pull.pid, function (error) {
                                        console.log("Error occured while pulling: ", error);
                                    });
                                }
                            }
                        });
                    }, 90000);
                } else {
                    exec("git config --get remote.origin.url", function (error, stdout, stderr) {
                        if (error || stderr) {
                            res.status(500).send(error || stderr);
                        } else if (stdout) {
                            var addslashes = function (str) {
                                return String(str).replace(/[\\#;&\."',\/`:!\*\?\$\{}@\(\)\[\]><\|\-=\+%~\^]/g, "\\$&").replace(/\u0000/g, "\\0");
                            };

                            var url = "", urlComponents = stdout.split("/");

                            for (var i in urlComponents) {
                                url += urlComponents[i];
                                if (Number(i) !== urlComponents.length - 1) {
                                    url += "/";
                                }
                                if (urlComponents[i] === "") {
                                    url += addslashes(data.user) + ":" + addslashes(data.pwd) + "@";
                                }
                            }

                            exec("git pull " + url, function (error, stdout) {
                                if (error) {
                                    console.log("Error occured while pulling: ", error);
                                } else if (stdout) {
                                    if (stdout.indexOf("Already up-to-date.") === -1) {
                                        socket.emit("send_to_client", {
                                            message: "apio_git_pull_msg",
                                            data: data.apioId
                                        });
                                    }
                                } else {
                                    console.log("Error occured while pulling");
                                }
                            });
                        } else {
                            console.log("Error occured while pulling");
                        }
                    });
                }
            }
        });

        Apio.Remote.socket.on("apio_reboot_board", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data) {
            socket.emit("send_to_client", {message: "apio_board_reboot", data: data});
            exec("sudo reboot", function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log("exec error: " + error || stderr);
                } else if (stdout) {
                    console.log("Board is rebooting in a while, please wait");
                }
            });
            //}
        });

        Apio.Remote.socket.on("apio_restart_system", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data) {
            socket.emit("send_to_client", {message: "apio_system_restart", data: data});
            exec("ps aux | grep app.js | awk '{print $2}'", function (error, appjsPID, stderr) {
                if (error) {
                    console.log("exec error: " + error);
                } else if (appjsPID) {
                    appjsPID = appjsPID.split("\n");
                    appjsPID.pop();
                    exec("cd " + __dirname + "/.. && forever start -s -c 'node --expose_gc' app.js", function (error, stdout, stderr) {
                        if (error || stderr) {
                            console.log("exec error: " + error || stderr);
                        } else {
                            if (appjsPID.length > 2) {
                                for (var i in appjsPID) {
                                    exec("sudo kill -9 " + appjsPID[i], function (error, stdout, stderr) {
                                        if (error) {
                                            console.log("exec error: " + error);
                                        } else {
                                            console.log("Process with PID " + appjsPID[i] + " killed");
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            });
            //}
        });

        Apio.Remote.socket.on("apio_shutdown_board", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data) {
            socket.emit("send_to_client", {message: "apio_board_shutdown", data: data});
            exec("sudo shutdown -h now", function (error, stdout, stderr) {
                if (error || stderr) {
                    console.log("exec error: " + error || stderr);
                } else if (stdout) {
                    console.log("Board is shutting down in a while, please wait");
                }
            });
            //}
        });

        Apio.Remote.socket.on("ask_dongle_settings", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data) {
            if (Apio.hasOwnProperty("Configuration") && Apio.Configuration.hasOwnProperty("dongle")) {
                socketServer.emit("send_to_client", {
                    data: Apio.Configuration.dongle,
                    message: "get_dongle_setting"
                });
            } else {
                try {
                    socketServer.emit("send_to_client", {
                        data: require("../configuration/dongle.js"),
                        message: "get_dongle_setting"
                    });
                } catch (e) {
                    socketServer.emit("send_to_client", {data: {}, message: "get_dongle_setting"});
                }
            }
            //}
        });

        Apio.Remote.socket.on("ask_logics", function () {
            fs.readdir("./services/apio_logic", function (error, files) {
                if (error) {
                    console.log("Error while reading folder ./services/apio_logic: ", error);
                    socketServer.emit("send_to_client", {
                        data: [],
                        message: "get_logics"
                    });
                } else if (files) {
                    socketServer.emit("send_to_client", {
                        data: files,
                        message: "get_logics"
                    });
                } else {
                    socketServer.emit("send_to_client", {
                        data: [],
                        message: "get_logics"
                    });
                }
            });
        });

        Apio.Remote.socket.on("ask_logic_file", function (file) {
            fs.readFile("./services/apio_logic/" + file, function (error, content) {
                if (error) {
                    console.log("Error while reading file ./services/apio_logic/" + file + ": ", error);
                    socketServer.emit("send_to_client", {
                        data: "",
                        message: "get_logic_file"
                    });
                } else if (content) {
                    socketServer.emit("send_to_client", {
                        data: content,
                        message: "get_logic_file"
                    });
                } else {
                    socketServer.emit("send_to_client", {
                        data: "",
                        message: "get_logic_file"
                    });
                }
            });
        });

        Apio.Remote.socket.on("change_dongle_settings", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data.apioId) {
            //delete data.apioId;
            request({
                json: true,
                method: "POST",
                uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/service/dongle/route/" + encodeURIComponent("/apio/dongle/changeSettings") + "/data/" + encodeURIComponent(JSON.stringify(data))
            }, function (err, response, body) {
                if (err || !response || Number(response.statusCode) !== 200) {
                    console.log("ERROR");
                } else {
                    Apio.Configuration.dongle = data;
                    console.log("Setting changed");
                }
            });
            //}
        });

        Apio.Remote.socket.on("change_set_onoff", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data.apioId) {
            //delete data.apioId;
            request({
                json: true,
                method: "POST",
                uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/service/dongle/route/" + encodeURIComponent("/apio/dongle/onoff") + "/data/" + encodeURIComponent(JSON.stringify(data))
            }, function (err, response, body) {
                if (err || !response || Number(response.statusCode) !== 200) {
                    console.log("ERROR");
                } else if (body) {
                    console.log("Setting changed");
                }
            });
            //}
        });

        Apio.Remote.socket.on("update_dongle", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data) {
            request({
                json: true,
                method: "GET",
                uri: "http://localhost:" + Apio.Configuration.http.port + "/apio/service/dongle/route/" + encodeURIComponent("/apio/dongle/updateDongle")
            }, function (err, response, body) {
                if (err || !response || Number(response.statusCode) !== 200) {
                    console.log("ERROR");
                } else if (body) {
                    console.log("New firmware");
                }
            });
            //}
        });

        Apio.Remote.socket.on("send_to_client_service", function (data) {
            //if (Apio.System.getApioIdentifierCloud() === data.apioId) {
            socket.emit("send_to_service", data);
            //}
        });

        Apio.Remote.socket.on("apio_board_enabled", function (data) {
            if (Apio.System.getApioIdentifierCloud() === data) {
                Apio.Remote.socket.emit('apio.server.handshake', {
                    apioId: Apio.System.getApioIdentifierCloud()
                });
            }
        });

        Apio.Remote.socket.on("apio_object_online", function (data) {
            data.sendToCloud = false;
            socket.emit("apio_object_online", data);
        });

        Apio.Remote.socket.on("apio_client_stream", function (data) {
            //console.log("apio_client_stream");
            //console.log(data);
            //Apio.Serial.stream(data);
            socket.emit("apio_client_stream", data);
        });

        Apio.Remote.socket.on('apio.remote.handshake.test', function (data) {
            Apio.Util.log("Received test from ApioCloud");
            var factor = data.factor;
            var test = crypto.createHash('sha256').update(factor + ":" + Apio.System.getApioSecret()).digest('base64');
            Apio.Util.log("Sending the test answer to the remote");
            Apio.Remote.socket.emit('apio.server.handshake.test', {
                test: test,
                apioId: Apio.System.getApioIdentifierCloud()
            });
        });

        Apio.Remote.socket.on("apio.create.new.app", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            var decodeBase64Image = function (dataString) {
                var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/), response = {};

                response.type = matches[1];
                response.data = new Buffer(matches[2], "base64");

                return response;
            };

            var html = data.html;
            var icon = data.icon;
            var ino = data.ino;
            var js = data.js;
            var makefile = data.makefile;
            var mongo = data.mongo;
            var obj = data.obj;
            var subapps = data.subapps;

            var objectToSave = {properties: {}};
            var SensorInProperties = 0;

            objectToSave.name = obj.objectName;
            objectToSave.objectId = obj.objectId;
            objectToSave.protocol = obj.protocol;
            objectToSave.address = obj.address;

            for (var key in obj.properties) {
                if (obj.properties[key].type !== "List") {
                    if (obj.properties[key].type === "Sensor") {
                        SensorInProperties = 1;
                    }

                    objectToSave.properties[obj.properties[key].name] = obj.properties[key].defaultValue;
                } else {
                    var returnFirstListItemValue = function (o) {
                        for (var k in o) return k;
                    };

                    objectToSave.properties[obj.properties[key].name] = returnFirstListItemValue(obj.properties[key].items);
                }
            }

            objectToSave.db = JSON.parse(mongo);

            console.log("Object" + obj.objectId + "is being manipulated by the server");
            console.log("APIO: Creating application " + obj.objectId);

            Apio.Database.registerObject(JSON.parse(mongo), function (error) {
                if (error) {
                    console.log("/apio/Database/createNewApioApp Error while saving");
                } else {
                    fs.mkdirSync("public/applications/" + obj.objectId);
                    fs.mkdirSync("public/applications/" + obj.objectId + "/_" + obj.objectId);
                    fs.mkdirSync("public/applications/" + obj.objectId + "/_" + obj.objectId + "/XBee");

                    fs.writeFileSync("public/applications/" + obj.objectId + "/_" + obj.objectId + "/_" + obj.objectId + ".ino", ino);
                    fs.writeFileSync("public/applications/" + obj.objectId + "/_" + obj.objectId + "/Makefile", makefile);
                    fs.writeFileSync("public/applications/" + obj.objectId + "/" + obj.objectId + ".html", html);
                    fs.writeFileSync("public/applications/" + obj.objectId + "/" + obj.objectId + ".js", js);
                    fs.writeFileSync("public/applications/" + obj.objectId + "/" + obj.objectId + ".mongo", mongo);
                    fs.writeFileSync("public/applications/" + obj.objectId + "/icon.png", decodeBase64Image(icon).data);

                    var dimensions = imageSize("public/applications/" + obj.objectId + "/icon.png");
                    easyimg.exec("convert public/applications/" + obj.objectId + "/icon.png -resize " + dimensions.width + "x" + dimensions.height + "^  -gravity center -crop " + dimensions.width + "x" + dimensions.height + "+0+0 +repage public/applications/" + obj.objectId + "/icon.png").then(function (file) {
                        easyimg.exec("convert public/applications/" + obj.objectId + "/icon.png \\( -size " + dimensions.width + "x" + dimensions.height + " xc:none -fill white -draw \"circle " + (dimensions.width / 2) + "," + (dimensions.height / 2) + " " + (Math.max(dimensions.width, dimensions.height) / 2) + ",0\" \\) -compose copy_opacity -composite public/applications/" + obj.objectId + "/icon.png").then(function (file) {
                            console.log("Image public/applications/" + obj.objectId + "/icon.png cropped");
                        }, function (err) {
                            console.log("easyimg error 1: ", err);
                        });
                    }, function (err) {
                        console.log("easyimg error 2: ", err);
                    });

                    if (subapps && Object.keys(subapps).length) {
                        fs.mkdirSync("public/applications/" + obj.objectId + "/subapps");
                        for (var i in subapps) {
                            fs.writeFileSync("public/applications/" + obj.objectId + "/subapps/" + i + ".html", subapps[i].html);
                            fs.writeFileSync("public/applications/" + obj.objectId + "/subapps/" + i + ".js", subapps[i].js);
                        }
                    }

                    //Injection of the libraries file in the sketch folder
                    var source = "public/arduino/";
                    console.log("obj.protocol: " + obj.protocol);
                    if (obj.protocol === "z") {
                        source += "XBee";
                    } else if (obj.protocol === "l") {
                        source += "LWM";
                    }
                    console.log("source: " + source);
                    var destination = "public/applications/" + obj.objectId + "/_" + obj.objectId;

                    ncp.limit = 16;

                    ncp(source, destination, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log("done!");
                    });

                    source = "public/arduino/apioGeneral";
                    ncp(source, destination, function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log("done!");
                    });

                    //if there is a sensor in properties inject the sensor.h from libraries
                    if (SensorInProperties === 1) {
                        source = "public/arduino/libraries";
                        ncp(source, destination, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                            console.log("done!");
                        });
                    }

                    //socket.emit("apio_server_new", {apioId: data.apioId, objectId: obj.objectId});
                    socket.emit("apio_server_new", obj.objectId);
                }
            });
            //}
        });

        Apio.Remote.socket.on("ask_board_ip", function (data) {
            //if (data === Apio.System.getApioIdentifierCloud()) {
            exec("ifconfig -a | grep 'Link encap' | awk '{print $1}'", function (error, stdout) {
                if (error) {
                    console.log("exec error (1): " + error);
                } else if (stdout) {
                    var next = true, peripherals = stdout.split("\n"), peripheralsIP = {};
                    peripherals.pop();
                    var interval = setInterval(function () {
                        if (peripherals.length) {
                            if (next) {
                                next = false;
                                var p = peripherals[0];
                                if (p !== "" && p !== "lo") {
                                    exec("ifconfig " + p.trim() + " | grep 'inet addr' | awk -F: '{print $2}' | awk '{print $1}'", function (error, stdout) {
                                        if (error) {
                                            console.log("exec error (2): " + error);
                                        } else if (stdout) {
                                            peripheralsIP[p] = stdout.trim();
                                        }

                                        peripherals.splice(0, 1);
                                        next = true;
                                    });
                                } else {
                                    peripherals.splice(0, 1);
                                    next = true;
                                }
                            }
                        } else {
                            clearInterval(interval);
                            exec("wget http://ipinfo.io/ip -qO -", function (error, stdout) {
                                var publicIP = "";
                                if (error) {
                                    console.log("exec error (3): " + error);
                                    //socket.emit("get_board_ip", {
                                    //    apioId: Apio.System.getApioIdentifierCloud(),
                                    //    local: peripheralsIP,
                                    //    public: ""
                                    //});
                                } else if (stdout) {
                                    publicIP = stdout.trim();
                                    //socket.emit("get_board_ip", {local: peripheralsIP, public: stdout.trim()});
                                    //socket.emit("get_board_ip", {
                                    //    apioId: Apio.System.getApioIdentifierCloud(),
                                    //    local: peripheralsIP,
                                    //    public: stdout.trim()
                                    //});
                                }

                                exec("curl http://localhost:4040/inspect/http | grep window.common", function (error1, stdout1, stderr1) {
                                    clearInterval(interval);
                                    var remoteAccess = "";
                                    if (error1) {
                                        console.log("Error while getting remote access: ", error1)
                                    } else if (stdout1) {
                                        var result = stdout1.split(" ");
                                        var index = -1;
                                        var obj = "";
                                        for (var i = 0; index === -1 && i < result.length; i++) {
                                            if (result[i] === "window.common") {
                                                index = i
                                            }
                                        }

                                        if (index > -1) {
                                            for (var i = index + 2; i < result.length; i++) {
                                                if (obj === "") {
                                                    obj = result[i];
                                                } else {
                                                    obj += " " + result[i];
                                                }
                                            }

                                            obj = eval(obj);
                                            var url = obj.Session.Tunnels.command_line.URL;
                                            url = url.split("/");
                                            url = url[url.length - 1];
                                            url = url.split(":");
                                            var port = url[1];
                                            url = url[0];
                                            console.log("url: ", url, "port: ", port);
                                            remoteAccess = "ssh pi@" + url + " -p " + port;
                                        }
                                    }

                                    socket.emit("get_board_ip", {
                                        apioId: Apio.System.getApioIdentifierCloud(),
                                        local: peripheralsIP,
                                        public: publicIP,
                                        remote: remoteAccess
                                    });
                                });
                            });
                        }
                    }, 0);
                }
            });
            //}
        });

        Apio.Remote.socket.on("apio_notification_disabled.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            socket.emit("apio_notification_disabled", {notif: data.notif, user: data.user});
            //}
        });

        Apio.Remote.socket.on("apio_notification_enabled.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            socket.emit("apio_notification_enabled", {notif: data.notif, user: data.user});
            //}
        });

        Apio.Remote.socket.on("apio_notification_read.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            socket.emit("apio_notification_read", {notif: data.notif, user: data.user});
            //}
        });

        Apio.Remote.socket.on("apio_notification_read_all.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            socket.emit("apio_notification_read_all", {user: data.user});
            //}
        });

        Apio.Remote.socket.on('apio.remote.handshake.test.success', function (data) {
            Apio.Util.log("This ApioOS has been successfully authenticated on ApioCloud. Storing the Auth Token");
            Apio.Remote.token = data.token;
        });

        Apio.Remote.socket.on('apio.remote.handshake.test.error', function (data) {
            Apio.Util.log("This ApioOS failed authentication on ApioCloud. Retrying...")
            if (Apio.Remote.connectionRetryCounter > 3) {
                Apio.Util.log("This ApioOS exceeded the number of connection retry available. Aborting ApioCloud connection. This problem may be Cloud related, check cloud.apio.cc/status for updates about our servers's status or contact us at support@apio.cc")
            } else {
                Apio.Remote.connectionRetryCounter++;
                Apio.Util.log("ApioCloud connection ");
                Apio.Remote.socket.emit('apio.server.handshake', {
                    apioId: Apio.System.getApioIdentifierCloud()
                });
            }
        });

        //CHIARIRE, L'emit deve esistere ma non ha senso metterlo qui perché non viene intercettato
        Apio.Remote.socket.on("apio_shutdown", function (data) {
            if (data == Apio.System.getApioIdentifierCloud()) {
                //socket.emit("apio_shutdown")
                var child = exec("sudo shutdown -h now", function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log("exec error: " + error);
                    } else {
                        console.log("Spegnimento in Corso+++++");
                    }
                });
            }
        });

        Apio.Remote.socket.on("apio_user_new.fromcloud", function (data) {
            if (data.apioId === Apio.System.getApioIdentifierCloud()) {
                delete data.apioId;

                Apio.Users.create(data, function (err, usr) {
                    if (err) {
                        console.log("Error while inserting User: ", err);
                    } else if (usr) {
                        console.log("User successfully inserted: ", usr);
                        socket.emit("apio_user_new", usr);
                    }
                });
            }
        });

        Apio.Remote.socket.on("apio.add.planimetry", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            fs.writeFileSync("public/images/planimetry/" + data.filename, data.filedata);
            //}
        });

        Apio.Remote.socket.on("apio.add.db.planimetry.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            delete data.planimetry.apioId;
            Apio.Database.db.collection("Planimetry").insert(data.planimetry, function (err) {
                if (err) {
                    console.log("Error while inserting new Planimetry: ", err);
                } else {
                    socket.emit("apio.add.db.planimetry", data.planimetry);
                    console.log("Planimetry succefully inserted");
                }
            });
            //}
        });

        Apio.Remote.socket.on("apio.remove.planimetry", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            fs.unlinkSync("public/images/planimetry/" + data.filename);
            //}
        });

        Apio.Remote.socket.on("apio.remove.db.planimetry.fromcloud", function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            Apio.Database.db.collection("Planimetry").remove({planimetryId: data.planimetryId}, function (err) {
                if (err) {
                    console.log("Error while removing planimetry with planimetryId " + data.planimetryId + ": ", err);
                } else {
                    socket.emit("apio.remove.db.planimetry", data.planimetryId);
                    console.log("Planimetry with planimetryId " + data.planimetryId + " succefully removed");
                }
            });
            //}
        });

        Apio.Remote.socket.on('apio.remote.sync.request', function (data) {
            console.log("---------------------------------------SINCRONIZZAZIONE---------------------------");
            if (data === undefined || (data.hasOwnProperty("files") && !data.hasOwnProperty("apioId")) || data.apioId === Apio.System.getApioIdentifierCloud()) {
                console.log("The Apio Cloud is requesting sync data. I'm sending it");
                var payload = {
                    apio: {
                        system: {
                            apioId: Apio.System.getApioIdentifierCloud()
                        }
                    }
                };
                async.series([function (callback) {
                    Apio.Object.list("admin", function (err, data) {
                        if (!err) {
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }, function (callback) {
                    Apio.State.list(function (err, data) {
                        if (!err) {
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }, function (callback) {
                    Apio.Event.list(function (err, data) {
                        if (!err) {
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }, function (callback) {
                    Apio.Users.list(function (err, data) {
                        if (!err) {
                            for (var i = 0; i < data.length; i++) {
                                if (!data[i].hasOwnProperty("email") || !validator.isEmail(data[i].email)) {
                                    data.splice(i--, 1);
                                }
                            }
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }, function (callback) {
                    Apio.Database.db.collection("Services").find().toArray(function (err, data) {
                        if (!err) {
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }, function (callback) {
                    Apio.Database.db.collection("Planimetry").find().toArray(function (err, data) {
                        if (!err) {
                            callback(null, data);
                        } else {
                            callback(err);
                        }
                    });
                }], function (err, results) {
                    payload.apio.objects = results[0];
                    payload.apio.states = results[1];
                    payload.apio.events = results[2];
                    payload.apio.users = results[3];
                    payload.apio.services = results[4];
                    payload.apio.planimetries = results[5];
                    payload.apio.system = {
                        apioId: Apio.System.getApioIdentifierCloud().toString(),
                        planimetryImages: {}
                    };

                    for (var i in payload.apio.planimetries) {
                        payload.apio.system.planimetryImages[payload.apio.planimetries[i].url] = fs.readFileSync("public/images/planimetry/" + payload.apio.planimetries[i].url);
                    }

                    var numberOfObjects = 0, retObj = {};
                    payload.apio.objects.forEach(function (object) {
                        if (Object.keys(object.properties).length && object.name.indexOf("Dongle") === -1) {
                            numberOfObjects++;
                            var query = "";
                            var fields = "";
                            for (var i in object.properties) {
                                if (object.properties[i].hasOwnProperty("type")) {
                                    fields += i + ", ";
                                }
                            }

                            fields += "timestamp, " + object.objectId + " AS objectId";

                            if (data.timestampObj[object.objectId]) {
                                query = "SELECT " + fields + " FROM `" + object.objectId + "` WHERE timestamp > \"" + data.timestampObj[object.objectId] + "\"";
                            } else {
                                query = "SELECT " + fields + " FROM `" + object.objectId + "`";
                            }

                            sql_db.query(query, function (s_e, records) {
                                if (s_e) {
                                    console.log("Error while getting timestamp from tables: ", s_e);
                                } else {
                                    numberOfObjects--;
                                    for (var x in records) {
                                        var objectId = records[x].objectId;
                                        delete records[x].objectId;
                                        if (!retObj.hasOwnProperty(objectId)) {
                                            retObj[objectId] = [];
                                        }

                                        retObj[objectId].push(records[x]);
                                    }

                                    if (numberOfObjects === 0) {
                                        Apio.Remote.socket.emit("apio.server.log.sync", {
                                            apioId: payload.apio.system.apioId,
                                            logs: retObj
                                        });
                                    }
                                }
                            });
                        }
                    });

                    Apio.Remote.socket.emit('apio.server.sync', payload);
                    //Ora invio le appp
                    console.log("ApioOS>>> Compressing and packaging applications for the upload... ");

                    var basePath = "public/applications";
                    var copyDir = "public/" + Apio.System.getApioIdentifierCloud();
                    var modMap = {};
                    var numberOfCopied = 0;

                    var finish = function () {
                        new targz().compress(copyDir, "public/applications.tar.gz", function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("ApioOS>>> Compressing ended! ");
                            }

                            request.post({
                                url: Apio.Configuration.remote.uri + "/apio/sync/" + Apio.System.getApioIdentifierCloud(),
                                formData: {
                                    applications: fs.createReadStream("public/applications.tar.gz")
                                }
                            }, function (err, httpResponse, body) {
                                if (err) {
                                    console.error('ApioOS>>> Error while sending apps to :' + Apio.Configuration.remote.uri + '/apio/sync/', err);
                                } else {
                                    fs.unlink("public/applications.tar.gz", function (err) {
                                        if (err) {
                                            console.log("Error while unlinking file public/applications.tar.gz: ", err);
                                        } else {
                                            Apio.System.deleteFolderRecursive(copyDir);
                                            console.log('ApioOS>>>> Applications Upload successful!');
                                        }
                                    });
                                }
                            });
                        });
                    };

                    if (!fs.existsSync(copyDir)) {
                        fs.mkdirSync(copyDir);
                    }

                    var finder = require("findit")(basePath);
                    finder.on("file", function (file, stats) {
                        modMap[file.replace(basePath + "/", "")] = stats.mtime.getTime();
                    });

                    finder.on("end", function () {
                        var filesKey = Object.keys(modMap);
                        for (var i in filesKey) {
                            if (data.files.hasOwnProperty(filesKey[i])) {
                                var date = new Date(modMap[filesKey[i]]);
                                var timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0).getTime();
                                if (timestamp < data.files[filesKey[i]]) {
                                    delete modMap[filesKey[i]];
                                }
                            }
                        }

                        if (Object.keys(modMap).length) {
                            filesKey = Object.keys(modMap);
                            for (var i in filesKey) {
                                fse.copy(basePath + "/" + filesKey[i], copyDir + "/" + filesKey[i], function (err) {
                                    if (err) {
                                        console.log("Unable to copy file " + basePath + "/" + filesKey[i] + " to " + copyDir + "/" + filesKey[i] + ": ", err);
                                    } else {
                                        numberOfCopied++;
                                        if (numberOfCopied === filesKey.length) {
                                            finish();
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            }
        });

        Apio.Remote.socket.on('apio.server.serial.send', function (data) {
            if (data.message) {
                console.log("Il cloud dice che devo mandare in seriale sta roba");
                console.log(data);
                if (data.apioId == Apio.System.getApioIdentifierCloud()) {
                    Apio.Serial.send(data.message);
                }
            }
        });

        //Tenere potrebbero essere utili per il salvataggio della singola property
        Apio.Remote.socket.on('apio.remote.state.create', function (data) {
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            console.log(data);
            Apio.State.create(data.state, data.event, function () {
                console.log('apio.remote.state.create');
                Apio.io.emit('apio.server.state.create', data.state); //Notifico tutti i client
            });
        });

        Apio.Remote.socket.on('apio.remote.state.delete', function (data) {
            Apio.State.delete(data.stateName, function () {
                console.log('apio.remote.state.delete');
            });
        });

        Apio.Remote.socket.on('apio.remote.state.update', function (data) {
            Apio.State.update(data.stateName, data.state, function () {
                console.log('apio.remote.state.update');
            });
        });

        Apio.Remote.socket.on('apio.remote.state.apply', function (data) {
            Apio.State.apply(data.stateName, function () {
                console.log("apio.remote.state.apply " + data.stateName);
            });
        });

        Apio.Remote.socket.on('apio.remote.event.create', function (data) {
            Apio.Util.log("New event created on the cloud");
            console.log(data);
            Apio.Event.create(data, function () {
                console.log("Event from the cloud successfully created");
            });
        });

        Apio.Remote.socket.on('apio.remote.event.delete', function (data) {
            Apio.Event.delete(data.name, function (err) {
                Apio.Util.log("Deleted event " + data.name);
            });
        });

        Apio.Remote.socket.on('apio.remote.event.update', function (data) {
            Apio.Util.log("Updating event from athe Cloud...");
            Apio.Event.update(data.name, data.eventUpdate, function () {
                Apio.Util.log("Event Updated");
            });
        });

        Apio.Remote.socket.on('apio.remote.event.launch', function (data) {
            Apio.Util.log("Launching event from the cloud.");
        });

        Apio.Remote.socket.on('apio.remote.object.delete', function (data) {
            Apio.Util.log("Deleting object from the cloud.");
            Apio.Database.deleteObject(data, function (err) {
                // Apio.Database.db.collection('Objects').remove({objectId : id}, function(err){
                if (err) {
                    console.log('error while deleting the object ' + data + ' from the db');
                    //res.status(500).send();
                } else {
                    //Apio.System.deleteFolderRecursive('../public/applications/' + data);
                    Apio.System.deleteFolderRecursive('public/applications/' + data);
                    socket.emit("apio_server_delete", data);
                    //res.send(200);
                }
            });
        });

        //Tenere, si vede in seguito
        Apio.Remote.socket.on('apio_remote_autoinstall', function (data) {
            if (Apio.Configuration.autoinstall.default == false) {
                var req_data = {
                    //json: true,
                    uri: "http://localhost:8083/" + Apio.Configuration.autoinstall.company + "/installNew/" + data,
                    method: "GET"
                    /*body: {
                     mail: data.properties.mail,
                     text: data.properties.text
                     }*/
                };
                //console.log("\n\n /apio/service/" + data.protocol + "/send");
                console.log(req_data);
                console.log("\n\n");
                request(req_data, function (error, response, body) {
                    if (response) {
                        if (Number(response.statusCode) === 200) {
                            console.log("xxxxxxHo installato dal cloud rinvio l'oggetto");
                            console.log(body);
                            //QUIIIIIIII
                            var o = {};
                            o.objectId = body.id;
                            Apio.Database.getObjectById(o, function (data) {
                                console.log(data);
                                Apio.Remote.socket.emit("apio.server.object.new", data);
                            });
                        } else {
                            console.log("Apio Service: Something went wrong");
                        }
                    } else {
                        console.log("Errore di sistema: ", error);
                    }
                });
            } else {
                var req_data = {
                    json: true,
                    uri: "http://localhost:8083/marketplace/applications/autoinstall",
                    method: "POST",
                    body: {
                        appId: data.appId,
                        address: data.address
                    }
                };
                //console.log("\n\n /apio/service/" + data.protocol + "/send");
                console.log(req_data);
                console.log("\n\n");
                request(req_data, function (error, response, body) {
                    /*if (response) {
                     if (Number(response.statusCode) === 200) {
                     console.log("Email inviata");
                     } else {
                     console.log("Apio Service: Something went wrong");
                     }
                     } else {
                     console.log("Errore di sistema: ", error);
                     }*/
                });
                /*var url = "http://localhost:8083/marketplace/applications/autoinstall"
                 $http.post(url, {
                 appId: data.appId,
                 address: data.address

                 }).success(function(as, status){
                 sweet.show('Installata!', data.appId+' installed', 'success');


                 })*/
            }
        });

        Apio.Remote.socket.on('apio.remote.object.modify', function (data) {
            Apio.Util.log("Socket event : apio.remote.object.update");
            Apio.Object.Modify(data, function () {
                console.log("apio_client_update dalla board o da un client connesso");
                Apio.io.emit("apio_server_update", {objectId: data.objectId});
            });
        });

        //ELIMINARE
        Apio.Remote.socket.on('apio.remote.user.create', function (data) {
            Apio.Util.log("Socket user : apio.remote.user.create");
            Apio.Users.create(data, function () {
                console.log("User in cloud successfully created");
            });
        });

        Apio.Remote.socket.on('apio.remote.user.delete', function (data) {
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            Apio.Users.delete(data, function () {
                console.log("User in cloud successfully deleted");
                socket.emit("apio_user_delete", data);
            });
            //}
        });

        Apio.Remote.socket.on('apio.remote.user.updateUser', function (data) {
            //Apio.Util.log("Socket user : apio.remote.user.delete");
            //Apio.Users.updateUser(data, function () {
            //    console.log("");
            //});
            //if (data.apioId === Apio.System.getApioIdentifierCloud()) {
            console.log("apio.remote.user.updateUser", data);
            Apio.Users.shareApp(data, function (err, result) {
                if (err) {
                    console.log("Error while sharing app: ", err);
                } else if (result) {
                    console.log("App successfully shared");
                    if (data.method === "add") {
                        socket.emit("apio_server_new", data.objectId);
                    } else if (data.method === "delete") {
                        socket.emit("apio_server_delete", data.objectId);
                    }
                }
            });
            //}
        });

        Apio.Remote.socket.on('apio.remote.user.assignUser', function (data) {
            Apio.Util.log("Socket user : apio.remote.user.assignUser");
            Apio.Users.assignUser(data, function () {
                console.log("User in cloud successfully assigned");
            });
        });

        Apio.Remote.socket.on('apio.remote.user.setPermission', function (data) {
            Apio.Util.log("Socket user : apio.remote.user.setPermission");
            Apio.Users.setPermission(data, function () {
                console.log("User in cloud successfully setPermission");
            });
        });

        Apio.Remote.socket.on('apio.cloud.update', function (data) {
            //if (data.apioId == Apio.System.getApioIdentifierCloud()) {
            data.sendToCloud = false;
            socket.emit("apio_client_update", data);
            //}
        });

        Apio.Remote.socket.on("apio.cloud.sync.end", function (apioId) {
            //if (Apio.Configuration.type === "gateway" && apioId == Apio.System.getApioIdentifierCloud()) {
            //Apio.isBoardSynced = true;
            console.log("----------apio.cloud.sync.end-------- invio true");
            socket.emit("enableCloudUpdate", true);
            //}
            //console.log("apio.cloud.sync.end, Apio.isBoardSynced: ", Apio.isBoardSynced);
        });

        Apio.Remote.socket.on('disconnect', function () {
        });
    }

//socketServer.listen(server);
    var log = function (data) {
        console.log(data);
        //socketServer.emit("logic_update", data);
        socketServer.emit("send_to_client", {
            message: "logic_update",
            data: data
        });
    };

    var port = 8100;

    if (process.argv.indexOf("--http-port") > -1) {
        var index = process.argv.indexOf("--http-port");
        port = Number(process.argv[index + 1]);
    }

    log("Provo a partire");
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

    socketServer.on("connection", function (socket) {
        socket.on("close", function (data) {
            console.log("close, data: ", data);
        });
        socket.on("disconnect", function (data) {
            console.log("disconnect, data: ", data);
        });
        socket.on("syncRequest", function (data) {
            Apio.Remote.socket.emit("apio.server.handshake", {
                apioId: Apio.System.getApioIdentifierCloud()
            });
        });
    });

    MongoClient.connect("mongodb://" + configuration.database.hostname + ":" + configuration.database.port + "/" + configuration.database.database, function (error, db) {
        if (error) {
            console.log("Unable to get database");
        } else if (db) {
            db.collection("Services").findOne({name: "cloud"}, function (err, service) {
                if (err) {
                    console.log("Error while getting service Cloud: ", err);
                    console.log("Service Cloud DOESN'T Exists, creating....");
                    db.collection("Services").insert({
                        name: "cloud",
                        show: "Cloud",
                        port: String(port)
                    }, function (err) {
                        if (err) {
                            console.log("Error while creating service Cloud on DB: ", err);
                        } else {
                            console.log("Service Cloud successfully created");
                        }
                    });
                } else if (service) {
                    console.log("Service Cloud exists");
                } else {
                    console.log("Unable to find service Cloud");
                    console.log("Service Cloud DOESN'T Exists, creating....");
                    db.collection("Services").insert({
                        name: "cloud",
                        show: "Cloud",
                        port: String(port)
                    }, function (err) {
                        if (err) {
                            console.log("Error while creating service Cloud on DB: ", err);
                        } else {
                            console.log("Service Cloud successfully created");
                        }
                    });
                }
            });

            db.collection("Services").findOne({name: "mail"}, function (err, service) {
                if (err) {
                    console.log("Error while finding service mail: ", err);
                } else if (service) {
                    Socket = libraries["socket.io-client"]("http://localhost:" + service.port);
                    Socket.on("connect", function () {
                        mailSocketConnected = true;
                    });
                }
            });
            console.log("Database correctly initialized");
        }
    });

    /***************************************CLOUD SOCKET ************************************/
        //Apio.Remote = {
        //    connectionRetryCounter: 0
        //};

//SERVER
    http.listen(port, function () {
        log("APIO Cloud Service correctly started on port " + port);
        Apio.Database.connect(function () {
            //if (Apio.Configuration.remote.enabled) {
            //    if (Apio.Configuration.type == "gateway") {
            //    }
            //}
        });
    });
};
