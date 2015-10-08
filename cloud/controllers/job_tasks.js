/**
 * Created by sandr on 06.10.15.
 */

var parseAll = require('cloud/controllers/parseAll');

Parse.Cloud.job("parseAllFile", function(request, status) {

    Parse.Cloud.useMasterKey();

    var strDate = (new Date().getMonth()+1) + " " +  new Date().getDate() + " " +  new Date().getFullYear() + " 00:00:00 GMT+0300";
    var mskDate = new Date(strDate);

    var timetableQuery = new Parse.Query("Timetable");
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
