//Copyright 2014-2015 Alex Benfaremo, Alessandro Chelli, Lorenzo Di Berardino, Matteo Di Sabatino

/********************************** LICENSE *********************************
 *                                                                          *
 * This file is part of ApioOS.                                             *
 *                                                                          *
 * ApioOS is free software released under the GPLv2 license: you can        *
 * redistribute it and/or modify it under the terms of the GNU General      *
 * Public License version 2 as published by the Free Software Foundation.   *
 *                                                                          *
 * ApioOS is distributed in the hope that it will be useful, but            *
 * WITHOUT ANY WARRANTY; without even the implied warranty of               *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the             *
 * GNU General Public License version 2 for more details.                   *
 *                                                                          *
 * To read the license either open the file COPYING.txt or                  *
 * visit <http://www.gnu.org/licenses/gpl2.txt>                             *
 *                                                                          *
 ****************************************************************************/

"use strict";
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var domain = require("domain");
var exec = require("child_process").exec;
var express = require("express");
var fs = require("fs");
var http = require("http");
//var logger = require("morgan");
var path = require("path");
var request = require("request");
var session = require("express-session");
var util = require("util");

var Slack = require('node-slack');
var webhook_url = "https://hooks.slack.com/services/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";
var slack = new Slack(webhook_url);

var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var transporter = nodemailer.createTransport(smtpTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "apioassistance@gmail.com",
        pass: "Apio22232425."
    }
}));

var app = express();
var configuration = {};

if (process.argv.indexOf("--config") > -1) {
    configuration = require(process.argv[process.argv.indexOf("--config") + 1]);
} else {
    configuration = require("./configuration/default.js");
}

configuration.dongle = require("./configuration/dongle.js");

if (process.argv.indexOf("--use-remote") > -1) {
    configuration.remote.enabled = true;
    configuration.remote.uri = process.argv[process.argv.indexOf("--use-remote") + 1]
}
if (process.argv.indexOf("--no-serial") > -1) {
    configuration.serial.enabled = false;
}

if (process.argv.indexOf("--http-port") > -1) {
    configuration.http.port = process.argv[process.argv.indexOf("--http-port") + 1];
}

if (process.argv.indexOf("--serial-port") > -1) {
    configuration.serial.port = process.argv[process.argv.indexOf("--serial-port") + 1];
}

var Apio = require("./apio.js")(configuration);

var sessionMiddleware = session({
    cookie: {
        expires: false,
        maxAge: 0,
        name: "apioCookie"
    },
    resave: true,
    saveUninitialized: true,
    secret: "e8cb0757-f5de-4c109-9774-7Bf45e79f285"
});

app.use(express.static(path.join(__dirname, "public")));
//app.use(logger("dev"));
app.use(bodyParser.json({
    limit: "50mb"
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
}));
app.use(cookieParser());

//app.use(session({
//    cookie: {
//        expires: false,
//        maxAge: 0,
//        name: "apioCookie"
//    },
//    resave: true,
//    saveUninitialized: true,
//    secret: "e8cb0757-f5de-4c109-9774-7Bf45e79f285"
//}));

app.use(sessionMiddleware);
app.use(function (req, res, next) {
    if (req.headers.host.indexOf("localhost") > -1 || req.headers.host.indexOf("127.0.0.1") > -1) {
        next();
    } else {
        if (req.path === "/" || (req.path.indexOf("template") > -1 && (req.path.indexOf("logo.png") > -1 || req.path.indexOf("background.jpg") > -1)) || req.path === "/apio/user/authenticate" || req.path.indexOf("/apio/sync") > -1 || req.path.indexOf("/apio/enableSync") > -1 || req.path === "/apio/user" || req.path === "/apio/assignToken" || req.headers.hasOwnProperty("cookie")) {
            next();
        } else {
            res.redirect("/");
        }
    }
});

if (typeof Apio === "undefined") {
    Apio = {};
}
if (typeof Apio.user === "undefined") {
    Apio.user = {};
}
if (typeof Apio.user.email === "undefined") {
    Apio.user.email = [];
}

