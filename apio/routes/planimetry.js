var util = require('util');
var fs = require('fs');
var formidable = require('formidable');

module.exports = function (Apio) {
    return {
        insertInDb: function (req, res) {
            var object = req.body;
            if (Apio.Configuration.type === "cloud") {
                object.apioId = req.session.apioId;
            }

            Apio.Database.db.collection("Planimetry").insert(object, function (error, result) {
                if (error) {
                    console.log("Error while inserting Planimetry with planimetryId " + object.planimetryId);
                    res.status(500).send();
                } else if (result) {
                    console.log("Planimetry with planimetryId " + object.planimetryId + " successfully inserted");
                    res.status(200).send("Planimetry insert successfull");

                    if (Apio.Configuration.type === "cloud") {
                        //Apio.io.emit("apio.add.db.planimetry", object);
                        var socketIds = Apio.connectedSockets[req.session.email];
                        for (var i in socketIds) {
                            if (req.session.apioId === Apio.io.sockets.connected[socketIds[i]].client.request.session.apioId) {
                                Apio.io.sockets.connected[socketIds[i]].emit("apio.add.db.planimetry", object);
                            }
                        }
                        //MIGLIORARE (TROVARE TUTTE LE E-MAIL E MANDARE SOLO Lì)

                        //Apio.io.emit("apio.add.db.planimetry.fromcloud", {
                        //    apioId: req.session.apioId,
                        //    planimetry: object
                        //});

                        var socketId = Apio.connectedSockets[req.session.apioId][0];
                        Apio.io.sockets.connected[socketId].emit("apio.add.db.planimetry.fromcloud", {
                            //apioId: req.session.apioId,
                            planimetry: object
                        });
                    } else if (Apio.Configuration.type === "gateway") {
                        Apio.io.emit("apio.add.db.planimetry", object);
                        //MIGLIORARE (TROVARE TUTTE LE E-MAIL E MANDARE SOLO Lì)
                        if (Apio.Configuration.remote.enabled) {
                            Apio.Remote.socket.emit("apio.add.db.planimetry.fromgateway", {
                                apioId: req.session.apioId,
                                planimetry: object
                            });
                        }
                    }
                }
            });
        },
        uploadPlanimetry: function (req, res) {
            console.log("FILE UPLOADER: ", req.body);
            //var url = "public/images/planimetry";
            var url = undefined;

            if (!fs.existsSync("public/images")) {
                fs.mkdirSync("public/images");
            }

            if (!fs.existsSync("public/images/planimetry")) {
                fs.mkdirSync("public/images/planimetry");
            }

            if (Apio.Configuration.type === "cloud") {
                url = "public/images/planimetry/" + req.session.apioId;

                if (!fs.existsSync(url)) {
                    fs.mkdirSync(url);
                }
            } else if (Apio.Configuration.type === "gateway") {
                url = "public/images/planimetry";
            }

            //res.writeHead(200, {'Content-Type': 'application/json'});
            res.setHeader("Content-Type", "application/json");
            var form = new formidable.IncomingForm();
            form.uploadDir = url;
            form.keepExtensions = true;
            //var responseUpload;

            /*form.on('file', function (name, file) {
             console.log("FILE");
             fs.renameSync(file.path, url + "/" + file.name);
             //responseUpload = true;
             //res.status(200).send(responseUpload);
             res.status(200).write(util.inspect(true));
             });

             form.on('fileBegin', function (name, file) {
             if (fs.existsSync(url + "/" + file.name)) {
             console.log("IF")
             //responseUpload = false;
             //res.status(200).send(responseUpload);
             res.status(200).write(util.inspect(false));
             console.log("RES: ", res);
             } else {
             console.log("file.name: ", file.name);
             console.log("ELSE");
             res.status(200).write(util.inspect(true));
             }
             });*/

            form.on('file', function (name, file) {
                console.log("END")
                fs.renameSync(file.path, url + "/" + file.name);
                res.status(200).send(true);

                if (Apio.Configuration.type === "cloud") {
                    //Apio.io.emit("apio.add.planimetry", {
                    //    apioId: req.session.apioId,
                    //    filedata: fs.readFileSync(url + "/" + file.name),
                    //    filename: file.name
                    //});

                    var socketId = Apio.connectedSockets[req.session.apioId][0];
                    Apio.io.sockets.connected[socketId].emit("apio.add.planimetry", {
                        //apioId: req.session.apioId,
                        filedata: fs.readFileSync(url + "/" + file.name),
                        filename: file.name
                    });
                } else if (Apio.Configuration.type === "gateway" && Apio.Configuration.remote.enabled) {
                    Apio.Remote.socket.emit("apio.add.planimetry.fromgateway", {
                        apioId: req.session.apioId,
                        filedata: fs.readFileSync(url + "/" + file.name),
                        filename: file.name
                    });
                }
                //res.end();
            });
            form.parse(req, function (err, fields, files) {
                console.log('file: ', files);
            });

            //res.status(200).send(toSend);
            //res.end();
        },
        modifyInDb: function (req, res) {
            //delete req.body._id;
            console.log("#####################MODIFYINDB###############")
            console.log(req.body);
            //res.status(200).send(req.body.object);
            var object = req.body;
            Apio.Database.db.collection("Planimetry").update({planimetryId: object.planimetryId}, {$set: object}, function (error, result) {
                if (error) {
                    console.log("Error while modifying Planimetry with planimetryId " + object.planimetryId);
                    res.status(500).send(error);
                } else if (result) {
                    console.log("Planimetry with planimetryId " + object.planimetryId + " successfully modified");
                    res.status(200).send("Planimetry insert successfull");
                    //Apio.io.emit("apio_server_update", {objectId : req.params.id});
                }
            });
        },
        update: function (req, res) {
            var object = typeof req.body.object === "string" ? JSON.parse(req.body.object) : req.body.object;

            res.status(200).send();
        },
        removeById: function (req, res) {
            Apio.Database.db.collection("Planimetry").remove({planimetryId: req.body.planimetryId}, function (result) {
                if (Apio.Configuration.type === "cloud") {
                    //Apio.io.emit("apio.remove.db.planimetry", req.body.planimetryId);
                    var socketIds = Apio.connectedSockets[req.session.email];
                    for (var i in socketIds) {
                        if (req.session.apioId === Apio.io.sockets.connected[socketIds[i]].client.request.session.apioId) {
                            Apio.io.sockets.connected[socketIds[i]].emit("apio.remove.db.planimetry", req.body.planimetryId);
                        }
                    }

                    //Apio.io.emit("apio.remove.db.planimetry.fromcloud", {
                    //    apioId: req.session.apioId,
                    //    planimetryId: req.body.planimetryId
                    //});

                    var socketId = Apio.connectedSockets[req.session.apioId][0];
                    Apio.io.sockets.connected[socketId].emit("apio.remove.db.planimetry.fromcloud", {
                        //apioId: req.session.apioId,
                        planimetryId: req.body.planimetryId
                    });
                } else if (Apio.Configuration.type === "gateway") {
                    Apio.io.emit("apio.remove.db.planimetry", req.body.planimetryId);
                    if (Apio.Configuration.remote.enabled) {
                        Apio.Remote.socket.emit("apio.remove.db.planimetry.fromgateway", {
                            apioId: req.session.apioId,
                            planimetryId: req.body.planimetryId
                        });
                    }
                }

                res.send(result);
            });
        },
        list: function (req, res) {
            //var email = req.session.email;
            var email = {};
            if (Apio.Configuration.type === "cloud") {
                email = {
                    apioId: req.session.apioId,
                    email: req.session.email,
                    priviligies: req.session.priviligies
                };
            } else if (Apio.Configuration.type === "gateway") {
                email = {
                    email: req.session.email,
                    priviligies: req.session.priviligies
                };
            }

            Apio.Planimetry.list(email, function (err, data) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(data);
                }
            });
        }
    }
};