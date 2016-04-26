/*
  INPUT:

  1) peopleData: an array of person objects, with each object of the form:
  {
    id: Number,
    name: String,
    yes: Number[], // array of ids of people they want to work with
    no: Number[] //array of ids of people they don't want to work with
    preferredNo: Number[] //array of ids of people that, if possible,
      // will also not be put in a group together 
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
  For each person, generate the array of people they can work with,
    i.e. neither said no for the other
  Start with the people who can work with the fewest people
  Group them with the people who do not mutually have no's,
    using up people who can work with the fewest people first 

  2) Solution that also incorporates maximization of yes's
  ?

  3) Solution that also incorporates minimization of preferredNo's
  ?
*/

var peopleData = [];

var compatibility = {}; // adjacency graph of people who didn't say no
// key: id
// value: array of ids for all people they can work with

var byFlexibility = []; // sorted array of ids from least to most flexible,
// i.e. by least to greatest number of people they can work with

var isAvailable = {}; // temp object to store whether or not someone is still
// available to be added to a group
// key: id
// value: Boolean (defaulted to true)

for (var i = 0; i < byFlexibility.length; i++) {
  var id = byFlexibility[i];

  // continue if they've already been put in a group
  if (!isAvailable[i]) {
    continue;
  }



}


// Create a graph
// Nodes are connected if they can work with each other node
// Check if any node is connected to FEWER than groupSize elements
// If so, return null
// Otherwise, print out all components