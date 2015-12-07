/**
 * Created by sandr on 06.10.15.
 */

var parseAll = require('cloud/controllers/parseAll');
var adminClass = require('cloud/controllers/admin');
var envarlib = require('cloud/controllers/Envar');
var turnirs =  require('cloud/controllers/turnirs');

Parse.Cloud.job("parseAllFile", function(request, status) {

    Parse.Cloud.useMasterKey();

    var strDate = (new Date().getMonth()+1) + " " +  new Date().getDate() + " " +  new Date().getFullYear() + " 00:00:00 GMT+0300";
    var mskDate = new Date(strDate);

    var timetableQuery = new Parse.Query("Calendar");
    timetableQuery.equalTo("date", mskDate);


    timetableQuery.find({

        success: function (calendarEntries) {

            if(calendarEntries.length == 0) {
                status.success("There were no new events in FA13...");
                return;
            }

            if(calendarEntries.length >1) {
                status.error("More than one calendar entry got!");
                return;
            }

            var calendarEntry = calendarEntries[0];


           // console.log("creating envar");
            var envar = new envarlib.Envar();


            envar.init().then(function(result) {

                envar.setValueToVar('Calendar', 'currentCalendarEntry', calendarEntry.id, true).then(function (result) {

                    console.log(result + " was saved");
                   // console.log(result);
                    getParse();

                }, function(error) {
                    //console.log(error);
                    getParse();
                })
            }, function(error) {
               // console.log(error);
                getParse();
            });



            function getParse() {
                //groupedEvents[event.virtual_date]["shouldUpdateAll"] = false;
                //groupedEvents[event.virtual_date]["shouldUpdateTransList"] = false;
                //groupedEvents[event.virtual_date]["shouldUpdateTurnirs"] = false;
                //

                updateAll(calendarEntry).then(function(result) {
                    updateMatches(calendarEntry).then(function(result) {
                        status.success(result);
                    }, function(error) {
                        status.error(error);
                    });
                }, function(error) {
                    status.error(error);
                });

            }
        },

        error: function (error) {
            console.log("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
            status.error("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
        }
    });
});

function updateAll(calendarEntry) {

    var promise = new Parse.Promise();

    if(calendarEntry.get("shouldUpdateAll") == true) {
    parseAll.removeAllForCalendarEntry(calendarEntry).then(function(result) {

        parseAll.parseAllFileOnRequest(calendarEntry, null).then(function(result) {
            console.log(result);
            promise.resolve(result);
        }, function(error) {
            console.log(error);
            promise.reject(error);
        })
    }, function(error) {
        promise.reject(error);
    });

    } else {
        promise.resolve("There were no changes in All file");
    }

    return promise;
}


function updateMatches(calendarEntry) {

    var promise = new Parse.Promise();

    if(calendarEntry.get("shouldUpdateAll") == true) {
        turnirs.updateMatchesOnDate(calendarEntry).then(function(result) {
            promise.resolve(result);
        }, function(error) {
            promise.reject(error);
        })
    } else {
        promise.resolve("There is no needs in matches update");
    }

    return promise;
}


