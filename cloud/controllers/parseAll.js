var JSZip = require("cloud/lib/jszip");

var encodings = {
    // Windows code page 1252 Western European
    //
    cp1252: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\u20ac\ufffd\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\ufffd\u017d\ufffd\ufffd\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\ufffd\u017e\u0178\xa0\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff',

    // Windows code page 1251 Cyrillic
    //
    cp1251: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\x0c\r\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\u0402\u0403\u201a\u0453\u201e\u2026\u2020\u2021\u20ac\u2030\u0409\u2039\u040a\u040c\u040b\u040f\u0452\u2018\u2019\u201c\u201d\u2022\u2013\u2014\ufffd\u2122\u0459\u203a\u045a\u045c\u045b\u045f\xa0\u040e\u045e\u0408\xa4\u0490\xa6\xa7\u0401\xa9\u0404\xab\xac\xad\xae\u0407\xb0\xb1\u0406\u0456\u0491\xb5\xb6\xb7\u0451\u2116\u0454\xbb\u0458\u0405\u0455\u0457\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041a\u041b\u041c\u041d\u041e\u041f\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042a\u042b\u042c\u042d\u042e\u042f\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043a\u043b\u043c\u043d\u043e\u043f\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044a\u044b\u044c\u044d\u044e\u044f'
};

function decodeBytes(bytes, encoding) {
    var enc = encodings[encoding];
    var n = bytes.length;
    var chars = new Array(n);
    for (var i = 0; i < n; i++)
        chars[i] = enc.charAt(bytes.charCodeAt(i));
    return chars.join('');
}

function uint8ArrayToArray(uint8Array) {
    var array = [];

    for (var i = 0; i < uint8Array.byteLength; i++) {
        array[i] = uint8Array[i];
    }

    return array;
}

exports.removeAllForCalendarEntry = function (calendarEntry) {
    var promise = new Parse.Promise();

    var classes = ["Player", "Club", "Manager"];
    var c = 0;
    dropObjectWithClass(classes[0]);

    function dropObjectWithClass(className) {
        var query = new Parse.Query(className);

        query.equalTo("calendar", calendarEntry);
        query.limit(1000);
        query.find({
            success: function (objects) {

                if (objects.length > 0) {
                    Parse.Object.destroyAll(objects, {
                        success: function (objects) {
                            c++;

                            if (c == classes.length) {
                                console.log("Old objects were dropped");
                                promise.resolve(true);
                            } else {
                                dropObjectWithClass(classes[c]);
                            }
                        },
                        error: function (object, error) {
                            console.log("Error on dropping old" + className + " : " + error.code + " " + error.message);
                            promise.reject("Error on dropping old" + className + " : " + error.code + " " + error.message);

                        }
                    })
                } else {
                    c++;

                    if (c == classes.length) {
                        console.log("Old objects were dropped");
                        promise.resolve(true);
                    } else {
                        dropObjectWithClass(classes[c]);
                    }
                }
            },
            error: function (object, error) {
                console.log("Error on getting old" + className + " : " + error.code + " " + error.message);
                promise.reject("Error on getting old" + className + " : " + error.code + " " + error.message);

            }
        });
    }

    return promise;

};


exports.parseAllFileOnRequest = function (calendarEntry, fileData64) {

    var promise = new Parse.Promise();


    if (fileData64) {
        unpackAndResume(fileData64, false);
    } else {
        Parse.Cloud.httpRequest({
            url: 'http://www.fa13.info/build/all13Ho.zip',
            method:'get',
            headers: {
                'Content-Type': 'application/zip;charset=utf-8'
            },
            success: function (httpResponse) {

                var array = httpResponse.buffer.toString('base64');
                unpackAndResume(array, true);
            },
            error: function (error) {

                promise.reject(error.message);

            }
        });
    }


    function unpackAndResume(array) {
        var result = {};

        try {


            var unpacked = new JSZip();
            unpacked.load(array, {base64: true});
            var all = decodeBytes(unpacked.file('all13Ho.b13').asBinary(), 'cp1251');


            //var parser = new Parse.Promise( parseAll(all, calendarEntry))
            parseAll(all, calendarEntry).then(function (result) {

                promise.resolve(result);

            }, function (error) {

                promise.reject(error);

            });

        } catch (e) {
            console.error('Не удалось распаковать: ' + e);
            result["error"] = e;
            promise.reject(result["error"]);
        }
    }


    return promise;
};

