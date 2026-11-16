/* =========================================================
   textures/desk.js: the metal desk surface.

   We draw ONE square tile, then Three.js repeats it across the
   whole floor (see desk.tileRepeat in config.js).
   Steps: base colour, soft light gradient, grain, seam, corner crosses, bolts.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.drawers = PD.drawers || {};

  PD.drawers.desk = function (kit) {
    var P = PD.config.palette;
    var SIZE = 512;

    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    var x = canvas.getContext('2d');
    var random = PD.rng(7);

    // 1. Flat base colour
    x.fillStyle = P.deskBase;
    x.fillRect(0, 0, SIZE, SIZE);

    // 2. Soft light-to-dark gradient so tiles do not look flat
    var gradient = x.createLinearGradient(0, 0, SIZE, SIZE);
    gradient.addColorStop(0, 'rgba(255,255,255,.35)');
    gradient.addColorStop(1, 'rgba(0,0,0,.06)');
    x.fillStyle = gradient;
    x.fillRect(0, 0, SIZE, SIZE);

    // 3. Fine grain: 1400 tiny light or dark specks
    for (var i = 0; i < 1400; i++) {
      var speck = random() > 0.5 ? '255,255,255' : '60,66,72';
      x.fillStyle = 'rgba(' + speck + ',' + (0.03 + random() * 0.04) + ')';
      x.fillRect(random() * SIZE, random() * SIZE, 1 + random() * 3, 1 + random() * 2);
    }

    // 4. Seam around the tile edge
    x.strokeStyle = P.deskSeam;
    x.lineWidth = 3;
    x.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);

    // 5. Small "+" marks at the four corners
    x.strokeStyle = P.deskMark;
    x.lineWidth = 2;
    [[0, 0], [SIZE, 0], [0, SIZE], [SIZE, SIZE]].forEach(function (c) {
      x.beginPath();
      x.moveTo(c[0] - 12, c[1]); x.lineTo(c[0] + 12, c[1]);
      x.moveTo(c[0], c[1] - 12); x.lineTo(c[0], c[1] + 12);
      x.stroke();
    });

    // 6. Four bolts
    [[44, 44], [468, 44], [44, 468], [468, 468]].forEach(function (c) {
      x.beginPath();
      x.arc(c[0], c[1], 6, 0, 7);
      x.fillStyle = P.deskBolt;
      x.fill();
      x.stroke();
    });

    // Turn the canvas into a texture that repeats
    var texture = kit.tex(canvas, true);
    texture.wrapS = texture.wrapT = kit.THREE.RepeatWrapping;
    texture.repeat.set(PD.config.desk.tileRepeat, PD.config.desk.tileRepeat);
    return texture;
  };
})(window.PD);
