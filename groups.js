var _ = require('underscore');
var Graph = require('./graph');

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
  Randomly select people one at a time, adding people who are mutually compatible
  If it fails at any time, reattempt the add
  After a certain moderately high number of reattempts have failed,
    conclude that there is no possible person given this partial grouping
    and start the entire grouping over from scratch

  2) Solution that also incorporates maximization of yes's
  * When selecting randomly, first select randomly from the yes's of
    at least one of the existing people in the group
  * Better, first see if there are any yes's for multiple people in the group
  * Better yet, START with trying to produce groups of yes's, especially
    any groups > size 2 that all mutually want to work with each other
    -Do this by heavily weighing yes's:
      -Out of the possible random choices, weigh a mutual yes very high
      -Then weigh a one-way yes pretty high
      -The baseline is a neutral person
    -Alternatively, do it by straight up maximizing yeses as the first goal
      -Search the whole system for all groups of size 4 or more that mutually selected
      -Then groups of size 3
      -Then pairs
      -Then simply place everyone else in a way that is not incompatible

  3) Solution that also incorporates minimization of preferredNo's
  * Treat preferredNo's like real no's
  * Only if a solution cannot be found, weaken them to preferredNo's
  * In that case, make it so that we first try to select yes's, then neutrals,
    and only finally preferredNo's

  4) Solution that also allows specific constraints
  * For example, if we specifically want to honor certain partial groupings
    -e.g. allow two specific people to work together
  
  5) Solution that also allows tech ability to be matched
  * All similar tech level, or two strong two weak preferred
  * Or, at least not three strong + one weak

  6) Solution that rewards those who put down many yes's and few no's
    -Reward those who put down many yes's by increasing the likelihood they
     get any of them
    -E.g. if someone put down 10 yeses, they should be ~5 times as likely
     to get at least one yes than someone who put down only 2 yes's
    -If someone put down 5 yeses and no no's, they should be more likely
     to get at least one yes than someone who put down 5 yes's and 10 no's

  7) Analysis of the idealness of any given matching
  * Indicate "validity": if there are people who are incompatible
  * Indicate number of people who got at least 1 yes
  * Indicate number of tapout repeats

  8) Mathematical optimization toward ideal matching, where yes's are maximized

  9) Protection against gaming the system
  * Anti-weigh when 3 or 4 people have all mutually selected each other
  * Print out all such instances, to allow human to decide if it's an attempt
    at gaming
    -If so, user can choose to turn them into preferredNo's
  * Anti-weigh when someone has put a huge number of no's
    -If so, user can choose to turn their yes's into preferredNo's
    -Or to simply print out that they've put a lot of no's

*/

var peopleData = require('./incorporateTapout');
var personIds = Object.keys(peopleData);

var compatibility = new Graph();

// Add all people
personIds.forEach(function(personId) {
  compatibility.addNode(personId);
});

// Add all edges
personIds.forEach(function(personId) {
  personIds.forEach(function(otherPersonId) {
    compatibility.addEdge(personId, otherPersonId);
  });
});

// Remove rejected edges
personIds.forEach(function(personId) {
  var incompatiblePersonIds = _.filter(personIds, function(currPersonId) {
    return currPersonId in peopleData[personId].no;
  });
  incompatiblePersonIds.forEach(function(incompatiblePersonId) {
    compatibility.removeEdge(personId, incompatiblePersonId);
  });
});

// console.log(peopleData);
// console.log(compatibility);

// _.map(compatibility.edges, function(compatiblePersonIds, personId) {
//   console.log(
//     peopleData[personId].name + ':',
//     _.map(compatiblePersonIds, function(_, compatiblePersonId) {
//       return peopleData[compatiblePersonId].name;
//     })
//   );
// });

var mutualGroups = compatibility.createGrouping();

console.log(mutualGroups.map(function(mutualGroup) {
  return mutualGroup.map(function(personId) {
    return peopleData[personId].name;
  });
}));