/* =========================================================
   textures.js: every image in the scene is drawn here with the
   2D canvas, so the project needs no image files.

   PD.createTextures(THREE, maxAnisotropy) returns:
     desk()        tiled metal desk surface
     card(item)    one section card (big title plus bullet lines)
     sheet(seed)   a loose sheet of paper
     pass()        the name pass lying on the desk

   To restyle a card, change COLORS or CARD below. No drawing code to touch.
   ========================================================= */

   (function (PD) {
    'use strict';
  
    /* ---------- Look: colours and card measurements (pixels) ---------- */
    var COLORS = {
      paper:  '#eef0f0',
      ink:    '#14171a',
      ink2:   '#4b5258',
      signal: '#f2dd3c'
    };
  
    var FONTS = {
      display: '"Barlow Condensed","Arial Narrow",sans-serif',
      body:    '"Barlow",sans-serif',
      mono:    '"IBM Plex Mono",monospace'
    };
  
    var CARD = {
      w: 1680, h: 1050,
      margin: 64,
      headerH: 150,                    // yellow band at the top
      titleSize: 250, titleY: 410,
      kickerSize: 42, kickerY: 484,
      ruleY: 524, ruleH: 5,
      bulletSize: 52, bulletFirstY: 626, bulletGap: 104, wrapLineH: 62,
      textX: 124,                      // where bullet text starts
      barcode: { y: 930, h: 70, maxX: 520 },
      cropLen: 36, cropTop: 190
    };
  
    PD.createTextures = function (THREE, maxAniso) {
      var N = PD.CONTENT.length;
  
      /* ---------- Helpers ---------- */
  
      // Make a canvas and its 2D context in one go.
      function canvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        return { c: c, x: c.getContext('2d') };
      }
  
      // Turn a canvas into a Three.js texture with correct colour handling.
      function tex(c, sharp) {
        var t = new THREE.CanvasTexture(c);
        t.encoding = THREE.sRGBEncoding;
        t.anisotropy = sharp ? maxAniso : 4;
        return t;
      }
  
      // Set font from parts: font(x, 700, 250, FONTS.display)
      function font(x, weight, size, family) { x.font = weight + ' ' + size + 'px ' + family; }
  
      // Split text into lines that fit a pixel width.
      function wrapText(x, text, maxW) {
        var words = text.split(' '), lines = [], line = '';
        words.forEach(function (w) {
          var t = line ? line + ' ' + w : w;
          if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else { line = t; }
        });
        if (line) lines.push(line);
        return lines;
      }
  
      // Row of random-width bars, like a barcode. wVar / gapVar set how much widths vary.
      function barcode(x, rand, x0, x1, y, h, wVar, gapVar) {
        var bx = x0;
        while (bx < x1) {
          var bw = 3 + Math.floor(rand() * wVar);
          x.fillRect(bx, y, bw, h);
          bx += bw + 3 + Math.floor(rand() * gapVar);
        }
      }
  
      /* ---------- Desk: one 512px tile, repeated across the floor ---------- */
      function desk() {
        var S = 512, cv = canvas(S, S), x = cv.x, r = PD.rng(7);
  
        x.fillStyle = '#d3d6d8'; x.fillRect(0, 0, S, S);
  
        var g = x.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,.06)');
        x.fillStyle = g; x.fillRect(0, 0, S, S);
  
        for (var i = 0; i < 1400; i++) {            // fine grain
          x.fillStyle = 'rgba(' + (r() > 0.5 ? '255,255,255' : '60,66,72') + ',' + (0.03 + r() * 0.04) + ')';
          x.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 2);
        }
  
        x.strokeStyle = '#b3b8bc'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, S - 3, S - 3);   // panel seam
  
        x.strokeStyle = 'rgba(110,116,122,.7)'; x.lineWidth = 2;                             // corner crosses
        [[0, 0], [S, 0], [0, S], [S, S]].forEach(function (p) {
          x.beginPath();
          x.moveTo(p[0] - 12, p[1]); x.lineTo(p[0] + 12, p[1]);
          x.moveTo(p[0], p[1] - 12); x.lineTo(p[0], p[1] + 12);
          x.stroke();
        });
  
        [[44, 44], [S - 44, 44], [44, S - 44], [S - 44, S - 44]].forEach(function (p) {      // bolts
          x.beginPath(); x.arc(p[0], p[1], 6, 0, 7); x.fillStyle = '#c3c7ca'; x.fill(); x.stroke();
        });
  
        var t = tex(cv.c, true);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(20, 20);
        return t;
      }
  
      /* ---------- Section card: yellow header, huge title, bullet list ---------- */
      function card(item) {
        var L = CARD, W = L.w, H = L.h, M = L.margin;
        var cv = canvas(W, H), x = cv.x;
  
        x.fillStyle = COLORS.paper; x.fillRect(0, 0, W, H);
  
        // Header band: section number on the left, name on the right
        x.fillStyle = COLORS.signal; x.fillRect(0, 0, W, L.headerH);
        x.fillStyle = COLORS.ink; x.textBaseline = 'middle';
        font(x, 500, 36, FONTS.mono);
        x.textAlign = 'left';  x.fillText(item.n + ' / 0' + N + '   SECTION', M, 76);
        x.textAlign = 'right'; x.fillText(PD.NAME.toUpperCase() + '  PORTFOLIO', W - M, 76);
  
        // Title, kicker and the rule under them
        x.textAlign = 'left'; x.textBaseline = 'alphabetic';
        font(x, 700, L.titleSize, FONTS.display);
        x.fillText(item.title.toUpperCase(), M - 4, L.titleY);
        x.fillStyle = COLORS.ink2; font(x, 500, L.kickerSize, FONTS.body);
        x.fillText(item.kicker, M + 4, L.kickerY);
        x.fillStyle = COLORS.ink; x.fillRect(M, L.ruleY, W - M * 2, L.ruleH);
  
        // Bullet lines: a yellow square, then the text (wrapped if too long)
        font(x, 500, L.bulletSize, FONTS.body);
        var y = L.bulletFirstY;
        item.lines.forEach(function (line) {
          x.fillStyle = COLORS.signal; x.fillRect(68, y - 34, 26, 26);
          x.strokeStyle = COLORS.ink; x.lineWidth = 3; x.strokeRect(68, y - 34, 26, 26);
          x.fillStyle = COLORS.ink;
          wrapText(x, line, W - L.textX - 70).forEach(function (part, k) {
            x.fillText(part, L.textX, y + k * L.wrapLineH);
            if (k) y += L.wrapLineH;
          });
          y += L.bulletGap;
        });
  
        // Decorative barcode and footer label
        x.fillStyle = COLORS.ink;
        barcode(x, PD.rng(item.n.charCodeAt(1) * 31), M, L.barcode.maxX, L.barcode.y, L.barcode.h, 9, 7);
        x.fillStyle = COLORS.ink2; font(x, 500, 28, FONTS.mono); x.textAlign = 'right';
        x.fillText('SAMPLE CONTENT', W - M, 990);
  
        // Corner crop marks: [corner x, corner y, direction x, direction y]
        x.strokeStyle = COLORS.ink; x.lineWidth = 4;
        [[40, L.cropTop, 1, 1], [W - 40, L.cropTop, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]]
          .forEach(function (p) {
            x.beginPath();
            x.moveTo(p[0], p[1] + p[3] * L.cropLen); x.lineTo(p[0], p[1]); x.lineTo(p[0] + p[2] * L.cropLen, p[1]);
            x.stroke();
          });
  
        return tex(cv.c, true);
      }
  
      /* ---------- Loose paper sheet ---------- */
      function sheet(seed) {
        var cv = canvas(512, 640), x = cv.x, r = PD.rng(seed);
        x.fillStyle = '#f3f4f4'; x.fillRect(0, 0, 512, 640);
        x.fillStyle = COLORS.ink; x.fillRect(36, 40, 150, 14);                       // heading bar
        x.fillStyle = '#b8bcc0';
        for (var i = 0; i < 18; i++) x.fillRect(36, 100 + i * 28, 150 + r() * 290, 6);   // text lines
        x.strokeStyle = '#9aa0a5'; x.lineWidth = 2; x.strokeRect(300, 36, 176, 40);      // stamp box
        return tex(cv.c, false);
      }
  
      /* ---------- Name pass ---------- */
      function pass() {
        var cv = canvas(720, 450), x = cv.x;
        x.fillStyle = '#f4f5f5'; x.fillRect(0, 0, 720, 450);
  
        x.fillStyle = COLORS.ink; x.fillRect(0, 0, 720, 70);                         // top band
        x.fillStyle = COLORS.signal; font(x, 500, 28, FONTS.mono); x.textBaseline = 'middle';
        x.fillText('// PORTFOLIO PASS', 28, 36);
  
        x.textBaseline = 'alphabetic';
        x.fillStyle = COLORS.ink; font(x, 700, 92, FONTS.display);
        x.fillText(PD.NAME.toUpperCase(), 28, 220);
        x.fillStyle = COLORS.ink2; font(x, 500, 32, FONTS.body);
        x.fillText('Designer and developer', 30, 272);
  
        x.fillStyle = COLORS.ink;
        barcode(x, PD.rng(3), 30, 380, 330, 70, 8, 6);
        x.fillStyle = COLORS.signal; x.fillRect(560, 300, 130, 100);                 // yellow chip
        return tex(cv.c, true);
      }
  
      return { desk: desk, card: card, sheet: sheet, pass: pass };
    };
  })(window.PD);