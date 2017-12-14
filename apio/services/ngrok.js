//Copyright 2014-2015 Alex Benfaremo, Alessandro Chelli, Lorenzo Di Berardino, Matteo Di Sabatino

/********************************* LICENSE **********************************
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
 * GNU General Public License version 2 for more details.s                   *
 *                                                                          *
 * To read the license either open the file COPYING.txt or                  *
 * visit <http://www.gnu.org/licenses/gpl2.txt>                             *
 *                                                                          *
 ****************************************************************************/

module.exports = function (libraries) {
    var bodyParser = libraries["body-parser"];
    var express = libraries.express;
    var exec = libraries.child_process.exec;
    var app = express();
    var http = libraries.http.Server(app);
    var configuration = require("../configuration/default.js");
    var Apio = require("../apio.js")(configuration);
    var Port = 9192;
    var socket = libraries["socket.io-client"]("http://localhost:" + configuration.http.port, {query: "associate=ngrok"});

    app.use(function (req, res, next) {
        res.header("Accept", "*");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        next();
    });
    app.use(bodyParser.json({
        limit: "50mb"
    }));
    app.use(bodyParser.urlencoded({
        extended: true,
        limit: "50mb"
    }));

    socket.on("ask_ngrok_url", function () {
        console.log("#############ask_ngrok_url################");
        exec("curl http://localhost:4040/inspect/http | grep window.common", function (error, stdout, stderr) {
            if (error) {
                socket.emit("get_ngrok_url", "Error while exec command " + error.toString());
            } else if (stdout) {
                var result = stdout.split(" ");
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
                    console.log("***************mando get_ngrok_url************");
                    socket.emit("get_ngrok_url", "ssh pi@" + url + " -p " + port);
                }
            } else if (stderr) {
                socket.emit("get_ngrok_url", "Error while exec command " + error.toString());
            }
        });
    });

    http.listen(Port, function () {
        console.log("APIO ngrok Service on " + Port);
    });
};
