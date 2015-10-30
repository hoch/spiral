// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
// 
// @filename spiral.buff.js
// @description Buffer generation utilities.
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (Spiral) {

  'use strict';

  // Create a Gaussian white noise buffer. (1-ch)
  // TODO(hoch): extend this to multi-channel usage.
  function createGaussianNoiseBuffer(context, duration) {
    var length = duration * context.sampleRate;
    var noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    var channel = noiseBuffer.getChannelData(0);

    for (var i = 0; i < length; i++) {
      var r1 = Math.log(Math.random()), r2 = Math.PI * Math.random();
      channel[i] = Math.sqrt(-2.0 * r1) * Math.cos(2.0 * r2) * 0.5;
    }

    return noiseBuffer;
  }

  // Create a Pink noise buffer. (1-ch)
  // From: home.earthlink.net/~ltrammell/tech/pinkalg.htm
  // TODO(hoch): extend this to multi-channel usage.
  function createPinkNoiseBuffer(context, duration) {
    var length = duration * context.sampleRate;
    var noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    var channel = noiseBuffer.getChannelData(0);

    // pink noise specific coefficients.
    var pA = [3.8024, 2.9694, 2.5970, 3.0870, 3.4006],
        pSum = [0.00198, 0.01478, 0.06378, 0.23378, 0.91578],
        pASum = 15.8564,
        sample = 0,
        contrib = [0.0, 0.0, 0.0, 0.0, 0.0];
    
    for (var i = 0; i < length; i++) {
      var ur1 = Math.random(), ur2 = Math.random();
      for (var j = 0; j < 5; j++) {
        if (ur1 <= pSum[j]) {
          sample -= contrib[j];
          contrib[j] = 2 * (ur2 - 0.5) * pA[j];
          sample += contrib[j];
          break;
        }
      }
      channel[i] = sample / pASum;
    }

    return noiseBuffer;
  }

  // Create a constant buffer, which is useful for the control signal. (1-ch)
  function createConstantBuffer(context, duration) {
    var length = duration * context.sampleRate;
    var constantBuffer = context.createBuffer(1, length, context.sampleRate);
    var channel = constantBuffer.getChannelData(0);

    for (var i = 0; i < length; i++)
      channel[i] = 1;

    return constantBuffer;
  }

  // Create an impulse buffer. (1-ch)
  function createImpulseBuffer(context, duration) {
    var length = duration * context.sampleRate;
    var impulseBuffer = context.createBuffer(1, length, context.sampleRate);
    var channel = impulseBuffer.getChannelData(0);

    for (var i = 0; i < length; i++)
      channel[i] = 0;
    channel[0] = 1;

    return impulseBuffer;
  }


  Object.defineProperties(Spiral, {

    createPresetBuffer: {
      value: function (context, options) {
        if (!options.hasOwnProperty('type') || !options.hasOwnProperty('duration')) {
          console.log('[Spiral] type or duration is unspecified.');
          return null;
        }

        switch (options.type) {
          case 'white':
            return createGaussianNoiseBuffer(context, options.duration);
            break;
          case 'pink':
            return createPinkNoiseBuffer(context, options.duration);
            break;
          case 'constant':
            return createConstantBuffer(context, options.duration);
            break;
          case 'impulse':
            return createImpulseBuffer(context, options.duration);
            break;
          default:
            return null;
        }
      }
    }

  });

}(window.Spiral);
