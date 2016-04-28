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

// ---- Group class ----
var GroupCreator = function(preferences, idToGroup, maxGroupSize) {
  var Group = function() {
    this.members = [];
  };

  Group.prototype.isFull = function() {
    return this.members.length === maxGroupSize;
  }

  Group.prototype.add = function(member) {
    if (this.isFull()) {
      return;
    }
    this.members.push(member);
    idToGroup[member] = this;
  };

  Group.prototype.isCompatibleWith = function(candidate) {
    return _.every(this.members, function(member) {
      return (
        !(candidate in preferences[member].no) &&
        !(member in preferences[candidate].no)
      );
    });
  };

  Group.prototype.hasMemberWantedBy = function(candidate) {
    return _.some(this.members, function(member) {
      return member in preferences[candidate].yes;
    });
  };

  return Group;
}
// ---- end Group class ----

var attemptGrouping = function(preferences) {
  var MAX_ATTEMPTS = 20;
  var MAX_GROUP_SIZE = 4;
  var MAX_NUM_GROUPS = Math.ceil(ids.length / MAX_GROUP_SIZE);

  var idToGroup = {};
  var Group = GroupCreator(preferences, idToGroup, MAX_GROUP_SIZE);

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

      // 1) place in random compatible group smaller than MAX_GROUP_SIZE
      //    that has someone they want
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            !randomGroup.isFull() &&
            randomGroup.isCompatibleWith(id) &&
            randomGroup.hasMemberWantedBy(id)
          ) {
            randomGroup.add(id);
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
        var newGroup = new Group();
        newGroup.add(id);
        newGroup.add(randomPersonTheyWant);
        acc.push(newGroup);
        return acc;
      }

      // 3) place in random compatible group
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            !randomGroup.isFull() &&
            randomGroup.isCompatibleWith(id)
          ) {
            randomGroup.add(id);
            return acc;
          }
        }
      }

      // 4) place in new group
      if (acc.length < MAX_NUM_GROUPS) {
        var newGroup = new Group();
        newGroup.add(id);
        acc.push(newGroup);
        return acc;
      }

      // 5) blow up
      return null;
    } else {
      var unplacedPeopleTheyWant = Object.keys(preferences[id].yes).filter(function(wantedPerson) {
        return !(wantedPerson in idToGroup);
      });

      if (
        !group.isFull() &&
        !group.hasMemberWantedBy(id) &&
        unplacedPeopleTheyWant.length > 0
      ) {
        var randomPersonTheyWant = getRandomItem(unplacedPeopleTheyWant);
        group.add(randomPersonTheyWant);
      }
      return acc;
    }
  }, []);

  var numSatisfied = 0;
  var unsatisfiedIds = [];
  if (grouping) {
    numSatisfied = ids.reduce(function(acc, id) {
      var group = idToGroup[id];
      if (group.hasMemberWantedBy(id)) {
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
  return idsToNames(group.members);
}));
console.log('# satisfied:', bestAttempt.numSatisfied);
console.log('Unsatisifed:', idsToNames(bestAttempt.unsatisfiedIds));