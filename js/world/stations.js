/* =========================================================
   world/stations.js: the five section cards lying far out on the desk.

   Each section sits on the same line as its blade, so "blade 3 points at card 3".
   Angles and sizes come from config.js (stations).

   Returns:
     dirs      for each section, a unit direction from the emblem toward its card
     centres   for each section, the world position of its card
   ========================================================= */

(function (PD) {
  'use strict';

  PD.buildStations = function (THREE, scene, textures) {
    var cfg = PD.config.stations;
    var P = PD.config.palette;

    var dirs = [];
    var centres = [];

    PD.CONTENT.forEach(function (item, i) {
      var angle = PD.toRad(cfg.angles[i]);

      // Angles run counter-clockwise on screen. On the desk, screen-up is -z, hence the minus sign.
      var dir = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
      var centre = dir.clone().multiplyScalar(cfg.radius);
      dirs.push(dir);
      centres.push(centre);

      // One group holds slab and card, so they move and turn together
      var group = new THREE.Group();
      group.position.copy(centre);
      group.rotation.y = Math.atan2(-dir.x, -dir.z);   // turn so the card's text reads upright from the emblem side

      // Grey slab underneath: gives the card thickness and a shadow
      var slab = new THREE.Mesh(
        new THREE.BoxGeometry(cfg.slabSize[0], cfg.slabSize[1], cfg.slabSize[2]),
        new THREE.MeshStandardMaterial({ color: P.slab, roughness: 0.7 })
      );
      slab.position.y = cfg.slabSize[1] / 2;
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);

      // The printed card, resting just on top of the slab
      var face = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.cardSize[0], cfg.cardSize[1]),
        new THREE.MeshStandardMaterial({ map: textures.card(item), roughness: 0.85 })
      );
      face.rotation.x = -Math.PI / 2;
      face.position.y = cfg.slabSize[1] + 0.006;
      face.receiveShadow = true;
      group.add(face);

      scene.add(group);
    });

    return { dirs: dirs, centres: centres };
  };
})(window.PD);
