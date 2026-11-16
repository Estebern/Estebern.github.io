/* =========================================================
   world/desk.js: the big flat floor everything sits on.
   Size and tiling come from config.js (desk.size, desk.tileRepeat).
   ========================================================= */

(function (PD) {
  'use strict';

  PD.buildDesk = function (THREE, scene, textures) {
    var size = PD.config.desk.size;

    var desk = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({ map: textures.desk(), roughness: 0.85, metalness: 0 })
    );

    desk.rotation.x = -Math.PI / 2;   // planes start upright; lay it flat
    desk.receiveShadow = true;        // blades and props cast shadows onto it
    scene.add(desk);
    return desk;
  };
})(window.PD);