app.use(function (req, res, next) {
    if (req.session.email && Apio.user.email.indexOf(req.session.email) === -1) {
        Apio.user.email.push(req.session.email);
    }
    next();
});

if (Apio.Configuration.type === "cloud") {
    app.use(function (req, res, next) {
        var p = req.path.toString();
        if (p.indexOf("applications") > -1) {
            p = p.replace("applications", "boards%2F" + req.session.apioId);
            res.redirect(p);
        } else if (p.indexOf("planimetry") > -1 && p.indexOf(req.session.apioId) === -1) {
            p = p.replace("planimetry", "planimetry%2F" + req.session.apioId);
            res.redirect(p);
        } else {
            next();
        }
    });
}

var routes = {
    boards: require("./routes/boards.js")(Apio),
    cloud: require("./routes/cloud.js")(Apio),
    core: require("./routes/core.route.js")(Apio),
    dashboard: require("./routes/dashboard.route.js")(Apio),
    dongleApio: require("./routes/dongleapio.js")(Apio),
    events: require("./routes/events.js")(Apio),
    mail: require("./routes/mail.js")(Apio),
    marketplace: require("./routes/marketplace.js")(Apio),
    notifications: require("./routes/notifications.js")(Apio),
    objects: require("./routes/objects.js")(Apio),
    planimetry: require("./routes/planimetry.js")(Apio),
    services: require("./routes/services.js")(Apio),
    states: require("./routes/states.js")(Apio),
    users: require("./routes/users.js")(Apio)
};

process.on("SIGINT", function () {
    console.log("About to exit");
    Apio.Database.db.close();
    process.exit();
});

var d = domain.create();
d.on("error", function (err) {
    Apio.Util.printError(err);
});

