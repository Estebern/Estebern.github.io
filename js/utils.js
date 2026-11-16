/* =========================================================
   utils.js: small helpers shared by every other file.
   ========================================================= */

(function (PD) {
  'use strict';

  // True when the visitor asked their system to reduce motion.
  PD.RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Smooth start and end (0..1 in, 0..1 out).
  PD.ease = function (u) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  };

  // Degrees to radians.
  PD.toRad = function (deg) { return deg * Math.PI / 180; };

  // Linear blend between a and b.
  PD.lerp = function (a, b, t) { return a + (b - a) * t; };

  // Seeded random numbers, so the desk looks the same on every load.
  PD.rng = function (seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
})(window.PD);
