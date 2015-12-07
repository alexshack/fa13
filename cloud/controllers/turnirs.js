/**
 * Created by sandr on 16.10.15.
 */

var moment = require('cloud/lib/moment-timezone-with-data');
moment.tz.setDefault('Europe/Moscow');

function getTurnirs() {
    var promise = new Parse.Promise();

    var tQuery = new Parse.Query("Turnir");

    tQuery.limit(1000);
    tQuery.find().then(function (turnirs) {
        if (turnirs.length > 0) {
            var sortedTurnirs = {};

            turnirs.forEach(function (turnir) {
                sortedTurnirs[turnir.get("sok")] = turnir;
            });

            promise.resolve(sortedTurnirs);

        } else {
            promise.resolve({});
        }
    }, function (turnirs, error) {
        promise.reject(error);
    });


    return promise;
}

function getClubsForCalendarEntry(calendarEntry) {
    var promise = new Parse.Promise();

    var tQuery = new Parse.Query("Club");
    tQuery.equalTo("calendar", calendarEntry);
    tQuery.limit(1000);
    tQuery.find().then(function (clubs) {
        if (clubs.length > 0) {
            var sortedClubs = {};

            clubs.forEach(function (club) {
                sortedClubs[club.get("clubId")] = club;
            });

            promise.resolve(sortedClubs);

        } else {
            promise.resolve({});
        }
    }, function (error) {
        promise.reject(error);
    });


    return promise;
}



exports.updateMatchesOnDate = function (calendarEntry) {
    var promise = new Parse.Promise();
    updateMatchesInDate(calendarEntry).then(function(result) {
        promise.resolve(result);
    }, function(error) {
        promise.reject(error);
    });

    return promise;

};


function updateMatchesInDate(calendarEntry) {
    var promise = new Parse.Promise();
    getTurnirs().then(function (turnirs) {
        getClubsForCalendarEntry(calendarEntry).then(function(clubs) {
            updateMatchesForCalendarEntry(calendarEntry, turnirs, clubs).then(function (result) {
                promise.resolve(result);
            }, function (error) {
                promise.reject(error);
            });
        }, function(error) {
            promise.reject(error);
        });

    }, function(error) {
        promise.reject(error);
    });

    return promise;
}

exports.updateMatchesOnDateRequest = function (req, res) {
    var calId = req.query.calendarEntryId;
    var timetableQuery = new Parse.Query("Calendar");
    timetableQuery.get(calId, {

        success: function (calendarEntry) {

            getTurnirs().then(function (turnirs) {
                getClubsForCalendarEntry(calendarEntry).then(function(clubs) {
                    updateMatchesForCalendarEntry(calendarEntry, turnirs, clubs).then(function (result) {
                        res.send(result);
                    }, function (error) {
                        res.send(error);
                    });
                }, function(error) {
                    res.send(error);
                });

            }, function(error) {
                res.send(error);
            });

        },

        error: function (object, error) {

            return res.send({
                "result":"error",
                "message": "Не найдена запись в календаре!"
            });

        }
    });




};

function updateMatchesForCalendarEntry(calendarEntry, turnirs, clubs) {
    var promise = new Parse.Promise();
    getMatches(turnirs, clubs, calendarEntry).then(function(result) {
        promise.resolve(result);
    }, function(error) {
        promise.reject(error);
    });


    return promise;
}



function getMatches(turnirs, clubs, calendarEntry) {

    var date = moment(calendarEntry.get("date")).tz('Europe/Moscow').format("YYYY-MM-DD");

    var promise = new Parse.Promise();

    var matches = [];
    var fa13DomenUrl = "";

    Parse.Config.get().then(function (config) {

        fa13DomenUrl = config.get("fa13url");


        if (fa13DomenUrl != "") {
            fa13DomenUrl = fa13DomenUrl + "/index.api.php?action=gameList&date=" + date;
            getmatchesFromFa13Server(fa13DomenUrl).then(function(updatedMatches) {
                savematchesToParse(updatedMatches, turnirs, clubs, calendarEntry).then(function(result) {
                    promise.resolve(result);
                }, function(error) {
                    promise.reject(error.message);
                })
            }, function(error) {
                promise.reject(error.message);
            });
        } else {
            promise.reject("There is no link to da13 server!");
        }

    }, function (error) {
        promise.reject(error.message);
    });


    return promise;

}