d.run(function () {
    if (!fs.existsSync("./uploads")) {
        fs.mkdirSync("./uploads");
    }
    Apio.Socket.init(http, sessionMiddleware);
    Apio.Database.connect(function () {
        Apio.Database.db.collectionNames("Events", function (err, names) {
            if (err) {
                console.log("Error while check existence of Events: ", err);
            } else if (names.length) {
                console.log("Collection Events Exists");
            } else {
                console.log("Collection Events DOESN'T Exists, creating....");
                Apio.Database.db.createCollection("Events", function (error, collection) {
                    if (error) {
                        console.log("Error while creating collection Events");
                    } else if (collection) {
                        console.log("Collection Events successfully created");
                    }
                });
            }
        });
        Apio.Database.db.collectionNames("Objects", function (err, names) {
            if (err) {
                console.log("Error while check existence of Objects: ", err);
            } else if (names.length) {
                console.log("Collection Objects Exists");
            } else {
                console.log("Collection Objects DOESN'T Exists, creating....");
                Apio.Database.db.createCollection("Objects", function (error, collection) {
                    if (error) {
                        console.log("Error while creating collection Objects");
                    } else if (collection) {
                        console.log("Collection Objects successfully created");
                        if (Apio.Configuration.type === "gateway") {
                            var date = new Date();
                            var d = date.getFullYear() + "-" + (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-" + (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());
                            Apio.Database.db.collection("Objects").insert({
                                address: "10",
                                connected: true,
                                created: d,
                                db: {},
                                log: {},
                                marker: {},
                                name: "Analytics",
                                notifications: {},
                                objectId: "10",
                                properties: {},
                                protocol: "l",
                                status: "1",
                                tag: " ",
                                type: "service",
                                user: []
                            }, function (error, result1) {
                                if (error) {
                                    console.log("Error while inserting App Analytics: ", error);
                                } else if (result1) {
                                    console.log("App Analytics successfully installed");
                                }
                            });
                        }
                    }
                });
            }
        });
        Apio.Database.db.collectionNames("Planimetry", function (err, names) {
            if (err) {
                console.log("Error while check existence of Planimetry: ", err);
            } else if (names.length) {
                console.log("Collection Planimetry Exists");
            } else {
                console.log("Collection Planimetry DOESN'T Exists, creating....");
                Apio.Database.db.createCollection("Planimetry", function (error, collection) {
                    if (error) {
                        console.log("Error while creating collection Planimetry");
                    } else if (collection) {
                        console.log("Collection Planimetry successfully created");
                    }
                });
            }
        });

        if (configuration.type === "gateway") {
            require("./services/ngrok.js")(require("./apioLibraries.js"));
            Apio.Database.db.collectionNames("Services", function (err, names) {
                if (err) {
                    console.log("Error while check existence of Services: ", err);
                } else if (names.length) {
                    console.log("Collection Services Exists");
                    for (var i in configuration.dependencies.gateway) {
                        if (i !== "logic" && i !== "mail" && i !== "sms") {
                            if (i === "dongle") {
                                exec("ps aux | grep dongle | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        if (fs.existsSync("./dongle_flag.txt")) {
                                            var hiFlag = Number(String(fs.readFileSync("./dongle_flag.txt")).trim());
                                            if (hiFlag === 0) {
                                                fs.writeFileSync("./dongle_flag.txt", "1");
                                            }
                                        } else {
                                            fs.writeFileSync("./dongle_flag.txt", "1");
                                        }
                                        exec("cd ./services && sudo forever start -s -c 'node --expose_gc' dongle_logic.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "log") {
                                exec("ps aux | grep log | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./services && sudo forever start -s -c 'node --expose_gc' log.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "zwave") {
                                exec("ps aux | grep zwave | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./services && sudo forever start -s -c 'node --expose_gc' zwave.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "notification") {
                                exec("ps aux | grep notification | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./services && sudo forever start -s -c 'node --expose_gc' notification_mail_sms.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else {
                                require("./services/" + i + ".js")(require("./apioLibraries.js"));
                            }
                        }
                    }
                } else {
                    console.log("Collection Services DOESN'T Exists, creating....");
                    Apio.Database.db.createCollection("Services", function (error, collection) {
                        if (error) {
                            console.log("Error while creating collection Services");
                        } else if (collection) {
                            console.log("Collection Services successfully created");
                            for (var i in configuration.dependencies.gateway) {
                                if (i !== "logic" && i !== "mail" && i !== "sms") {
                                    if (i === "dongle") {
                                        exec("ps aux | grep dongle | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                if (fs.existsSync("./dongle_flag.txt")) {
                                                    var hiFlag = Number(String(fs.readFileSync("./dongle_flag.txt")).trim());
                                                    if (hiFlag === 0) {
                                                        fs.writeFileSync("./dongle_flag.txt", "1");
                                                    }
                                                } else {
                                                    fs.writeFileSync("./dongle_flag.txt", "1");
                                                }
                                                exec("cd ./services && sudo forever start -s -c 'node --expose_gc' dongle_logic.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else if (i === "log") {
                                        exec("ps aux | grep log | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./services && sudo forever start -s -c 'node --expose_gc' log.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else if (i === "notification") {
                                        exec("ps aux | grep notification | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./services && sudo forever start -s -c 'node --expose_gc' notification_mail_sms.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        require("./services/" + i + ".js")(require("./apioLibraries.js"));
                                    }
                                }
                            }
                        }
                    });
                }
            });
        } else if (configuration.type === "cloud") {
            Apio.Database.db.collectionNames("Services", function (err, names) {
                if (err) {
                    console.log("Error while check existence of Services: ", err);
                } else if (names.length) {
                    console.log("Collection Services Exists");
                    for (var i in configuration.dependencies.cloud) {
                        if (i !== "logic" && i !== "mail" && i !== "sms") {
                            if (i === "dongle") {
                                exec("ps aux | grep dongle | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' dongle_logic.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "log") {
                                exec("ps aux | grep log | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' log.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "notification") {
                                exec("ps aux | grep notification | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' notification_mail_sms.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "objectWs") {
                                exec("ps aux | grep objectWS | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }

                                        exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' objectWS.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else if (i === "boardSync") {
                                exec("ps aux | grep boardSync | awk '{print $2}'", function (error, stdout, stderr) {
                                    if (error) {
                                        console.log("exec error: " + error);
                                    } else if (stdout) {
                                        stdout = stdout.split("\n");
                                        stdout.pop();
                                        if (stdout.length > 2) {
                                            for (var i in stdout) {
                                                exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log("Process with PID " + stdout[i] + " killed");
                                                    }
                                                });
                                            }
                                        }
                                        exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' boardSync.js", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else {
                                                console.log(i + " server corretly start");
                                            }
                                        });
                                    }
                                });
                            } else {
                                require("./servicesCloud/" + i + ".js")(require("./apioLibraries.js"));
                            }
                        }
                    }
                } else {
                    console.log("Collection Services DOESN'T Exists, creating....");
                    Apio.Database.db.createCollection("Services", function (error, collection) {
                        if (error) {
                            console.log("Error while creating collection Services");
                        } else if (collection) {
                            console.log("Collection Services successfully created");
                            for (var i in configuration.dependencies.cloud) {
                                if (i !== "logic" && i !== "mail" && i !== "sms") {
                                    if (i === "dongle") {
                                        exec("ps aux | grep dongle | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' dongle_logic.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else if (i === "log") {
                                        exec("ps aux | grep log | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' log.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else if (i === "notification") {
                                        exec("ps aux | grep notification | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' notification_mail_sms.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else if (i === "objectWs") {
                                        exec("ps aux | grep objectWS | awk '{print $2}'", function (error, stdout, stderr) {
                                            if (error) {
                                                console.log("exec error: " + error);
                                            } else if (stdout) {
                                                stdout = stdout.split("\n");
                                                stdout.pop();
                                                if (stdout.length > 2) {
                                                    for (var i in stdout) {
                                                        exec("sudo kill -9 " + stdout[i], function (error, stdout, stderr) {
                                                            if (error) {
                                                                console.log("exec error: " + error);
                                                            } else {
                                                                console.log("Process with PID " + stdout[i] + " killed");
                                                            }
                                                        });
                                                    }
                                                }

                                                exec("cd ./servicesCloud && sudo forever start -s -c 'node --expose_gc' objectWS.js", function (error, stdout, stderr) {
                                                    if (error) {
                                                        console.log("exec error: " + error);
                                                    } else {
                                                        console.log(i + " server corretly start");
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        require("./servicesCloud/" + i + ".js")(require("./apioLibraries.js"));
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }

        Apio.Database.db.collectionNames("States", function (err, names) {
            if (err) {
                console.log("Error while check existence of States: ", err);
            } else if (names.length) {
                console.log("Collection States Exists");
            } else {
                console.log("Collection States DOESN'T Exists, creating....");
                Apio.Database.db.createCollection("States", function (error, collection) {
                    if (error) {
                        console.log("Error while creating collection States");
                    } else if (collection) {
                        console.log("Collection States successfully created");
                    }
                });
            }
        });
        Apio.Database.db.collectionNames("Users", function (err, names) {
            if (err) {
                console.log("Error while check existence of Users: ", err);
            } else if (names.length) {
                console.log("Collection Users Exists");
                Apio.Database.db.collection("Users").find({token: {$exists: false}}).toArray(function (error, users) {
                    if (error) {
                        console.log("Error while getting Users: ", error);
                    } else if (users) {
                        for (var i = 0; i < users.length; i++) {
                            if (!users[i].hasOwnProperty("email") || !users[i].hasOwnProperty("password")) {
                                users.splice(i--, 1);
                            }
                        }

                        users.forEach(function (user) {
                            var hash = user.password;
                            while (hash.length < 32) {
                                hash += "0";
                            }

                            var key = hash.substring(0, 32);

                            Apio.Database.db.collection("Users").update({email: user.email}, {$set: {token: Apio.Token.getFromText(user.email, key)}}, function (err_) {
                                if (err_) {
                                    console.log("Error while updating user with email " + user.email + ": ", err_);
                                } else {
                                    console.log("Token on user with email " + user.email + " successfully added");
                                }
                            });
                        });
                    }
                });
            } else {
                console.log("Collection Users DOESN'T Exists, creating....");
                Apio.Database.db.createCollection("Users", function (error, collection) {
                    if (error) {
                        console.log("Error while creating collection Users");
                    } else if (collection) {
                        console.log("Collection Users successfully created");
                    }
                });
            }
        });
        Apio.io.emit("started");

        if (configuration.type === "gateway") {
            Apio.Database.db.collection("Users").find().toArray(function (err, users) {
                if (err) {
                    console.log("Error while getting Users: ", err);
                } else if (users) {
                    var u = [];
                    for (var x in users) {
                        if (users[x].email) {
                            u.push(users[x].email);
                        }
                    }
                    var name = "";
                    if (configuration.hasOwnProperty('name')) {
                        name = configuration.name;

                    } else {
                        name = Apio.System.getApioIdentifier();
                    }
                    slack.send({
                        text: 'Il sistema ' + configuration.name + ' è connesso.Gli utenti abilitati sono:\n\r ' + u.join("\n\r"),
                        username: configuration.name
                    });
                    /*transporter.sendMail({
                     to: "info@apio.cc",
                     from: "Apio <apioassistance@gmail.com>",
                     subject: "Sistema on-line",
                     text: "Il sistema con apioId " + Apio.System.getApioIdentifier() + " ed utenti:\n\r" + u.join("\n\r") + "\n\rsi è connesso alle " + (new Date())
                     }, function (err, info) {
                     if (err) {
                     console.log("Error while sending mail: ", err);
                     } else if (info) {
                     console.log("Mail successfully sent: ", info);
                     }
                     });*/
                }
            });

            //NGROK Verify
            //if (!fs.existsSync("/opt")) {
            //    fs.mkdirSync("/opt");
            //}
            //
            //if (!fs.existsSync("/opt/ngrok")) {
            //    fs.mkdirSync("/opt/ngrok");
            //}
            //
            //if (!fs.existsSync("/opt/ngrok/bin")) {
            //    fs.mkdirSync("/opt/ngrok/bin");
            //}
            //
            //if (!fs.existsSync("/opt/ngrok/bin/ngrok")) {
            //    exec("bash ./ngrok_install.sh", function (error, stdout, stderr) {
            //        if (error) {
            //            console.log("Error while installing ngrok: ", error || stderr);
            //        } else {
            //            console.log("ngrok successfully installed");
            //            exec("curl http://localhost:4040/inspect/http | grep window.common", function (error1, stdout1, stderr1) {
            //                console.log("------------CURL------------");
            //                console.log("error1: ", error1);
            //                console.log("stdout1: ", stdout1);
            //                console.log("stderr1: ", stderr1);
            //            });
            //
            //            request({
            //                method: "GET",
            //                uri: "http://localhost:4040/inspect/http"
            //            }, function (error_, response, body) {
            //                console.log("--------------REQUEST--------------");
            //                console.log("error_: ", error_);
            //                console.log("response: ", response);
            //                console.log("body: ", body);
            //            });
            //        }
            //    });
            //}
        }

        //Apio.System.resumeCronEvents();
        /*

         if (Apio.Configuration.type === "gateway" && Apio.Configuration.remote.enabled) {
         Apio.Remote.setupRemoteConnection();
         }*/
    });

    //Core Routes
    app.post("/apio/manage/file", routes.core.manageDriveFile);

    //Core Routes
    app.post("/apio/file/delete", routes.core.fileDelete);
    app.post("/apio/log", routes.core.log);
    app.get("/", routes.core.index);
    app.get("/admin", routes.core.admin);
    app.get("/app", routes.core.login, routes.core.redirect);
    app.post("/apio/user/setCloudAccess", routes.core.setCloudAccess);
    app.post("/apio/adapter", routes.core.adapter);
    app.get("/apio/restore", routes.core.restore);
    app.post("/apio/serial/send", routes.core.serialSend);
    app.get("/apio/getFiles/:folder", routes.core.getFiles);
    app.get("/apio/getAllLogs/:app", routes.core.getAllLogs);
    app.get("/apio/shutdown", routes.core.shutdownBoard);
    app.get("/apio/getPlatform", routes.core.getPlatform);
    app.get("/apio/getServices", routes.core.getServices);
    app.get("/apio/getService/:name", routes.core.getServiceByName);
    app.get("/apio/configuration/return", routes.core.returnConfig);
    app.post("/apio/configuration/toggleEnableCloud", routes.core.toggleEnableCloud);
    app.get("/apio/getIP", routes.core.getIP);
    app.get("/apio/getIPComplete", routes.core.getIPComplete);
    app.post("/apio/process/monitor", routes.core.monitor);
    app.post("/apio/launchPropertiesAdder", routes.core.launchPropertiesAdder);
    app.post("/apio/rebootBoard", routes.core.rebootBoard);
    app.post("/apio/restartSystem", routes.core.restartSystem);
    app.post("/apio/shutdownBoard", routes.core.shutdownBoard);
    app.post("/apio/ngrok/install", routes.core.installNgrok);
    app.get("/apio/communication/bindToProperty", routes.core.getBindToProperty);
    app.post("/apio/communication/bindToProperty", routes.core.modifyBindToProperty);
    app.get("/apio/communication/integrated", routes.core.getIntegrated);
    app.post("/apio/communication/integrated", routes.core.modifyIntegrated);
    app.get("/apio/wifi/ssids", routes.core.getWifiSSIDs);
    app.get("/apio/wifi/currentSsid", routes.core.getWifiCurrentSSID);
    app.get("/apio/wifi/status", routes.core.getWifiStatus);
    app.post("/apio/wifi/switchStatus", routes.core.switchWifiStatus);
    app.get("/apio/3g/status", routes.core.get3gStatus);
    app.get("/apio/3g/data", routes.core.get3gData);
    //Cloud Routes
    app.post("/apio/user/allowCloud", routes.cloud.allowCloud);
    app.post("/apio/sync/:uuid", routes.cloud.sync);
    app.post("/apio/syncLogics", routes.cloud.syncLogics);
    app.get("/apio/enableSync/:apioId/:timestamp", routes.cloud.enableSync);
    app.post("/apio/assignToken", routes.cloud.assignToken);
    //Marketplace Routes
    app.get("/marketplace/applications/download/:name", routes.marketplace.download);
    app.post("/marketplace/applications/autoinstall", routes.marketplace.autoInstall);
    app.post("/marketplace/hex/installHex", routes.marketplace.installHex);
    //Notifications Routes
    app.get("/apio/notifications/:user", routes.notifications.list);
    app.get("/apio/notifications/listDisabled/:user", routes.notifications.listdisabled);
    app.post("/apio/notifications/markAsRead", routes.notifications.delete);
    app.post("/apio/notifications/disable", routes.notifications.disable);
    app.post("/apio/notifications/enable", routes.notifications.enable);
    app.post("/apio/notifications/readAll", routes.notifications.deleteAll);
    app.post("/apio/notify", routes.notifications.notify);
    app.put("/apio/notifications/sendMail/:user", routes.notifications.sendMail);
    app.put("/apio/notifications/sendSMS/:user", routes.notifications.sendSMS);
    //Routes Users
    app.post("/apio/user", routes.users.create);
    app.post("/apio/user/uploadImage", routes.users.uploadImage);
    app.post("/apio/user/saveLastUploadImage", routes.users.saveLastUploadImage);
    app.get("/apio/user", routes.users.list);
    app.get("/apio/user/getSession", routes.users.getSession);
    app.get("/apio/user/getSessionComplete", routes.users.getSessionComplete);
    app.get("/apio/user/getSessionToken", routes.users.getSessionToken);
    app.post("/apio/user/authenticate", routes.users.authenticate);
    app.get("/apio/user/logout", routes.users.logout);
    app.post("/apio/database/updateUserOnApplication", routes.users.updateUserOnApplication);
    app.post("/apio/user/delete", routes.users.delete);
    app.post("/apio/user/changePassword", routes.users.changePassword);
    app.post("/apio/user/setAdminPermission", routes.users.setAdminPermission);
    app.post("/apio/user/assignUser", routes.users.assignUser);
    app.post("/apio/user/getUser", routes.users.getUser);
    app.post("/apio/user/modifyAdditionalInfo", routes.users.modifyAdditionalInfo);
    app.post("/apio/user/:email/editAccess", routes.users.editAccess);
    //Routes Dongle apio
    app.get("/apio/dongle/getSettings", routes.dongleApio.getSettings);
    app.post("/apio/dongle/changeSettings", routes.dongleApio.changeSettings);
    app.post("/apio/dongle/onoff", routes.dongleApio.onoff);
    //States Routes
    app.post("/apio/state/apply", routes.states.apply);
    app.delete("/apio/state/:name", routes.states.deleteState);
    app.put("/apio/state/:name", routes.states.modify);
    app.post("/apio/state", routes.states.create);
    app.get("/apio/state", routes.states.list);
    app.get("/apio/state/:name", routes.states.getByName);
    //Dashboard Routes
    app.get("/dashboard", routes.dashboard.index);
    app.get("/apio/app/export", routes.dashboard.exportApioApp);
    app.get("/apio/app/exportIno", routes.dashboard.exportInoApioApp);
    app.post("/apio/app/upload", routes.dashboard.uploadApioApp);
    app.post("/apio/app/maximumId", routes.dashboard.maximumIdApioApp);
    app.post("/apio/app/gitCloneApp", routes.dashboard.gitCloneApp);
    app.post("/apio/app/delete", routes.dashboard.deleteApioApp);
    app.post("/apio/app/folder", routes.dashboard.folderApioApp);
    app.post("/apio/app/modify", routes.dashboard.modifyApioApp);
    app.post("/apio/database/updateApioApp", routes.dashboard.updateApioApp);
    app.post("/apio/database/createNewApioAppFromEditor", routes.dashboard.createNewApioAppFromEditor);
    app.post("/apio/database/createNewApioApp", routes.dashboard.createNewApioApp);
    app.post("/apio/app/changeSettings", routes.dashboard.changeSettingsObject);
    //Events Routes
    app.get("/apio/event", routes.events.list);
    app.get("/apio/event/launch", routes.events.launch);
    app.get("/apio/event/:name", routes.events.getByName);
    app.delete("/apio/event/:name", routes.events.delete);
    app.put("/apio/event/:name", routes.events.update);
    app.post("/apio/event", routes.events.create);
    //Planimetry Routes
    app.get("/apio/database/getPlanimetry", routes.planimetry.list);
    app.post("/apio/database/insertInDbPlanimetry/", routes.planimetry.insertInDb);
    app.post("/apio/database/modifyInDbPlanimetry/", routes.planimetry.modifyInDb);
    app.post("/apio/database/removeById/", routes.planimetry.removeById);
    app.post("/apio/file/uploadPlanimetry", routes.planimetry.uploadPlanimetry);
    //Objects Routes
    app.get("/apio/database/getObjects", routes.objects.list);
    app.get("/apio/database/getAllObjects", routes.objects.listCloud);
    app.get("/apio/database/getObject/:id", routes.objects.getById);
    app.patch("/apio/object/:id", routes.objects.update);
    app.put("/apio/object/:id", routes.objects.update);
    app.put("/apio/modifyObject/:id", routes.objects.modify);
    app.post("/apio/object/addNotification", routes.objects.addNotification);
    app.get("/apio/object/:obj", routes.objects.requireOne);
    app.get("/apio/objects", routes.objects.listAll);
    app.post("/apio/updateListElements", routes.objects.updateListElements);
    app.post("/apio/object/updateLog", routes.objects.updateLog);
    app.post("/apio/object/updateAll", routes.objects.updateAll);
    //Mail Routes
    app.get("/apio/mail/registration/:mail", routes.mail.sendMailRegistration);
    app.post("/apio/service/mail/send", routes.mail.sendSimpleMail);

    //Boards Routes
    app.get("/apio/boards", routes.boards.show);
    app.get("/apio/boards/getDetailsFor/:boardsArr", routes.boards.getDetails);
    app.post("/apio/boards/change", routes.boards.change);
    app.post("/apio/boards/setName", routes.boards.setName);
    //Services Routes
    app.get("/apio/services", routes.services.getAll);
    app.post("/apio/service/:service/route/:route/data/:data", routes.services.postRequest);
    app.get("/apio/service/:service/route/:route", routes.services.getRequest);

    //Custom Routes
    //routes.custom = require("./public/applications/routes/customRoutes.js")(Apio, app);

    //http.globalAgent.maxSockets = Infinity;
    var server = http.createServer(app);

    Apio.io.listen(server);
    server.listen(configuration.http.port, function () {
        Apio.Util.log("APIO server started on port " + configuration.http.port + " using the configuration:");
        console.log(util.inspect(configuration, {colors: true}));

        exec("cd ./services && node apio_properties_adder.js", function (error, stdout, stderr) {
            if (error || stderr) {
                console.log("apio_properties_adder, error: ", error || stderr);
            } else {
                console.log("apio_properties_adder, success: ", stdout);
            }
        });

        var gc = require("./services/garbage_collector.js");
        gc();

        /*setInterval(function(){
         Apio.Database.db.stats(function(err, stats){
         if(err){
         console.log("Error while getting stats: ", err);
         } else if(Number(stats.storageSize)/1024/1024 >= 35) {
         console.log("DB reached to maximum size, appending data to file");
         Apio.Database.db.collection("Objects").find().toArray(function(error, objs){
         if(error){
         console.log("Error while getting objects: ", error);
         } else if(objs){
         for(var i in objs){
         var date = new Date(), day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear();
         if(fs.existsSync("public/applications/"+objs[i].objectId+"/logs "+year+"-"+month+"-"+day+".json")){
         var read = String(fs.readFileSync("public/applications/"+objs[i].objectId+"/logs "+year+"-"+month+"-"+day+".json"));
         var data = JSON.parse(read === "" ? "{}" : read);
         } else {
         var data = {};
         }

         for(var j in objs[i].log){
         if(typeof data[j] === "undefined"){
         data[j] = {};
         }

         for(var k in objs[i].log[j]) {
         data[j][k] = objs[i].log[j][k];
         }
         }
         fs.writeFileSync("public/applications/"+objs[i].objectId+"/logs "+year+"-"+month+"-"+day+".json", JSON.stringify(data));
         }
         Apio.Database.db.collection("Objects").update({}, { $set : { log : {} } }, { multi: true }, function(e, r){
         if(e){
         console.log("Error while updating logs", e);
         } else if(r){
         Apio.Database.db.command({ compact: "Objects", paddingFactor: 1 }, function(er, re){
         if(er){
         console.log("Unable to compact collection Objects");
         } else if(re){
         console.log("Return of compact is: ", re);
         }
         });
         }
         });
         }
         });
         }
         });
         }, 60000);*/

        //BOT PER MODIFICA FILES, POTREBBE TORNARE UTILE DI NUOVO
        /*setTimeout(function(){
         Apio.Database.db.collection("Objects").find().toArray(function(error, objs){
         if(error){
         console.log("Error while getting objects: ", error);
         } else if(objs){
         for(var i in objs){
         var files = fs.readdirSync("public/applications/"+objs[i].objectId);
         var toWrite = {};
         for(var j in files){
         if(files[j].indexOf("_") === -1 && files[j].indexOf("logs ") > -1 && files[j].indexOf(".json") > -1){
         var read = String(fs.readFileSync("public/applications/"+objs[i].objectId+"/"+files[j]));
         var data = JSON.parse(read === "" ? "{}" : read);

         for(var k in data){
         for(var l in data[k]){
         var date = new Date(Number(l));
         var day = date.getDate();
         var month = date.getMonth() + 1;
         var year = date.getFullYear();

         if(typeof toWrite[year+"-"+month+"-"+day] === "undefined"){
         toWrite[year+"-"+month+"-"+day] = {};
         }

         if(typeof toWrite[year+"-"+month+"-"+day][k] === "undefined"){
         toWrite[year+"-"+month+"-"+day][k] = {};
         }

         toWrite[year+"-"+month+"-"+day][k][l] = data[k][l];
         }
         }
         }
         }

         for(var j in toWrite) {
         fs.writeFileSync("public/applications/" + objs[i].objectId + "/logs " + j + ".json", JSON.stringify(toWrite[j]));
         console.log("File public/applications/" + objs[i].objectId + "/logs " + j + ".json successfully overwrited");
         }
         }
         }
         });
         }, 1000);*/
    });
});
