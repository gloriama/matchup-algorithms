/*
read file
for first line,
  create person for each entry
for each subsequent line,
  add the yeses and nos for that person
*/

var _ = require('underscore');
var fs = require('fs');

var peopleData = {};
var byPersonName = {}; // helper object with key: personName, value: personId

var data = fs.readFileSync('data/cleanedCSV', 'utf8');


var lines = data.split('\n');
lines.forEach(function(line, i) {
  var entries = line.split(',');

  // for first line, create a new person for each entry
  if (i === 0) {
    entries.forEach(function(entry, j) {
      if (j === 0) {
        return;
      }
      peopleData[j] = {
        name: entry
      };
      byPersonName[entry] = j;
    });
  
  // for any other line, add the yes/no data to that person entry
  // for now, we just add the no data
  } else {
    var personName;
    var preferences = entries.reduce(function(acc, entry, j) {
      if (j === 0) {
        personName = entry;
      } else if (entry === 'yes' || entry === 'no') {
        acc[entry][j] = true;
      }
      return acc;
    }, { yes: {}, no: {} });
    var personId = byPersonName[personName];
    _.extend(peopleData[personId], preferences);
  }
});

console.log(peopleData);
exports.peopleData = peopleData;
exports.byPersonName = byPersonName;