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
var _ = require('underscore');
var peopleData = require('./incorporateTapout');
// key: id
/* value: {
     name: 'Christine',
     yes: { id: true, id: true, ... },
     no: { id: true, id: true, ... }
   }
*/
var personIds = Object.keys(peopleData);
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

var getMutualYeses = function(group, candidatePool) {
  return group.reduce(function(acc, personId) {
    return acc.filter(function(currPersonId) {
      return (
        currPersonId !== personId &&
        currPersonId in peopleData[personId].yes &&
        personId in peopleData[currPersonId].yes
      );
    })
  }, candidatePool);
};

var getMutualGroups = function(partialGroup, candidatePool) { // optional parameters
  partialGroup = partialGroup || [];
  candidatePool = candidatePool || personIds;

  // if it is already a maximal group, return array containing just itself
  var mutualYeses = getMutualYeses(partialGroup, candidatePool);
  // console.log('start', partialGroup, candidatePool, mutualYeses, 'end');
  if (mutualYeses.length === 0) {
    return [partialGroup.slice()];
  }

  // otherwise return array of all possibilities larger than itself
  return mutualYeses.reduce(function(acc, mutualYes) {
    partialGroup.push(mutualYes);
    var result = acc.concat(getMutualGroups(partialGroup, mutualYeses));
    partialGroup.pop();
    return result;
  }, []);
};

var removeDuplicateCombinations = function(arrayOfCombinations) {
  arrayOfCombinations.forEach(function(combination) {
    combination.sort();
  })
  arrayOfCombinations.sort();

  return arrayOfCombinations.reduce(function(acc, combination) {
    var lastCombination = acc[acc.length-1];
    if (
      !lastCombination ||
      lastCombination.length !== combination.length ||
      _.some(lastCombination, function(item, i) {
        return item !== combination[i];
      })) {
      acc.push(combination);
    }
    return acc;
  }, []);
};

var mutualGroups = removeDuplicateCombinations(getMutualGroups());
mutualGroups.sort(function(a, b) {
  return b.length - a.length;
});

console.log(mutualGroups.map(function(group) {
  var groupAsNames = group.map(function(personId) {
    return peopleData[personId].name;
  });
  groupAsNames.sort();
  return groupAsNames;
}));