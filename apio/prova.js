//var MongoClient = require("mongodb").MongoClient;
//var mysql = require("mysql");
//var sql_db = mysql.createConnection("mysql://root:root@127.0.0.1/Logs");
//
//MongoClient.connect("mongodb://127.0.0.1:27017/apio", function (e, mongo_db) {
//    if (e) {
//        console.log("Unable to get database: ", e);
//    } else if (mongo_db) {
//        sql_db.connect(function (err) {
//            if (err) {
//                console.error("error connecting: ", err);
//            } else {
//                console.log("connected as id: " + sql_db.threadId);
//                mongo_db.collection("Objects").find().toArray(function (f_err, objects) {
//                    if (f_err) {
//                        console.log("Error while finding objects: ", f_err);
//                    } else if (objects) {
//                        objects.forEach(function (object) {
//                            var condition_array = [];
//
//                            if (Object.keys(object.properties).length) {
//                                for (var p in object.properties) {
//                                    if (["apiobutton", "apiolink", "asyncdisplay", "autocomplete", "battery", "collapse", "dynamicview", "graph", "list", "log", "note", "property", "ranking", "text", "textbox"].indexOf(object.properties[p].type) > -1) {
//                                        condition_array.push(p + " TEXT");
//                                    } else if (["number", "trigger", "unclickabletrigger"].indexOf(object.properties[p].type) > -1) {
//                                        condition_array.push(p + " INT");
//                                    } else if (["sensor", "slider", "unlimitedsensor"].indexOf(object.properties[p].type) > -1) {
//                                        condition_array.push(p + " DOUBLE");
//                                    }
//                                }
//
//                                var condition_string = "id INT UNSIGNED NOT NULL AUTO_INCREMENT, " + condition_array.join(", ") + ", timestamp BIGINT UNSIGNED NOT NULL, PRIMARY KEY (id)";
//
//                                sql_db.query("CREATE TABLE `" + object.objectId + "` (" + condition_string + ")", function (error, result) {
//                                    if (error) {
//                                        console.log("Error while creating table: ", error);
//                                    } else if (result) {
//                                        console.log("Created table " + object.objectId + ", result: ", result);
//                                    } else {
//                                        console.log("No result");
//                                    }
//                                });
//                            }
//                        });
//                    }
//                });
//            }
//        });
//    }
//});

//var MongoClient = require("mongodb").MongoClient;
//var fs = require("fs");
//var mysql = require("mysql");
//var sql_db = mysql.createConnection("mysql://root:root@127.0.0.1/Logs");
//var basePath = "public/applications";
//MongoClient.connect("mongodb://127.0.0.1:27017/apio", function (e, mongo_db) {
//    if (e) {
//        console.log("Unable to get database: ", e);
//    } else if (mongo_db) {
//        sql_db.connect(function (err) {
//            if (err) {
//                console.error("error connecting: ", err);
//            } else {
//                console.log("connected as id: " + sql_db.threadId);
//                fs.readdir(basePath, function (a_err, applications) {
//                    if (a_err) {
//                        console.log("Error while reading folder " + basePath + ": ", a_err);
//                    } else if (applications) {
//                        for (var i = 0; i < applications.length; i++) {
//                            if (isNaN(applications[i]) || applications[i] === "10") {
//                                applications.splice(i--, 1);
//                            }
//                        }
//
//                        applications.forEach(function (application) {
//                            mongo_db.collection("Objects").findOne({objectId: application}, function (o_err, object) {
//                                if (o_err) {
//                                    console.log("Error while getting object with objectId " + application + ": ", o_err);
//                                } else if (object) {
//                                    fs.readdir(basePath + "/" + application, function (f_err, logFiles) {
//                                        if (f_err) {
//                                            console.log("Error while reading folder " + basePath + "/" + application + ": ", f_err);
//                                        } else if (logFiles) {
//                                            for (var i = 0; i < logFiles.length; i++) {
//                                                if (logFiles[i].indexOf(".json") === -1 || logFiles[i].indexOf("logs") === -1) {
//                                                    logFiles.splice(i--, 1);
//                                                }
//                                            }
//
//                                            logFiles.forEach(function (file) {
//                                                console.log(basePath + "/" + application + "/" + file);
//                                                fs.readFile(basePath + "/" + application + "/" + file, "utf8", function (error, data) {
//                                                    if (error) {
//                                                        console.log("Error while reading file " + basePath + "/" + application + "/" + file + ": ", error);
//                                                    } else if (data) {
//                                                        try {
//                                                            data = JSON.parse(data);
//                                                        } catch (e) {
//                                                            console.log("Exception while parsing file " + basePath + "/" + application + "/" + file + ": ", e);
//                                                            data = {};
//                                                        }
//
//                                                        var fields = Object.keys(data);
//                                                        for (var i in fields) {
//                                                            if (!object.properties.hasOwnProperty(fields[i])) {
//                                                                delete data[fields[i]];
//                                                            }
//                                                        }
//
//                                                        fields = Object.keys(data);
//                                                        fields.push("timestamp");
//
//                                                        var rows = [];
//
//                                                        var isIn = function (ts) {
//                                                            var val = -1;
//                                                            for (var i = 0; val === -1 && i < rows.length; i++) {
//                                                                if (rows[i][rows[i].length - 1] === ts) {
//                                                                    val = i;
//                                                                }
//                                                            }
//
//                                                            return val;
//                                                        };
//
//                                                        for (var i in data) {
//                                                            for (var j in data[i]) {
//                                                                var index = isIn(j);
//                                                                if (index === -1) {
//                                                                    var row = [];
//                                                                    row[fields.length - 1] = j;
//                                                                    row[fields.indexOf(i)] = data[i][j];
//                                                                    rows.push(row);
//                                                                } else {
//                                                                    rows[index][fields.length - 1] = j;
//                                                                    rows[index][fields.indexOf(i)] = data[i][j];
//                                                                }
//                                                            }
//                                                        }
//
//                                                        //console.log("file: ", basePath + "/" + application + "/" + file, "fields: ", fields, "rows: ", rows);
//                                                        var sql = "INSERT INTO `" + application + "` (" + fields.join() + ") VALUES ?";
//                                                        //for (var r in rows) {
//                                                        //    for (var x = 0; x < rows[r].length; x++) {
//                                                        //        if (rows[r][x] === undefined) {
//                                                        //            rows[r][x] = null;
//                                                        //        }
//                                                        //    }
//                                                        //}
//                                                        sql_db.query(sql, [rows], function (s_err) {
//                                                            if (s_err) {
//                                                                console.log("Error while inserting data in table " + application + ": ", s_err);
//                                                            } else {
//                                                                console.log("Successfully inserted data " + rows + " in table " + application);
//                                                            }
//                                                        });
//                                                    }
//                                                });
//                                            });
//                                        }
//                                    });
//                                }
//                            });
//                        });
//                    }
//                });
//            }
//        });
//    }
//});

