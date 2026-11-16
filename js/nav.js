/* =========================================================
   nav.js: which screen you are on, and how you move between them.

   PD.state.mode is one of:
     'overview'  first screen: stacked emblem
     'detail'    second screen: opened star with five tags
     'station'   one section card, with PD.state.active = 0..4

   Flight lengths come from config.js (flight).
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
  var flight = PD.config.flight;

  function ready() { return !!PD.nav.rig; }

  // Fly the camera to a named pose using a named flight from config.js.
  function flyTo(poseKind, flightName, stationIndex) {
    var rig = PD.nav.rig;
    var f = flight[flightName];
    rig.fly(rig.pose(poseKind, stationIndex), f.seconds, f.arc);
  }

  PD.nav = {
    rig: null,

    // overview -> detail
    goDetail: function () {
      if (!ready()) return;
      st.mode = 'detail';
      PD.ui.sync();
      flyTo('detail', 'toDetail');
    },

    // anywhere -> section i
    goStation: function (i) {
      if (!ready()) return;
      var from = st.mode;
      st.active = i;
      st.mode = 'station';
      PD.ui.sync();
      flyTo('station', from === 'station' ? 'betweenStations' : 'toStation', i);
    },

    // anywhere -> overview
    goOverview: function () {
      if (!ready()) return;
      st.mode = 'overview';
      PD.ui.sync();
      flyTo('overview', 'toOverview');
    },

    // one step back: section -> detail -> overview
    back: function () {
      if (!ready()) return;
      if (st.mode === 'station') {
        st.mode = 'detail';
        PD.ui.sync();
        flyTo('detail', 'stationToDetail');
      } else if (st.mode === 'detail') {
        PD.nav.goOverview();
      }
    },

    next: function () { PD.nav.goStation((st.active + 1) % N); },
    prev: function () { PD.nav.goStation((st.active + N - 1) % N); }
  };
})(window.PD);
