/* =========================================================
   textures/sheet.js: a loose sheet of paper with grey "text" lines.

   The seed decides how long each line is, so every sheet looks a bit different.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.drawers = PD.drawers || {};

  PD.drawers.sheet = function (kit, seed) {
    var P = PD.config.palette;
    var random = PD.rng(seed);

    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    var x = canvas.getContext('2d');

    // paper
    x.fillStyle = P.sheetPaper;
    x.fillRect(0, 0, 512, 640);

    // dark title bar
    x.fillStyle = P.ink;
    x.fillRect(36, 40, 150, 14);

    // 18 grey lines of random length
    x.fillStyle = P.sheetLine;
    for (var i = 0; i < 18; i++) {
      x.fillRect(36, 100 + i * 28, 150 + random() * 290, 6);
    }

    // small empty box in the top right
    x.strokeStyle = P.sheetBox;
    x.lineWidth = 2;
    x.strokeRect(300, 36, 176, 40);

    return kit.tex(canvas, false);
  };
})(window.PD);
