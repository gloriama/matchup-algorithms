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

var isMutualYes = function(personId1, personId2) {
  return (
    personId1 in peopleData[personId2].yes &&
    personId2 in peopleData[personId1].yes
  );
};

var getMutualYeses = function(group, candidatePool) {
  return group.reduce(function(acc, personId) {
    return acc.filter(function(currPersonId) {
      return (
        currPersonId !== personId &&
        isMutualYes(personId, currPersonId)
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

// console.log(mutualGroups.map(function(group) {
//   var groupAsNames = group.map(function(personId) {
//     return peopleData[personId].name;
//   });
//   groupAsNames.sort();
//   return groupAsNames;
// }));


//------------------------------------------------
// INCOMPLETE - temporarily abandoned for another approach
// Given all the possible groups that all mutually want each other,
// optimize an overall grouping where no one is repeated

  // select the top group
  // then select the next group that doesn't use anything above
  // etc.

  // restart with starting from the second-top group

  // save only the one with the most total people placed

var getOptimizedPartialGrouping = function(groups, used) {
  used = used || {};
  var potentialGroups = groups.filter(function(group) {
    return _.every(group, function(item) {
      return !(item in used);
    });
  });
  if (potentialGroups.length === 0) {
    return [];
  }

  var first = potentialGroups[0];
  var usedIncludingFirst = first.reduce(function(acc, item) {
    acc[item] = true;
    return acc;
  }, Object.create(used));
  var remaining = potentialGroups.slice(1);
  var bestGroupWithFirst = [potentialGroups].concat(getOptimizedPartialGrouping(remaining, usedIncludingFirst));
  var bestGroupWithoutFirst = getOptimizedPartialGrouping(remaining, used);

  if (bestGroupWithFirst.length >= bestGroupWithoutFirst) {
    return bestGroupWithFirst;
  } else {
    return bestGroupWithoutFirst;
  }
};

// console.log(getOptimizedPartialGrouping(mutualGroups));
//------------------------------------------------


/*
1) Create pairs
  Analyze for people who have written the fewest yeses
  Starting from those, find them a mutual pair with the fewest yeses
  Try a few times to find a solution with the most people paired up

2) After all possible pairs are found,
  for each remaining person, still from fewest yeses to greatest,
  add them to the pair (or triple) that maximizes mutual interest
  Alternatively, add them to any pair (or triple) that includes someone they want
*/

var maximizeNumPeopleWithYes = function() {
  var byFewestYeses = personIds.slice();
  byFewestYeses.sort(function(a, b) {
    return peopleData[a].yes.length < peopleData[b].yes.length;
  });

  var byNumYeses = personIds.reduce(function(acc, personId) {
    var numYeses = peopleData[personId].yes.length;
    acc[numYeses] = acc[numYeses] || {};
    acc[numYeses][personId] = true;
    return acc;
  }, {});

  var isUsed = {};
  var grouping = [];
  var toGroup = [];

  byFewestYeses.forEach(function(personId) {
    if (isUsed[personId]) {
      return;
    }
    var desiredPartners = Object.keys(peopleData[personId].yes);
    var availableMutualPartners = desiredPartners.filter(function(desiredPartner) {
      return (
        desiredPartner !== personId &&
        !(desiredPartner in isUsed) && //available
        personId in peopleData[desiredPartner].yes
      );
    });
    availableMutualPartners.sort(function(a, b) {
      return peopleData[a].yes.length < peopleData[b].yes.length;
    });
    if (availableMutualPartners.length > 0) {
      // select closer to the front (fewest yeses), but randomize it
      var partnerId = getFrontHeavyRandomElement(availableMutualPartners);
      grouping.push([personId, partnerId]);
      isUsed[personId] = true;
      isUsed[partnerId] = true;
    } else {
      toGroup.push(personId);
    }
  });
  return {
    pairs: grouping,
    remaining: toGroup,
  };
};

// return a random element from the array, with elements near the front more likely
// given x elements, the pie will be split into 1 + 2 + 3 ... + x pieces
// 0th element is given x chances, 1th is given (x-1) chances, etc.
var getFrontHeavyRandomElement = function(array) {
  var length = array.length;
  var pieSize = (length * (length + 1)) / 2;
  var randomValue = Math.floor(Math.random() * pieSize);
  for (var i = 0; i < pieSize; i++) {
    // the ith element gets (length - i) chances
    var numChances = length - i;
    if (numChances - randomValue > 0) {
      return array[i];
    } else {
      randomValue -= numChances;
    }
  }
  throw new Error('should not have gotten here');
};
// example: 3 elements in array
// their respective weighted chances are [3, 2, 1], with pieSize = 3+2+1 = 6
// randomValue will be between 0~5 (inclusive)
// if randomValue is 0~2, function returns 0
// else if it's 3~4, function returns 1
// else if it's 5, function returns 2

var bestPairing;
for (var i = 0; i < 1000; i++) {
  var newPairing = maximizeNumPeopleWithYes();
  if (!bestPairing || newPairing.pairs.length > bestPairing.pairs.length) {
    bestPairing = newPairing;
  }
}
// console.log(bestPairing, bestPairing.pairs.length);


var getRandomItem = function(array) {
  return array[Math.floor(Math.random() * array.length)];
};

var canBeAdded = function(group, personId) {
  return (
    _.every(group, function(memberId) {
      return (
        !(personId in peopleData[memberId].no) &&
        !(memberId in peopleData[personId].no)
      );
    }) &&
    _.some(group, function(memberId) {
      return memberId in peopleData[personId].yes;
    })
  );
}

var attemptToComplete = function(partialGrouping) {
  var partialGroupingPairsDeepCopy = partialGrouping.pairs.map(function(pair) {
    return pair.slice();
  });

  partialGrouping.remaining.reduce(function(acc, personId) {
    if (acc === null) {
      return null;
    }
    // pick a random pair, until you find one that has someone they like
    // and no mutual incompatibility
    //after 100 attempts, consider it a failure
    var numAttempts = 0;
    while (numAttempts < 100) {
      var randomPair = getRandomItem(acc);
      if (canBeAdded(randomPair, personId)) {
        randomPair.push(personId);
        return acc;
      }
      numAttempts++;
    }
    return null;
  }, partialGroupingPairsDeepCopy);
};

// var numAttempts = 0;
// while (numAttempts < 100) {
//   var attempt = attemptToComplete(bestPairing);
//   if (attempt) {
//     console.log(attempt);
//     break;
//   }
// }