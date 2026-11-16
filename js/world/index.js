/* =========================================================
   world/index.js: builds the whole 3D set by calling one builder per part.

     lights.js     sun and sky
     desk.js       the floor
     props.js      objects on the desk (list is in config.js)
     stations.js   the five section cards
     emblem.js     the gold blades

   The result is the one object the rest of the app talks to.
   ========================================================= */

(function (PD) {
  'use strict';

  PD.buildWorld = function (THREE, scene, textures) {
    PD.buildLights(THREE, scene);
    PD.buildDesk(THREE, scene, textures);
    PD.buildProps(THREE, scene, textures);
    var stations = PD.buildStations(THREE, scene, textures);
    var emblem = PD.buildEmblem(THREE, scene);

    return {
      // emblem
      emblem: emblem.group,             // main.js reads emblem.position.y
      bladeMeshes: emblem.bladeMeshes,  // for click picking
      proxy: emblem.clickArea,          // invisible click target on the first screen
      update: emblem.update,            // called every frame
      tagAnchor: emblem.tagAnchor,      // where each yellow tag attaches

      // stations (the camera needs these to know where to fly)
      dirs: stations.dirs,
      stationC: stations.centres
    };
  };
})(window.PD);
