/* =========================================================
   camera.js: where the camera stands and how it travels.

   A "pose" is { pos, tgt }: where the camera is and what it looks at.
   There are three kinds:
     overview        close, tilted look at the stacked emblem
     detail          high, nearly top-down look at the opened star
     station, i      looking at section card i from the emblem side

   The numbers for each pose are in config.js (camera).
   Poses are pulled back on narrow screens (see fit) so nothing is cut off.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.createCameraRig = function (THREE, camera, world) {
    var V3 = THREE.Vector3;
    var cfg = PD.config.camera;
    var HALF_TAN = Math.tan(PD.toRad(cfg.fov / 2));   // half of the field of view

    var pos = new V3(), tgt = new V3();   // where the camera is, and what it looks at
    var tween = null;                      // the flight in progress, if any
    var smoothX = 0, smoothY = 0;          // eased mouse position for parallax

    // Scale factor (>= 1) that moves the camera back until `need` world units fit across the screen.
    function fit(distance, need) {
      return Math.max(1, need / (2 * distance * HALF_TAN * camera.aspect));
    }

    // Pose for the overview or detail screen (both are described by offset, target, width).
    function fixedPose(c) {
      var offset = new V3(c.offset[0], c.offset[1], c.offset[2]);
      var target = new V3(c.target[0], c.target[1], c.target[2]);
      var k = fit(offset.length(), c.width);
      return { pos: target.clone().add(offset.multiplyScalar(k)), tgt: target };
    }

    // Pose for looking at section i: stand between the emblem and the card, above and behind it.
    function stationPose(i) {
      var s = cfg.station;
      var centre = world.stationC[i], dir = world.dirs[i];
      var k = fit(Math.sqrt(s.back * s.back + s.height * s.height), s.width);
      return {
        pos: new V3(centre.x - dir.x * s.back * k, s.height * k, centre.z - dir.z * s.back * k),
        tgt: new V3(centre.x + dir.x * s.lookAhead, 0, centre.z + dir.z * s.lookAhead)
      };
    }

    function pose(kind, i) {
      if (kind === 'station') return stationPose(i);
      return fixedPose(cfg[kind]);   // 'overview' or 'detail'
    }

    function poseForState(st) {
      return st.mode === 'station' ? pose('station', st.active) : pose(st.mode);
    }

    // Start a flight from the current camera to `p`. `arc` lifts the camera mid-flight.
    function fly(p, seconds, arc) {
      tween = {
        p0: pos.clone(), t0: tgt.clone(), p1: p.pos, t1: p.tgt,
        t: 0, dur: PD.RM ? 0.01 : seconds, arc: PD.RM ? 0 : arc
      };
    }

    // Jump straight to a pose (used on resize and at start).
    function snapTo(p) { pos.copy(p.pos); tgt.copy(p.tgt); tween = null; }

    // Call once per frame. px, py are the pointer in -1..1 for a gentle parallax.
    function update(dt, px, py) {
      if (tween) {
        tween.t += dt / tween.dur;
        var u = Math.min(1, tween.t), k = PD.ease(u);
        pos.lerpVectors(tween.p0, tween.p1, k);
        pos.y += Math.sin(Math.PI * k) * tween.arc;
        tgt.lerpVectors(tween.t0, tween.t1, k);
        if (u >= 1) tween = null;
      }

      var calm = PD.RM ? 0 : 1;
      var ease = Math.min(1, dt * cfg.parallax.smoothing);
      smoothX += (px - smoothX) * ease;
      smoothY += (py - smoothY) * ease;

      camera.position.set(
        pos.x + smoothX * cfg.parallax.x * calm,
        pos.y,
        pos.z + smoothY * cfg.parallax.z * calm
      );
      camera.lookAt(tgt);
      camera.updateMatrixWorld(true);
    }

    return {
      pose: pose, poseForState: poseForState,
      fly: fly, snapTo: snapTo, update: update,
      isFlying: function () { return !!tween; }
    };
  };
})(window.PD);
