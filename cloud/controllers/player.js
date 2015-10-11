var _ = require('underscore');
var Player = Parse.Object.extend('Player');

// Display all posts.
exports.index = function(req, res) {
  var query = new Parse.Query(Player);
  query.descending('name');
  query.limit(1000);
  query.find().then(function(results) {
    res.render('player/index', { 
      players: results
    });
  },
  function() {
    res.send(500, 'Failed loading posts');
  });
};

exports.show = function(req, res) {
  
  var playerQuery = new Parse.Query(Player);
  var currPlayer;
  var prevPlayer;
  var allPlayer;
  playerQuery.equalTo("playerId", req.params.playerId);
  playerQuery.descending("date");
  playerQuery.include("nationalityCode");
  playerQuery.include("calendarEntry");
  playerQuery.include("club");
  playerQuery.find().then(function(resPlayer) {
    if (resPlayer.length > 0) {
      allPlayer = resPlayer;
      currPlayer = resPlayer[0];
      prevPlayer = resPlayer[1];
 

//      var playerLess = new Parse.Query(Player);
//      playerLess.lessThan('price', 3000); //resPlayer[0].get('price')*1.05);

//      var playerGreat = new Parse.Query(Player);
//     playerGreat.greaterThan('price', 1000); //resPlayer[0].get('price')/1.0476);

//      var playerObmen = Parse.Query.or(playerLess, playerGreat);

      var playerObmen = new Parse.Query(Player);
      playerObmen.equalTo("date", resPlayer[0].get('date'));
      playerObmen.ascending('positionId', 'name', 'date');
      playerObmen.include("nationalityCode");
      playerObmen.include("club");
      playerObmen.include("club.manager");
      return playerObmen.find();
    } else {
      return [];
    }
  }).then(function(players) {
    res.render('player/show', {
      aPlayer: allPlayer,
      pPlayer: prevPlayer,
      player: currPlayer,
      players: players,
     });
  },
  function() {
    res.send(500, 'Failed finding the specified player to show');
  });
};