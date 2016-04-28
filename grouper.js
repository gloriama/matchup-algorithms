/*
  Input: preferences
  Output: Random grouping that
  1) strictly honors "no" preferences, i.e. no one will be grouped with
     someone they did not want to work with
  2) approaches optimization of at least one "yes" preference for each
     person

  Overall Approach:
  Order people by number of "yeses" they put down (low to high)
  For each person in order,
    Do our best to group them with someone they want

  Detailed Approach:
  Order people by number of "yeses" they put down (low to high)
  For each person in order,
    If they haven't already been placed in a group (on someone else's turn)
      1) If we can (via finite number of random selections) find a compatible group that has someone they want
        Add them to that group
      2) If there's someone they want who is unplaced, and
         we can still add a new group
        Put them in a new group one of those people
      3) If we can (via finite number of random selections) find a compatible group
        Add them to that group
      4) If we can still add a new group
        Put them in a new group
      5) Conclude we're out of options and return null
    Else if the group they're in doesn't have someone they want, and
    there's someone they want who is unplaced
      Add one of those people to their group
*/

var _ = require('underscore');
var scraperOutput = require('./scrapers/index');

var preferences = scraperOutput.preferences;
var names = scraperOutput.names;
var ids = Object.keys(preferences);

var getRandomItem = function(array) {
  return array[Math.floor(Math.random() * array.length)];
};

var idsToNames = function(ids) {
  return ids.map(function(id) {
    return names[id];
  })
};

var isCompatibleWith = function(group, id) {
  return _.every(group, function(memberId) {
    return (
      !(id in preferences[memberId].no) &&
      !(memberId in preferences[id].no)
    );
  });
}

var hasMemberWantedBy = function(group, id) {
  return _.some(group, function(memberId) {
    return memberId in preferences[id].yes;
  });
};

var attemptGrouping = function(preferences) {
  var MAX_ATTEMPTS = 20;
  var MAX_GROUP_SIZE = 4;
  var MAX_NUM_GROUPS = Math.ceil(ids.length / MAX_GROUP_SIZE);

  var idToGroup = {};

  var byFewestYeses = ids.slice();
  byFewestYeses.sort(function(a, b) {
    return preferences[a].yes.length < preferences[b].yes.length;
  });

  var grouping = byFewestYeses.reduce(function(acc, id) {
    if (acc === null) {
      return null;
    }

    var group = idToGroup[id];

    if (!group) {
      // Try to do each "random" thing MAX_ATTEMPTS times
      var numAttempts;

      // 1) place in random compatible group < MAX_GROUP_SIZEppl that has someone they want
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            randomGroup.length < MAX_GROUP_SIZE &&
            isCompatibleWith(randomGroup, id) &&
            hasMemberWantedBy(randomGroup, id)
          ) {
            randomGroup.push(id);
            idToGroup[id] = randomGroup;
            return acc;
          }
        }
      }

      // 2) place in new group with someone compatible they want
      var unplacedPeopleTheyWant = Object.keys(preferences[id].yes).filter(function(wantedPerson) {
        return !(wantedPerson in idToGroup);
      });
      if (acc.length < MAX_NUM_GROUPS && unplacedPeopleTheyWant.length > 0) {
        var randomPersonTheyWant = getRandomItem(unplacedPeopleTheyWant);
        var newGroup = [id, randomPersonTheyWant];
        acc.push(newGroup);
        idToGroup[id] = newGroup;
        idToGroup[randomPersonTheyWant] = newGroup;
        return acc;
      }

      // 3) place in random compatible group
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            randomGroup.length < MAX_GROUP_SIZE &&
            isCompatibleWith(randomGroup, id)
          ) {
            randomGroup.push(id);
            idToGroup[id] = randomGroup;
            return acc;
          }
        }
      }

      // 4) place in new group
      if (acc.length < MAX_NUM_GROUPS) {
        var newGroup = [id];
        acc.push(newGroup);
        idToGroup[id] = newGroup;
        return acc;
      }

      // 5) blow up
      return null;
    } else {
      var unplacedPeopleTheyWant = Object.keys(preferences[id].yes).filter(function(wantedPerson) {
        return !(wantedPerson in idToGroup);
      });

      if (
        group.length < MAX_GROUP_SIZE &&
        !hasMemberWantedBy(group, id) &&
        unplacedPeopleTheyWant.length > 0
      ) {
        var randomPersonTheyWant = getRandomItem(unplacedPeopleTheyWant);
        group.push(randomPersonTheyWant);
        idToGroup[randomPersonTheyWant] = group;
      }
      return acc;
    }
  }, []);

  var numSatisfied = 0;
  var unsatisfiedIds = [];
  if (grouping) {
    numSatisfied = ids.reduce(function(acc, id) {
      if (hasMemberWantedBy(idToGroup[id], id)) {
        return acc + 1;
      } else {
        unsatisfiedIds.push(id);
        return acc;
      }
    }, 0);
  }

  return {
    idToGroup: idToGroup,
    grouping: grouping,
    numSatisfied: numSatisfied,
    unsatisfiedIds: unsatisfiedIds
  };
};

var bestAttempt;
for (var numAttempts = 0; numAttempts < 1000; numAttempts++) {
  var attempt = attemptGrouping(preferences);
  if (
    !bestAttempt ||
    attempt.grouping && attempt.numSatisfied > bestAttempt.numSatisfied
  ) {
    bestAttempt = attempt;
  }
}

console.log(bestAttempt.grouping.map(function(group) {
  return idsToNames(group);
}));
console.log('# satisfied:', bestAttempt.numSatisfied);
console.log('Unsatisifed:', idsToNames(bestAttempt.unsatisfiedIds));