function parseAll(allText, calendarEntry) {

    var promise = new Parse.Promise();
    var result = {};
    var turnirs = [];
    var clubs = [];
    var managers = [];
    var players = [];
    var allTemp = allText.replace(/\s+\//, ", ");
    var allTemp = allTemp.replace(/\/\s+\//gmi, ", ");
    var allTemp = allTemp.replace(/999\/\s+/gmi, "999");
    var arr = allTemp.split(', ');
    var aDate = arr[1].split('.');
    var allDate = new Date(aDate[2], aDate[1] - 1, aDate[0]);
    var i = 2;
    //сначала затянем все флаги, что бы потом не дергать базу каждый раз

    var flagsQuery = new Parse.Query("Flags");
    var flagMap = {};
    flagsQuery.limit(1000);
    flagsQuery.find({


        success: function (flags) {


            for (var f = 0; f < flags.length; f++) {
                flagMap[flags[f].get("name")] = flags[f];
            }

            //теперь проверим, все ли турниры есть в базе, если не все, то добавим те, которых нет
            var turnirQuery = new Parse.Query("Turnir");
            turnirQuery.limit(1000);
            turnirQuery.find({
                success: function (turnirs) {
                    var turnirsObj = [];
                    for (var t = 0; t < turnirs.length; t++) {
                        turnirsObj.push(turnirs[t].get("sok"));
                    }


                    var tResult = parseTurnir(arr, turnirsObj, turnirs).error;

                    if (tResult) {
                        promise.reject(tResult);
                    }

                    i += 2;

                    continueParseAll(flagMap, turnirs, calendarEntry).then(function (res) {
                            promise.resolve(res);
                        },
                        function (error) {
                            promise.reject(error);
                        })
                },
                error: function (error) {
                    console.log("Error on getting turnirs: " + error.code + " " + error.message);
                    // res.send(error);
                    result["error"] = "Error on getting turnirs: " + error.code + " " + error.message;
                    //return result;
                    promise.reject(result["error"]);

                }
            });


        },
        error: function (error) {
            console.log("Error on getting flags: " + error.code + " " + error.message);
            // res.send(error);
            //status.error("Error on getting flags: " + error.code + " " + error.message);
            result["error"] = "Error on getting flags: " + error.code + " " + error.message;
            // return result;
            promise.reject(result["error"]);

        }
    });


    function continueParseAll(flags, turnirs, calendarEntry) {
        var promise = new Parse.Promise();

        while (i < arr.length) {
            if (parseClub(flags, arr, allDate, clubs, managers, players, turnirs, calendarEntry).error) {
                promise.reject(result["error"]);
                break;
            }
        }

        //теерь все сохраняем в строгой последовательности

        Parse.Object.saveAll(turnirs, {


            success: function (turnirs) {

                Parse.Object.saveAll(managers, {
                    success: function (managers) {
                        Parse.Object.saveAll(clubs, {
                            success: function (clubs) {
                                Parse.Object.saveAll(players, {
                                    success: function (players) {
                                        //status.success("All has imported successfully");

                                        result["success"] = "All has imported successfully";
                                        //return result;
                                        promise.resolve(result["success"]);


                                    },
                                    error: function (error) {

                                        //status.error("Error on saving players: " + error.code + " " + error.message)

                                        result["error"] = "Error on saving players: " + error;
                                        //return result;
                                        promise.reject(result["error"]);

                                    }
                                });

                            },
                            error: function (error) {


                                //status.error("Error on saving clubs: " + error.code + " " + error.message)

                                result["error"] = "Error on saving clubs: " + error;
                                //return result;\
                                promise.reject(result["error"]);


                            }
                        });

                    },
                    error: function (error) {


                        //status.error("Error on saving managers: " + error.code + " " + error.message)

                        result["error"] = "Error on saving managers: " + error.code + " " + error.message;
                        //return result
                        promise.reject(result["error"]);


                    }
                });


            },
            error: function (turnirs, error) {


                // status.error("Error on saving turnirs: " + error.code + " " + error.message)
                result["error"] = "Error on saving turnirs: " + error.code + " " + error.message;
                //return result
                promise.reject(result["error"]);

            }
        });

        return promise;


    }

    function parseTurnir(arr, turnirsIds, avaibleTurnirs) {


        try {
            var s = '';

            while (arr[i] != '888') {
                s = arr[i].split('=');

                if (turnirsIds.indexOf(s[1]) < 0) {
                    var turnir = new Parse.Object("Turnir");
                    turnir.set("turnir", s[0]);
                    turnir.set("sok", s[1]);

                    avaibleTurnirs.push(turnir);
                }

                i++;
            }

            result["success"] = "ok";
            return result;

        } catch (error) {
            result["error"] = "Error on parsing turnirs: " + error.code + " " + error.message;
            return result


        }

    }


    function parseClub(flags, arr, date, clubs, managers, players, turnirs) {

        try {

            var club = new Parse.Object("Club");
            var s1 = arr[i].split('/');
            club.set("calendar", calendarEntry);
            club.set("date", date);
            club.set("name", s1[0]);
            club.set("clubId", s1[1]);
            club.set("city", s1[2]);
            club.set("country", s1[3]);


            if (flags[s1[3]]) {
                club.set("flag", flags[s1[3]]);
            }


            club.set("stadionName", s1[4]);

            i++;
            var s2 = arr[i].split('/');

            var Man = false;
            if (s2[1] != 'нет') {
                Man = true;
            }
            if (Man == true) {
                var Manager = Parse.Object.extend("Manager");
                var manager = new Manager();

                manager.set("date", date);
                manager.set("name", s2[1]);
                manager.set("city", s2[2]);
                manager.set("country", s2[3]);
                if (flags[s2[3]]) {
                    manager.set("flag", flags[s2[3]]);
                }

                manager.set("email", s2[4]);
                manager.set("icq", s2[5]);
                manager.set("matches", parseInt(s2[6]));
                manager.set("calendar", calendarEntry);
            }

            i++;
            var s3 = arr[i].split('/');

            if (Man) {
                manager.set("fm", parseInt(s3[4]));
                managers.push(manager);
                club.set("manager", manager);
            }
            club.set("stadionSize", parseInt(s3[0]));
            club.set("stadionState", parseInt(s3[1]));
            club.set("bum", parseInt(s3[2]));
            club.set("fc", parseInt(s3[3]));
            club.set("raiting", parseInt(s3[5]));
            club.set("base", parseInt(s3[6]));
            club.set("baseState", parseInt(s3[7]));

            i++;
            s = arr[i].split('/');

            club.set("school", parseInt(s[0]));
            club.set("schoolState", parseInt(s[1]));
            club.set("coach", parseInt(s[2]));
            var coach = parseInt(s[2]);

            club.set("goalkeepersCoach", parseInt(s[3]));
            var goalkeepersCoach = parseInt(s[3]);

            club.set("defendersCoach", parseInt(s[4]));
            var defendersCoach = parseInt(s[4]);

            club.set("midfieldersCoach", parseInt(s[5]));
            var midfieldersCoach = parseInt(s[5]);

            club.set("forwardsCoach", parseInt(s[6]));
            var forwardsCoach = parseInt(s[6]);

            club.set("fitnessCoach", parseInt(s[7]));
            var fitnessCoach = parseInt(s[7]);

            club.set("moraleCoach", parseInt(s[8]));
            var moraleCoach = parseInt(s[8]);

            club.set("doctorQualification", parseInt(s[9]));
            var doctorQualification = parseInt(s[9]);

            club.set("doctorPlayers", parseInt(s[10]));
            var doctorPlayers = parseInt(s[10]);

            club.set("scout", parseInt(s[11]));
            var scout = parseInt(s[11]);

            i++;
            s = arr[i].split('/');

            if (s.length > 0) {
                club.set("homeTop", parseInt(s[0]));
            }
            if (s.length > 1) {
                club.set("awayTop", parseInt(s[1]));
            }
            if (s.length > 1) {
                club.set("homeBottom", parseInt(s[2]));
            }
            if (s.length > 1) {
                club.set("awayBottom", parseInt(s[3]));
            }


            i++;

            s = arr[i].split(',');
            //сразу добавим такой себе чемпионат "Все турниры" - далее потом для статистики пригодится
            s.push("allTurnirs");


            club.set("turnirs", s);


            //Добавим просто масив идентификаторов турниров, так как нельзя добавлять релейшены на несохраненные обхекты


            //for (var j = 0; j < s.length; j++) {
            //
            //    for (var t = 0;t<turnirs.length;t++) {
            //        if(turnirs[t].get("sok") == s[j]) {
            //
            //            var relation = club.relation("turnirs");
            //            relation.add(turnirs[t]);
            //        }
            //    }
            //
            //}


            i++;

            var Player = Parse.Object.extend("Player");


            var allStrength = 0;
            var allTallant = 0;
            var allPrice = 0;
            var allSalary = 0;
            var allPlayers = 0;
            var allAge = 0;
            var allSV = 0;
            var allExp = 0;
            var allFitness = 0;
            var allMorale = 0;
            var allHealth = 0;
            var yelows = 0;
            var reds = 0;
            var scorred = 0;
            var scorredInChamp = 0;
            var missed = 0;

            while (arr[i] != '999') {
                var s = arr[i].split('/');
                var player = new Player();
                player.set("calendar", calendarEntry);
                player.set("date", date);
                player.set('clubName', club.get('name'));
                player.set('number', parseInt(s[0]));
                player.set('name', s[1]);
                player.set('nationality', s[2]);

                if (flags[s[2]]) {
                    player.set("nationalityCode", flags[s[2]]);
                }

                player.set('position', s[3]);

                var pId = 0;
                switch (s[3]) {
                    case 'ВР':
                        pId = 1;
                        break;
                    case 'ЛЗ':
                        pId = 2;
                        break;
                    case 'ЦЗ':
                        pId = 3;
                        break;
                    case 'ПЗ':
                        pId = 4;
                        break;
                    case 'ЛП':
                        pId = 5;
                        break;
                    case 'ЦП':
                        pId = 6;
                        break;
                    case 'ПП':
                        pId = 7;
                        break;
                    case 'ЛФ':
                        pId = 8;
                        break;
                    case 'ЦФ':
                        pId = 9;
                        break;
                    case 'ПФ':
                        pId = 10;
                        break;
                    default:
                        pId = 0;
                }

                player.set('positionId', pId);
                player.set('age', parseInt(s[4]));
                allAge+=parseInt(s[4]);

                player.set('talent', parseInt(s[5]));
                allTallant +=parseInt(s[5]);

                player.set('experience', parseInt(s[6]));
                allExp+=parseInt(s[6]);

                player.set('fitness', parseInt(s[7]));
                allFitness +=parseInt(s[7]);

                player.set('morale', parseInt(s[8]));
                allMorale +=parseInt(s[8]);

                player.set('strength', parseInt(s[9]));
                allStrength +=parseInt(s[9])

                player.set('health', parseInt(s[10]));
                allHealth +=parseInt(s[10]);

                player.set('price', parseInt(s[11]));
                allPrice +=parseInt(s[11]);


                player.set('salary', parseInt(s[12]));
                allSalary +=parseInt(s[12]);

                player.set('shooting', parseInt(s[13]));
                allSV+=parseInt(s[13]);
                player.set('passing', parseInt(s[14]));
                allSV+=parseInt(s[14]);
                player.set('crossing', parseInt(s[15]));
                allSV+=parseInt(s[15]);
                player.set('dribbling', parseInt(s[16]));
                allSV+=parseInt(s[16]);
                player.set('tackling', parseInt(s[17]));
                allSV+=parseInt(s[17]);
                player.set('heading', parseInt(s[18]));
                allSV+=parseInt(s[18]);
                player.set('speed', parseInt(s[19]));
                allSV+=parseInt(s[19]);
                player.set('stamina', parseInt(s[20]));
                allSV+=parseInt(s[20]);
                player.set('reflexes', parseInt(s[21]));
                allSV+=parseInt(s[21]);
                player.set('handling', parseInt(s[22]));
                allSV+=parseInt(s[22]);
                player.set('disqualification', parseInt(s[23]));
                player.set('rest', parseInt(s[24]));
                player.set('teamwork', parseInt(s[25]));
                player.set('games', parseInt(s[26]));
                player.set('goalsTotal', parseInt(s[27]));
                scorred +=parseInt(s[27]);

                player.set('goalsMissed', parseInt(s[28]));
                missed +=parseInt(s[28]);
                player.set('goalsChamp', parseInt(s[29]));
                scorredInChamp +=parseInt(s[29]);
                player.set('mark', parseInt(s[30]));
                player.set('gamesCareer', parseInt(s[31]));
                player.set('goalsCareer', parseInt(s[32]));
                player.set('yellowCards', parseInt(s[33]));
                yelows +=parseInt(s[33]);
                player.set('redCards', parseInt(s[34]));
                reds +=parseInt(s[34]);
                player.set('transfer', parseInt(s[35]));
                player.set('lease', parseInt([36]));
                player.set('birthplace', s[37]);


                if (s[38].match(new RegExp(/(\d{1,2})/))) {
                    player.set('birthdate', parseInt(s[38].match(new RegExp(/(\d{1,2})/))[1]));

                }

                if (s[38].match(new RegExp(/\((\d{1,2})\)/))) {

                    player.set('birthtour', parseInt(s[38].match(new RegExp(/\((\d{1,2})\)/))[1]));
                }

                //player.set('birthtour', f[0].substr(0, f[0].length - 1));


                player.set('assists', parseInt(s[39]));
                player.set('profit', parseInt(s[40]));
                player.set('playerId', s[41]);
                player.set('club', club);
                players.push(player);
                allPlayers +=1;
                i++;
            }



            club.set("allStrength", allStrength);
            club.set("allTallant", allTallant);
            club.set("allPrice", allPrice);
            club.set("allSalary", allSalary);
            club.set("allPlayers", allPlayers);
            club.set("allAge", allAge);
            club.set("allSV", allSV);
            club.set("allExp", allExp);
            club.set("allFitness", allFitness);
            club.set("allMorale", allMorale);
            club.set("allHealth", allHealth);
            club.set("yelows", yelows);
            club.set("reds", reds);
            club.set("scorred", scorred);
            club.set("scorredInChamp", scorredInChamp);
            club.set("missed", missed);

            if(allPlayers >0) {
                var avgStrength = allStrength/allPlayers;
                club.set("avgStrength", avgStrength);
                var avgTallant = allTallant/allPlayers;
                club.set("avgTallant", avgTallant);
                var avgPrice = allPrice/allPlayers;
                club.set("avgPrice", avgPrice);
                var avgSalary = allSalary/allPlayers;
                club.set("avgSalary", avgSalary);
                var avgAge = allAge/allPlayers;
                club.set("avgAge", avgAge);
                var avgSV = allSV/allPlayers;
                club.set("avgSV", avgSV);
                var avgExp = allExp/allPlayers;
                club.set("avgExp", avgExp);
                var avgFitness = allFitness/allPlayers;
                club.set("avgFitness", avgFitness);
                var avgMorale = allMorale/allPlayers;
                club.set("avgMorale", avgMorale);
                var avgHealth = allHealth/allPlayers;
                club.set("avgHealth", avgHealth);

            }




            /*

             32+ round(1.6 * [kgt intValue]) + 8*([self.club.goalkeepersCoach intValue] +[self.club.defendersCoach intValue]  +[self.club.midfieldersCoach intValue]  +[self.club.forwardsCoach intValue]  +[self.club.fitnessCoach intValue]  +[self.club.moraleCoach intValue]  +[self.club.doctorQualification intValue]  +[self.club.doctorPlayers intValue]) + 24*[self.club.scout intValue];

             club.set("coach", parseInt(s[2]));
             club.set("goalkeepersCoach", parseInt(s[3]));
             club.set("defendersCoach", parseInt(s[4]));
             club.set("midfieldersCoach", parseInt(s[5]));
             club.set("forwardsCoach", parseInt(s[6]));
             club.set("fitnessCoach", parseInt(s[7]));
             club.set("moraleCoach", parseInt(s[8]));
             club.set("doctorQualification", parseInt(s[9]));
             club.set("doctorPlayers", parseInt(s[10]));
             club.set("scout", parseInt(s[11]));
            */

            var coachSallary = 32 + (1.6 *(coach - 200)) + 8*(goalkeepersCoach + defendersCoach + midfieldersCoach +forwardsCoach + fitnessCoach + moraleCoach + doctorQualification + doctorPlayers)+24*scout;
            club.set("coachSallary", coachSallary);

            clubs.push(club);

            i++;
            //return i;
            result["success"] = "success";
            return result;
        } catch (error) {
            result["error"] = "Error on parsing clubs: " + error.code + " " + error.message;
            //return result;
            return result;
        }


    }

    return promise;

}






