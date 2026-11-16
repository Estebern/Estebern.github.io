/* =========================================================
   textures/index.js: gathers every texture drawer into one object.

   Each file in this folder registers a function on PD.drawers:
     desk.js, card.js, sheet.js, pass.js

   PD.createTextures() wraps them so the 3D code can simply call:
     textures.desk()
     textures.card(item)
     textures.sheet(seed)
     textures.pass()

   To add a new texture:
     1. create js/textures/mything.js that sets  PD.drawers.mything = function (kit, arg) { ... return kit.tex(canvas, true); }
     2. add a <script> tag for it in index.html, above this file
     3. call  textures.mything()  from the world code
   ========================================================= */

(function (PD) {
  'use strict';

  PD.createTextures = function (THREE, maxAnisotropy) {

    // Turn a finished canvas into a Three.js texture.
    // sharp = true keeps text crisp when seen at an angle.
    function tex(canvas, sharp) {
      var t = new THREE.CanvasTexture(canvas);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = sharp ? maxAnisotropy : 4;
      return t;
    }

    // Split text into lines that each fit within maxWidth pixels.
    function wrapText(ctx, text, maxWidth) {
      var words = text.split(' '), lines = [], line = '';
      words.forEach(function (word) {
        var attempt = line ? line + ' ' + word : word;
        if (ctx.measureText(attempt).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = attempt;
        }
      });
      if (line) lines.push(line);
      return lines;
    }

    // Tools handed to every drawer
    var kit = { THREE: THREE, tex: tex, wrapText: wrapText };

    var textures = {};
    Object.keys(PD.drawers).forEach(function (name) {
      textures[name] = function (arg) { return PD.drawers[name](kit, arg); };
    });
    return textures;
  };
})(window.PD);
