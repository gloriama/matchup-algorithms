/* Given a positive preference list, produce a list of all maximal groups that
mutually want to work with each other, from largest to smallest

What does "maximal" mean?
If A, B, C, ... G all want to work together, we don't want to include any
strict subsets.
Instead, the result might be something like: [
  [A, B, C, ... G],
  [B, C, D, Z],
  [H, I, Z],
  [A, H]
]
*/

var peopleData = require('./incorporateTapout');
// key: id
/* value: {
     name: 'Christine',
     yes: { id: true, id: true, ... },
     no: { id: true, id: true, ... }
   }
*/
var personIds = Object.keys(peopleData);
console.log('original personIds', personIds);
/*
  starting from no one, try to add people one at a time
  each person must be a mutual yes with all people already in the group
  at all points, be ready to toggle them out
  similar to n-queens
  once a group is found and cannot be made larger, add it to the list of groups
  then continue with all the partial groups where you toggle off the last person
  remember to not include any groups that are strict subsets of others
  
  Needed helpers:
  mutualYeses(personArray)
    returns a union of all people that said yes to everyone in the array
    AND who everyone in the array said yes to
    returns all people if given no arguments
*/

var getMutualYeses = function(group, candidatePool) { // optional second parameter
  candidatePool = candidatePool || personIds;
  return group.reduce(function(acc, personId) {
    return acc.filter(function(currPersonId) {
      return currPersonId in peopleData[personId].yes;
    })
  }, candidatePool);
};

var getMutualGroups = function(partialGroup) { // optional parameter
  partialGroup = partialGroup || [];

  // if it is already a maximal group, return array containing just itself
  var mutualYeses = getMutualYeses(partialGroup);
  if (mutualYeses.length === 0) {
    return [partialGroup];
  }

  // otherwise return array of all possibilities larger than itself
  return mutualYeses.reduce(function(acc, mutualYes) {
    return acc.concat(getMutualGroups(partialGroup.concat(mutualYes)));
  }, []);
};

console.log(getMutualGroups());