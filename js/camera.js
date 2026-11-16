/* =========================================================
   camera.js: where the camera stands and how it travels.

   A "pose" is { pos, tgt }: where the camera is and what it looks at.
   There are three kinds:
     overview        close, tilted look at the stacked emblem
     detail          high, nearly top-down look at the opened star
     station, i      looking at section card i from the emblem side

   Poses are pulled back on narrow screens (see fit) so nothing is cut off.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.createCameraRig = function (THREE, camera, world) {
    var V3 = THREE.Vector3;
    var HALF_TAN = Math.tan(19 * Math.PI / 180);   // half of the 38 degree field of view

    var pos = new V3(), tgt = new V3();
    var tween = null;
    var smoothX = 0, smoothY = 0;                  // eased mouse position for parallax

    // Scale factor (>= 1) that moves the camera back until `need` world units fit across the screen.
    function fit(dist, need) {
      return Math.max(1, need / (2 * dist * HALF_TAN * camera.aspect));
    }

    function pose(kind, i) {
      var off, k, t;

      if (kind === 'overview') {
        off = new V3(0, 10, 5.8);
        k = fit(off.length(), 11.5);
        t = new V3(0, 1, 0.3);
        return { pos: t.clone().add(off.multiplyScalar(k)), tgt: t };
      }

      if (kind === 'detail') {
        off = new V3(0, 21, 9);
        k = fit(off.length(), 15.5);
        t = new V3(0, 0.5, 0);
        return { pos: t.clone().add(off.multiplyScalar(k)), tgt: t };
      }

      // station: stand between the emblem and the card, above and behind it
      var c = world.stationC[i], d = world.dirs[i];
      k = fit(Math.sqrt(5.2 * 5.2 + 8 * 8), 11);
      return {
        pos: new V3(c.x - d.x * 5.2 * k, 8 * k, c.z - d.z * 5.2 * k),
        tgt: new V3(c.x + d.x * 0.3, 0, c.z + d.z * 0.3)
      };
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
      smoothX += (px - smoothX) * Math.min(1, dt * 3);
      smoothY += (py - smoothY) * Math.min(1, dt * 3);
      camera.position.set(pos.x + smoothX * 0.45 * calm, pos.y, pos.z + smoothY * 0.3 * calm);
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
