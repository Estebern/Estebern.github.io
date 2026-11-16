/* =========================================================
   textures.js: every image in the scene is drawn here with the
   2D canvas, so the project needs no image files.

   PD.createTextures(THREE, maxAnisotropy) returns:
     desk()        tiled metal desk surface
     card(item)    one section card (big title plus bullet lines)
     sheet(seed)   a loose sheet of paper
     pass()        the name pass lying on the desk
   ========================================================= */

(function (PD) {
  'use strict';

  PD.createTextures = function (THREE, maxAniso) {
    var N = PD.CONTENT.length;

    // Turn a canvas into a Three.js texture with correct colour handling.
    function tex(canvas, sharp) {
      var t = new THREE.CanvasTexture(canvas);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = sharp ? maxAniso : 4;
      return t;
    }

    // Split text into lines that fit a pixel width.
    function wrapText(ctx, text, maxW) {
      var words = text.split(' '), lines = [], line = '';
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
      });
      if (line) lines.push(line);
      return lines;
    }

    /* ---------- Desk: one 512px tile, repeated across the floor ---------- */
    function desk() {
      var c = document.createElement('canvas'); c.width = c.height = 512;
      var x = c.getContext('2d');
      var r = PD.rng(7);

      x.fillStyle = '#d3d6d8'; x.fillRect(0, 0, 512, 512);

      var g = x.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,.06)');
      x.fillStyle = g; x.fillRect(0, 0, 512, 512);

      for (var i = 0; i < 1400; i++) {            // fine grain
        x.fillStyle = 'rgba(' + (r() > 0.5 ? '255,255,255' : '60,66,72') + ',' + (0.03 + r() * 0.04) + ')';
        x.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2);
      }

      x.strokeStyle = '#b3b8bc'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 509, 509);   // panel seam

      x.strokeStyle = 'rgba(110,116,122,.7)'; x.lineWidth = 2;                         // corner crosses
      [[0, 0], [512, 0], [0, 512], [512, 512]].forEach(function (p) {
        x.beginPath();
        x.moveTo(p[0] - 12, p[1]); x.lineTo(p[0] + 12, p[1]);
        x.moveTo(p[0], p[1] - 12); x.lineTo(p[0], p[1] + 12);
        x.stroke();
      });

      [[44, 44], [468, 44], [44, 468], [468, 468]].forEach(function (p) {              // bolts
        x.beginPath(); x.arc(p[0], p[1], 6, 0, 7); x.fillStyle = '#c3c7ca'; x.fill(); x.stroke();
      });

      var t = tex(c, true);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(20, 20);
      return t;
    }

    /* ---------- Section card: yellow header, huge title, bullet list ---------- */
    function card(item) {
      var W = 1680, H = 1050;
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');

      x.fillStyle = '#eef0f0'; x.fillRect(0, 0, W, H);

      // Header band
      x.fillStyle = '#f2dd3c'; x.fillRect(0, 0, W, 150);
      x.fillStyle = '#14171a'; x.textBaseline = 'middle';
      x.font = '500 36px "IBM Plex Mono",monospace'; x.textAlign = 'left';
      x.fillText(item.n + ' / 0' + N + '   SECTION', 64, 76);
      x.textAlign = 'right';
      x.fillText(PD.NAME.toUpperCase() + '  PORTFOLIO', W - 64, 76);

      // Title and kicker
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      x.font = '700 250px "Barlow Condensed","Arial Narrow",sans-serif';
      x.fillText(item.title.toUpperCase(), 60, 410);
      x.fillStyle = '#4b5258'; x.font = '500 42px "Barlow",sans-serif';
      x.fillText(item.kicker, 68, 484);
      x.fillStyle = '#14171a'; x.fillRect(64, 524, W - 128, 5);

      // Bullet lines (wrap if too long)
      x.font = '500 52px "Barlow",sans-serif';
      var y = 626;
      item.lines.forEach(function (line) {
        x.fillStyle = '#f2dd3c'; x.fillRect(68, y - 34, 26, 26);
        x.strokeStyle = '#14171a'; x.lineWidth = 3; x.strokeRect(68, y - 34, 26, 26);
        x.fillStyle = '#14171a';
        wrapText(x, line, W - 120 - 70).forEach(function (l, k) {
          x.fillText(l, 124, y + k * 62);
          y += k ? 62 : 0;
        });
        y += 104;
      });

      // Decorative barcode, footer label, corner crop marks
      var r = PD.rng(item.n.charCodeAt(1) * 31);
      x.fillStyle = '#14171a';
      var bx = 64;
      while (bx < 520) {
        var bw = 3 + Math.floor(r() * 9);
        x.fillRect(bx, 930, bw, 70);
        bx += bw + 3 + Math.floor(r() * 7);
      }
      x.fillStyle = '#4b5258'; x.font = '500 28px "IBM Plex Mono",monospace'; x.textAlign = 'right';
      x.fillText('SAMPLE CONTENT', W - 64, 990);

      x.strokeStyle = '#14171a'; x.lineWidth = 4;
      [[40, 190, 1, 1], [W - 40, 190, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]].forEach(function (p) {
        x.beginPath(); x.moveTo(p[0], p[1] + p[3] * 36); x.lineTo(p[0], p[1]); x.lineTo(p[0] + p[2] * 36, p[1]); x.stroke();
      });

      return tex(c, true);
    }

    /* ---------- Loose paper sheet ---------- */
    function sheet(seed) {
      var c = document.createElement('canvas'); c.width = 512; c.height = 640;
      var x = c.getContext('2d'), r = PD.rng(seed);
      x.fillStyle = '#f3f4f4'; x.fillRect(0, 0, 512, 640);
      x.fillStyle = '#14171a'; x.fillRect(36, 40, 150, 14);
      x.fillStyle = '#b8bcc0';
      for (var i = 0; i < 18; i++) x.fillRect(36, 100 + i * 28, 150 + r() * 290, 6);
      x.strokeStyle = '#9aa0a5'; x.lineWidth = 2; x.strokeRect(300, 36, 176, 40);
      return tex(c, false);
    }

    /* ---------- Name pass ---------- */
    function pass() {
      var c = document.createElement('canvas'); c.width = 720; c.height = 450;
      var x = c.getContext('2d');
      x.fillStyle = '#f4f5f5'; x.fillRect(0, 0, 720, 450);
      x.fillStyle = '#14171a'; x.fillRect(0, 0, 720, 70);
      x.fillStyle = '#f2dd3c'; x.font = '500 28px "IBM Plex Mono",monospace'; x.textBaseline = 'middle';
      x.fillText('// PORTFOLIO PASS', 28, 36);
      x.fillStyle = '#14171a'; x.font = '700 92px "Barlow Condensed",sans-serif'; x.textBaseline = 'alphabetic';
      x.fillText(PD.NAME.toUpperCase(), 28, 220);
      x.fillStyle = '#4b5258'; x.font = '500 32px "Barlow",sans-serif';
      x.fillText('Designer and developer', 30, 272);
      var r = PD.rng(3); x.fillStyle = '#14171a'; var bx = 30;
      while (bx < 380) { var bw = 3 + Math.floor(r() * 8); x.fillRect(bx, 330, bw, 70); bx += bw + 3 + Math.floor(r() * 6); }
      x.fillStyle = '#f2dd3c'; x.fillRect(560, 300, 130, 100);
      return tex(c, true);
    }

    return { desk: desk, card: card, sheet: sheet, pass: pass };
  };
})(window.PD);
