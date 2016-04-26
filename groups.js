var _ = require('underscore');

/*
  INPUT:

  1) peopleData: an object of person objects, with
    key: person id,
    value: data object of the form:
      {
        name: String,
        yes: object with key: id, value: true,
          // people they want to work with
        no: object with key: id, value: true
          // people they don't want to work with
        preferredNo: object with key: id, value: true
          // people they ideally shouldn't work with, but which are acceptable
      }

  2) groupSize: a positive number indicating size of groups we'd like to form
  If the pool of people does not divide evenly, we will form some number of
  groups that has groupSize-1 people in it

  -----
  OUTPUT: one possible grouping of the pool, as an array of array of person ids

  Requirements, in order of importance:
  1) All no's are honored. If no such grouping is possible, return null
  2) Number of people who get at least one of their yes's is maximized.
  3) Number of preferredNo's are minimized.
*/

/*
  Algorithm:

  1) Minimal solution: only worry about no's
  Create a graph:
    node: person id
    edge: neither of the two corresponding people has said "no" to the other
  Get all groups of mutually compatible people using graph.getMutualGroups()
  If any group is smaller than groupSize, return null
  Otherwise, split the groups up into size groupSize or groupSize-1

  2) Solution that also incorporates maximization of yes's
  ?

  3) Solution that also incorporates minimization of preferredNo's
  ?
*/

var peopleData = {};
var personIds = Object.keys(peopleData);

var compatibility = new Graph();

personIds.forEach(function(personId) {
  compatibility.addNode(personId);
});

personIds.forEach(function(personId) {
  var compatiblePersonIds = _.reject(personIds, function(currPersonId) {
    return currPersonId in peopleData[personId].no;
  });
  compatiblePersonIds.forEach(function(compatiblePersonId) {
    compatibility.addEdge(personId, compatiblePersonId);
  });
});

console.log(compatibility.getMutualGroups());