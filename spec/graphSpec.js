var assert = require('chai').assert;
var Graph = require('../graph.js');

describe('Graph', function() {
  var graph;

  // Initialize the graph newly before each "it" block below
  beforeEach(function() {
    graph = new Graph();
    for (var i = 0; i < 100; i++) {
      graph.addNode(i);
      for (var j = 0; j < 80; j++) {
        graph.addEdge(i, Math.floor(Math.random() * i));
      };
    }
    // console.log(graph);
  });

  describe('addNode()', function () {
    it('should return an object if the node already existed', function () {
      assert(true, typeof graph.addNode(10) === 'object');
    });
    it('should return an object if the node didn\'t already exist', function () {
      assert(true, typeof graph.addNode(1000) === 'object');
    });
    it('should add the node value as a key in the graph\'s edges object', function() {
      for (var i = 0; i < 100; i++) {
        assert.isTrue(i in graph.edges);
      }
    });
    it('should not add any other value as a key in the graph\'s edges object', function() {
      assert.isFalse(2000 in graph.edges);
    });
  });

  describe('removeNode()', function () {
    it('should return true if the node existed', function () {
      assert.isTrue(graph.removeNode(10));
    });
    it('should return false if the node didn\'t exist', function () {
      graph.removeNode(10);
      assert.isFalse(graph.removeNode(10));
    });
    it('should remove the node value as a key from the graph\'s edges object', function() {
      graph.removeNode(10);
      assert.isFalse(10 in graph.edges);
    });
  });

  describe('isConnected()', function () {
    it('should return true for two nodes whose edge has been added', function () {
      graph.addEdge(1, 2);
      assert.isTrue(graph.isConnected(1, 2));
    });
    it('should return false for two nodes whose edge has been removed', function () {
      graph.removeEdge(1, 2);
      assert.isFalse(graph.isConnected(1, 2));
    });
  });

  describe('getComponents()', function () {
    it('should return an array', function () {
      var components = graph.getComponents();
      assert.equal(true, Array.isArray(components));
    });
    it('should return an array of arrays', function () {
      var components = graph.getComponents();
      // console.log(components);
      components.forEach(function(component) {
        assert.equal(true, Array.isArray(component));
      });
    });
  });

  describe('getMutualGroups()', function () {
    it('should return an array', function () {
      var mutualGroups = graph.getMutualGroups();
      assert.equal(true, Array.isArray(mutualGroups));
    });
    it('should return an array of arrays', function () {
      var mutualGroups = graph.getMutualGroups();
      mutualGroups.forEach(function(mutualGroup) {
        assert.equal(true, Array.isArray(mutualGroup));
      });
    });
    it('should contain each node in the graph exactly once', function () {
      var mutualGroups = graph.getMutualGroups();
      var seen = {};
      mutualGroups.forEach(function(mutualGroup) {
        mutualGroup.forEach(function(nodeValue) {
          assert.isFalse(nodeValue in seen);
          seen[nodeValue] = true;
        });
      });
      for (var i = 0; i < 100; i++) {
        assert.isTrue(i.toString() in seen);
      }
    });
    it('should not contain any node not in the graph', function () {
      var mutualGroups = graph.getMutualGroups();
      // console.log(mutualGroups);
      var seen = {};
      mutualGroups.forEach(function(mutualGroup) {
        mutualGroup.forEach(function(nodeValue) {
          assert.isFalse(nodeValue in seen);
          seen[nodeValue] = true;
        });
      });
      for (var i = 100; i < 110; i++) {
        assert.isFalse(i.toString() in seen);
      }
    });
  });
});