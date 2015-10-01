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

