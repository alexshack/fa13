/**
 * Created by sandr on 01.10.15.
 */

exports.index = function(req, res) {
    res.render('admin/test', {

    });
};

exports.getCalendarEntryWithDate = function(req, res) {

    var ondate = req.body.ondate.split(".");

    var date = new Date(ondate[1] + " " + ondate[0] + " " + ondate[2]);

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
                res.send({"errors": "No calendar enty found in date " + ondate})
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

exports.uploadAllFile = function (req, res) {
    var parseAll = require('cloud/controllers/parseAll');
    var calId = req.body.calendarEntryId;
    var fileData64 = req.body.b64.replace("data:application/zip;base64,", "");


    if (!calId || calId == "" || !fileData64 || fileData64 == "") {
        res.render('admin/test', {
            errors: "Empty calendar Id got or no file sent!"
        });
    }


    var timetableQuery = new Parse.Query("Timetable");
    timetableQuery.get(calId, {

        success: function (calendarEntry) {

            parseAll.parseAllFileOnRequest(calendarEntry, fileData64).then(function(result) {

                console.log(result);
                res.render('admin/test', {
                    content: JSON.stringify(result),
                    contentObj:result
                });
            }, function(error) {
                console.log("Error on parsing all file: " + error);
                res.render('admin/test', {
                    errors: "Error on parsing all file: " + error
                });
            });

        },

        error: function (object, error) {
            console.log("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
            res.render('admin/test', {
                errors: "Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message
            });

        }
    });


};

exports.updateTimetable = function (req, res) {
    //admin/updatetimetable?from=8-2015&to=12-2015
    var from = req.query.from.split("-");
    var to = req.query.to.split("-");
    var fromDate = new Date(from[0] + " 01 " + from[1]);


    var toDate = new Date(to[0] + " 01 " + to[1]);

    var m = parseInt(to[0]);
    var y = parseInt(to[1]);
    if (m == 12) {
        y++;
        m = 1;
    } else {
        m++;
    }


    var fToDate = new Date(m + " 01 " + y);
    var seasonQuery = new Parse.Query("Season");

    // console.log(fromDate + " - " + toDate);

    seasonQuery.lessThanOrEqualTo("validFrom", fromDate);
    seasonQuery.greaterThanOrEqualTo("validTo", fToDate);
    seasonQuery.first({
        success: function (season) {
            if (season) {
                var timetableQuery = new Parse.Query("Timetable");
                timetableQuery.greaterThanOrEqualTo("date", fromDate);
                timetableQuery.lessThanOrEqualTo("date", fToDate);
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
                                    res.render('admin/test', {
                                        errors: "Error on deleting old timetable entries: " + error.code + " " + error.message
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
                        res.render('admin/test', {
                            errors: "Error on finding timetable: " + error.code + " " + error.message
                        });
                    }
                })
            } else {
                // res.send({"error":"No active season found"})
                res.render('admin/test', {
                    errors: "No active season found"
                });
            }
        },
        error: function (error) {
            console.log("Error on finding Currencies: " + error.code + " " + error.message);
            res.render('admin/test', {
                errors: "Error on finding Currencies: " + error.code + " " + error.message
            });
            //res.send(error);
        }
    });
};

function createNewEntry(res, dateFrom, dateTo, season) {
    var timetableJS = [];
    var htmlparser = require("cloud/lib/htmlparser");
    var utfEncoder = require("cloud/lib/w1251ToUtf");
    //var iconv  = require('cloud/lib/node_modules/iconv-lite/lib/index');


    var years = dateTo[1] - dateFrom[1];
    var months = dateTo[0] - dateFrom[0] + 1;

    if (years > 0) {
        months = 12 - dateFrom[0] + dateTo[0];
    }

    if (months > 12 || years > 1) {
        res.render('admin/templateItem', {
            errors: "Обновление календаря, сроком более одного года - бессмысленно!"
        });
        //res.send({"Error":"Обновление календаря, сроком более одного года - бессмысленно!"})

    }


    var dates = [];

    for (var i = 0; i < months; i++) {


        if (JSON.parse(dateFrom[0]) + i > 12) {
            dateFrom[0] = 0;
            dateFrom[1]++;
        }

        dates.push({"month": JSON.parse(dateFrom[0]) + i, "year": dateFrom[1]});

    }

    if (dates.length == 0) {
        res.render('admin/test', {
            errors: "Выбран очень маленький период времени!"
        });
        //   res.send({"Error":"Выбран очень маленький период времени!"})
    }

    var m = 0;
    var events = [];
    getCalendar(dates[m]);

    function getCalendar(date) {


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

                    res.render('admin/test', {
                        content: JSON.stringify(events),
                        contentObj: events
                    })

                },
                error: function (error) {
                    console.log("Error on creating timetable entries: " + error.code + " " + error.message);
                    res.render('admin/test', {
                        errors: "Error on creating old timetable entries: " + error.code + " " + error.message
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
                            res.render('admin/test', {
                                errors: "Error on parsing timetable from site. Response: " + error.message
                            })

                        } else {

                            //getting event
                            getEvents(htmlparser.DomUtils.getElementsByTagName("td", dom), year, month, timetableJS);

                            //events.push(jsevent);
                            // var cells =  json["query"].results.body.div.div[0].div[2].div.table.tbody;
                            //console.log(JSON.stringify(jsevent));


                            events = timetableJS;
                            getCalendar(dates[m]);
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

function getEvents(monthEntries, year, month, result) {

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


            if (ev[2] && ev[2].match(matchEvents)) {
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

