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

function splitArray(arr, n) {
    var res = [];
    while (arr.length) {
        res.push(arr.splice(0, n));
    }
    return res;
}

function getTurnirs(turnirType) {
    var promise = new Parse.Promise();

    var tQuery = new Parse.Query("Turnir");

    tQuery.limit(1000);

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
        //getMatchesRecursive(turnirs, 0).then(function(result) {
            getMatchesRecursive(turnirs, 0).then(function(result) {
                promise.resolve(result);
            },
            function(error) {
                promise.reject(error);
            })

    }, function(turnirs, error) {
        promise.reject("Error on finfding turnirs");
    });


    return promise;
}

function getMatchesRecursive(turnirs, i) {

    var promise = new Parse.Promise();

    var tParts = splitArray(turnirs, 10);
    console.log(tParts[i]);



    getMatches(tParts[i]).then(function(result) {
        i++;
        if(i<tParts.length) {
            promise.resolve(getMathchesRecursive(turnirs, i));
        } else {
            promise.resolve(result);
        }

    }, function(error) {
        promise.reject(error);
    });

    return promise;

}

//function delay(turnirs, i) {
//
//    var promise = new Parse.Promise();
//    $timeout(function() {
//        getMathchesRecursive(turnirs, i).then(function(result) {
//            promise.resolve();
//        });
//
//    }, 5000);
//
//    return promise;
//}

function getMatches(turnirs) {
    var promise = new Parse.Promise();
    var links = [];


    var matches = [];

    var fa13DomenUrl = "";

    var calMap = {};

    var t = 0;
    var tIds = [];

    var link = "";



        Parse.Config.get().then(function (config) {

        fa13DomenUrl = config.get("fa13url");
        console.log("config = " + fa13DomenUrl);

        if (fa13DomenUrl != "") {
            fa13DomenUrl = fa13DomenUrl + "/index.api.php?action=gameList&tournament_id=";
        }
        turnirs.forEach(function (turnir) {
            links.push([turnir, fa13DomenUrl + turnir.get("sok")]);
            tIds.push(turnir.get("sok"));
           // console.log(fa13DomenUrl + turnir.get("sok"));
        });



        if (links.length > 0) {

            var calQuery = new Parse.Query("Calendar");

            calQuery.ascending("date");
            calQuery.limit(1000);
            calQuery.find().then(function (calEntries) {

                calEntries.forEach(function (entry) {
                    calMap[entry.get("date")] = entry;
                });

                link = links[t];
                getmatchesFromFa13Server();

            }, function (calEntries, error) {
                promise.reject(error);
            });

        } else {
            promise.reject("No turnirs found");
        }

    }, function (error) {
        promise.reject(error);
    });


    function getmatchesFromFa13Server() {
        console.log("getmatchesFromFa13Server");
        Parse.Cloud.httpRequest({
            url: link[1],
            headers: {
                'Content-Type': 'application/json'
            },
            success: function (httpResponse) {
                var cTurnirs = JSON.parse(httpResponse.text);
                console.log("success");
               // var cTurnirs = httpResponse;
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
                        link = links[t];

                        getmatchesFromFa13Server();

                    } else {
                        savematchesToParse();
                    }

                } else {
                    promise.reject("fa13 server api error " + JSON.stringify(httpResponse.text));
                }

            },
            error: function (error) {
                console.log("ERROR GETTING: " + link[1]);
                //t++;
                //if (t < links.length) {
                //    getmatchesFromFa13Server(links[t]);
                //} else {
                //    savematchesToParse();
                //}


                promise.reject("ERROR GETTING: " + link[1]);

            }
        });
    }

    function savematchesToParse() {
        var matchQyery = new Parse.Query('Match');
        console.log(tIds);
        matchQyery.containedIn("objectId", tIds);
        matchQyery.find().then(function (parseMathches) {
            console.log("WE ARE HERE");
            var matchesMap = {};
            var matchesToSave = [];
            if(parseMathches.length>0) {
                parseMathches.forEach(function (entry) {
                    matchesMap[entry.get("matchId")] = entry;
                });
            }

            console.log(matches.length);
            matches.forEach(function (match) {

                var pMatch = matchesMap[match.id];
                console.log(pMatch);
                if (!pMatch) {
                    pMatch = new Parse.Object('Match');
                }
                console.log(pMatch);
                pMatch = setmatchProperties(pMatch, match);
                matchesToSave.push(pMatch);

            });

            console.log("matchesToSave count = ", matchesToSave.length);


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

        console.log(properties);
        console.log(pMatch);
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

        console.log("PR: " + fMatch);

        return pMatch;
    }

    return promise;

}

exports.getMatches = function (turnirs) {
    return getMatches(turnirs);

};
