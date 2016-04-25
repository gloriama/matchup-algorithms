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

Graph.prototype.getMutualGroups = function() {
  var nodeValues = Object.keys(this.edges);

  // Keep track of what component index a nodeValue is in
  // Initialized to -1 for each, i.e. not in a component
  var componentIndex = nodeValues.reduce(function(acc, nodeValue) {
    acc[nodeValue] = 0;
    return acc;
  }, {});

  // An array of components
  // Each component is an object of nodeValues that are connected in a graph
    // key: nodeValue
    // value: true (dummy value)
  var components = [nodeValues.reduce(function(acc, nodeValue) {
    acc[nodeValue] = true;
    return acc;
  }, {})];

  nodeValues.forEach(function(nodeValue) {
    // grab the nodes that nodeValue is compatible with
      // from within the component that the node is in
    var componentIndexForNode = componentIndex[nodeValue];
    var componentForNode = components[componentIndexForNode];
    var compatibleNodes = Object.keys(componentForNode).filter(function(neighbor) {
      return neighbor === nodeValue || neighbor in this.edges[nodeValue];
    }.bind(this));

    // if it's not compatible with everything in its component,
      // pull out all those compatible nodes into a new component
    if (compatibleNodes.length !== Object.keys(componentForNode).length) {
      var newComponent = {};
      components.push(newComponent);
      compatibleNodes.forEach(function(compatibleNode) {
        delete componentForNode[compatibleNode];
        newComponent[compatibleNode] = true;
        componentIndex[compatibleNode] = components.length - 1;
      });
    }
  }.bind(this));

  // Return components as an array of arrays (rather than array of sets)
  return components.map(function(componentAsObject) {
    return Object.keys(componentAsObject);
  });
};

module.exports = Graph;