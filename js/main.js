/* =========================================================
   main.js: starts everything and runs the render loop.

   Order of events:
     1. wait for the web fonts (the card textures need them)
     2. create renderer, scene, camera
     3. build textures, world, camera rig
     4. wire up pointer picking (hover and click on 3D objects)
     5. run the loop: animate blades, move camera, place HTML tags, draw
   ========================================================= */

(function (PD) {
  'use strict';

  var st = PD.state;
  var N = PD.CONTENT.length;

  /* ---------- 1. Wait for fonts, then start ---------- */
  var fontsReady = Promise.race([
    Promise.all([
      document.fonts.load('700 120px "Barlow Condensed"'),
      document.fonts.load('500 40px "Barlow"'),
      document.fonts.load('500 28px "IBM Plex Mono"')
    ]),
    new Promise(function (resolve) { setTimeout(resolve, 2500); })   // do not wait forever
  ]).catch(function () {});

  fontsReady.then(init);

  function init() {
    var THREE = window.THREE;
    if (!THREE) { PD.ui.showError('Could not load the 3D library'); return; }

    var stage = document.getElementById('stage');
    var canvas = document.getElementById('gl');

    /* ---------- 2. Renderer, scene, camera ---------- */
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    } catch (err) {
      PD.ui.showError('WebGL is not available in this browser');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var bg = PD.config.palette.background;                 // matches --bg in styles.css
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    scene.fog = new THREE.Fog(bg, 45, 100);
    var camera = new THREE.PerspectiveCamera(PD.config.camera.fov, 1, 0.1, 200);

    /* ---------- 3. Textures, world, camera rig ---------- */
    var textures = PD.createTextures(THREE, renderer.capabilities.getMaxAnisotropy());
    var world = PD.buildWorld(THREE, scene, textures);
    var rig = PD.createCameraRig(THREE, camera, world);

    var W = 1, H = 1;
    function resize() {
      W = stage.clientWidth || 1;
      H = stage.clientHeight || 1;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      if (!rig.isFlying()) rig.snapTo(rig.poseForState(st));   // re-fit the current view
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);

    // Opening shot: start higher and further back, then glide into the overview.
    var intro = PD.config.camera.intro;
    var startPose = rig.pose('overview');
    startPose.pos.add(new THREE.Vector3(intro.from[0], intro.from[1], intro.from[2]));
    rig.snapTo(startPose);
    PD.nav.rig = rig;
    rig.fly(rig.pose('overview'), intro.seconds, 0);
    PD.ui.hideLoading();

    /* ---------- 4. Picking ---------- */
    var ray = new THREE.Raycaster();
    var ndc = new THREE.Vector2();

    // Returns the blade index under the pointer, 0 for the emblem proxy on the overview, or -1.
    function pick(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);

      var hits = ray.intersectObjects(world.bladeMeshes, false);
      if (hits.length) return hits[0].object.userData.i;
      if (st.mode === 'overview' && ray.intersectObject(world.proxy, false).length) return 0;
      return -1;
    }

    var mouseX = 0, mouseY = 0;   // -1..1, feeds the camera parallax

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseY = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (e.pointerType === 'touch' || rig.isFlying()) return;

      var hit = pick(e.clientX, e.clientY);
      if (st.mode === 'overview') {
        st.hoverEmblem = hit >= 0; st.hoverIdx = -1;
        canvas.style.cursor = st.hoverEmblem ? 'pointer' : 'default';
      } else if (st.mode === 'detail') {
        st.hoverIdx = hit; st.hoverEmblem = false;
        canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      } else {
        st.hoverIdx = -1; st.hoverEmblem = false;
        canvas.style.cursor = 'default';
      }
    });

    canvas.addEventListener('pointerleave', function () {
      st.hoverIdx = -1; st.hoverEmblem = false;
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('click', function (e) {
      if (rig.isFlying()) return;                 // ignore clicks mid-flight
      var hit = pick(e.clientX, e.clientY);
      if (st.mode === 'overview' && hit >= 0) PD.nav.goDetail();
      else if (st.mode === 'detail' && hit >= 0) PD.nav.goStation(hit);
    });

    /* ---------- 5. Render loop ---------- */
    var spread = 0;                                 // 0 = stacked, 1 = opened star
    var last = performance.now(), time = 0;
    var point = new THREE.Vector3(), ndcPoint = new THREE.Vector3();

    // Project a 3D point to pixel coordinates inside the stage.
    function toScreen(p) {
      ndcPoint.copy(p).project(camera);
      return [(ndcPoint.x * 0.5 + 0.5) * W, (-ndcPoint.y * 0.5 + 0.5) * H];
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now; time += dt;

      // Open or close the emblem depending on the screen.
      var goal = st.mode === 'overview' ? 0 : 1;
      if (spread !== goal) {
        var step = dt / (PD.RM ? 0.01 : PD.config.emblem.openSeconds);
        spread = goal > spread ? Math.min(goal, spread + step) : Math.max(goal, spread - step);
      }

      world.update({
        spread: spread, time: time, dt: dt, calm: PD.RM ? 0 : 1,
        mode: st.mode, hoverIdx: st.hoverIdx, hoverEmblem: st.hoverEmblem
      });
      rig.update(dt, mouseX, mouseY);
      PD.ui.updateHot();

      // Follow the blades with the HTML tags.
      if (st.mode === 'detail' || PD.ui.tagsVisible()) {
        for (var i = 0; i < N; i++) {
          var s = toScreen(world.tagAnchor(i, point));
          PD.ui.placeTag(i, s[0], s[1]);
        }
      }

      // Keep the "View details" prompt next to the emblem.
      if (st.mode === 'overview') {
        point.set(0, world.emblem.position.y, 0);
        var c = toScreen(point);
        var wide = W > 700;
        PD.ui.placeHint(c[0] + (wide ? 170 : 0), c[1] + (wide ? 30 : Math.min(H * 0.3, 150)));
      }

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})(window.PD);
