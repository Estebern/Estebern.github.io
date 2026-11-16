/* =========================================================
   world.js: everything you can see in 3D.

   PD.buildWorld(THREE, scene, textures) adds to the scene:
     1. lights
     2. the desk and the props on it
     3. five section stations (cards on the desk, far from the centre)
     4. the emblem: a disc, rings and five gold blades

   It returns what other files need:
     emblem, blades, proxy, glow          emblem parts
     dirs, stationC                       direction and centre of each station
     update(opts)                         moves the blades for the current state
     tagAnchor(i, out)                    world point where blade i's tag sits
   ========================================================= */

   (function (PD) {
    'use strict';
  
    PD.buildWorld = function (THREE, scene, textures) {
      var N = PD.CONTENT.length;
      var lerp = PD.lerp;
      var HALF_PI = Math.PI / 2;
  
      /* ---------- Helpers: the only places that repeat boilerplate ---------- */
  
      // Make a standard material. Only pass what differs from the defaults.
      function mat(color, opts) {
        return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.6 }, opts));
      }
  
      // Make a mesh, position it, and add it to the scene (or to opts.parent).
      //   pos: [x, y, z]
      //   opts: ry (yaw), rot ([x, y, z] radians), scale, cast / receive (shadows, default true), parent
      function place(geo, material, pos, opts) {
        opts = opts || {};
        var m = new THREE.Mesh(geo, material);
        m.position.set(pos[0], pos[1], pos[2]);
        if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
        if (opts.ry) m.rotation.y = opts.ry;
        if (opts.scale) m.scale.setScalar(opts.scale);
        m.castShadow = opts.cast !== false;
        m.receiveShadow = opts.receive !== false;
        (opts.parent || scene).add(m);
        return m;
      }
  
      // A flat textured rectangle lying on the desk. Returns a group so more can be attached.
      function flat(w, h, map, pos, rotY, roughness) {
        var g = new THREE.Group();
        g.position.set(pos[0], pos[1], pos[2]);
        g.rotation.y = rotY;
        place(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: map, roughness: roughness || 0.9 }),
          [0, 0, 0], { rot: [-HALF_PI, 0, 0] });
        scene.add(g);
        return g;
      }
  
      // Shared materials.
      var GOLD = mat(0xd9a21f, { roughness: 0.35, metalness: 0.5, emissive: 0x5a3a00, emissiveIntensity: 0.5 });
      var DARK = mat(0x1d2023, { roughness: 0.35, metalness: 0.3 });
      var SILVER = mat(0xcdd1d4, { roughness: 0.3, metalness: 0.55 });
  
      /* ---------- 1. Lights ---------- */
      scene.add(new THREE.HemisphereLight(0xffffff, 0xb9bec2, 0.85));
  
      var sun = new THREE.DirectionalLight(0xfff3df, 0.7);
      sun.position.set(-7, 20, 9);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera;
      sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 60;
      sun.shadow.bias = -0.0004;
      scene.add(sun);
  
      // Warm light above the emblem; it pulses a little in update().
      var glow = new THREE.PointLight(0xffa83c, 1, 16, 2);
      glow.position.set(0, 3.2, 0);
      scene.add(glow);
  
      /* ---------- 2. Desk and props ---------- */
      // The desk is a big plane with a tiled texture.
      place(new THREE.PlaneGeometry(130, 130), mat(0xffffff, { map: textures.desk(), roughness: 0.85 }),
        [0, 0, 0], { rot: [-HALF_PI, 0, 0], cast: false });
  
      // Loose paper sheets. y rises a tiny bit per sheet so they never flicker (z-fighting).
      var SHEETS = [
        { x: -7.2, z: -3.6, ry:  0.45, seed: 1 },
        { x:  7.6, z: -4.6, ry: -0.50, seed: 2 },
        { x: -8.2, z:  4.6, ry:  0.20, seed: 3 },
        { x:  9.2, z:  2.2, ry:  0.75, seed: 4 },
        { x:  1.8, z: -9.6, ry:  0.12, seed: 5 },
        { x: -1.4, z:  9.2, ry: -0.30, seed: 6 }
      ];
      SHEETS.forEach(function (s, i) {
        flat(4.2, 5.2, textures.sheet(s.seed * 11), [s.x, 0.02 + i * 0.006, s.z], s.ry);
      });
  
      // Name pass: a flat card plus a slim box underneath for thickness.
      var pass = flat(3.8, 2.4, textures.pass(), [4.9, 0.05, 3.9], -0.38, 0.5);
      place(new THREE.BoxGeometry(3.9, 0.06, 2.5), mat(0xdfe2e4, { roughness: 0.6 }),
        [0, -0.035, 0], { parent: pass, cast: false, receive: false });
  
      // Pawns: a Lathe spins a 2D profile (radius, height) around the Y axis.
      var PAWN_PROFILE = [
        [0, 0], [0.55, 0], [0.55, 0.12], [0.3, 0.25], [0.2, 0.9], [0.34, 1.0], [0.34, 1.1],
        [0.2, 1.2], [0.34, 1.5], [0.3, 1.85], [0.1, 2.05], [0, 2.07]
      ];
      var pawnGeo = new THREE.LatheGeometry(PAWN_PROFILE.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 28);
      [
        { x: -5.6, z:  5.8, scale: 1.00 },
        { x:  8.4, z: -1.4, scale: 0.85 },
        { x: -9.4, z: -0.4, scale: 1.10 }
      ].forEach(function (p) {
        place(pawnGeo, DARK, [p.x, 0, p.z], { scale: p.scale });
      });
  
      // Silver capsule device: a cylinder lying on its side, with a dark window on top.
      place(new THREE.CylinderGeometry(0.34, 0.34, 2.4, 28), SILVER, [1.2, 0.36, 6.4],
        { rot: [0, 0.9, HALF_PI], receive: false });
      place(new THREE.BoxGeometry(0.3, 0.08, 0.5), DARK, [1.2, 0.72, 6.4],
        { ry: 0.9 + HALF_PI, cast: false, receive: false });
  
      // Gold hex nut: a cylinder with only 6 sides.
      place(new THREE.CylinderGeometry(1.15, 1.15, 0.9, 6), GOLD, [-7.6, 0.45, -5.2],
        { ry: 0.3, receive: false });
  
      /* ---------- 3. Section stations ----------
         Blade i points along ANGLES[i] (degrees, counter-clockwise from screen-right,
         as seen from above). Its station sits on the same line, far out on the desk. */
      var ANGLES = [126, 198, 270, 342, 54].map(function (d) { return d * Math.PI / 180; });
      var dirs = ANGLES.map(function (t) { return new THREE.Vector3(Math.cos(t), 0, -Math.sin(t)); });
      var STATION_RADIUS = 16;
      var SLAB = { w: 8.9, h: 0.14, d: 5.75 };      // grey base plate
      var FACE = { w: 8.4, d: 5.25 };               // the card drawn on top of it
      var stationC = [];
  
      PD.CONTENT.forEach(function (item, i) {
        var d = dirs[i];
        var centre = d.clone().multiplyScalar(STATION_RADIUS);
        stationC.push(centre);
  
        var g = new THREE.Group();
        g.position.copy(centre);
        g.rotation.y = Math.atan2(-d.x, -d.z);      // text top points away from the emblem
        scene.add(g);
  
        place(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d), mat(0xaeb3b7, { roughness: 0.7 }),
          [0, SLAB.h / 2, 0], { parent: g });
        place(new THREE.PlaneGeometry(FACE.w, FACE.d), mat(0xffffff, { map: textures.card(item), roughness: 0.85 }),
          [0, SLAB.h + 0.006, 0], { parent: g, rot: [-HALF_PI, 0, 0], cast: false });
      });
  
      /* ---------- 4. Emblem ---------- */
      var emblem = new THREE.Group();
      scene.add(emblem);
  
      // White disc under the blades.
      place(new THREE.CylinderGeometry(2.1, 2.1, 0.1, 48),
        mat(0xf4f5f5, { roughness: 0.5, emissive: 0x8d9094, emissiveIntensity: 0.25 }),
        [0, 0.05, 0], { cast: false });
  
      // Thin flat rings drawn on the desk.
      function ring(inner, outer, color, opacity) {
        var m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96),
          new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: opacity < 1, opacity: opacity }));
        m.rotation.x = -HALF_PI; m.position.y = 0.07;
        scene.add(m);
      }
      ring(2.45, 2.52, 0xe0a21c, 1);
      ring(3.1, 3.13, 0x8c9399, 0.8);
  
      // Dark hole in the middle.
      var hole = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0x2a2d30 }));
      hole.rotation.x = -HALF_PI; hole.position.y = 0.11;
      scene.add(hole);
  
      // One blade: a kite-shaped outline, extruded into 3D and bevelled, lying flat along +X.
      var BLADE_OUTLINE = [[0, -0.55], [5.6, -0.42], [7.2, -0.02], [5.9, 0.5], [0, 0.62], [-0.4, 0]];
      var shape = new THREE.Shape();
      BLADE_OUTLINE.forEach(function (p, k) { if (k === 0) shape.moveTo(p[0], p[1]); else shape.lineTo(p[0], p[1]); });
      shape.closePath();
      var bladeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 1
      });
      bladeGeo.translate(0, 0, -0.11);
      bladeGeo.rotateX(-HALF_PI);
      var edgeGeo = new THREE.EdgesGeometry(bladeGeo, 25);   // bright outline
  
      // Overview pose per blade: stacked and tilted like a pile of shards.
      // y = height, yaw = extra turn, roll = tilt around its length, pitch = tip up or down.
      var OVERVIEW = [
        { y: 0.00, yaw:  0.45, roll:  0.50, pitch:  0.35 },
        { y: 0.35, yaw: -0.30, roll: -0.40, pitch:  0.20 },
        { y: 0.15, yaw:  0.55, roll:  0.35, pitch: -0.10 },
        { y: 0.55, yaw: -0.50, roll: -0.45, pitch:  0.30 },
        { y: 0.30, yaw:  0.20, roll:  0.20, pitch:  0.15 }
      ];
  
      var blades = [];
      for (var i = 0; i < N; i++) {
        var pivot = new THREE.Group();
        pivot.rotation.order = 'YXZ';   // yaw first, so roll and pitch stay relative to the blade
        var material = mat(0xd6a021, { metalness: 0.45, roughness: 0.28, emissive: 0x8a5a00, emissiveIntensity: 0.55 });
        var mesh = place(bladeGeo, material, [0, 0, 0], { parent: pivot, receive: false });
        mesh.userData.i = i;
        pivot.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffe08a })));
        emblem.add(pivot);
        blades.push({ pivot: pivot, mesh: mesh, mat: material, glow: 0 });
      }
  
      // Invisible cylinder so the whole emblem is easy to click on the first screen.
      var proxy = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 3, 24),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      proxy.position.y = 1;
      scene.add(proxy);
  
      /* ---------- Per-frame update ----------
         opts: { spread 0..1, time, dt, calm 0|1, mode, hoverIdx, hoverEmblem }
         spread 0 = stacked overview, 1 = opened star. */
      function update(opts) {
        var e = PD.ease(opts.spread);
  
        for (var i = 0; i < N; i++) {
          var b = blades[i], o = OVERVIEW[i], t = ANGLES[i];
          var r = lerp(0.25, 1.3, e);                                   // distance from centre
          b.pivot.position.set(Math.cos(t) * r, lerp(o.y, 0, e), -Math.sin(t) * r);
          b.pivot.rotation.set(lerp(o.roll, 0, e), t + lerp(o.yaw, 0.32, e), lerp(o.pitch, 0, e));
          b.pivot.scale.setScalar(lerp(0.6, 1, e));
  
          var hot = (opts.mode === 'detail' && opts.hoverIdx === i) || (opts.mode === 'overview' && opts.hoverEmblem);
          b.glow += ((hot ? 1 : 0) - b.glow) * Math.min(1, opts.dt * 9);
          b.mat.emissiveIntensity = 0.55 + b.glow * 0.7;
        }
  
        emblem.position.y = lerp(1.1, 0.55, e) + Math.sin(opts.time * 1.2) * 0.12 * (1 - e) * opts.calm;
        emblem.rotation.y = Math.sin(opts.time * 0.35) * 0.08 * (1 - e) * opts.calm;
  
        glow.intensity = 0.9 + Math.sin(opts.time * 1.7) * 0.25 * opts.calm + (opts.hoverEmblem ? 0.5 : 0);
        glow.position.y = emblem.position.y + 2.2;
  
        emblem.updateMatrixWorld(true);
      }
  
      // World position of the point on blade i where its tag is drawn.
      function tagAnchor(i, out) {
        out.set(4.5, 0.15, 0);
        blades[i].pivot.localToWorld(out);
        return out;
      }
  
      return {
        emblem: emblem, blades: blades, proxy: proxy, glow: glow,
        dirs: dirs, stationC: stationC,
        bladeMeshes: blades.map(function (b) { return b.mesh; }),
        update: update, tagAnchor: tagAnchor
      };
    };
  })(window.PD);