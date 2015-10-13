/**
 * Created by sandr on 01.10.15.
 */

exports.index = function(req, res) {
    res.render('admin/updatePage', {

    });
};

exports.getCalendarEntryWithDate = function(req, res) {

    var ondate = req.body.ondate.split(".");

    var date = new Date(ondate[1] + " " + ondate[0] + " " + ondate[2] + " 00:00:00 GMT+0300");

    var timetableQuery = new Parse.Query("Timetable");
    timetableQuery.equalTo("date", date);
    timetableQuery.limit(1000);
    timetableQuery.find({
        success: function (entries) {
            if(entries.length>0) {
                var entry = entries[0];
                res.send({
                    "calendarEntryId": entry.id,
                    "events":entry.get("event")
                })
            } else {
                res.send({"errors": "No calendar entry found in date " + ondate})
            }


        },
        error: function (error) {
            console.log("Error on finding timetable: " + error.code + " " + error.message);
            // res.send(error);
            res.send({
                errors: "Error on finding timetable: " + error.code + " " + error.message
            });
        }
    });
};

exports.setEnvar = function(varName, varClass, varValue) {

    var promise = new Parse.Promise();

    var varQuery = new Parse.Query('Envar');
    varQuery.equalTo('name', varName);
    varQuery.equalTo('class', varClass);
    varQuery.find({
        success:function(envVars) {
            if(envVars.length >1) {
                promise.reject("More than one envVar was found");

            } else if(envVars.length >0) {
                var envVar = envVars[0];

                envVar.save({
                    value: varValue

                }).then(function(env) {
                    promise.resolve("Env var was saved");

                }, function(error) {
                    promise.reject("Error on saving envVar with name " + varName);

                });

            } else {
                var envVar = new Parse.Object('Envar');

                envVar.save({
                    name:varName,
                    class:varClass,
                    value: varValue

                }).then(function(env) {

                    promise.resolve("Env var was created and saved");

                }, function(error) {
                    promise.reject("Error on creating envVar with name " + varName);

                });
            }
        },
        error:function(error) {

            promise.reject("Error on finding envVar with name " + varName);

        }
    });


    return promise;

};

