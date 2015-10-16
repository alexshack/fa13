/**
 * Created by sandr on 16.10.15.
 */

exports.updateMatches = function(req, res) {
    console.log(req.query.turnirType);
    var turnirType = parseInt(req.query.turnirType);
    getTurnirs(turnirType).then(function(result) {
        res.send(result);
    }, function(error) {
        res.send(error);
    });
};


exports.getTurnirs = function(turnirType) {
  return getTurnirs(turnirType);
};

function getTurnirs(turnirType) {
    var promise = new Parse.Promise();

    var tQuery = new Parse.Query("Turnir");


    switch (turnirType) {
        case 0: //WC
            tQuery.contains("turnir", "ОЧМ");

            break;

        case 1: //championships
            tQuery.contains("turnir", "чемпионат");

            break;

        case 2: //intercups

            var qCM1 = new Parse.Query("Turnir").contains("turnir", "ЛЧ");
            var qCM2 = new Parse.Query("Turnir").contains("turnir", "КА");
            var qCM3 = new Parse.Query("Turnir").contains("turnir", "КФ");
            var qCM4 = new Parse.Query("Turnir").contains("turnir", "Федераций");
            var qCM5 = new Parse.Query("Turnir").contains("turnir", "Ассоциации");
            var qCM6 = new Parse.Query("Turnir").contains("turnir", "Чемпионов");

            tQuery.or(qCM1, qCM2, qCM3, qCM4, qCM5, qCM6);

            break;

        case 3: //national cups
            tQuery.contains("turnir", "кубок");

            break;

        case 4: //frendly
            tQuery.equalTo("sok", "rfg");

            break;

        case 5: //allTurnirs

            break;

        default:
            promise.reject("Unknown type of turnirs sent");
    }

    tQuery.find().then(function(turnirs) {
        getMatches(turnirs).then(function(result) {
            promise.resolve(result);
        }, function(error) {
            promise.reject(error);
        });
    }, function(turnirs, error) {
        promise.reject("Error on finfding turnirs");
    });


    return promise;
}

function getMatches(turnirs) {
    var promise = new Parse.Promise();
    var links = [];


    var matches = [];

    var fa13DomenUrl = "";

    var calMap = {};

    Parse.Config.get().then(function (config) {

        fa13DomenUrl = config.get("fa13url");
        console.log("config = " + fa13DomenUrl);

        if (fa13DomenUrl != "") {
            fa13DomenUrl = fa13DomenUrl + "/index.api.php?action=gameList&tournament_id=";
        }
        turnirs.forEach(function (turnir) {
            links.push([turnir, fa13DomenUrl + turnir.get("sok")]);
            console.log(fa13DomenUrl + turnir.get("sok"));
        });

        var t = 0;

        if (links.length > 0) {

            var calQuery = new Parse.Query("Timetable");

            calQuery.ascending("date");
            calQuery.find().then(function (calEntries) {

                calEntries.forEach(function (entry) {
                    calMap[entry.get("date")] = entry;
                });

                getmatchesFromFa13Server(links[t]);

            }, function (calEntries, error) {
                promise.reject(error);
            });

        } else {
            promise.reject("No turnirs found");
        }

    }, function (error) {
        promise.reject(error);
    });


    function getmatchesFromFa13Server(link) {
        Parse.Cloud.httpRequest({
            url: link[1],
            headers: {
                'Content-Type': 'application/json'
            },
            success: function (httpResponse) {
                var cTurnirs = JSON.parse(httpResponse);
                if (cTurnirs.status == 0) {
                    var cMatches = cTurnirs.data;

                    cMatches.forEach(function (cMatch) {
                        if (typeof  cMatch.tournamentId == "undefined") {
                            cMatch["tournamentId"] = link[0].get("sok");
                            cMatch["tournamentParse"] = link[0];
                        }
                    });

                    if (cMatches.length > 0) {
                        matches.push(cMatches);
                    }

                    t++;
                    if (t < links.length) {
                        getmatchesFromFa13Server(links[t]);
                    } else {
                        savematchesToParse();
                    }

                } else {
                    promise.reject("fa13 server api error");
                }

            },
            error: function (error) {

                promise.reject(error);

            }
        });
    }

    function savematchesToParse() {
        var matchQyery = new Parse.Query('Match');
        matchQyery.find().then(function (parseMathches) {
            var matchesMap = {};
            var matchesToSave = [];
            parseMathches.forEach(function (entry) {
                matchesMap[entry.get("matchId")] = entry;
            });

            matches.forEach(function (match) {
                var pMatch = matchesMap[match.id];
                if (!pMatch) {
                    pMatch = new Parse.Object('Match');
                }

                pMatch = setmatchProperties(pMatch, match);
                matchesToSave.push(pMatch);

            });


            Parse.Object.saveAll(matchesToSave, {
                success: function (matches) {
                    //status.success("All has imported successfully");


                    //return result;
                    promise.resolve("All matches has imported successfully");


                },
                error: function (matches, error) {

                    //status.error("Error on saving players: " + error.code + " " + error.message)

                    //return result;
                    promise.reject("Error on saving matches: " + error);

                }
            })


        }, function (parseMathches, error) {
            promise.reject(error);
        })
    }

    function setmatchProperties(pMatch, fMatch) {
        var properties = [
            "realdata",
            "tournament",
            "tournamentId",
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
            "tournamentParse"];

        pMatch.set("matchId", fMatch.id);
        properties.forEach(function (property) {
            pMatch.set(property, fMatch[property]);
        });

        var aDate = fMatch.realdata.split("-");
        var date = new Date(aDate[1] + " " + aDate[2] + " " + aDate[0]);
        var cEntry = calMap[date];
        if (cEntry) {
            pMatch.set("calendarEntry", cEntry);
        }

        return pMatch;
    }


    return promise;
}

exports.getMatches = function (turnirs) {
    return getMatches(turnirs);

};
