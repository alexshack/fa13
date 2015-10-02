var _ = require('underscore');
var Club = Parse.Object.extend('Club');

// Show a given club based on specified id.
exports.show = function(req, res) {
  var clubQuery = new Parse.Query(Club);
  var foundClub;
  var prevClub;
  var allClub;
  var aDate = new Date();
  clubQuery.equalTo("clubId", req.params.clubId);
  clubQuery.ascending('date');
  clubQuery.find().then(function(resClub) {
    if (resClub.length > 0) {
      allClub = resClub;
      foundClub = resClub[resClub.length-1];
      prevClub = resClub[resClub.length-2];
      aDate = resClub[resClub.length-1].get('date');
      var Player = Parse.Object.extend('Player');
      var playerQuery = new Parse.Query(Player);
      playerQuery.equalTo('clubName', resClub[0].get('name'));
      playerQuery.ascending('positionId', 'name', 'date');
      return playerQuery.find();
    } else {
      return [];
    }
  }).then(function(players) {
    res.render('club/show', {
      aClub: allClub,
      pClub: prevClub,
      club: foundClub,
      players: players,
      cDate: aDate
    });
  },
  function() {
    res.send(500, 'Failed finding the specified club to show');
  });
};