exports.uploadAllFile = function (req, res) {
    var parseAll = require('cloud/controllers/parseAll');
    var calId = req.body.calendarEntryId;

    var fileData64 = req.body.b64;

    if (!calId || calId == "" || typeof calId  == "undefined"|| typeof  fileData64 == "undefined" || !fileData64 || fileData64 == "") {
        console.log("Не выбрана запись календаря, или не выбран файл импорта!");

        return res.send({
                    "result":"error",
                    "message": "Не выбрана запись календаря, или не выбран файл импорта!"
                });



    }

    fileData64 = fileData64.replace("data:application/zip;base64,", "");
    console.log("file data is not empty!");

    var timetableQuery = new Parse.Query("Timetable");
    timetableQuery.get(calId, {

        success: function (calendarEntry) {

            parseAll.parseAllFileOnRequest(calendarEntry, fileData64).then(function(result) {

                console.log(result);
                //res.render('admin/test', {
                //    content: JSON.stringify(result),
                //    contentObj:result
                //});

                return  res.send({
                    "result":"success",
                    "message": "Импорт произведен успешно"
                });

            }, function(error) {
                console.log("Error on parsing all file: " + error);
                //res.render('admin/test', {
                //    errors: "Error on parsing all file: " + error
                //});

                return  res.send({
                    "result":"error",
                    "message": "При парсинге файла произошла ошибка"
                });

            });

        },

        error: function (object, error) {
            console.log("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
            //res.render('admin/test', {
            //    errors: "Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message
            //});

            return res.send({
                "result":"error",
                "message": "Не найдена запись в календаре!"
            });

        }
    });


};

exports.updateTimetable = function (req, res) {
    //admin/updatetimetable?from=8-2015&to=12-2015

    //return res.send({
    //    "result":"error",
    //    "message": req.query.from + " " + req.query.to
    //});

    var from = req.query.from.split(".");
    var to = req.query.to.split(".");

    var fromDate = new Date(from[1] + " " + from[0] + " " + from[2]);
    var toDate = new Date(to[1] + " " + to[0] + " " + to[2]);

    //
    //var m = parseInt(to[0]);
    //var y = parseInt(to[1]);
    //if (m == 12) {
    //    y++;
    //    m = 1;
    //} else {
    //    m++;
    //}


    var seasonQuery = new Parse.Query("Season");

    // console.log(fromDate + " - " + toDate);

    seasonQuery.lessThanOrEqualTo("validFrom", fromDate);
    seasonQuery.greaterThanOrEqualTo("validTo", toDate);
    seasonQuery.first({
        success: function (season) {
            if (season) {
                var timetableQuery = new Parse.Query("Timetable");
                timetableQuery.greaterThanOrEqualTo("date", fromDate);
                timetableQuery.lessThanOrEqualTo("date", toDate);
                timetableQuery.limit(1000);
                timetableQuery.find({
                    success: function (oldEntries) {
                        //dropping old entries
                        if (oldEntries.length > 0) {
                            Parse.Object.destroyAll(oldEntries, {
                                success: function (oldEntries) {
                                    //creating new timetable entries
                                    console.log("old entries were removed")
                                    createNewEntry(res, from, to, season);

                                },
                                error: function (error) {
                                    console.log("Error on deleting old timetable entries: " + error.code + " " + error.message);
                                    //res.render('admin/test', {
                                    //    errors: "Error on deleting old timetable entries: " + error.code + " " + error.message
                                    //});

                                    return res.send({
                                        "result":"error",
                                        "message": "Ошибка при удалении старых записей календаря"
                                    });

                                    //res.send(error);
                                }
                            })
                        } else {
                            createNewEntry(res, from, to, season);
                        }
                    },
                    error: function (error) {
                        console.log("Error on finding timetable: " + error.code + " " + error.message);
                        // res.send(error);
                        //res.render('admin/test', {
                        //    errors: "Error on finding timetable: " + error.code + " " + error.message
                        //});

                        return res.send({
                            "result":"error",
                            "message": "Ошибка при поиске старых записей календаря"
                        });
                    }
                })
            } else {
                // res.send({"error":"No active season found"})
                //res.render('admin/test', {
                //    errors: "No active season found"
                //});

                return res.send({
                    "result":"error",
                    "message": "Не найден активный сезон!"
                });

            }
        },
        error: function (error) {
            console.log("Error on finding season: " + error.code + " " + error.message);
            //res.render('admin/test', {
            //    errors: "Error on finding Currencies: " + error.code + " " + error.message
            //});
            //res.send(error);

            return res.send({
                "result":"error",
                "message": "Ошибка при поиске сезона!"
            });


        }
    });
};

function createNewEntry(res, dateFrom, dateTo, season) {
    var timetableJS = [];
    var htmlparser = require("cloud/lib/htmlparser");
    var utfEncoder = require("cloud/lib/w1251ToUtf");
    //var iconv  = require('cloud/lib/node_modules/iconv-lite/lib/index');


    var years = dateTo[2] - dateFrom[2];
    var months = dateTo[1] - dateFrom[1] + 1;

    var fromDate = new Date(dateFrom[1] + " " + dateFrom[0] + " " + dateFrom[2]);

    var toDate = new Date(dateTo[1] + " " + dateTo[0] + " " + dateTo[2]);

    if (years > 0) {
        months = 12 - dateFrom[1] + dateTo[1];
    }

    if (months > 12 || years > 1) {
        //res.render('admin/templateItem', {
        //    errors: "Обновление календаря, сроком более одного года - бессмысленно!"
        //});

        return res.send({
            "result":"error",
            "message": "Обновление календаря, сроком более одного года - бессмысленно!"
        });

        //res.send({"Error":"Обновление календаря, сроком более одного года - бессмысленно!"})

    }


    var dates = [];

    for (var i = 0; i < months; i++) {


        if (JSON.parse(dateFrom[1]) + i > 12) {
            dateFrom[1] = 0;
            dateFrom[2]++;
        }

        dates.push({"month": JSON.parse(dateFrom[1]) + i, "year": dateFrom[2]});

    }

    if (dates.length == 0) {
        //res.render('admin/test', {
        //    errors: "Выбран очень маленький период времени!"
        //});

        return res.send({
            "result":"error",
            "message": "Выбран очень маленький период времени!"
        });

        //   res.send({"Error":"Выбран очень маленький период времени!"})
    }

    var m = 0;
    var events = [];
    getCalendar(dates[m], fromDate, toDate);

    function getCalendar(date, from, to) {


        if (m == dates.length) {
            //saving to DB

            var objectstoSave = [];
            for (var o = 0; o < timetableJS.length; o++) {
                var timeObject = new Parse.Object("Timetable");
                var timeEntry = timetableJS[o];
                timeObject.set("date", timeEntry.date);
                timeObject.set("event", timeEntry.events);
                timeObject.set("shouldUpdateAll", timeEntry.shouldUpdateAll);
                timeObject.set("season", season);
                objectstoSave.push(timeObject);
            }

            Parse.Object.saveAll(objectstoSave, {
                success: function (objects) {
                    console.log("RENDERING");
                    //console.log(JSON.stringify(events));
                    //
                    //res.render('admin/test', {
                    //    content: JSON.stringify(events),
                    //    contentObj: events
                    //})


                    return res.send({
                        "result":"success",
                        "message": "Календарь успешно обновлен"
                    });


                },
                error: function (error) {
                    console.log("Error on creating timetable entries: " + error.code + " " + error.message);
                    //res.render('admin/test', {
                    //    errors: "Error on creating old timetable entries: " + error.code + " " + error.message
                    //});

                    return res.send({
                        "result":"error",
                        "message": "Ошибка при создании записи календаря!"
                    });

                    //res.send(error);
                }
            });

            //console.log("RENDERING");
            ////console.log(JSON.stringify(events));
            //
            //res.render('admin/test', {
            //    content: JSON.stringify(events),
            //    contentObj: events
            //})


        } else {
            m++;
            // console.log(date);
            var month = date["month"];
            var year = date["year"];

            //console.log( "http://www.fa13.info/timetable.html?year=" + year + "&month=" + month);

            Parse.Cloud.httpRequest({
                //url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'http%3A%2F%2Fwww.fa13.info%2Ftimetable.html%3Fyear%3D" + year + "%26month%3D" + month + "'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
                url: "http://www.fa13.info/timetable.html?year=" + year + "&month=" + month,
                headers: {

                    'Content-Type': 'text/html; charset=windows-1251'

                }

                //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'http%3A%2F%2Fwww.fa13.info%2Ftimetable.html%3Fyear%3D' + year + '%26month%3D' + month + '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys
            }).then(function (httpResponse) {

                var text = utfEncoder.win2unicode(httpResponse.text);

                var rawHtml = text.replace("<<", "").replace(">>", "").replace(new RegExp('\r?\n', 'g'), "");


                var handler = new htmlparser.HtmlBuilder(function (error, dom) {
                        if (error) {
                            console.log("Error on parsing timetable from site. Response: " + error.message);
                            //res.send({"Error":"Error on parsing timetable from site. Response: " + error.message});
                            //res.render('admin/test', {
                            //    errors: "Error on parsing timetable from site. Response: " + error.message
                            //})


                            return res.send({
                                "result":"error",
                                "message": "Ошибка при парсинге записи календаря!"
                            });

                        } else {

                            //getting event
                            getEvents(htmlparser.DomUtils.getElementsByTagName("td", dom), year, month, timetableJS, from, to);

                            //events.push(jsevent);
                            // var cells =  json["query"].results.body.div.div[0].div[2].div.table.tbody;
                            //console.log(JSON.stringify(jsevent));


                            events = timetableJS;
                            getCalendar(dates[m], from, to);
                        }

                    },
                    {verbose: false}
                );
                var parser = new htmlparser.Parser(handler);
                parser.parseComplete(rawHtml);

            })
        }
    }

}

function getEvents(monthEntries, year, month, result, fromDate, toDate) {

    var tEvents = [];

    //var matchEvents = new RegExp('[^\(]*[\(][^\)]*[\)].*|изменение|банкротство|выкуп|золотые|постройки|обмены|Обмены|финальный|аукцион|Аренда');
    var matchEvents = new RegExp('[\(].*?[\)]|изменение|банкротство|выкуп|золотые|постройки|обмены|Обмены|финальный|аукцион|Аренда');

    for (var i = 0; i < monthEntries.length; i++) {
        var entry = monthEntries[i];

        if (entry.children) {
            var event = [];
            entry.children.forEach(function (child) {
                if (child.type == "text") {
                    event.push(child.data);

                }
            });

            i++;
            entry = monthEntries[i];

            entry.children.forEach(function (child) {
                if (child.type == "text") {

                    event.push(child.data);

                }
            });

            tEvents.push(event);
        }
    }

    if (tEvents.length > 0) {
        // var result = [];
        // console.log(events[0]);
        //console.log("year1 = " + year + " month1 = " + month);

        for (var e = 0; e < tEvents.length; e++) {
            var ev = tEvents[e];
            var resultEv = {};

            var eventDate = new Date(month + " " + ev[0] + " " + year + " 00:00:00 GMT+0300");


            if (ev[2] && ev[2].match(matchEvents) && eventDate >= fromDate && eventDate<=toDate) {
                // console.log(ev[2].match(matchEvents)[0]);
                //resultEv.push(eventDate);
                var eventArray = [];
                for (var c = 2; c < ev.length - 1; c++) {
                    if (ev[c].match(matchEvents)) {
                        eventArray.push(ev[c]);

                    }
                }

                if (eventArray.length > 0) {
                    result.push({"date": eventDate, "events": eventArray, "shouldUpdateAll": true});
                }

                //resultEv.push(eventArray);

            }
            //if(resultEv.length>1) {
            //    resultEv.push(true);
            //    result.push(resultEv);
            //}
        }

        // return result;
    }

}

/*
 фразы для регулярных выражений

 \(([^)]+)\)|(золотые|постройки|Обмены|аукцион|Аренда)


 */

