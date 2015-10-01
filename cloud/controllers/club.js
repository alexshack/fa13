var _ = require('underscore');
var Club = Parse.Object.extend('Club');

// Show a given club based on specified id.
exports.show = function(req, res) {
  var clubQuery = new Parse.Query(Club);
  var foundClub;
  clubQuery.equalTo("clubId", req.params.clubId);
  clubQuery.descending('createdAt');
  clubQuery.first().then(function(club) {
    if (club) {
      foundClub = club;
      var Player = Parse.Object.extend('Player');
      var playerQuery = new Parse.Query(Player);
      playerQuery.equalTo('clubName', club.get('name'));
      playerQuery.equalTo('date', '25.9.2015');
      playerQuery.ascending('positionId', 'number');
      return playerQuery.find();
    } else {
      return [];
    }
  }).then(function(players) {
    res.render('club/show', {
      club: foundClub,
      players: players
    });
  },
  function() {
    res.send(500, 'Failed finding the specified club to show');
  });
};