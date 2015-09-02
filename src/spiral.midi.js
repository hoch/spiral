// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
//
// @filename spiral.midi.js
// @description Web MIDI API helpers.
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (Spiral) {

  'use strict';


  // Spiral.MIDI Namespace.
  Spiral.MIDI = {
    isSupported: false
  };


  // Internal helper: packages MIDI message into an object.
  var _MIDIObject = function (type, channel, data1, data2) {
    return {
      type: type,
      channel: channel,
      data1: data1,
      data2 : data2
    };
  };

  // Internal helper: parses a MIDI message.
  var _parseMIDIMessage = function (message) {
    // Get channel first (starts from 1).
    var channel = (message.data[0] & 0x0F) + 1;

    // Branch on the message type.
    switch (message.data[0] >> 4) {
      case 8:
        return _MIDIObject('noteoff', channel, message.data[1], message.data[2]);
        break;
      case 9:
        return _MIDIObject('noteon', channel, message.data[1], message.data[2]);
        break;
      case 10:
        return _MIDIObject('polypressure', channel, message.data[1], message.data[2]);
        break;
      case 11:
        return _MIDIObject('controlchange', channel, message.data[1], message.data[2]);
        break;
      case 12:
        return _MIDIObject('programchange', channel, message.data[1], null);
        break;
      case 13:
        return _MIDIObject('channelpressure', channel, message.data[1], null);
        break;
      case 14:
        return _MIDIObject('pitchwheel', channel, (message.data[1] << 8 || message.data[2]));
        break;
      default:
        return null;
        break;
    }
  };


  /**
   * @class SpiralMIDISource
   */
  function SpiralMIDISource(midiInput) {
    this.targets = new Set();
    this.input = midiInput;
    this.input.onmidimessage = this.routeMIDIMessage.bind(this);
  }

  // SpiralMIDISource.addTargets()
  SpiralMIDISource.prototype.addTargets = function () {
    for (var i = 0; i < arguments.length; i++) {
      var targetObj = arguments[i];
      if (this.targets.has(targetObj)) {
        // TODO: use targetObj's label instead.
        console.log('[Spiral:MIDI] Cannot add a duplicate MIDI target: ' + targetObj);
        return;
      }

      this.targets.add(targetObj);
    }
  };

  // SpiralMIDISource.removeTargets()
  SpiralMIDISource.prototype.removeTargets = function () {
    for (var i = 0; i < arguments.length; i++) {
      var targetObj = arguments[i];
      if (this.targets.has(targetObj)) {
        this.targets.delete(targetObj);
      } else {
        // TODO: use targetObj's label instead.
        console.log('[Spiral:MIDI] Target is not available for removal: ' + targetObj);
        return;
      }
    }
  };

  // SpiralMIDISource.routeMIDIMessage()
  SpiralMIDISource.prototype.routeMIDIMessage = function (message) {
    // Stop if there is no target for this source.
    if (this.targets.size === 0)
      return;

    // Send out the parsed MIDI message to all connected targets.
    var parsedMessage = _parseMIDIMessage(message);
    this.targets.forEach(function (target) {
      target.onmidimessage(parsedMessage);
    });
  };


  /**
   * @class SpiralMIDITarget
   */

  // TODO...


  /**
   * @class SpiralMIDIManager
   */
  function SpiralMIDIManager() {
    this.sources = new Map();
    this.targets = new Map();
    this.isReady = false;
    this.onReadyCallback = null;
  }

  SpiralMIDIManager.prototype.start = function () {

    var me = this;

    var promiseHandlers = function (resolve, reject) {

      if (!Spiral.MIDI.isSupported)
        reject('[Spiral.MIDI] Cannot proceed: Web MIDI API is not supported.');

      // Initiate population.
      window.navigator.requestMIDIAccess().then(function (access) {

        // Collect MIDIInputs.
        access.inputs.forEach(function (input) {
          // TODO: handle MIDI input with duplicate names.
          if (me.sources.has(input.name))
            return;

          me.sources.set(input.name, new SpiralMIDISource(input));
        });

        access.outputs.forEach(function (output) {
          // TODO: handle MIDI output with duplicate names.
          if (me.targets.has(output.name))
            return;

          // me.targets.set(output.name, new SpiralMIDITarget(output));
          me.targets.set(output.name, output);
        });

        me.isReady = true;

        // Dispatch 'spiral-midi-ready' event.
        window.dispatchEvent(new Event('spiral-midi-ready', { detail: null }));

        resolve(me);

      }, function (errorMessage) {
        reject('[Spiral.MIDI] starting MIDI system failed: ' + errorMEssage);
      });

    };

    return new Promise(promiseHandlers);
  };

  SpiralMIDIManager.prototype.stop = function () {
    // TODO: clear out all the routing info.
  };

  SpiralMIDIManager.prototype.report = function () {
    var sources = [], targets = [];

    this.sources.forEach(function (source, label) {
      sources.push(label);
    });

    this.targets.forEach(function (target, label) {
      targets.push(label);
    });

    return {
      sources: sources,
      targets: targets
    };
  };

  SpiralMIDIManager.prototype.defineTarget = function (label, target) {
    if (typeof label !== 'string') {
      console.log('[Spiral:MIDI] Target label should be a string.');
      return;
    }

    if (this.targets.has(label)) {
      console.log('[Spiral:MIDI] Duplicate MIDI target label.');
      return;
    }

    if (typeof target.onmidimessage !== 'function') {
      console.log('[Spiral:MIDI] MIDI target MUST have a valid onmidimessage handler.');
      return;
    }

    this.targets.set(label, target);
  };

  /**
   * Connect MIDI sources to the targets.
   * @param {String...} arguments MIDI input labels.
   * @return {Object}
   */
  SpiralMIDIManager.prototype.connect = function () {

    var selectedSources = [], selectedTargets = [];
    var me = this;

    // For method chaining: .to()
    var tailFunction = {

      /**
       * Specify MIDI targets for the routing.
       * @param {String...} arguments Labels for MIDITarget objects.
       */
      to: function () {
        // Check if a target is valid and registered.
        for (var i = 0; i < arguments.length; i++) {
          var targetLabel = arguments[i];
          if (me.targets.has(targetLabel)) {
            selectedTargets.push(me.targets.get(targetLabel));
          } else {
            console.log('[Spiral:MIDI] Cannot route invalid targets: ' + targetLabel);
            return;
          }
        }

        if (selectedTargets.length === 0) {
          console.log('[Spiral:MIDI] There is no target to route.');
          return;
        }

        // All check passed, do the routing.
        for (i = 0; i < selectedSources.length; i++) {
          selectedSources[i].addTargets.apply(selectedSources[i], selectedTargets);
        }

      }

    };

    // Check if a source is valid and registered.
    for (var i = 0; i < arguments.length; i++) {
      var sourceLabel = arguments[i];
      if (me.sources.has(sourceLabel))
        selectedSources.push(me.sources.get(sourceLabel));
      else
        console.log('[Spiral:MIDI] Cannot route invalid source: "' + sourceLabel + '"');
    }

    if (selectedSources.length === 0) {
      console.log('[Spiral:MIDI] There is no source to route.');
      return tailFunction;
    }

    return tailFunction;
  };


  /**
   * Connects all sources into a target.
   */
  SpiralMIDIManager.prototype.connectAll = function () {

    var selectedTargets = [];
    var me = this;

    // For method chaining: .to()
    return {

      /**
       * Specify MIDI targets for the routing.
       * @param {String...} arguments Labels for MIDITarget objects.
       */
      to: function () {
        // Check if a target is valid and registered.
        for (var i = 0; i < arguments.length; i++) {
          var targetLabel = arguments[i];
          if (me.targets.has(targetLabel)) {
            selectedTargets.push(me.targets.get(targetLabel));
          } else {
            console.log('[Spiral:MIDI] Cannot route invalid targets: ' + targetLabel);
            return;
          }
        }

        if (selectedTargets.length === 0) {
          console.log('[Spiral:MIDI] There is no target to route.');
          return;
        }

        // All check passed, do the routing.
        me.sources.forEach(function (source) {
          source.addTargets.apply(source, selectedTargets);
        });

      }
    };
  };


  // Compat check.
  if (typeof window.navigator.requestMIDIAccess === 'function')
    Spiral.MIDI.isSupported = true;


  // Spiral public methods.
  Object.defineProperties(Spiral, {

    /**
     * Create an instance of MIDIManager.
     */
    createMIDIManager: {
      value: function () {
        return new SpiralMIDIManager();
      }
    },

    parseMIDIMessage: {
      value: _parseMIDIMessage
    }

  });

}(window.Spiral);