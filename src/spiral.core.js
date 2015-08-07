// spiral.header.js
// : Web Audio API prototype overriding and few nice things.
// 
// @version 0.0.1

!function (Spiral) {

  'use strict';

  // Spiral version.
  var SPIRAL_VERSION = '0.0.1';

  // Epsilon value for exponential operation in AudioParam. It is -60dBFS.
  var EPSILON = 0.001;


  // AudioContext overriding.
  Object.defineProperties(window.AudioContext.prototype, {

    /**
     * Returns the current time. Equivalent to |.currentTime|.
     * @return {Number} The current context time in seconds.
     */
    now: {
      get: function () {
        return this.currentTime;
      }
    },

    /**
     * Returns the destination node.
     * @return {AudioDestinatioNode} The destination node in the context.
     */
    DAC: {
      get: function () {
        return this.destination;
      }
    }

  });


  // AudioNode overriding.
  Object.defineProperties(window.AudioNode.prototype, {

    // If one or more node arguments exist, connect them and return the first
    // node argument. Otherwise (no valid node argument), just return this node.
    // Note that this method doesn't support multi-IO connection such as
    // ChannelMerger or ChannelSplitter node.
    to: {
      value: function () {
        if (arguments.length > 0) {
          for (var i = 0; i < arguments.length; i++)
            this.connect(arguments[i]);
          return arguments[0];
        }
        return this;
      }
    },

    // Just a simple syntactic sugar. Disconnect everything. If you want a fine
    // control on disconnection such as selective disconneciton, use
    // disconnect() method.
    cut: {
      value: function () {
        this.disconnect();
      }
    }

  });


  // AudioParam overriding.
  Object.defineProperties(window.AudioParam.prototype, {

    // Equivalent to setValueAtTime, but supports multiple data points.
    step: {
      value: function () {
        if (arguments[0] instanceof Array) {
          for (var i = 0; i < arguments.length; i++)
            this.setValueAtTime.apply(this, arguments[i]);
        } else {
          this.setValueAtTime.apply(this, arguments);
        }
        return this;
      }
    },

    line: {
      value: function () {
        if (arguments[0] instanceof Array) {
          for (var i = 0; i < arguments.length; i++)
            this.linearRampToValueAtTime.apply(this, arguments[i]);
        } else {
          this.linearRampToValueAtTime.apply(this, arguments);
        }
        return this;
      }
    },

    expo: {
      value: function () {
        if (arguments[0] instanceof Array) {
          for (var i = 0; i < arguments.length; i++)
            this.exponentialRampToValueAtTime.apply(this, arguments[i]);
        } else {
          this.exponentialRampToValueAtTime.apply(this, arguments);
        }
        return this;
      }
    },

    // TO FIX: generalize this for polarity transition.
    slew: {
      value: function (targetValue, startTime, duration) {
        var safeTargetValue = Math.max(EPSILON, targetValue);
        var tau = duration / Math.log(1 / safeTargetValue);
        this.setTargetAtTime(safeTargetValue, startTime, tau);
        this.setValueAtTime(safeTargetValue, startTime + duration);
        this.linearRampToValueAtTime(targetValue, startTime + duration);
        return this;
      }
    }

  });


  // Spiral primitives.
  Object.defineProperties(Spiral, {

    /**
     * Returns the version of Spiral library.
     */
    version: {
      get: function () {
        return SPIRAL_VERSION;
      }
    },

    /**
     * Returns the current browser version.
     */
    // browserVersion: {
    //   get: function () {
    //     return BROWSER_VERSION;
    //   }
    // }

  });

}(Spiral = {});