function getmatchesFromFa13Server(link) {
    var promise = new Parse.Promise();

    Parse.Cloud.httpRequest({
        url: link,
        headers: {
            'Content-Type': 'application/json'
        },
        success: function (httpResponse) {
            var cTurnirs = JSON.parse(httpResponse.text);

            if (cTurnirs.status == 0) {
                var cMatches = cTurnirs.data;
                promise.resolve(cMatches);
            } else {
                promise.reject("Ошибка запроса на сервер ФА13");
            }
        },
        error: function (error) {
            console.log("ERROR GETTING: " + link);

            promise.reject(error);

        }
    });

    return promise;
}

function savematchesToParse(matches, turnirs, clubs, calendarEntry) {
    var promise = new Parse.Promise();

    var matchQyery = new Parse.Query('Match');
    matchQyery.limit(1000);
    matchQyery.equalTo("calendar", calendarEntry);
    matchQyery.find().then(function (parseMathches) {

        var matchesMap = {};
        var matchesToSave = [];
        if (parseMathches.length > 0) {
            parseMathches.forEach(function (entry) {
                matchesMap[entry.get("matchId")] = entry;
            });
        }


        //var newMatches = [];
        //
        //var oldMatches = [];

        //if (typeof matchesMap[matches[0].id] == "undefined" || matchesMap[matches[0].id] == null) {
        //
        //    return promise.resolve("some sheet");
        //} else {
        //    return promise.resolve(matchesMap[matches[0].id]);
        //}


        //matches.forEach(function (match) {
        for(var i =0; i<matches.length;i++) {
            var match = matches[i];
            var pMatch = matchesMap[match.id];

            if (typeof pMatch == "undefined" || pMatch == null) {
                pMatch = new Parse.Object('Match');
                //newMatches.push(pMatch);
            }

            pMatch = setmatchProperties(pMatch, match);
            matchesToSave.push(pMatch);

        }



        Parse.Object.saveAll(matchesToSave, {
            success: function (matches) {

                promise.resolve("All matches has imported successfully");


            },
            error: function (matches, error) {

                //status.error("Error on saving players: " + error.code + " " + error.message)

                //return result;
                promise.reject(error);

            }
        })



    }, function (parseMathches, error) {
        promise.reject(error);
    });

    function setmatchProperties(pMatch, fMatch) {

        var properties = [
            "realdata",
            "tournament",
            "tournsok",
            "round",
            "teamowner",
            "teamguest",
            "ballowner",
            "ballguest",
            "styleowner",
            "styleguest",
            "schemeowner",
            "schemeguest",
            "taktikowner",
            "taktikguest",
            "agressowner",
            "agressguest",
            "people",
            "sokowner",
            "sokguest",
            "rang",
            "penalty",
            "ustowner",
            "ustguest",
            "poledoma",
            "penitog",
            "basetime",
            "tournamentParse",
            "press_url",
            "report_url",
            "video_url"];


        pMatch.set("matchId", fMatch.id);
        properties.forEach(function (property) {
            pMatch.set(property, fMatch[property]);
        });

        pMatch.set("ownerClub", clubs[fMatch.sokowner]);
        pMatch.set("guestClub", clubs[fMatch.sokguest]);
        pMatch.set("turnir", turnirs[fMatch.tournsok]);
        pMatch.set("calendar", calendarEntry);

        return pMatch;
    }

    return promise;

}

exports.firstImportOfmatches = function(calendarEntries) {
    var promise = new Parse.Promise();

    recursiveImport(0, calendarEntries);

    function recursiveImport(i, calendarEntries) {

        if(i<calendarEntries.length) {
            var calendarEntry = calendarEntries[i];
            updateMatchesInDate(calendarEntry).then(function(result) {

                var lastmatchUpdate = new Parse.Object("lastUpdate");
                lastmatchUpdate.set("date",calendarEntry.get("date"));
                lastmatchUpdate.save({
                    success:function(obj) {
                        console.log(calendarEntry.get("date") + " processed");
                        i++;
                        recursiveImport(i, calendarEntries)
                    },
                    error: function(error) {
                        promise.reject(error.message);
                    }

                });

            }, function(error) {
                promise.reject(error.message);
            })
        } else {
            promise.resolve("All the matches were imported")
        }
    }

    return promise;
};

exports.getAllmatchesForTeam = function(teamId) {
    var promise = new Parse.Promise();

    var gMatchQyery = new Parse.Query('Match');
    gMatchQyery.limit(1000);
    gMatchQyery.equalTo("sokguest", teamId);

    var oMatchQyery = new Parse.Query('Match');
    oMatchQyery.limit(1000);
    oMatchQyery.equalTo("sokowner", teamId);

    var mainQuery =  Parse.Query.or(gMatchQyery, oMatchQyery);


    mainQuery.find().then(function (parseMathches) {
        promise.resolve(parseMathches);
    }, function(parseMatches, error) {
        promise.reject(error.message);
    });


    return promise;
};
