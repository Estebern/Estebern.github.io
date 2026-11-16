/* =========================================================
   nav.js: which screen you are on, and how you move between them.

   PD.state.mode is one of:
     'overview'  first screen: stacked emblem
     'detail'    second screen: opened star with five tags
     'station'   one section card, with PD.state.active = 0..4

   The camera rig is attached later by main.js (PD.nav.rig).
   ========================================================= */

(function (PD) {
  'use strict';

  var st = PD.state = {
    mode: 'overview',
    active: 0,
    hoverIdx: -1,        // blade or tag under the pointer (detail screen)
    hoverEmblem: false   // pointer over the emblem (overview screen)
  };

  var N = PD.CONTENT.length;

  function ready() { return !!PD.nav.rig; }

  PD.nav = {
    rig: null,

    // overview -> detail
    goDetail: function () {
      if (!ready()) return;
      st.mode = 'detail';
      PD.ui.sync();
      PD.nav.rig.fly(PD.nav.rig.pose('detail'), 1.6, 0);
    },

    // anywhere -> section i
    goStation: function (i) {
      if (!ready()) return;
      var from = st.mode;
      st.active = i;
      st.mode = 'station';
      PD.ui.sync();
      PD.nav.rig.fly(PD.nav.rig.pose('station', i), 1.8, from === 'station' ? 5 : 3);
    },

    // anywhere -> overview
    goOverview: function () {
      if (!ready()) return;
      st.mode = 'overview';
      PD.ui.sync();
      PD.nav.rig.fly(PD.nav.rig.pose('overview'), 1.6, 0);
    },

    // one step back: section -> detail -> overview
    back: function () {
      if (!ready()) return;
      if (st.mode === 'station') {
        st.mode = 'detail';
        PD.ui.sync();
        PD.nav.rig.fly(PD.nav.rig.pose('detail'), 1.6, 2);
      } else if (st.mode === 'detail') {
        PD.nav.goOverview();
      }
    },

    next: function () { PD.nav.goStation((st.active + 1) % N); },
    prev: function () { PD.nav.goStation((st.active + N - 1) % N); }
  };
})(window.PD);
