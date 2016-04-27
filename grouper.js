// Third, least-greedy approach:
// very similar to above, but don't worry about the mutualism

// isPlaced = {} personId: Boolean

// Still go by fewest yeses to most
/*
For each person
  if not placed:
    try to place them in an existing grouping where they are compatible and
    which has someone they want

    if there is someone they want who is not placed yet,
    put them in a new group with that person

    if not possible, place them in a group where they are compatible

    if not possible, place them in a new group alone

    if not possible, we're at a deadend and return null

  if placed and the group doesn't have someone they want and we can add
  someone they want,
    add one of those people

  Always true:
  -When it's a given person's turn, that is the moment we will do our best
   to give them someone they want
*/

var _ = require('underscore');
var peopleData = require('./incorporateTapout');
var personIds = Object.keys(peopleData);

var getRandomItem = function(array) {
  return array[Math.floor(Math.random() * array.length)];
};

var canBeAdded = function(group, personId) {
  return _.every(group, function(memberId) {
    return (
      !(personId in peopleData[memberId].no) &&
      !(memberId in peopleData[personId].no)
    );
  });
}

var hasMemberTheyWant = function(group, personId) {
  return _.some(group, function(memberId) {
    return memberId in peopleData[personId].yes;
  });
};

var groupUngreedily = function() {
  var groupForPersonId = {};

  var byFewestYeses = personIds.slice();
  byFewestYeses.sort(function(a, b) {
    return peopleData[a].yes.length < peopleData[b].yes.length;
  });

  var grouping = byFewestYeses.reduce(function(acc, personId) {
    if (acc === null) {
      return null;
    }

    var group = groupForPersonId[personId];

    if (!group) {
      // Try to do each "random" thing MAX_ATTEMPTS times
      var numAttempts;
      var MAX_ATTEMPTS = 20;
      var MAX_GROUP_SIZE = 4;

      // 1) place in random compatible group < MAX_GROUP_SIZEppl that has someone they want
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            randomGroup.length < MAX_GROUP_SIZE &&
            canBeAdded(randomGroup, personId) &&
            hasMemberTheyWant(randomGroup, personId)
          ) {
            randomGroup.push(personId);
            groupForPersonId[personId] = randomGroup;
            return acc;
          }
        }
      }

      // 2) place in new group with someone compatible they want
      var unplacedPeopleTheyWant = Object.keys(peopleData[personId].yes).filter(function(wantedPerson) {
        return !(wantedPerson in groupForPersonId);
      });
      if (acc.length < 10 && unplacedPeopleTheyWant.length > 0) {
        var randomPersonTheyWant = getRandomItem(unplacedPeopleTheyWant);
        var newGroup = [personId, randomPersonTheyWant];
        acc.push(newGroup);
        groupForPersonId[personId] = newGroup;
        groupForPersonId[randomPersonTheyWant] = newGroup;
        return acc;
      }

      // 3) place in random compatible group
      if (acc.length > 0) {
        for (numAttempts = 0; numAttempts < MAX_ATTEMPTS; numAttempts++) {
          var randomGroup = getRandomItem(acc);
          if (
            randomGroup.length < MAX_GROUP_SIZE &&
            canBeAdded(randomGroup, personId)
          ) {
            randomGroup.push(personId);
            groupForPersonId[personId] = randomGroup;
            return acc;
          }
        }
      }

      // 4) place in new group
      if (acc.length < 10) {
        var newGroup = [personId];
        acc.push(newGroup);
        groupForPersonId[personId] = newGroup;
        return acc;
      }

      // 5) blow up
      return null;
    } else {
      var unplacedPeopleTheyWant = Object.keys(peopleData[personId].yes).filter(function(wantedPerson) {
        return !(wantedPerson in groupForPersonId);
      });

      if (
        group.length < MAX_GROUP_SIZE &&
        !hasMemberTheyWant(group, personId) &&
        unplacedPeopleTheyWant.length > 0
      ) {
        var randomPersonTheyWant = getRandomItem(unplacedPeopleTheyWant);
        group.push(randomPersonTheyWant);
        groupForPersonId[randomPersonTheyWant] = group;
      }
      return acc;
    }
  }, []);

  var numPeopleWithSomeoneTheyWant;
  var personIdsWithoutSomeoneTheyWant = [];
  if (grouping) {
    numPeopleWithSomeoneTheyWant = personIds.reduce(function(acc, personId) {
      if (hasMemberTheyWant(groupForPersonId[personId], personId)) {
        return acc + 1;
      } else {
        personIdsWithoutSomeoneTheyWant.push(personId);
        return acc;
      }
    }, 0);
  }

  return {
    groupForPersonId: groupForPersonId,
    grouping: grouping,
    numPeopleWithSomeoneTheyWant: numPeopleWithSomeoneTheyWant,
    personIdsWithoutSomeoneTheyWant: personIdsWithoutSomeoneTheyWant
  };
};

var bestAttempt;
for (var numAttempts = 0; numAttempts < 1000; numAttempts++) {
  var attempt = groupUngreedily();
  if (
    attempt.grouping && (
      !bestAttempt ||
      attempt.numPeopleWithSomeoneTheyWant > bestAttempt.numPeopleWithSomeoneTheyWant
    )
  ) {
    bestAttempt = attempt;
  }
}
console.log(bestAttempt.grouping.map(function(group) {
  return group.map(function(personId) {
    return peopleData[personId].name;
  });
}));

console.log(
  'num people who have someone they want to work with:',
  bestAttempt.numPeopleWithSomeoneTheyWant
);

console.log(
  'people without someone they want:',
  bestAttempt.personIdsWithoutSomeoneTheyWant.map(function(personId) {
    return peopleData[personId].name;
  })
);