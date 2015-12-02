var envarlib = require('cloud/controllers/Envar');
var moment = require('cloud/lib/moment-timezone-with-data');
moment.tz.setDefault('Europe/Moscow');

exports.createCalendar = function (req, res) {
    var envar = new envarlib.Envar();
    var from = req.query.from;
    var to = req.query.to;
    envar.init().then(function(result) {

        if (result.currentSeason) {

            result.getVarAsObject("currentSeason").then(function(season) {
                console.log("result.currentSeason = " + season);
                downloadEvents(from, to).then(function(response) {

                    var jsondata = JSON.parse(response);
                    if(jsondata!=null) {
                        var data = jsondata.data;
                        var groupedEvents = {};
                        var dates = [];
                        var fids = [];
                        data.forEach(function(event) {
                            if(typeof groupedEvents[event.virtual_date] !="undefined") {
                                groupedEvents[event.virtual_date].events.push(event);




                                if(["abankrot", "playerbuy", "obmen", "transfer", "smena", "game", "tren", "game-wc", "schoolsale", "club"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateAll"] = true;
                                }
                                if(["translist"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateTransList"] = true;
                                }

                                if(["cup", "shedule"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateTurnirs"] = true;
                                }

                                fids.push(event.id)
                            } else {
                                groupedEvents[event.virtual_date] = {};
                                groupedEvents[event.virtual_date]["date"] = new Date(moment(event.date).tz('Europe/Moscow').format());
                                groupedEvents[event.virtual_date]["virtual_date"] = event.virtual_date;
                                var events = [];
                                events.push(event);

                                groupedEvents[event.virtual_date]["shouldUpdateAll"] = false;
                                groupedEvents[event.virtual_date]["shouldUpdateTransList"] = false;
                                groupedEvents[event.virtual_date]["shouldUpdateTurnirs"] = false;


                                if(["abankrot", "playerbuy", "obmen", "transfer", "smena", "game", "tren", "game-wc", "schoolsale", "club"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateAll"] = true;
                                }
                                if(["translist"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateTransList"] = true;
                                }

                                if(["cup", "shedule"].indexOf(event.event_code) !=-1) {
                                    groupedEvents[event.virtual_date]["shouldUpdateTurnirs"] = true;
                                }

                                groupedEvents[event.virtual_date]["events"] = events;
                                dates.push(event.virtual_date);
                                fids.push(event.id);
                            }
                        });




                            var calQuery = new Parse.Query("Calendar");
                            calQuery.containedIn("virtual_date", dates);
                            calQuery.limit(1000);
                            calQuery.find().then(function(exCalObjects) {
                                var sortedExCalObjects = {};


                                if(exCalObjects.length>0) {
                                    exCalObjects.forEach(function(extCalObject) {
                                        sortedExCalObjects[extCalObject.get("virtual_date")] = extCalObject;
                                    });

                                }


                                var parseCal = [];

                               for (att in groupedEvents) {
                                   var gEvent = groupedEvents[att];
                                    var pCal = {};
                                    if(typeof sortedExCalObjects[gEvent.virtual_date] !="undefined") {
                                        pCal = sortedExCalObjects[gEvent.virtual_date];
                                    } else {
                                        pCal = new Parse.Object("Calendar");
                                        pCal.set("virtual_date", gEvent.virtual_date);
                                    }

                                    pCal.set("date", new Date(moment(gEvent.date).tz('Europe/Moscow').format()));
                                    pCal.set("season", season);
                                    pCal.set("shouldUpdateAll", gEvent.shouldUpdateAll);
                                    pCal.set("shouldUpdateTransList", gEvent.shouldUpdateTransList);
                                    pCal.set("shouldUpdateTurnirs", gEvent.shouldUpdateTurnirs);
                                    parseCal.push(pCal)

                                }




                                if(parseCal.length > 0) {

                                    Parse.Object.saveAll(parseCal, {
                                        success:function(objects) {
                                            var sortedCal = {};
                                            objects.forEach(function(pObj) {
                                                sortedCal[pObj.get("virtual_date")] = pObj;
                                            });

                                            var calQuery = new Parse.Query("CalendarEvent");
                                            calQuery.containedIn("fid", fids);
                                            calQuery.limit(1000);
                                            calQuery.find().then(function(exEvObjects) {
                                                var sortedExEvObjects = {};

                                                if(exEvObjects.length>0) {
                                                    exEvObjects.forEach(function(exEvObject) {
                                                        sortedExEvObjects[exEvObject.get("fid")] = exEvObject;
                                                    });
                                                }


                                                var parseEvents = [];
                                                 for (att in groupedEvents) {
                                                     var gCal = groupedEvents[att];

                                                        var gEvents = gCal.events;
                                                     if(typeof gEvents == "undefined") {
                                                         console.log("att = " + att);
                                                         console.log(JSON.stringify(groupedEvents[att]));
                                                     }

                                                         gEvents.forEach(function(gEvent) {
                                                         var pCal = {};
                                                         if(typeof sortedExEvObjects[gEvent.id]!="undefined") {
                                                             pCal = sortedExEvObjects[gEvent.id];
                                                         } else {
                                                             pCal = new Parse.Object("CalendarEvent");
                                                             pCal.set("fid", gEvent.id);
                                                         }

                                                         pCal.set("date", new Date(moment(gEvent.date).tz('Europe/Moscow').format()));
                                                         pCal.set("virtual_date", gEvent.virtual_date);
                                                         pCal.set("event_code", gEvent.event_code);
                                                         pCal.set("description", gEvent.description);
                                                         pCal.set("season", season);
                                                         pCal.set("calendar",sortedCal[gEvent.virtual_date]);
                                                         parseEvents.push(pCal);
                                                     });

                                                }


                                                    Parse.Object.saveAll(parseEvents, {
                                                        success:function(objects) {
                                                            res.send("Календарь успешно обновлен!")
                                                        },
                                                        error:function(error) {
                                                            console.log(error.message);
                                                            return res.send("Ошибка сохранения события календаря:" + error.message)
                                                        }
                                                    });


                                            }, function(exEvObjects, error) {
                                                console.log(error.message);
                                                return res.send("Ошибка поиска события календаря:" + error.message)
                                            });


                                        },

                                        error:function(error) {
                                            console.log(error.message);
                                            return res.send("Ошибка сохранения календаря: " + error.message)
                                        }
                                    });


                                } else {
                                    return res.send("Ошибка парсинга результата")
                                }
                            }, function(exCalObjects, error) {
                                return res.send("Ошибка запроса календаря")
                            });


                       // return res.send(groupedEvents);
                    } else {
                        return res.send("Ошибка парсинга результата")
                    }


                }, function(error) {
                    return res.send(error.message)
                })
            }, function (error) {
                console.log(error.message);
                return res.send({
                    "result":"error",
                    "message": "Не найден активный сезон!"
                });
            });
        } else {
            console.log(result);
            res.send(result)
        }
    });


    function downloadEvents(dateFrom, dateTo) {
        var promise = new Parse.Promise ();

        var lnk = "http://www.fa13.info/index.api.php?action=calendar&date_from="+moment(dateFrom).format("YYYY-MM-DD")+"&date_to="+moment(dateTo).format("YYYY-MM-DD");
        console.log(lnk);
        Parse.Cloud.httpRequest({
            //url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'http%3A%2F%2Fwww.fa13.info%2Ftimetable.html%3Fyear%3D" + year + "%26month%3D" + month + "'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
            //http://www.fa13.info/index.api.php?action=calendar&date_from=2015-08-26&date_to=2015-12-30



            url: lnk,
            headers: {

                'Content-Type': 'application/json'

            }

            //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'http%3A%2F%2Fwww.fa13.info%2Ftimetable.html%3Fyear%3D' + year + '%26month%3D' + month + '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys
        }).then(function (httpResponse) {
            console.log("status = " + httpResponse.status);
            promise.resolve(httpResponse.text)
        }, function(httpResponse, error) {
            console.log("status = " + httpResponse.status);
            promise.reject(error)
        });

        return promise
    }


};

exports.migrateCalendar = function(req, res) {
    var i = parseInt(req.query.i);
  migrate(i).then(function(result) {
      return res.send(result)
  }, function(error) {
      return res.send(error.message);
  })

};

function migrate(start) {

    var promise = new Parse.Promise();

    var newQ = new Parse.Query("Calendar");
    newQ.limit(1000);
    newQ.find().then(function(newCalEntries) {
       // console.log(newCalEntries[42].get("date"));
        changeItem(start, newCalEntries)

    });

    function callSuccess(result) {
        promise.resolve(result)
    }

    function callError(error) {
        promise.reject(error)
    }

    function changeItem(k, newCalEntries) {
        var i = k;
        console.log("i = " +i + "date = " + newCalEntries[i].get("date"));
        if(i<newCalEntries.length) {



            var oldQuery = new Parse.Query("Timetable");
            var newEntry = newCalEntries[i];
            oldQuery.equalTo("date", newEntry.get("date"));
            oldQuery.find().then(function(oldCalEntries) {
                if(i<newCalEntries.length) {
                    if(oldCalEntries.length>0) {
                        var objectsToSave = [];
                        var clQuery = new Parse.Query("Club");
                        clQuery.limit(1000);
                        clQuery.doesNotExist( "calendar" );
                        clQuery.equalTo("calendarEntry",oldCalEntries[0]);
                        clQuery.find().then(function(clubs) {
                            clubs.forEach(function(obj) {
                                obj.set("calendar", newCalEntries[i]);
                                objectsToSave.push(obj);
                            });

                            var plQuery = new Parse.Query("Player");
                            plQuery.equalTo("calendarEntry",oldCalEntries[0]);
                            plQuery.limit(1000);
                            plQuery.doesNotExist( "calendar" );
                            plQuery.find().then(function(players) {
                                players.forEach(function(obj) {
                                    obj.set("calendar", newCalEntries[i]);
                                    objectsToSave.push(obj);
                                });
                               // objectsToSave.push(players);
                                var manQuery = new Parse.Query("Manager");
                                manQuery.equalTo("calendarEntry",oldCalEntries[0]);
                                manQuery.limit(1000);
                                    manQuery.doesNotExist( "calendar" );
                                manQuery.find().then(function(managers) {
                                    managers.forEach(function(obj) {
                                        obj.set("calendar", newCalEntries[i]);
                                        objectsToSave.push(obj);
                                    });
                                    //objectsToSave.push(managers);

                                    if(objectsToSave.length>0) {
                                        console.log("i = " + i + " length = " + objectsToSave.length);
                                        Parse.Object.saveAll(objectsToSave, {
                                            success:function(result) {
                                                i++;
                                                console.log("i = " + i);
                                                changeItem(i, newCalEntries);


                                            },
                                            error:function(error) {
                                                console.log(error.message);
                                                callError(error);
                                            }

                                        })
                                    } else {
                                        i++;
                                        changeItem(i, newCalEntries);

                                    }
                                }
                                    , function(objects, error) {
                                        callError(error);
                                    })
                            },
                                 function(objects, error) {
                                    callError(error);
                                })
                        }, function(objects, error) {
                            callError(error);
                        });

                    } else {
                        i++;
                        changeItem(i, newCalEntries);
                    }
                } else {
                    callSuccess("All entries were processed");
                }

            });

        } else {

            callSuccess("All entries were processed");
        }
    }

    return promise;
}

exports.getCalendarEntryWithDate = function(req, res) {

    //var ondate = req.body.ondate.split(".");

    //var date = new Date(ondate[1] + " " + ondate[0] + " " + ondate[2] + " 00:00:00 GMT+0300");
    var date = new Date(moment(req.body.ondate).tz('Europe/Moscow').format())

    var timetableQuery = new Parse.Query("Calendar");
    timetableQuery.equalTo("date", date);
    timetableQuery.limit(1000);
    timetableQuery.find({
        success: function (entries) {
            if(entries.length>0) {
                var entry = entries[0];

                var eventsQuery = new Parse.Query("CalendarEvent");
                eventsQuery.equalTo("calendar", entry);
                eventsQuery.find().then(function(events) {

                    var descriptions = [];
                    events.forEach(function(event) {
                        descriptions.push(event.get("description"));
                    });

                    res.send({
                        "calendarEntryId": entry.id,
                        "events":descriptions
                    })
                })



            } else {
                res.send({"errors": "No calendar entry found in date " + date})
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

