/*
  Input: preferences
  Output: Random grouping that
  1) strictly honors "no" preferences, i.e. no one will be grouped with
     someone they did not want to work with
  2) approaches optimization of at least one "yes" preference for each
     person

  Algorithm:
  Order people by number of "yeses" they put down (low to high)
  For each person in order,
    If they haven't already been placed in a group (on someone else's turn)
      1) Try to add to a random compatible group that has someone they want
      2) Place in a new group with someone they want
      3) Try to add to a random compatible group
      4) Place in a new group
      5) Conclude we're out of options and return null
    Else
      If the group they're in doesn't have someone they want,
      Try to add someone they want
*/

var _ = require('underscore');
var scraperOutput = require('./scrapers/index');
var MAX_ATTEMPTS = 5; // used in Grouping, can be set to any positive integer

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

var Grouping = function(preferences, maxGroupSize, maxAttempts) {
  this.maxAttempts = maxAttempts;
  this.maxNumGroups = Math.ceil(Object.keys(preferences).length / maxGroupSize);
  this.memberToGroup = {};
  this.Group = GroupCreator(preferences, maxGroupSize, this.memberToGroup);
  this.groups = [];
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

// May return null, if either no group exists or we fail to find
// a random group that passes the filter after {maxAttempts} tries
Grouping.prototype.getRandomGroup = function(filter) {
  filter = filter || function(candidateGroup) { return true; };
  for (var i = 0; i < this.maxAttempts; i++) {
    var randomGroup = getRandomItem(this.groups);
    if (randomGroup && filter(randomGroup)) {
      return randomGroup;
    }
  }
  return null;
};

Grouping.prototype.getAvailableYesesFor = function(member) {
  return Object.keys(preferences[member].yes).filter(function(wantedPerson) {
    return !this.contains(wantedPerson);
  }.bind(this));
};

var attemptGrouping = function(preferences, maxGroupSize) {
  var grouping = new Grouping(preferences, maxGroupSize, MAX_ATTEMPTS);
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
      // 1) place in random compatible group smaller than MAX_GROUP_SIZE
      //    that has someone they want
      group = grouping.getRandomGroup(function(candidateGroup) {
        return (
          !candidateGroup.isFull() &&
          candidateGroup.isCompatibleWith(id) &&
          candidateGroup.hasMemberWantedBy(id)
        );
      });
      if (group) {
        group.add(id);
        return;
      }

      // 2) place in new group with someone compatible they want
      var availableYeses = grouping.getAvailableYesesFor(id);
      if (!grouping.isFull() && availableYeses.length > 0) {
        grouping.add(new Group(id, getRandomItem(availableYeses)));
        return;
      }

      // 3) place in random compatible group
      group = grouping.getRandomGroup(function(candidateGroup) {
        return (
          !candidateGroup.isFull() &&
          candidateGroup.isCompatibleWith(id)
        );
      });
      if (group) {
        group.add(id);
        return;
      }

      // 4) place in new group
      if (!grouping.isFull()) {
        grouping.add(new Group(id));
        return;
      }

      // 5) blow up: we cannot add this person
      grouping = null;
    } else {
      var availableYeses = grouping.getAvailableYesesFor(id);
      if (
        !group.isFull() &&
        !group.hasMemberWantedBy(id) &&
        availableYeses.length > 0
      ) {
        group.add(getRandomItem(availableYeses));
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

// ---- MAIN ----
// Find and print the best grouping
var bestGrouping;
var MAX_GROUP_SIZE = 4;
for (var i = 0; i < 1000; i++) {
  var attempt = attemptGrouping(preferences, MAX_GROUP_SIZE);
  if (
    !bestGrouping ||
    attempt.grouping && attempt.numSatisfied > bestGrouping.numSatisfied
  ) {
    bestGrouping = attempt;
  }
}

console.log(bestGrouping.grouping.groups.map(function(group) {
  return idsToNames(group.members);
}));
console.log('# satisfied:', bestGrouping.numSatisfied);
console.log('Unsatisifed:', idsToNames(bestGrouping.unsatisfiedIds));