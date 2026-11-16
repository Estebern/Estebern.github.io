/* =========================================================
   textures/pass.js: the name pass lying on the desk.
   Uses PD.NAME from content.js.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.drawers = PD.drawers || {};

  PD.drawers.pass = function (kit) {
    var P = PD.config.palette;
    var F = PD.config.fonts;

    var canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 450;
    var x = canvas.getContext('2d');

    // paper
    x.fillStyle = P.passPaper;
    x.fillRect(0, 0, 720, 450);

    // dark header with yellow label
    x.fillStyle = P.ink;
    x.fillRect(0, 0, 720, 70);
    x.fillStyle = P.signal;
    x.font = '500 28px ' + F.mono;
    x.textBaseline = 'middle';
    x.fillText('// PORTFOLIO PASS', 28, 36);

    // name and subtitle
    x.textBaseline = 'alphabetic';
    x.fillStyle = P.ink;
    x.font = '700 92px ' + F.display;
    x.fillText(PD.NAME.toUpperCase(), 28, 220);
    x.fillStyle = P.inkSoft;
    x.font = '500 32px ' + F.body;
    x.fillText('Designer and developer', 30, 272);

    // barcode
    var random = PD.rng(3);
    var barX = 30;
    x.fillStyle = P.ink;
    while (barX < 380) {
      var barWidth = 3 + Math.floor(random() * 8);
      x.fillRect(barX, 330, barWidth, 70);
      barX += barWidth + 3 + Math.floor(random() * 6);
    }

    // yellow square in the corner
    x.fillStyle = P.signal;
    x.fillRect(560, 300, 130, 100);

    return kit.tex(canvas, true);
  };
})(window.PD);
