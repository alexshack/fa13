var _ = require('underscore');
var Club = Parse.Object.extend('Club');
var turnirs =  require('cloud/controllers/turnirs');
// Show a given club based on specified id.
exports.show = function(req, res) {
  
  var clubQuery = new Parse.Query(Club);
  var currClub;
  var prevClub;
  var allClub;
  var aDate = new Date();
  clubQuery.equalTo("clubId", req.params.clubId);
  clubQuery.descending("date");
  clubQuery.include("calendar");
  clubQuery.include("flag");
  clubQuery.include("manager");
  clubQuery.include("manager.flag");
  clubQuery.find().then(function(resClub) {
    if (resClub.length > 0) {
      allClub = resClub;
      currClub = resClub[0];
      prevClub = resClub[1];
      aDate = resClub[0].get('date');
      var Player = Parse.Object.extend('Player');
      var playerQuery = new Parse.Query(Player);
      playerQuery.equalTo('club', resClub[0]);
      playerQuery.ascending('positionId', 'name', 'date');
      playerQuery.include("nationalityCode");
      return playerQuery.find();
    } else {
      return [];
    }
  }).then(function(players) {

      turnirs.getAllmatchesForTeam(req.params.clubId).then(function(matches) {
        res.render('index', {
          aClub: allClub,
          pClub: prevClub,
          club: currClub,
          players: players,
          cDate: aDate,
          matches:matches,
          title:currClub.get("name"),
          page:"showClub"
        });
      }, function(error) {
        res.send(500, error);
      })


  },
  function() {
    res.send(500, 'Failed finding the specified club to show');
  });
};