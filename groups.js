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