//MongoClient.connect("mongodb://127.0.0.1:27017/apio", function (e, mongo_db) {
//    if (e) {
//        console.log("Unable to get database: ", e);
//    } else if (mongo_db) {
//        sql_db.connect(function (err) {
//            if (err) {
//                console.error("error connecting: ", err);
//            } else {
//                console.log("connected as id: " + sql_db.threadId);
//                var application = "14";
//                mongo_db.collection("Objects").findOne({objectId: application}, function (o_err, object) {
//                    if (o_err) {
//                        console.log("Error while getting object with objectId " + application + ": ", o_err);
//                    } else if (object) {
//                        fs.readdir(basePath + "/" + application, function (f_err, logFiles) {
//                            if (f_err) {
//                                console.log("Error while reading folder " + basePath + "/" + application + ": ", f_err);
//                            } else if (logFiles) {
//                                for (var i = 0; i < logFiles.length; i++) {
//                                    if (logFiles[i].indexOf(".json") === -1 || logFiles[i].indexOf("logs") === -1) {
//                                        logFiles.splice(i--, 1);
//                                    }
//                                }
//
//                                logFiles.forEach(function (file, index, arr) {
//                                    console.log(basePath + "/" + application + "/" + file);
//                                    fs.readFile(basePath + "/" + application + "/" + file, "utf8", function (error, data) {
//                                        if (error) {
//                                            console.log("Error while reading file " + basePath + "/" + application + "/" + file + ": ", error);
//                                        } else if (data) {
//                                            try {
//                                                data = JSON.parse(data);
//                                            } catch (e) {
//                                                console.log("Exception while parsing file " + basePath + "/" + application + "/" + file + ": ", e);
//                                                data = {};
//                                            }
//
//                                            var fields = Object.keys(data);
//                                            for (var i in fields) {
//                                                if (!object.properties.hasOwnProperty(fields[i])) {
//                                                    delete data[fields[i]];
//                                                }
//                                            }
//
//                                            fields = Object.keys(data);
//                                            fields.push("timestamp");
//
//                                            var rows = [];
//
//                                            var isIn = function (ts) {
//                                                var val = -1;
//                                                for (var i = 0; val === -1 && i < rows.length; i++) {
//                                                    if (rows[i][rows[i].length - 1] === ts) {
//                                                        val = i;
//                                                    }
//                                                }
//
//                                                return val;
//                                            };
//
//                                            for (var i in data) {
//                                                for (var j in data[i]) {
//                                                    var index = isIn(j);
//                                                    if (index === -1) {
//                                                        var row = [];
//                                                        row[fields.length - 1] = j;
//                                                        row[fields.indexOf(i)] = data[i][j];
//                                                        rows.push(row);
//                                                    } else {
//                                                        rows[index][fields.length - 1] = j;
//                                                        rows[index][fields.indexOf(i)] = data[i][j];
//                                                    }
//                                                }
//                                            }
//
//                                            //console.log("file: ", basePath + "/" + application + "/" + file, "fields: ", fields, "rows: ", rows);
//                                            var sql = "INSERT INTO `" + application + "` (" + fields.join() + ") VALUES ?";
//                                            //for (var r in rows) {
//                                            //    for (var x = 0; x < rows[r].length; x++) {
//                                            //        if (rows[r][x] === undefined) {
//                                            //            rows[r][x] = null;
//                                            //        }
//                                            //    }
//                                            //}
//                                            sql_db.query(sql, [rows], function (s_err) {
//                                                if (s_err) {
//                                                    console.log("Error while inserting data in table " + application + ": ", s_err);
//                                                } else {
//                                                    console.log("Successfully inserted data " + rows + " in table " + application);
//                                                }
//                                            });
//                                        }
//                                    });
//                                });
//                            }
//                        });
//                    }
//                });
//            }
//        });
//    }
//});