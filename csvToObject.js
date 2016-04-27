/*
read file
for first line,
  create person for each entry
for each subsequent line,
  add the yeses and nos for that person
*/

var _ = require('underscore');
var fs = require('fs');

var preferences = {};
var names = {};
var nameToId = {}; // helper object mapping { name: id }

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
      names[j] = entry;
      nameToId[entry] = j;
    });
  
  // for any other line, add the yes/no data to that person entry
  // for now, we just add the no data
  } else {
    var name;
    var preference = entries.reduce(function(acc, entry, j) {
      if (j === 0) {
        name = entry;
      } else if (entry === 'yes' || entry === 'no') {
        acc[entry][j] = true;
      }
      return acc;
    }, { yes: {}, no: {} });
    var id = nameToId[name];
    preferences[id] = preference;
  }
});

exports.preferences = preferences;
exports.names = names;
exports.nameToId = nameToId;