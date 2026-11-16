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
    var desk = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 130),
      new THREE.MeshStandardMaterial({ map: textures.desk(), roughness: 0.85, metalness: 0 })
    );
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    scene.add(desk);

    // A flat textured rectangle lying on the desk.
    function flat(w, h, map, x, y, z, rotY, roughness) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: map, roughness: roughness || 0.9 }));
      m.rotation.x = -Math.PI / 2;
      m.receiveShadow = true; m.castShadow = true;
      var g = new THREE.Group();
      g.add(m);
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      scene.add(g);
      return g;
    }

    // Loose paper sheets: [x, z, rotation, texture seed]
    [[-7.2, -3.6, 0.45, 1], [7.6, -4.6, -0.5, 2], [-8.2, 4.6, 0.2, 3],
     [9.2, 2.2, 0.75, 4], [1.8, -9.6, 0.12, 5], [-1.4, 9.2, -0.3, 6]]
      .forEach(function (s, i) {
        flat(4.2, 5.2, textures.sheet(s[3] * 11), s[0], 0.02 + i * 0.006, s[1], s[2]); // tiny y steps stop z-fighting
      });

    // Name pass with a slab behind it for thickness
    var pass = flat(3.8, 2.4, textures.pass(), 4.9, 0.05, 3.9, -0.38, 0.5);
    var passBack = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.06, 2.5), new THREE.MeshStandardMaterial({ color: 0xdfe2e4, roughness: 0.6 }));
    passBack.position.set(0, -0.035, 0);
    pass.add(passBack);

    // Dark pawns (lathe = spin a profile around the Y axis)
    var pawnProfile = [[0, 0], [0.55, 0], [0.55, 0.12], [0.3, 0.25], [0.2, 0.9], [0.34, 1.0], [0.34, 1.1],
                       [0.2, 1.2], [0.34, 1.5], [0.3, 1.85], [0.1, 2.05], [0, 2.07]]
      .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var pawnGeo = new THREE.LatheGeometry(pawnProfile, 28);
    var pawnMat = new THREE.MeshStandardMaterial({ color: 0x1d2023, roughness: 0.35, metalness: 0.3 });
    [[-5.6, 5.8, 1], [8.4, -1.4, 0.85], [-9.4, -0.4, 1.1]].forEach(function (p) {
      var m = new THREE.Mesh(pawnGeo, pawnMat);
      m.position.set(p[0], 0, p[1]);
      m.scale.setScalar(p[2]);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
    });

    // Silver capsule device
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 2.4, 28),
      new THREE.MeshStandardMaterial({ color: 0xcdd1d4, roughness: 0.3, metalness: 0.55 }));
    cap.rotation.z = Math.PI / 2; cap.rotation.y = 0.9;
    cap.position.set(1.2, 0.36, 6.4);
    cap.castShadow = true;
    scene.add(cap);
    var capWindow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x1d2023, roughness: 0.3 }));
    capWindow.position.set(1.2, 0.72, 6.4);
    capWindow.rotation.y = 0.9 + Math.PI / 2;
    scene.add(capWindow);

    // Gold hex nut
    var nut = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: 0xd9a21f, roughness: 0.35, metalness: 0.5, emissive: 0x5a3a00, emissiveIntensity: 0.5 }));
    nut.position.set(-7.6, 0.45, -5.2); nut.rotation.y = 0.3; nut.castShadow = true;
    scene.add(nut);

    /* ---------- 3. Section stations ----------
       Blade i points along ANGLES[i] (degrees, counter-clockwise from screen-right,
       as seen from above). Its station sits on the same line, far out on the desk. */
    var ANGLES = [126, 198, 270, 342, 54].map(function (d) { return d * Math.PI / 180; });
    var dirs = ANGLES.map(function (t) { return new THREE.Vector3(Math.cos(t), 0, -Math.sin(t)); });
    var STATION_RADIUS = 16;
    var stationC = [];

    PD.CONTENT.forEach(function (item, i) {
      var d = dirs[i];
      var centre = d.clone().multiplyScalar(STATION_RADIUS);
      stationC.push(centre);

      var g = new THREE.Group();
      g.position.copy(centre);
      g.rotation.y = Math.atan2(-d.x, -d.z);   // text top points away from the emblem

      var slab = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.14, 5.75), new THREE.MeshStandardMaterial({ color: 0xaeb3b7, roughness: 0.7 }));
      slab.position.y = 0.07; slab.castShadow = true; slab.receiveShadow = true;
      g.add(slab);

      var face = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.25), new THREE.MeshStandardMaterial({ map: textures.card(item), roughness: 0.85 }));
      face.rotation.x = -Math.PI / 2; face.position.y = 0.146; face.receiveShadow = true;
      g.add(face);

      scene.add(g);
    });

    /* ---------- 4. Emblem ---------- */
    var emblem = new THREE.Group();
    scene.add(emblem);

    var disc = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.1, 48),
      new THREE.MeshStandardMaterial({ color: 0xf4f5f5, roughness: 0.5, emissive: 0x8d9094, emissiveIntensity: 0.25 }));
    disc.position.y = 0.05; disc.receiveShadow = true;
    scene.add(disc);

    function ringOnDesk(inner, outer, color, opacity) {
      var m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96),
        new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: opacity < 1, opacity: opacity }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.07;
      scene.add(m);
    }
    ringOnDesk(2.45, 2.52, 0xe0a21c, 1);
    ringOnDesk(3.1, 3.13, 0x8c9399, 0.8);

    var hole = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0x2a2d30 }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = 0.11;
    scene.add(hole);

    // One blade: a kite-shaped polygon, extruded and bevelled, lying flat along +X.
    var shape = new THREE.Shape();
    shape.moveTo(0, -0.55); shape.lineTo(5.6, -0.42); shape.lineTo(7.2, -0.02);
    shape.lineTo(5.9, 0.5); shape.lineTo(0, 0.62); shape.lineTo(-0.4, 0); shape.closePath();
    var bladeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 1
    });
    bladeGeo.translate(0, 0, -0.11);
    bladeGeo.rotateX(-Math.PI / 2);
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
      var material = new THREE.MeshStandardMaterial({
        color: 0xd6a021, metalness: 0.45, roughness: 0.28, emissive: 0x8a5a00, emissiveIntensity: 0.55
      });
      var mesh = new THREE.Mesh(bladeGeo, material);
      mesh.castShadow = true;
      mesh.userData.i = i;
      pivot.add(mesh);
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

      emblem.position.y = lerp(6.1, 0.55, e) + Math.sin(opts.time * 1.2) * 0.12 * (1 - e) * opts.calm;
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
