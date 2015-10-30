// -----------------------------------------------------------------------------
// Spiral: Light-weight & modular Web Audio/MIDI API Library
// 
// @filename spiral.util.js
// @description Math utilities and more.
// @author hoch (hongchan.choi@gmail.com)
// -----------------------------------------------------------------------------

!function (Spiral) {

  'use strict';

  // @class SpiralEnvelope
  function SpiralEnvelope() {
    this._points = new Map();
  }

  // Get an finalized (time-sorted) a set of value-time pairs.
  SpiralEnvelope.prototype.get = function () {
    var times = [], envelope = [];
    this._points.keys.forEach(function (key) {
      times.push(key);
    });
    times.sort();
    
    // Change it back to Value-Time pair.
    for (var i = 0; i < times.length; i++)
      envelope.push([this._points.get(times[i]), times[i]]);
    
    return envelope;
  };

  // Add or modify envelope point(s).
  SpiralEnvelope.prototype.set = function () {
    // Store point as Time-Value pair. 
    // (time is unique key, last-insertion priority)
    for (var i = 0; i < arguments.length; i++)
      this._points.set(arguments[i][1], arguments[i][0]);
  };
  

  // Math functions.
  Object.defineProperties(Spiral, {

    /**
     * Clamps a number into a range specified by min and max.
     * @param  {Number} value Value to be clamped
     * @param  {Number} min   Range minimum
     * @param  {Number} max   Range maximum
     * @return {Number}       Clamped value
     */
    clamp: {
      value: function (value, min, max) {
        return Math.min(Math.max(value, min), max);
      }
    },

    /**
     * Generates a floating point random number between min and max.
     * @param  {Number} min Range minimum
     * @param  {Number} max Range maximum
     * @return {Number}     A floating point random number
     */
    random2f: {
      value: function (min, max) {
        return min + Math.random() * (max - min);
      }
    },

    /**
     * Generates an integer random number between min and max.
     * @param  {Number} min Range minimum
     * @param  {Number} max Range maximum
     * @return {Number}     An integer random number
     */
    random2: {
      value: function (min, max) {
        return Math.round(min + Math.random() * (max - min));
      }
    },

    /**
     * Converts a MIDI pitch number to frequency.
     * @param  {Number} midi MIDI pitch (0 ~ 127)
     * @return {Number}      Frequency (Hz)
     */
    mtof: {
      value: function (midi) {
        if (midi <= -1500)
          return 0;

        if (midi > 1499)
          return 3.282417553401589e+38;

        return 440.0 * Math.pow(2, (Math.floor(midi) - 69) / 12.0);
      }
    },

    /**
     * Converts frequency to MIDI pitch.
     * @param  {Number} freq Frequency
     * @return {Number}      MIDI pitch
     */
    ftom: {
      value: function (freq) {
        return Math.floor(freq > 0 ? Math.log(freq/440.0) / Math.LN2 * 12 + 69 : -1500);
      }
    },

    /**
     * Converts power to decibel. Note that it is off by 100dB to make it
     *   easy to use MIDI velocity to change volume. This is the same
     *   convention that PureData uses. This behavior might change in the
     *   future.
     * @param  {Number} power Power
     * @return {Number}       Decibel
     */
    powtodb: {
      value: function (power) {
        if (power <= 0)
          return 0;

        var db = 100 + 10.0 / Math.LN10 * Math.log(power);
        return db < 0 ? 0 : db;
      }
    },

    /**
     * Converts decibel to power. Note that it is off by 100dB to make it
     *   easy to use MIDI velocity to change volume. This is the same
     *   convention that PureData uses. This behavior might change in the
     *   future.
     * @param  {Number} db Decibel
     * @return {Number}    Power
     */
    dbtopow: {
      value: function (db) {
        if (db <= 0)
          return 0;

        // TODO: what is 870?
        if (db > 870)
          db = 870;

        return Math.exp(Math.LN10 * 0.1 * (db - 100.0));
      }
    },

    /**
     * Converts RMS(root-mean-square) to decibel.
     * @param  {Number} rms RMS value
     * @return {Number}     Decibel
     */
    rmstodb: {
      value: function (rms) {
        if (rms <= 0)
          return 0;

        var db = 100 + 20.0 / Math.LN10 * Math.log(rms);
        return db < 0 ? 0 : db;
      }
    },

    /**
     * Converts decibel to RMS(root-mean-square).
     * @param  {Number} db  Decibel
     * @return {Number}     RMS value
     */
    dbtorms: {
      value: function (db) {
        if (db <= 0)
          return 0;

        // TO FIX: what is 485?
        if (db > 485)
          db = 485;

        return Math.exp(Math.LN10 * 0.05 * (db - 100.0));
      }
    },

    /**
     * Converts linear amplitude to decibel.
     * @param  {Number} lin Linear amplitude
     * @return {Number}     Decibel
     */
    lintodb: {
      value: function (lin) {
        // if below -100dB, set to -100dB to prevent taking log of zero
        return 20.0 * (lin > 0.00001 ? (Math.log(lin) / Math.LN10) : -5.0);
      }
    },

    /**
     * Converts decibel to linear amplitude. Useful for dBFS conversion.
     * @param  {Number} db  Decibel
     * @return {Number}     Linear amplitude
     */
    dbtolin: {
      value: function (db) {
        return Math.pow(10.0, db / 20.0);
      }
    },

    /**
     * Converts MIDI velocity to linear amplitude.
     * @param  {Number} velocity MIDI velocity
     * @return {Number}     Linear amplitude
     */
    veltoamp: {
      value: function (velocity) {
        // TODO: velocity curve here?
        return velocity / 127;
      }
    },

    // Create an envelope object. (a set of [value, time] pairs).
    createEnvelope: {
      value: function () {
        var envelope = new SpiralEnvelope();
        envelope.set.apply(envelope, arguments);
        return envelope;
      }
    }

  });

}(window.Spiral);
