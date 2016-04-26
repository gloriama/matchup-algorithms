var _ = require('underscore');

// Graph class
// Instantiation style: pseudoclassical
// Available methods:
  // addNode(value)
  // removeNode(value)
  // getComponents()
    // returns array of connected components
  // getMutualGroups()
    // returns array of groups where EVERY node is connected to EACH other
  // getNodesByNumEdges()
    //returns array of node values by least to most num edges

var Graph = function() {
  this.edges = {};
  // key: nodeValue
  // value: object of nodeValues that this node is adjacent to
    //key: nodeValue
    //value: true (dummy value)
};

// Returns the object of nodeValues that this node is adjacent to
Graph.prototype.addNode = function(nodeValue) {
  if (!this.edges[nodeValue]) {
    this.edges[nodeValue] = {};
  }
  return this.edges[nodeValue];
};

//Returns true if deleted node, false if it didn't exist to begin with
Graph.prototype.removeNode = function(nodeValue) {
  // Delete nodeValue from adjacency list for all nodes in graph
  _.forEach(this.edges, function(adjacentNodes) {
    delete adjacentNodes[nodeValue];
  });

  // Delete nodeValue from graph
  if (this.edges[nodeValue]) {
    delete this.edges[nodeValue];
    return true;
  }
  return false;
};

Graph.prototype.addEdge = function(nodeValue1, nodeValue2) {
  this.edges[nodeValue1][nodeValue2] = true;
  this.edges[nodeValue2][nodeValue1] = true;
  return true;
};

Graph.prototype.removeEdge = function(nodeValue1, nodeValue2) {
  delete this.edges[nodeValue1][nodeValue2];
  delete this.edges[nodeValue2][nodeValue1];
  return true;
};

Graph.prototype.isConnected = function(nodeValue1, nodeValue2) {
  return nodeValue2 in this.edges[nodeValue1];
};

Graph.prototype.getComponents = function() {
  var nodeValues = Object.keys(this.edges);

  // Keep track of what component index a nodeValue is in
  // Initialized to -1 for each, i.e. not in a component
  var componentIndex = nodeValues.reduce(function(acc, nodeValue) {
    acc[nodeValue] = -1;
    return acc;
  }, {});

  // An array of components
  // Each component is an object of nodeValues that are connected in a graph
    // key: nodeValue
    // value: true (dummy value)
  var components = [];

  nodeValues.forEach(function(nodeValue) {
    // if the node is not already in a component,
    // create a new component and add this node to it
    if (componentIndex[nodeValue] === -1) {
      var newComponent = {};
      newComponent[nodeValue] = true;
      components.push(newComponent);
      componentIndex[nodeValue] = components.length - 1;
    }

    // add its adjacent nodes to the component it's in
    var componentIndexForNode = componentIndex[nodeValue];
    var componentForNode = components[componentIndexForNode];
    var neighbors = Object.keys(this.edges[nodeValue]);
    neighbors.forEach(function(neighbor) {
      componentForNode[neighbor] = true;
      componentIndex[neighbor] = componentIndexForNode;
    });
  }.bind(this));

  // Return components as an array of arrays (rather than array of sets)
  return components.map(function(componentAsObject) {
    return Object.keys(componentAsObject);
  });
};

// INCOMPLETE
// thoughts thus far:

// start with one person, select someone randomly from their compatible list
// then select someone randomly from who is compatible with both of them
// then someone randomly who is compatible with all of them

// then select another random person, and repeat to create another group

// if at any point, another person cannot be selected, start over and try again

Graph.prototype.createGrouping = function() {
  var nodeValues = Object.keys(this.edges);

  while (true) {
    var attempt = this._attemptGrouping();
    if (attempt) {
      return attempt;
    }
  };
};

Graph.prototype._attemptGrouping = function() {
  var nodeValues = Object.keys(this.edges);

  var isAvailable = nodeValues.reduce(function(acc, nodeValue) {
    acc[nodeValue] = true;
    return acc;
  }, {});
  var numAvailable = nodeValues.length;

  var grouping = [];
  while (numAvailable > 0) {
    var currGroup = [];
    // select a random nodeValue that is available
    var attemptCount = 0;
    while (
      numAvailable > 0 &&
      currGroup.length < 4 &&
      attemptCount < 100
    ) {
      var randomNodeValue = getRandomKey(isAvailable);
      if (this._isMutuallyCompatible(currGroup.concat(randomNodeValue))) {
        currGroup.push(randomNodeValue);
        delete isAvailable[randomNodeValue];
        numAvailable--;
        attemptCount = 0;
      } else {
        attemptCount++;
      }
    }
    if (attemptCount === 100) {
      return null;
    } else {
      grouping.push(currGroup);
    }
  }
  return grouping;
};

Graph.prototype._isMutuallyCompatible = function(nodeValues) {
  for (var i = 0; i < nodeValues.length; i++) {
    for (var j = 0; j < nodeValues.length; j++) {
      if (i !== j && !this.isConnected(nodeValues[i], nodeValues[j])) {
        return false;
      }
    }
  }
  return true;
};

var getRandomKey = function(obj) {
  var keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * (keys.length))];
}
module.exports = Graph;