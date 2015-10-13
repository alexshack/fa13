/**
 * Created by sandr on 13.10.15.
 */
//app.get('/initturnirs', preloaders.initTurnirs);
//app.get('/initclubs', preloaders.initClubs);

var envarlib = require('cloud/controllers/Envar');

exports.initTurnirs = function(req, res) {
    var turnirQuery = new Parse.Query('Turnir');

    turnirQuery.find({
                success:function(turnirs) {
                    res.send({turnirs:turnirs})
                },

                error:function(turnirs, error) {
                    res.send({error:"Error on getting turnirs!"});
                }
            })

};

exports.initClubs = function(req, res) {
    var clubQuery = new Parse.Query('Club');
    var envar = new envarlib.Envar();


    envar.init().then(function(result) {
        if(envar.currentCalendarEntry) {
            var entyId = envar.currentCalendarEntry.value;
            clubQuery.equalTo('calendarEntry.id', entyId);
            clubQuery.find({
                success:function(clubs) {
                   return  res.send({clubs:clubs})
                },

                error:function(clubs, error) {
                    return res.send({error:"Error on getting clubs! " + error.message});
                }
            })
        } else {
            return  res.send({error:"no active calendar entry found!"});
        }
    }, function(error) {
        return  res.send({error:"envirs not loaded"});
    });

};

