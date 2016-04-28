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

// Returns a Group class, bound to preferences and memberToGroup objects
var GroupCreator = function(preferences, maxGroupSize, memberToGroup) {
  var Group = function() {
    this.members = [];
    var initialMembers = Array.prototype.slice.call(arguments);
    initialMembers.forEach(function(member) {
      this.add(member);
    }.bind(this));
  };

  Group.prototype.isFull = function() {
    return this.members.length === maxGroupSize;
  }

  Group.prototype.add = function(member) {
    if (this.isFull()) {
      return;
    }
    this.members.push(member);
    memberToGroup[member] = this;
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
};

var Grouping = function(preferences, maxGroupSize) {
  this.maxNumGroups = Math.ceil(Object.keys(preferences).length / maxGroupSize);
  this.memberToGroup = {};
  this.Group = GroupCreator(preferences, maxGroupSize, this.memberToGroup);
  this.groups = [];
};

Grouping.prototype.isEmpty = function() {
  return this.groups.length === 0;
};

Grouping.prototype.isFull = function() {
  return this.groups.length === this.maxNumGroups;
};

Grouping.prototype.add = function(group) {
  if (this.isFull()) {
    return;
  }
  this.groups.push(group);
};

Grouping.prototype.getGroupFor = function(member) {
  return this.memberToGroup[member];
};

Grouping.prototype.contains = function(candidate) {
  return candidate in this.memberToGroup;
};

Grouping.prototype.getRandomGroup = function() {
  return getRandomItem(this.groups);
};

var attemptGrouping = function(preferences) {
  var MAX_ATTEMPTS = 20;
  var MAX_GROUP_SIZE = 4;
  var MAX_NUM_GROUPS = Math.ceil(ids.length / MAX_GROUP_SIZE);

  var grouping = new Grouping(preferences, MAX_GROUP_SIZE);
  var Group = grouping.Group;

  var byFewestYeses = ids.slice();
  byFewestYeses.sort(function(a, b) {
    return preferences[a].yes.length < preferences[b].yes.length;
  });

  byFewestYeses.forEach(function(id) {
    if (grouping === null) {
      return;
    }

    var group = grouping.getGroupFor(id);
    if (!group) {
      // Try to do each "random" thing MAX_ATTEMPTS times
      var numAttempts;

      // 1) place in random compatible group smaller than MAX_GROUP_SIZE
      //    that has someone they want
      if (!grouping.isEmpty()) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = grouping.getRandomGroup();
          if (
            !randomGroup.isFull() &&
            randomGroup.isCompatibleWith(id) &&
            randomGroup.hasMemberWantedBy(id)
          ) {
            randomGroup.add(id);
            return;
          }
        }
      }

      // 2) place in new group with someone compatible they want
      var availableWantedPeople = Object.keys(preferences[id].yes).filter(function(wantedPerson) {
        return !grouping.contains(wantedPerson);
      });
      if (!grouping.isFull() && availableWantedPeople.length > 0) {
        var randomPersonTheyWant = getRandomItem(availableWantedPeople);
        grouping.add(new Group(id, randomPersonTheyWant));
        return;
      }

      // 3) place in random compatible group
      if (!grouping.isEmpty()) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = grouping.getRandomGroup();
          if (
            !randomGroup.isFull() &&
            randomGroup.isCompatibleWith(id)
          ) {
            randomGroup.add(id);
            return;
          }
        }
      }

      // 4) place in new group
      if (!grouping.isFull()) {
        grouping.add(new Group(id));
        return;
      }

      // 5) blow up
      grouping = null;
    } else {
      var availableWantedPeople = Object.keys(preferences[id].yes).filter(function(wantedPerson) {
        return !grouping.contains(wantedPerson);
      });
      if (
        !group.isFull() &&
        !group.hasMemberWantedBy(id) &&
        availableWantedPeople.length > 0
      ) {
        var randomPersonTheyWant = getRandomItem(availableWantedPeople);
        group.add(randomPersonTheyWant);
      }
    }
  });

  var numSatisfied = 0;
  var unsatisfiedIds = [];
  if (grouping) {
    numSatisfied = ids.reduce(function(acc, id) {
      var group = grouping.getGroupFor(id);
      if (group.hasMemberWantedBy(id)) {
        return acc + 1;
      } else {
        unsatisfiedIds.push(id);
        return acc;
      }
    }, 0);
  }

  return {
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

console.log(bestAttempt.grouping.groups.map(function(group) {
  return idsToNames(group.members);
}));
console.log('# satisfied:', bestAttempt.numSatisfied);
console.log('Unsatisifed:', idsToNames(bestAttempt.unsatisfiedIds));