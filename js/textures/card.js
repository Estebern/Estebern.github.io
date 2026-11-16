/* =========================================================
   textures/card.js: one section card (the printed card on the desk).

   Called once per section with that section's data from content.js:
     { n: '01', title: 'About', kicker: '...', lines: ['...', '...'] }

   The card is drawn top to bottom in small steps. Each step is its own
   function, so to change one part of the card you only touch one function.
   All positions are in pixels on a 1680 x 1050 canvas.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.drawers = PD.drawers || {};

  var P = PD.config.palette;
  var F = PD.config.fonts;
  var W = 1680, H = 1050;

  // Layout numbers in one place
  var L = {
    margin: 64,
    headerHeight: 150,
    headerTextY: 76,
    titleX: 60,   titleY: 410,
    kickerX: 68,  kickerY: 484,
    ruleY: 524,   ruleHeight: 5,
    bulletsStartY: 626,
    bulletGap: 104,
    bulletMarkerX: 68, bulletMarkerSize: 26,
    bulletTextX: 124,
    wrapLineHeight: 62,
    barcodeY: 930, barcodeHeight: 70, barcodeEndX: 520,
    footerY: 990
  };

  /* ---------- Step 1: yellow header band with small labels ---------- */
  function drawHeader(x, item, total) {
    x.fillStyle = P.signal;
    x.fillRect(0, 0, W, L.headerHeight);

    x.fillStyle = P.ink;
    x.font = '500 36px ' + F.mono;
    x.textBaseline = 'middle';

    x.textAlign = 'left';
    x.fillText(item.n + ' / 0' + total + '   SECTION', L.margin, L.headerTextY);

    x.textAlign = 'right';
    x.fillText(PD.NAME.toUpperCase() + '  PORTFOLIO', W - L.margin, L.headerTextY);
  }

  /* ---------- Step 2: giant title, small kicker line, thick rule ---------- */
  function drawTitle(x, item) {
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';

    x.fillStyle = P.ink;
    x.font = '700 250px ' + F.display;
    x.fillText(item.title.toUpperCase(), L.titleX, L.titleY);

    x.fillStyle = P.inkSoft;
    x.font = '500 42px ' + F.body;
    x.fillText(item.kicker, L.kickerX, L.kickerY);

    x.fillStyle = P.ink;
    x.fillRect(L.margin, L.ruleY, W - L.margin * 2, L.ruleHeight);
  }

  /* ---------- Step 3: bullet list (long lines wrap onto a second line) ---------- */
  function drawBullets(x, item, kit) {
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.font = '500 52px ' + F.body;

    var y = L.bulletsStartY;
    var maxTextWidth = W - L.bulletTextX - 70;

    item.lines.forEach(function (line) {
      // little yellow square with a dark outline
      x.fillStyle = P.signal;
      x.fillRect(L.bulletMarkerX, y - 34, L.bulletMarkerSize, L.bulletMarkerSize);
      x.strokeStyle = P.ink;
      x.lineWidth = 3;
      x.strokeRect(L.bulletMarkerX, y - 34, L.bulletMarkerSize, L.bulletMarkerSize);

      // the text itself
      x.fillStyle = P.ink;
      kit.wrapText(x, line, maxTextWidth).forEach(function (part, k) {
        x.fillText(part, L.bulletTextX, y + k * L.wrapLineHeight);
        y += k ? L.wrapLineHeight : 0;
      });

      y += L.bulletGap;
    });
  }

  /* ---------- Step 4: decorative barcode (same bars every time for the same card) ---------- */
  function drawBarcode(x, item) {
    var random = PD.rng(item.n.charCodeAt(1) * 31);
    var barX = L.margin;

    x.fillStyle = P.ink;
    while (barX < L.barcodeEndX) {
      var barWidth = 3 + Math.floor(random() * 9);
      x.fillRect(barX, L.barcodeY, barWidth, L.barcodeHeight);
      barX += barWidth + 3 + Math.floor(random() * 7);
    }
  }

  /* ---------- Step 5: bottom-right label and four corner crop marks ---------- */
  function drawFooter(x) {
    x.fillStyle = P.inkSoft;
    x.font = '500 28px ' + F.mono;
    x.textAlign = 'right';
    x.textBaseline = 'alphabetic';
    x.fillText('SAMPLE CONTENT', W - L.margin, L.footerY);

    x.strokeStyle = P.ink;
    x.lineWidth = 4;
    // [corner x, corner y, direction x, direction y]
    [[40, 190, 1, 1], [W - 40, 190, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]].forEach(function (c) {
      x.beginPath();
      x.moveTo(c[0], c[1] + c[3] * 36);
      x.lineTo(c[0], c[1]);
      x.lineTo(c[0] + c[2] * 36, c[1]);
      x.stroke();
    });
  }

  /* ---------- Put the steps together ---------- */
  PD.drawers.card = function (kit, item) {
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var x = canvas.getContext('2d');

    x.fillStyle = P.cardPaper;
    x.fillRect(0, 0, W, H);

    drawHeader(x, item, PD.CONTENT.length);
    drawTitle(x, item);
    drawBullets(x, item, kit);
    drawBarcode(x, item);
    drawFooter(x);

    return kit.tex(canvas, true);
  };
})(window.PD);
