// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
// 
// @filename spiral.ext.js
// @description Extension (custom node) module.
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (Spiral) {

  'use strict';

  // http://jsbin.com/nomema/edit?js,console

  // Custom node name space.
  var _CUSTOM = {};

  // Custom node definition directory.
  _CUSTOM.nodeDefinitions = {};

  // Stashing the connect method.
  _CUSTOM.AudioNodeConnect = window.AudioNode.prototype.connect;
  _CUSTOM.AudioNodeDisconnect = window.AudioNode.prototype.disconnect;


  // Custom Node superclass.
  function CustomNode(audioContext, nodeDefinition) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();

    this._SPIRAL_CUSTOM_NODE = true;
    this._SPIRAL_CUSTOM_NODE_NAME = nodeDefinition.name;

    nodeDefinition.call(this, this.context);
  }

  CustomNode.prototype.connect = function () {
    this.output.connect.apply(this.output, arguments);
  };

  CustomNode.prototype.disconnect = function () {
    this.output.disconnect.apply(this.output, arguments);
  };


  // Overriding AudioContext.
  AudioContext.prototype.createCustomNode = function (nodeName) {
    var nodeDefinition = _CUSTOM.nodeDefinitions[nodeName];
    var newCustomNode = new CustomNode(this, nodeDefinition);

    for (var proto in nodeDefinition.prototype)
      newCustomNode[proto] = nodeDefinition.prototype[proto];

    return newCustomNode;
  };


  // Overriding AudioNode.
  Object.defineProperties(window.AudioNode.prototype, {

    // Overrides the native connect method to accommodate SpiralCustomNode.
    connect: {
      value: function () {        
        if (arguments[0]._SPIRAL_CUSTOM_NODE) {
          // If the target node is a SpiralCustomNode, swap the target with the
          // internal input node in it.  Let's not create an Array unless it is
          // necessary.
          var args = Array.prototype.slice.call(arguments);
          args[0] = args[0].input;
          _CUSTOM.AudioNodeConnect.apply(this, args);
        } else {
          _CUSTOM.AudioNodeConnect.apply(this, arguments);
        }
      }
    },

    // Overrides the native connect method to accommodate SpiralCustomNode.
    disconnect: {
      value: function () {        
        if (arguments[0]._SPIRAL_CUSTOM_NODE) {
          // If the target node is a SpiralCustomNode, swap the target with the
          // internal input node in it.  Let's not create an Array unless it is
          // necessary.
          var args = Array.prototype.slice.call(arguments);
          args[0] = args[0].input;
          _CUSTOM.AudioNodeDisconnect.apply(this, args);
        } else {
          _CUSTOM.AudioNodeDisconnect.apply(this, arguments);
        }
      }
    }

  });

  
  Spiral.defineCustomNode = function (nodeClass) {
    _CUSTOM.nodeDefinitions[nodeClass.name] = nodeClass;
  };

}(window.Spiral);