// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
//
// @filename spiral.core.js
// @description Web Audio API prototype extension and few other nice things.
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (window) {

  'use strict';

  // Spiral name space.
  window.Spiral = new Object();


  // Spiral version.
  var SPIRAL_VERSION = '0.0.3';

  // Epsilon value for exponential operation in AudioParam. It is -60dBFS.
  var EPSILON = 0.001;


  // Individual file loading Task.
  function _loadAudioFile(context, fileInfo, done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', fileInfo.url);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function () {
      if (xhr.status === 200) {
        context.decodeAudioData(xhr.response,
          function (buffer) {
            // console.log('Loading completed: ' + fileInfo.url);
            done(fileInfo.name, buffer);
          },
          function (message) {
            console.log('[Spiral] Decoding failure: ' + fileInfo.url + ' (' + message + ')');
            done(fileInfo.name, null);
          });
      } else {
        console.log('[Spiral] XHR Error: ' + fileInfo.url + ' (' + xhr.statusText + ')');
        done(fileInfo.name, null);
      }
    };

    xhr.onerror = function (event) {
      console.log('[Spiral] XHR Network failure: ' + fileInfo.url);
      done(fileInfo.name, null);
    };

    xhr.send();
  }


  // @class AudioBufferMananger
  // A wrapper/container for multiple file loaders.
  function AudioBufferManager(context, audioFileData, resolve, reject, progress) {
    this._context = context;
    this._resolve = resolve;
    this._reject = reject;
    this._progress = progress;

    this._buffers = new Map();
    this._loadingTasks = {};

    // Iterating file loading.
    for (var i = 0; i < audioFileData.length; i++) {
      var fileInfo = audioFileData[i];

      // Check for duplicates filename and quit if it happens.
      if (this._loadingTasks.hasOwnProperty(fileInfo.name)) {
        console.log('[Spiral] Duplicated filename in AudioBufferManager: ' + fileInfo.name);
        return;
      }

      // Mark it as pending (0)
      this._loadingTasks[fileInfo.name] = 0;
      _loadAudioFile(this._context, fileInfo, this._done.bind(this));
    }
  }

  AudioBufferManager.prototype._done = function (filename, buffer) {
    // Label the loading task.
    this._loadingTasks[filename] = buffer !== null ? 'loaded' : 'failed';
    
    // A failed task will be a null buffer.
    this._buffers.set(filename, buffer);
    
    this._updateProgress(filename);
  };

  AudioBufferManager.prototype._updateProgress = function (filename) {
    var numberOfFinishedTasks = 0, numberOfFailedTask = 0;
    var numberOfTasks = 0;

    for (var task in this._loadingTasks) {
      numberOfTasks++;
      if (this._loadingTasks[task] === 'loaded')
        numberOfFinishedTasks++;
      else if (this._loadingTasks[task] === 'failed')
        numberOfFailedTask++;
    }

    if (typeof this._progress === 'function')
      this._progress(filename, numberOfFinishedTasks, numberOfTasks);

    if (numberOfFinishedTasks === numberOfTasks)
      this._resolve(this._buffers);

    if (numberOfFinishedTasks + numberOfFailedTask === numberOfTasks)
      this._reject(this._buffers);
  };


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
    },

    /**
     * Load an audio file asynchronously.
     * @param {Array} dataModel Audio file info in the format of {name, url}
     * @param {Function} onprogress Callback function for reporting the progress.
     * @return {Promise} Promise.
     */
    loadAudioFiles: {
      value: function (dataModel, onprogress) {
        return new Promise(function (resolve, reject) {
          new AudioBufferManager(this, dataModel, resolve, reject, onprogress);
        }.bind(this));
      }
    },

    /**
     * Create multiple nodes into a target object.
     * @param {Object} target Target object for AudioNode creation.
     * @param {Object} nodeList A node list of (variable name, node type).
     */
    createNodes: {
      value: function (target, nodeList) {
        if (typeof target !== 'object')
          throw '[Spiral] Creation target is not an object.';

        for (var name in nodeList) {
          var functionName = 'create' + nodeList[name];
            if (typeof this[functionName] !== 'function')
              throw '[Spiral] Invalid AudioNode constructor: ' + functionName;

            target[name] = this[functionName]();
        }
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
    // control on disconnection such as selective disconnection, use
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

    // TODO: generalize this for polarity transition.
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
  Object.defineProperties(window.Spiral, {

    /**
     * Returns the version of Spiral library.
     * @return {String} Semver version string.
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


    /**
     * Generates Unique ID. Can be used for buffer, node, task and more.
     * @return {String} Unique ID in 8 characters.
     *
     * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    generateUid: {
      value: function () {
        return 'yxxxxxxx'.replace(/[xy]/g,
          function(c) {
            var r = Math.random()*8|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
          });
      }
    }

  });

}(window);
