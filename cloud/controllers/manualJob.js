////Данная задача запускаться будет только руками в начале сезона, для импорта расписания матчей на весь сезон
//Временно закоментировал, но не удалять!
//
//var turnirs =  require('cloud/controllers/turnirs');
//var envarlib = require('cloud/controllers/Envar');
//var calendar = require('cloud/controllers/calendar');
//
//Parse.Cloud.job("manualJob", function(request, status) {
//
//    Parse.Cloud.useMasterKey();
//
//
//    var envar = new envarlib.Envar();
//
//
//    envar.init().then(function(result) {
//        envar.getVarAsObject("currentSeason").then(function(season) {
//            getCalendarForSeason(season).then(function(calendarEntries) {
//                turnirs.firstImportOfmatches(calendarEntries).then(function(result) {
//                    status.success(result);
//                }, function(error) {
//                    status.error(error);
//                })
//            }, function(error) {
//                status.error(error);
//            })
//        }, function(error) {
//            status.error(error);
//        })
//
//    }, function(error) {
//
//        status.error(error);
//    });
//});
//
//function getCalendarForSeason(season) {
//    var promise = new Parse.Promise();
//
//
//    var lastUpdate = new Parse.Query("lastUpdate");
//    lastUpdate.descending("date");
//    lastUpdate.find().then(function(last) {
//        var timetableQuery = new Parse.Query("Calendar");
//        timetableQuery.equalTo("season", season);
//        timetableQuery.limit(1000);
//        timetableQuery.ascending("date");
//        timetableQuery.equalTo("shouldUpdateTurnirs", true);
//        if(last.length>0) {
//            timetableQuery.greaterThan("date", last[0].get("date"));
//        } else {
//            timetableQuery.greaterThan("date", new Date("Tue Sep 22 2015 21:00:00 GMT+0000"));
//        }
//
//
//        timetableQuery.find({
//            success: function (entries) {
//                promise.resolve(entries);
//            },
//            error: function (error) {
//                promise.reject(error.message);
//            }
//        });
//    }, function(error) {
//        var timetableQuery = new Parse.Query("Calendar");
//        timetableQuery.equalTo("season", season);
//        timetableQuery.limit(1000);
//        timetableQuery.ascending("date");
//        timetableQuery.equalTo("shouldUpdateTurnirs", true);
//
//        timetableQuery.greaterThan("date", new Date("Tue Sep 22 2015 21:00:00 GMT+0000"));
//
//        timetableQuery.find({
//            success: function (entries) {
//                promise.resolve(entries);
//            },
//            error: function (error) {
//                promise.reject(error.message);
//            }
//        });
//    });
//
//    return promise;
//}
