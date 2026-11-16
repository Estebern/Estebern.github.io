/* =========================================================
   ui.js: the HTML layer on top of the 3D canvas.

   - builds the tab row (top) and the five yellow tags
   - keeps buttons, counter and prev/next in step with PD.state
   - handles keyboard shortcuts
   - exposes placeTag / placeHint so main.js can move elements
     to the screen position of 3D points
   ========================================================= */

(function (PD) {
  'use strict';

  var st = PD.state;
  var CONTENT = PD.CONTENT;
  var N = CONTENT.length;
  var $ = function (id) { return document.getElementById(id); };

  var tabsEl = $('tabs'), tagsEl = $('tags'), hintEl = $('hint');
  var tabBtns = [], tagBtns = [];

  /* ---------- Build tabs and tags from CONTENT ---------- */
  CONTENT.forEach(function (c, i) {
    var tab = document.createElement('button');
    tab.className = 'tab';
    tab.type = 'button';
    tab.innerHTML = '<b style="font-weight:500">' + c.n + '</b><span>' + c.title + '</span>';
    tab.setAttribute('aria-label', 'Go to ' + c.title);
    tab.addEventListener('click', function () { PD.nav.goStation(i); });
    tabsEl.appendChild(tab);
    tabBtns.push(tab);

    var tag = document.createElement('button');
    tag.className = 'tag';
    tag.type = 'button';
    tag.style.transitionDelay = (i * 70) + 'ms';   // tags fade in one after another
    tag.innerHTML = '<b>' + c.n + '</b><div><i>Section</i><strong>' + c.title + '</strong></div>';
    tag.addEventListener('click', function () { PD.nav.goStation(i); });
    tag.addEventListener('mouseenter', function () { st.hoverIdx = i; });
    tag.addEventListener('mouseleave', function () { st.hoverIdx = -1; });
    tagsEl.appendChild(tag);
    tagBtns.push(tag);
  });

  /* ---------- Static buttons ---------- */
  $('back').addEventListener('click', PD.nav.back);
  hintEl.addEventListener('click', PD.nav.goDetail);
  $('prev').addEventListener('click', PD.nav.prev);
  $('next').addEventListener('click', PD.nav.next);

  /* ---------- Keyboard ---------- */
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      PD.nav.back();
    } else if (e.key >= '1' && e.key <= String(N)) {
      PD.nav.goStation(parseInt(e.key, 10) - 1);
    } else if (st.mode === 'station' && e.key === 'ArrowRight') {
      PD.nav.next();
    } else if (st.mode === 'station' && e.key === 'ArrowLeft') {
      PD.nav.prev();
    } else if (st.mode === 'overview' && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) {
      PD.nav.goDetail();
    }
  });

  /* ---------- Keep the interface in step with the state ---------- */
  function sync() {
    document.body.setAttribute('data-state', st.mode);   // CSS shows or hides parts from this

    tabBtns.forEach(function (b, i) {
      b.setAttribute('aria-current', st.mode === 'station' && i === st.active ? 'true' : 'false');
    });
    tagsEl.classList.toggle('on', st.mode === 'detail');

    if (st.mode === 'station') {
      $('cl').textContent = 'Current section';
      $('cn').textContent = CONTENT[st.active].n;
      $('ct').textContent = '/0' + N;
      $('prev').textContent = '‹  ' + CONTENT[(st.active + N - 1) % N].title;
      $('next').textContent = CONTENT[(st.active + 1) % N].title + '  ›';
    } else {
      $('cl').textContent = 'Sections';
      $('cn').textContent = '0' + N;
      $('ct').textContent = '';
    }
  }

  // Highlight the tag whose blade is under the pointer.
  function updateHot() {
    for (var i = 0; i < N; i++) {
      tagBtns[i].classList.toggle('hot', st.mode === 'detail' && st.hoverIdx === i);
    }
  }

  // Move tag i so its centre sits at screen pixel (x, y).
  function placeTag(i, x, y) {
    tagBtns[i].style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
  }

  // Move the "View details" prompt so its centre sits at (x, y).
  function placeHint(x, y) {
    hintEl.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
  }

  PD.ui = {
    sync: sync,
    updateHot: updateHot,
    placeTag: placeTag,
    placeHint: placeHint,
    tagsVisible: function () { return tagsEl.classList.contains('on'); },
    hideLoading: function () { $('loading').classList.add('done'); },
    showError: function (msg) { $('loading').textContent = msg; }
  };

  sync();
})(window.PD);
