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
  Spiral.MIDI = {};

  // Spiral.MIDI internal storage.
  var _MIDISources = new Map();
  var _MIDITargets = new Map();
  var _isMIDIReady = true;
  var _onReadyCallback = null;


  // Internal helper: packaging MIDI message into an object.
  function _MIDIObject(type, channel, data1, data2) {
    return {
      type: type,
      channel: channel,
      data1: data1,
      data2 : data2
    };
  }

  // Internal helper: parsing MIDI message into human-readable data.
  function _parseMIDIMessage(msg) {
    // Get channel first (starts from 1).
    var channel = (msg.data[0] & 0x0F) + 1;

    // Branch on the message type.
    switch (msg.data[0] >> 4) {
      case 8:
        return _MIDIObject('noteoff', channel, msg.data[1], msg.data[2]);
        break;
      case 9:
        return _MIDIObject('noteon', channel, msg.data[1], msg.data[2]);
        break;
      case 10:
        return _MIDIObject('polypressure', channel, msg.data[1], msg.data[2]);
        break;
      case 11:
        return _MIDIObject('controlchange', channel, msg.data[1], msg.data[2]);
        break;
      case 12:
        return _MIDIObject('programchange', channel, msg.data[1], null);
        break;
      case 13:
        return _MIDIObject('channelpressure', channel, msg.data[1], null);
        break;
      case 14:
        return _MIDIObject('pitchwheel', channel, (msg.data[1] << 8 || msg.data[2]));
        break;
      default:
        return null;
        break;
    }
  }


  // @class SpiralMIDISource
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
        console.log('[Spiral] Cannot add a duplicate MIDI target: ' + targetObj);
        return;
      }

      this.targets.add(arguments[i]);
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
        console.log('[Spiral] Target is not available for removal: ' + targetObj);
        return;
      }
    }
  };

  // SpiralMIDISource.routeMIDIMessage()
  SpiralMIDISource.prototype.routeMIDIMessage = function (midiMessage) {
    // Stop if there is no target for this source.
    if (this.targets.size === 0)
      return;

    // Send out the parsed MIDI message to all connected targets.
    var parsedMessage = _parseMIDIMessage(midiMessage);
    for (var target in this.targets)
      target.onmidimessage(parsedMessage);
  };


  // Spiral.MIDI public methods.
  Object.defineProperties(window.Spiral.MIDI, {

    /**
     * Defines MIDI-ready callback function.
     * @param {Function} callback Callback function for MIDI on-ready event.
     */
    ready: {
      value: function (callback) {
        if (!_isMIDIReady)
          return;

        if (typeof callback !== 'function') {
          console.log('[Spiral] Invalid callback function for spiral-midi-ready event.');
          return;
        }       

        _onReadyCallback = callback;
      }
    },

    /**
     * Returns JSON for Spiral MIDI inputs and targets.
     * @return {Object} List of input and target labels.
     */
    report: {
      value: function () {
        var devices = {
          sources: [],
          targets: []
        };

        // for (var label of _MIDISources.keys())
        //   devices.sources.push(label);
        
        _MIDISources.forEach(function (source, label) {
          devices.sources.push(label);
        });

        _MIDITargets.forEach(function (target, label) {
          devices.targets.push(label);
        })

        return devices;
      }
    },

    /**
     * Adds a target with the associated label.
     * @param {String} label Target's unique label.
     * @param {Object} target Target object with the onmidimessage handler.
     */
    addTarget: {
      value: function (label, target) {
        if (typeof label !== 'string') {
          console.log('[Spiral] Target label should be a string.');
          return;
        }

        if (_MIDITargets.has('label')) {
          console.log('[Spiral] Duplicate MIDI target label.');
          return;
        }

        if (typeof target.onmidimessage !== 'function') {
          console.log('[Spiral] MIDI target does not have a valid MIDI message handler.');
          return;
        }

        _MIDITargets.set(label, target);
      }
    },

    /**
     * Route MIDI inputs to MIDI targets.
     * @param {String} arguments MIDI input labels.
     * @return {Object.to()}
     */
    route: {
      value: function () {

        var sources = [];
        var targets = [];

        // For method chaining: .to()
        var chain = {

          /**
           * Specified the MIDI target for the routing.
           * @param {Objects} arguments Labels for MIDITarget objects.
           */
          to: function () {
            // Check if a target is valid and registered.
            for (var i = 0; i < arguments.length; i++) {
              if (_MIDITargets.has(arguments[i])) {
                targets.push(_MIDITargets.get(arguments[i]));
              } else {
                console.log('[Spiral] Cannot route invalid targets: ' + arguments[i]);
                return;
              }
            }

            if (targets.length === 0) {
              console.log('[Spiral] There is no target to route.');
              return;
            }

            // All check passed, do the routing.
            for (i = 0; i < sources.length; i++) {
              sources[i].addTargets.apply(sources[i], targets);
            }
          }

        };

        // Check if a source is valid and registered.
        for (var i = 0; i < arguments.length; i++) {
          if (_MIDISources.has(arguments[i]))
            sources.push(_MIDISources.get(arguments[i]));
          else
            console.log('[Spiral] Cannot route invalid source: "' + arguments[i] + '"');
        }

        if (sources.length === 0) {
          console.log('[Spiral] There is no source to route.');
          return chain;
        }

        return chain;
      }
    },

    /**
     * Unroute (disconnect) MIDI sources to MIDI targets.
     * @param {String} arguments MIDI source labels.
     * @return {Object.from()}
     */
    unroute: {
      value: function () {
        var sources = [];
        var targets = [];

        // For method chaining: .from()
        var chain = {

          /**
           * Specified the MIDI target for the routing.
           * @param {Objects} arguments Labels for MIDITarget objects.
           */
          from: function () {
            // Check if a target is valid and registered.
            for (var i = 0; i < arguments.length; i++) {
              if (_MIDITargets.has(arguments[i])) {
                targets.push(_MIDITargets.get(arguments[i]));
              } else {
                console.log('[Spiral] Cannot unroute invalid targets: ' + arguments[i]);
                return;
              }
            }

            if (targets.length === 0) {
              console.log('[Spiral] There is no target to unroute.');
              return;
            }

            // All check passed, do the routing.
            for (i = 0; i < sources.length; i++) {
              sources[i].removeTargets.apply(sources[i], targets);
            }
          }

        };

        // Check if a source is valid and registered.
        for (var i = 0; i < arguments.length; i++) {
          if (_MIDISources.has(arguments[i]))
            sources.push(_MIDISources.get(arguments[i]));
          else
            console.log('[Spiral] Cannot route invalid inputs: "' + arguments[i] + '"');
        }

        if (sources.length === 0) {
          console.log('[Spiral] There is no source to route.');
          return chain;
        }

        return chain;
      }
    }

  });


  // Compat check. If Web MIDI API is not available, bail out.
  if (typeof window.navigator.requestMIDIAccess !== 'function') {
    console.log('[Spiral] Your browser does not support Web MIDI API!');
    return;
  }
  
  // System check passed: collecting MIDI system info with requestMIDIAccess().
  window.navigator.requestMIDIAccess().then(function (midiAccess) {

    // Collect MIDIInputs.
    midiAccess.inputs.forEach(function (input) {
      // TODO: handle MIDI input with duplicate names.
      if (_MIDISources.has(input.name))
        return;
        
      _MIDISources.set(input.name, new SpiralMIDISource(input));
    });

    midiAccess.outputs.forEach(function (output) {
      // TODO: handle MIDI output with duplicate names.
      if (_MIDITargets.has(output.name))
        return;
        
      _MIDITargets.set(output.name, new SpiralMIDISource(output));
    });

    // After this point, the MIDI system is ready.
    _isMIDIReady = true;

    // Check the validity of on-ready callback.
    if (!_onReadyCallback) {
      console.log('[Spiral] MIDI.ready callback function is undefined.');
      return;
    }

    // Dispatch 'spiral-midi-ready' event.
    window.dispatchEvent(new Event('spiral-midi-ready', { detail: null }));

    // Call on-ready callback.
    _onReadyCallback(Spiral.MIDI);

  }, function (errorMessage) {
    console.log('[Spiral] Requesting MIDI access failed: ' + errorMessage);
    return;
  });

}(window.Spiral);