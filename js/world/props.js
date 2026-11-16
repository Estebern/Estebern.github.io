/* =========================================================
   world/props.js: the small objects lying on the desk.

   The list of props lives in config.js (PD.config.props). This file knows
   how to build each TYPE of prop. For every entry in the list,
   buildProps() looks up its type here and calls that builder.

   A builder is a function:  function (ctx, p) { ... }
     ctx = { THREE, scene, textures }
     p   = the entry from config.js (x, z, rot, ...)

   To add a new kind of prop:
     1. write a builder below and add it to PD.propBuilders
     2. add an entry with that type in config.js
   ========================================================= */

(function (PD) {
  'use strict';

  var P = PD.config.palette;

  // Shared by pawns, created the first time one is needed
  var pawnGeometry = null;
  var pawnMaterial = null;

  /* ---------- Helper: a flat textured rectangle lying on the desk ----------
     Returns a group so extra pieces can be attached to it. */
  function flat(ctx, width, depth, texture, x, y, z, rotY, roughness) {
    var THREE = ctx.THREE;

    var face = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({ map: texture, roughness: roughness || 0.9 })
    );
    face.rotation.x = -Math.PI / 2;
    face.receiveShadow = true;
    face.castShadow = true;

    var group = new THREE.Group();
    group.add(face);
    group.position.set(x, y, z);
    group.rotation.y = rotY;
    ctx.scene.add(group);
    return group;
  }

  PD.propBuilders = {

    /* A sheet of paper. */
    sheet: function (ctx, p) {
      flat(ctx, 4.2, 5.2, ctx.textures.sheet(p.seed), p.x, p.y, p.z, p.rot);
    },

    /* The name pass: a card with a slightly bigger slab behind it for thickness. */
    pass: function (ctx, p) {
      var THREE = ctx.THREE;
      var group = flat(ctx, 3.8, 2.4, ctx.textures.pass(), p.x, 0.05, p.z, p.rot, 0.5);

      var slab = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 0.06, 2.5),
        new THREE.MeshStandardMaterial({ color: P.passBack, roughness: 0.6 })
      );
      slab.position.set(0, -0.035, 0);
      group.add(slab);
    },

    /* A dark chess pawn. A "lathe" spins a side outline around an axis to make a round shape. */
    pawn: function (ctx, p) {
      var THREE = ctx.THREE;

      if (!pawnGeometry) {
        // [distance from the middle, height] points, bottom to top
        var outline = [[0, 0], [0.55, 0], [0.55, 0.12], [0.3, 0.25], [0.2, 0.9], [0.34, 1.0], [0.34, 1.1],
                       [0.2, 1.2], [0.34, 1.5], [0.3, 1.85], [0.1, 2.05], [0, 2.07]]
          .map(function (pt) { return new THREE.Vector2(pt[0], pt[1]); });
        pawnGeometry = new THREE.LatheGeometry(outline, 28);
        pawnMaterial = new THREE.MeshStandardMaterial({ color: P.pawn, roughness: 0.35, metalness: 0.3 });
      }

      var pawn = new THREE.Mesh(pawnGeometry, pawnMaterial);
      pawn.position.set(p.x, 0, p.z);
      pawn.scale.setScalar(p.scale);
      pawn.castShadow = true;
      pawn.receiveShadow = true;
      ctx.scene.add(pawn);
    },

    /* A silver capsule lying on its side, with a small dark window on top. */
    capsule: function (ctx, p) {
      var THREE = ctx.THREE;

      var body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 2.4, 28),
        new THREE.MeshStandardMaterial({ color: P.capsule, roughness: 0.3, metalness: 0.55 })
      );
      body.rotation.z = Math.PI / 2;     // lay the cylinder on its side
      body.rotation.y = p.rot;
      body.position.set(p.x, 0.36, p.z);
      body.castShadow = true;
      ctx.scene.add(body);

      var window_ = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.08, 0.5),
        new THREE.MeshStandardMaterial({ color: P.capsuleWindow, roughness: 0.3 })
      );
      window_.position.set(p.x, 0.72, p.z);
      window_.rotation.y = p.rot + Math.PI / 2;
      ctx.scene.add(window_);
    },

    /* A gold hex nut (a six-sided cylinder). */
    nut: function (ctx, p) {
      var THREE = ctx.THREE;

      var nut = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.9, 6),
        new THREE.MeshStandardMaterial({
          color: P.nutGold, roughness: 0.35, metalness: 0.5,
          emissive: P.nutGlow, emissiveIntensity: 0.5
        })
      );
      nut.position.set(p.x, 0.45, p.z);
      nut.rotation.y = p.rot;
      nut.castShadow = true;
      ctx.scene.add(nut);
    }
  };

  /* ---------- Build every prop listed in config.js ---------- */
  PD.buildProps = function (THREE, scene, textures) {
    var ctx = { THREE: THREE, scene: scene, textures: textures };

    PD.config.props.forEach(function (p) {
      var build = PD.propBuilders[p.type];
      if (build) build(ctx, p);
      else console.warn('Unknown prop type "' + p.type + '". Add a builder in js/world/props.js.');
    });
  };
})(window.PD);
