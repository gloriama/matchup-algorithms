/*
read file
for first line,
  create person for each entry
for each subsequent line,
  add the yeses and nos for that person
*/

var _ = require('underscore');
var fs = require('fs');

var computed = require('./csvToObject');
var peopleData = computed.peopleData;
var byPersonName = computed.byPersonName;

var data = fs.readFileSync('data/tapoutCSV', 'utf8');

var tapoutGroups = data.split('\n');
tapoutGroups.forEach(function(tapoutGroup) {
  var personNames = tapoutGroup.split(',');
  personNames.forEach(function(personName) {
    var personId = byPersonName[personName];
    personNames.forEach(function(otherPersonName) {
      var otherPersonId = byPersonName[otherPersonName];
      peopleData[personId].no[otherPersonId] = true;
    });
  });
});

module.exports = peopleData;