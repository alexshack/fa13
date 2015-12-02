/**
 * Created by sandr on 13.10.15.
 */
//app.get('/initturnirs', preloaders.initTurnirs);
//app.get('/initclubs', preloaders.initClubs);


    //подключение библиотеки переменных окружений
var envarlib = require('cloud/controllers/Envar');

exports.initTurnirs = function(req, res) {
    var turnirQuery = new Parse.Query('Turnir');
    turnirQuery.limit(500);
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

    //объект с переменными окружения
    var envar = new envarlib.Envar();

    //инициализация (делается для того, что бы взять актуальные данные
    envar.init().then(function(result) {

        //пример того, как получить актуальную запись календаря (ее ИД) из переменных окружения
        if(envar.currentCalendarEntry) {
            var entyId = envar.currentCalendarEntry.value;

            console.log(entyId);
            //а тут получаем запись календаря в виде объекта календаря
            envar.getVarAsObject("currentCalendarEntry").then(function(calendarEntry) {
                clubQuery.limit(2000);
                clubQuery.equalTo('calendar', calendarEntry);
                clubQuery.find({
                    success:function(clubs) {
                        return  res.send({clubs:clubs})
                    },

                    error:function(clubs, error) {
                        return res.send({error:"Error on getting clubs! "});
                    }
                })
            }, function(error) {
                return  res.send({error:"error getting calendar object!"});
            });

        } else {
            return  res.send({error:"no active calendar entry found!"});
        }
    }, function(error) {
        return  res.send({error:"envirs not loaded"});
    });

};

