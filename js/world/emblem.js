/* =========================================================
   world/emblem.js: the gold five-blade emblem and the disc under it.

   Two poses for the blades:
     stacked (spread = 0)  a pile of tilted shards: the first screen
     open    (spread = 1)  a neat pinwheel star: the second screen
   update() blends between the two. All numbers are in config.js (emblem).

   Returns:
     group            the emblem group (its y position bobs up and down)
     bladeMeshes      the five blade meshes, used for click picking
     clickArea        invisible cylinder that makes the stacked emblem easy to click
     update(opts)     call every frame
     tagAnchor(i,out) world position where blade i's yellow tag sits
   ========================================================= */

(function (PD) {
  'use strict';

  PD.buildEmblem = function (THREE, scene) {
    var cfg = PD.config.emblem;
    var P = PD.config.palette;
    var lerp = PD.lerp;
    var angles = PD.config.stations.angles.map(PD.toRad);   // blade i points the same way as station i

    var group = new THREE.Group();
    scene.add(group);

    /* ---------- Warm light above the emblem ---------- */
    var light = new THREE.PointLight(P.emblemLight, 1, cfg.light.distance, cfg.light.decay);
    light.position.set(0, 3.2, 0);
    scene.add(light);

    /* ---------- Disc, rings and centre hole lying on the desk ---------- */
    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.disc.radius, cfg.disc.radius, cfg.disc.height, cfg.disc.segments),
      new THREE.MeshStandardMaterial({ color: P.disc, roughness: 0.5, emissive: P.discGlow, emissiveIntensity: 0.25 })
    );
    disc.position.y = cfg.disc.height / 2;
    disc.receiveShadow = true;
    scene.add(disc);

    cfg.rings.forEach(function (r) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(r.inner, r.outer, 96),
        new THREE.MeshBasicMaterial({
          color: P[r.color], side: THREE.DoubleSide, transparent: r.opacity < 1, opacity: r.opacity
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.07;
      scene.add(ring);
    });

    var hole = new THREE.Mesh(
      new THREE.CircleGeometry(cfg.hole.radius, 32),
      new THREE.MeshBasicMaterial({ color: P.hole })
    );
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.11;
    scene.add(hole);

    /* ---------- Blade shape ----------
       Draw the outline flat, push it out into a thick 3D slab, then lay it on its side
       so its length runs along +x and its thickness points up. */
    var outline = new THREE.Shape();
    cfg.bladeOutline.forEach(function (pt, i) {
      if (i === 0) outline.moveTo(pt[0], pt[1]); else outline.lineTo(pt[0], pt[1]);
    });
    outline.closePath();

    var bladeGeometry = new THREE.ExtrudeGeometry(outline, {
      depth: cfg.bladeThickness,
      bevelEnabled: true, bevelThickness: cfg.bladeBevel, bevelSize: cfg.bladeBevel, bevelSegments: 2,
      curveSegments: 1
    });
    bladeGeometry.translate(0, 0, -cfg.bladeThickness / 2);
    bladeGeometry.rotateX(-Math.PI / 2);

    var edgeGeometry = new THREE.EdgesGeometry(bladeGeometry, 25);   // bright outline lines

    /* ---------- The five blades ----------
       Each blade sits inside a "pivot" group; we move and turn the pivot. */
    var blades = [];
    PD.CONTENT.forEach(function (item, i) {
      var pivot = new THREE.Group();
      pivot.rotation.order = 'YXZ';   // turn around the vertical axis first, then roll and pitch

      var material = new THREE.MeshStandardMaterial({
        color: P.bladeGold,
        metalness: cfg.bladeMaterial.metalness,
        roughness: cfg.bladeMaterial.roughness,
        emissive: P.bladeGlow,
        emissiveIntensity: cfg.bladeMaterial.glowBase
      });

      var mesh = new THREE.Mesh(bladeGeometry, material);
      mesh.castShadow = true;
      mesh.userData.i = i;            // so a click on this mesh knows which section it means

      pivot.add(mesh);
      pivot.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: P.bladeEdge })));
      group.add(pivot);

      blades.push({ pivot: pivot, mesh: mesh, material: material, hover: 0 });
    });

    /* ---------- Invisible click area ---------- */
    var clickArea = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.clickArea.radius, cfg.clickArea.radius, cfg.clickArea.height, 24),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    clickArea.position.y = cfg.clickArea.y;
    scene.add(clickArea);

    /* ---------- Per-frame update ----------
       opts: { spread (0..1), time, dt, calm (0 or 1), mode, hoverIdx, hoverEmblem } */
    function update(opts) {
      var open = PD.ease(opts.spread);

      for (var i = 0; i < blades.length; i++) {
        var blade = blades[i];
        var stacked = cfg.stackedPoses[i];
        var angle = angles[i];

        // Blend each value between its stacked and open setting
        var distance = lerp(cfg.stackRadius, cfg.openRadius, open);
        blade.pivot.position.set(
          Math.cos(angle) * distance,
          lerp(stacked.y, 0, open),
          -Math.sin(angle) * distance
        );
        blade.pivot.rotation.set(
          lerp(stacked.roll, 0, open),                           // roll
          angle + lerp(stacked.yaw, cfg.openYaw, open),          // turn
          lerp(stacked.pitch, 0, open)                           // pitch
        );
        blade.pivot.scale.setScalar(lerp(cfg.stackScale, 1, open));

        // Glow up when the pointer is over this blade (or over the emblem on the first screen)
        var hovered = (opts.mode === 'detail' && opts.hoverIdx === i) ||
                      (opts.mode === 'overview' && opts.hoverEmblem);
        blade.hover += ((hovered ? 1 : 0) - blade.hover) * Math.min(1, opts.dt * 9);
        blade.material.emissiveIntensity = cfg.bladeMaterial.glowBase + blade.hover * cfg.bladeMaterial.glowHover;
      }

      // Whole emblem: lower when open, gentle bob and sway when stacked
      var idle = (1 - open) * opts.calm;
      group.position.y = lerp(cfg.heightStacked, cfg.heightOpen, open) + Math.sin(opts.time * 1.2) * cfg.bob * idle;
      group.rotation.y = Math.sin(opts.time * 0.35) * cfg.sway * idle;

      // Warm light pulses, and brightens on hover
      light.intensity = cfg.light.intensity
        + Math.sin(opts.time * 1.7) * cfg.light.wobble * opts.calm
        + (opts.hoverEmblem ? cfg.light.hoverBoost : 0);
      light.position.y = group.position.y + cfg.light.height;

      group.updateMatrixWorld(true);
    }

    // World position of the spot on blade i where its tag is drawn
    function tagAnchor(i, out) {
      out.set(cfg.tagAnchor[0], cfg.tagAnchor[1], cfg.tagAnchor[2]);
      blades[i].pivot.localToWorld(out);
      return out;
    }

    return {
      group: group,
      bladeMeshes: blades.map(function (b) { return b.mesh; }),
      clickArea: clickArea,
      update: update,
      tagAnchor: tagAnchor
    };
  };
})(window.PD);
