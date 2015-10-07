/**
 * Created by sandr on 06.10.15.
 */

var parseAll = require('cloud/controllers/parseAll');

Parse.Cloud.job("parseAllFile", function(request, status) {

    Parse.Cloud.useMasterKey();
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var timetableQuery = new Parse.Query("Timetable");
    timetableQuery.greaterThanOrEqualTo("date", new Date());
    timetableQuery.lessThanOrEqualTo("date", tomorrow);
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


            parseAll.removeAllForCalendarEntry(calendarEntry).then(function(result) {

                parseAll.parseAllFileOnRequest(calendarEntry, null).then(function(result) {
                    console.log(result);
                    status.success(result);
                }, function(error) {
                    console.log(error);
                    status.error(error);
                })
            }, function(error) {
                status.error(error);
            });


        },

        error: function (object, error) {
            console.log("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
            status.error("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
        }
    });
});
