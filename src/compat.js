// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
// 
// @filename compat.js
// @description Compatibility patch. (aka monkey patch)
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (window) {

  'use strict';

  // Detect browser version.
  // http://stackoverflow.com/questions/5916900/
  var which = (function () {
    var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/);
      if (tem !== null)
        return 'Opera '+ tem[1];
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) !== null)
      M.splice(1, 1, tem[1]);
    return M.join(' ');
  })();


  // Check for AudioContext.
  var hasAudioContext = window.hasOwnProperty('AudioContext');
  var hasWebKitAudioContext = window.hasOwnProperty('webkitAudioContext');

  // The browser does not have either prefixed or unprefixed version of
  // AudioContext. Quit immediately.
  // This is for the old version of IE. (before Edge)
  if (!hasWebKitAudioContext && !hasAudioContext) {
    console.log('[Spiral] This browser does not support Web Audio API. Bye.');
    return;
  }

  // The browser only has the prefixed version of AudioContext. Apply patch.
  // This is for Safari.
  if (hasWebKitAudioContext && !hasAudioContext) {
    window.AudioContext = window.webkitAudioContext;
    console.log('[Spiral] This browser still has webkitAudioContext. Patch applied.');
  }


  // NOTE: As of Safari 8, it has all the up-to-date method names except for
  // 'webkitAudioContext'. FireFox and Chrome fully support the up-to-date
  // method names. However, for the backward compatibility, Spiral needs to
  // support all the old names.
  //
  // For ENUMS, Chrome, FF and Safari support both the numeric index and the
  // string. (Chrome 44, FF 39 and Safari 8) So we do not need to deal with that
  // any more.
  var DEPRECATED_DICT = {

    'AudioContext': {
      'createDelayNode': 'createDelay',
      'createGainNode': 'createGain',
      'createJavaScriptNode': 'createScriptProcessor',
      'createWaveTable': 'createPeriodicWave'
    },

    'AudioParam': {
      'setTargetValueAtTime': 'setTargetAtTime'
    },

    'OscillatorNode': {
      'noteOn': 'start',
      'noteOff': 'stop',
      'setWaveTable': 'setPeriodicWave'
    },

    'AudioBufferSourceNode': {
      'noteOn': 'start',
      'noteOff': 'stop'
    }

  };

  // Injecting obsolete method names to the associated name space.
  for (var nameSpace in DEPRECATED_DICT) {
    var newMethods = DEPRECATED_DICT[nameSpace];
    for (var oldMethod in newMethods)
      window[nameSpace].prototype[oldMethod] = window[nameSpace].prototype[newMethods[oldMethod]];
  }


  // Handle special cases for start/stop method in Safari. Safari's start/stop
  // methods throw when the time argument is not specified.
  if (which.split(' ')[0] === 'Safari') {
    var _oscStart = window.OscillatorNode.start;
    var _oscStop = window.OscillatorNode.stop;
    var _bufferSourceStart = window.AudioBufferSourceNode.start;
    var _bufferSourceStop = window.AudioBufferSourceNode.stop;

    window.OscillatorNode.start = function (time) {
      _oscStart(time || 0);
    };

    window.OscillatorNode.stop = function (time) {
      _oscStop(time || 0);
    };
    
    window.AudioBufferSourceNode.start = function (time) {
      _bufferSourceStart(time || 0);
    };

    window.AudioBufferSourceNode.stop = function (time) {
      _bufferSourceStop(time || 0);
    };

  }

}(window);
