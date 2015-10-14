var _ = require('underscore');
var Player = Parse.Object.extend('Player');

// Display all posts.
exports.index = function (req, res) {
    var query = new Parse.Query(Player);
    query.descending('name');
    query.limit(1000);
    query.find().then(function (results) {
            res.render('player/index', {
                players: results
            });
        },
        function () {
            res.send(500, 'Failed loading posts');
        });
};

exports.show = function (req, res) {

    var playerQuery = new Parse.Query(Player);
    var currPlayer;
    var prevPlayer;
    var allPlayer;
    playerQuery.equalTo("playerId", req.params.playerId);
    playerQuery.descending("date");
    playerQuery.include("nationalityCode");
    playerQuery.include("calendarEntry");
    playerQuery.include("club");


    playerQuery.find().then(function (resPlayer) {
        console.log("show started " + resPlayer.length);
        if (resPlayer.length > 0) {

            allPlayer = resPlayer;
            currPlayer = resPlayer[0];
            prevPlayer = resPlayer[1];

            var playerObmen = new Parse.Query(Player);
            playerObmen.equalTo("date", resPlayer[0].get('date'));
            playerObmen.descending('price', 'strength');
            playerObmen.include("nationalityCode");
            playerObmen.include("club");
            playerObmen.include("club.manager");
            playerObmen.lessThanOrEqualTo('price', JSON.parse(resPlayer[0].get('price'))*1.05);
            playerObmen.greaterThanOrEqualTo('price', JSON.parse(resPlayer[0].get('price'))/105*100);
            playerObmen.notEqualTo('clubName', resPlayer[0].get('clubName'));


            playerObmen.find().then(function (playersObmen) {

                res.render('player/show', {
                    aPlayer: allPlayer,
                    pPlayer: prevPlayer,
                    player: currPlayer,
                    playersObmen: playersObmen
                });
            },
                function (error) {

                    res.render('player/show', {
                        aPlayer: allPlayer,
                        pPlayer: prevPlayer,
                        player: currPlayer,
                        error:error
                    });
                });
        } else {

            res.render('player/show', {
                aPlayer: allPlayer,
                pPlayer: prevPlayer,
                player: currPlayer
            });
        }
    });
};