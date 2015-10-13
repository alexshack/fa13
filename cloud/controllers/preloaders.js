/**
 * Created by sandr on 13.10.15.
 */
//app.get('/initturnirs', preloaders.initTurnirs);
//app.get('/initclubs', preloaders.initClubs);


exports.initTurnirs = function(req, res) {

};

exports.initClubs = function(req, res) {
    var clubQuery = new Parse.Query('Club');
    var today = new Date();


};

function getCalendarEntry(date) {
    var promise = new Parse.Promise();
   // var date = new Date(ondate[1] + " " + ondate[0] + " " + ondate[2] + " 00:00:00 GMT+0300");


    function recursiveCal(date) {
        var timetableQuery = new Parse.Query("Timetable");
        timetableQuery.equalTo("date", date);
        timetableQuery.limit(1000);
        timetableQuery.find({
            success: function (entries) {
                if(entries.length>0) {
                    var entry = entries[0];
                    res.send({
                        "calendarEntryId": entry.id,
                        "events":entry.get("event")
                    })
                } else {
                    res.send({"errors": "No calendar entry found in date " + ondate})
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
    }



    return promise;
}