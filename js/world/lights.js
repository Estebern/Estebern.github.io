/* =========================================================
   world/lights.js: the sun and the sky.

   Without lights a 3D scene is black. Two are used here:
   - a hemisphere light: soft fill from above and below, no shadows
   - a directional light: the "sun", which casts the shadows

   (The warm glow over the emblem belongs to the emblem, see emblem.js.)
   ========================================================= */

(function (PD) {
  'use strict';

  PD.buildLights = function (THREE, scene) {
    var P = PD.config.palette;
    var cfg = PD.config.lights;

    // Soft fill light
    scene.add(new THREE.HemisphereLight(P.skyLight, P.groundLight, cfg.sky.intensity));

    // Sun
    var sun = new THREE.DirectionalLight(P.sunLight, cfg.sun.intensity);
    sun.position.set(cfg.sun.position[0], cfg.sun.position[1], cfg.sun.position[2]);
    sun.castShadow = true;
    sun.shadow.mapSize.set(cfg.sun.shadowMapSize, cfg.sun.shadowMapSize);

    // The area the sun draws shadows for
    var range = cfg.sun.shadowRange;
    var cam = sun.shadow.camera;
    cam.left = -range; cam.right = range; cam.top = range; cam.bottom = -range;
    cam.near = 1; cam.far = 60;
    sun.shadow.bias = -0.0004;

    scene.add(sun);
  };
})(window.PD);
