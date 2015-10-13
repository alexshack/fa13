/**
 * Created by sandr on 06.10.15.
 */

var parseAll = require('cloud/controllers/parseAll');
var adminClass = require('cloud/controllers/admin');
var envarlib = require('cloud/controllers/Envar');

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


           // console.log("creating envar");
            var envar = new envarlib.Envar();


            envar.init().then(function(result) {

                envar.setValueToVar('Timetable', 'currentCalendarEntry', calendarEntry.id, true).then(function (result) {

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
            }
            //
            //
            //adminClass.setEnvar('currentCalendarEntry', 'Timetable', calendarEntry.id).then(function(result) {
            //    //даже если не удастся сохранить переменную, мы все равно продолжнаем работу, но в лог записать надо
            //
            //});
        },

        error: function (object, error) {
            console.log("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
            status.error("Error on getting calendar entry with id: " + calId + ". Error: " + error.code + " " + error.message);
        }
    });
});
