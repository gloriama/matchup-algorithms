/*
read file
for first line,
  create person for each entry
for each subsequent line,
  add the yeses and nos for that person
*/

var _ = require('underscore');
var fs = require('fs');

// Modifies surveyOutput
module.exports = function(surveyOutput, filePath) {
  var preferences = surveyOutput.preferences;
  var names = surveyOutput.names;
  var nameToId = surveyOutput.nameToId;

  var data = fs.readFileSync('data/tapoutCSV', 'utf8');

  var tapoutGroups = data.split('\n');
  tapoutGroups.forEach(function(tapoutGroup) {
    var memberNames = tapoutGroup.split(',');
    memberNames.forEach(function(name) {
      var id = nameToId[name];
      memberNames.forEach(function(otherName) {
        if (name === otherName) {
          return;
        }
        var otherId = nameToId[otherName];
        preferences[id].no[otherId] = true;
      });
    });
  });

  return surveyOutput;
};