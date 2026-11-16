/* =========================================================
   config.js: every number, colour and position you might want to change.

   Nothing in here draws anything. Other files read these values.
   Change a value, save, refresh the page, and see what moves.

   Sections:
     palette    all colours, with names
     fonts      font stacks used on the canvas cards
     desk       floor size and tiling
     lights     sun and sky
     props      the objects lying on the desk (add yours here)
     stations   where the five section cards sit
     emblem     the gold blades and the disc under them
     camera     where the camera stands on each screen
     flight     how long each camera move takes
   ========================================================= */

window.PD = window.PD || {};

PD.config = {

  /* ---------- Colours ---------- */
  palette: {
    background:   '#cfd2d4',   // behind everything; matches --bg in styles.css

    // text and lines
    ink:          '#14171a',
    inkSoft:      '#4b5258',
    signal:       '#f2dd3c',   // the yellow accent

    // desk surface
    deskBase:     '#d3d6d8',
    deskSeam:     '#b3b8bc',
    deskBolt:     '#c3c7ca',
    deskMark:     'rgba(110,116,122,.7)',

    // paper things
    cardPaper:    '#eef0f0',
    sheetPaper:   '#f3f4f4',
    sheetLine:    '#b8bcc0',
    sheetBox:     '#9aa0a5',
    passPaper:    '#f4f5f5',
    passBack:     '#dfe2e4',

    // station slab under each card
    slab:         '#aeb3b7',

    // props
    pawn:         '#1d2023',
    capsule:      '#cdd1d4',
    capsuleWindow:'#1d2023',
    nutGold:      '#d9a21f',
    nutGlow:      '#5a3a00',

    // emblem
    disc:         '#f4f5f5',
    discGlow:     '#8d9094',
    ringGold:     '#e0a21c',
    ringSteel:    '#8c9399',
    hole:         '#2a2d30',
    bladeGold:    '#d6a021',
    bladeGlow:    '#8a5a00',
    bladeEdge:    '#ffe08a',

    // lights
    skyLight:     '#ffffff',
    groundLight:  '#b9bec2',
    sunLight:     '#fff3df',
    emblemLight:  '#ffa83c'
  },

  /* ---------- Fonts for text drawn on the canvas cards ---------- */
  fonts: {
    display: '"Barlow Condensed","Arial Narrow",sans-serif',
    body:    '"Barlow",sans-serif',
    mono:    '"IBM Plex Mono",monospace'
  },

  /* ---------- Desk floor ---------- */
  desk: {
    size: 130,        // width and depth in world units
    tileRepeat: 20    // how many times the 512px tile repeats across the desk
  },

  /* ---------- Lights ---------- */
  lights: {
    sky:  { intensity: 0.85 },
    sun:  { intensity: 0.7, position: [-7, 20, 9], shadowMapSize: 2048, shadowRange: 26 }
  },

  /* ---------- Props on the desk ----------
     Each entry is one object. "type" picks what it is; the other fields place it.
       x, z    position on the desk (0,0 is the emblem; +x right, +z toward you)
       rot     turn in radians
     Types available: sheet, pass, pawn, capsule, nut
     To add another, copy a line and change x and z.
     To invent a new type, add a builder in js/world/props.js. */
  props: [
    // sheet: y gives each sheet a tiny height step so overlapping sheets never flicker. seed changes the lines.
    { type: 'sheet', x: -7.2, z: -3.6, rot:  0.45, y: 0.020, seed: 11 },
    { type: 'sheet', x:  7.6, z: -4.6, rot: -0.50, y: 0.026, seed: 22 },
    { type: 'sheet', x: -8.2, z:  4.6, rot:  0.20, y: 0.032, seed: 33 },
    { type: 'sheet', x:  9.2, z:  2.2, rot:  0.75, y: 0.038, seed: 44 },
    { type: 'sheet', x:  1.8, z: -9.6, rot:  0.12, y: 0.044, seed: 55 },
    { type: 'sheet', x: -1.4, z:  9.2, rot: -0.30, y: 0.050, seed: 66 },

    { type: 'pass',    x:  4.9, z:  3.9, rot: -0.38 },
    { type: 'pawn',    x: -5.6, z:  5.8, scale: 1.00 },
    { type: 'pawn',    x:  8.4, z: -1.4, scale: 0.85 },
    { type: 'pawn',    x: -9.4, z: -0.4, scale: 1.10 },
    { type: 'capsule', x:  1.2, z:  6.4, rot: 0.9 },
    { type: 'nut',     x: -7.6, z: -5.2, rot: 0.3 }
  ],

  /* ---------- Section stations ----------
     angles: where each section sits around the emblem, in degrees,
             counter-clockwise from screen-right, seen from above.
             Order is section 1, 2, 3, 4, 5. */
  stations: {
    angles: [126, 198, 270, 342, 54],
    radius: 16,                       // distance from the emblem
    slabSize: [8.9, 0.14, 5.75],      // width, height, depth of the grey slab
    cardSize: [8.4, 5.25]             // width, depth of the printed card
  },

  /* ---------- Emblem ---------- */
  emblem: {
    // Height of the whole emblem above the desk
    heightStacked: 1.1,               // first screen
    heightOpen:    0.55,              // second screen
    bob:  0.12,                       // gentle up and down on the first screen
    sway: 0.08,                       // gentle turning on the first screen
    openSeconds: 1.25,                // how long the blades take to open or close

    // Under the blades
    disc:  { radius: 2.1, height: 0.1, segments: 48 },
    rings: [ { inner: 2.45, outer: 2.52, color: 'ringGold',  opacity: 1 },
             { inner: 3.10, outer: 3.13, color: 'ringSteel', opacity: 0.8 } ],
    hole:  { radius: 0.55 },

    // One blade, as a flat outline [x, y] seen from above. Blade length runs along x.
    bladeOutline: [[0, -0.55], [5.6, -0.42], [7.2, -0.02], [5.9, 0.5], [0, 0.62], [-0.4, 0]],
    bladeThickness: 0.22,
    bladeBevel: 0.05,
    bladeMaterial: { metalness: 0.45, roughness: 0.28, glowBase: 0.55, glowHover: 0.7 },

    // Opened star (second screen)
    openRadius: 1.3,                  // how far each blade's base sits from the centre
    openYaw: 0.32,                    // extra turn that gives the pinwheel look

    // Stacked pile (first screen), one entry per blade.
    // y = height, yaw = extra turn, roll = tilt along its length, pitch = tip up or down
    stackRadius: 0.25,
    stackScale: 0.6,
    stackedPoses: [
      { y: 0.00, yaw:  0.45, roll:  0.50, pitch:  0.35 },
      { y: 0.35, yaw: -0.30, roll: -0.40, pitch:  0.20 },
      { y: 0.15, yaw:  0.55, roll:  0.35, pitch: -0.10 },
      { y: 0.55, yaw: -0.50, roll: -0.45, pitch:  0.30 },
      { y: 0.30, yaw:  0.20, roll:  0.20, pitch:  0.15 }
    ],

    // Where on a blade its yellow tag is attached (x along the blade)
    tagAnchor: [4.5, 0.15, 0],

    // Click area around the stacked emblem (invisible)
    clickArea: { radius: 4.2, height: 3, y: 1 },

    // Warm light over the emblem
    light: { intensity: 0.9, wobble: 0.25, hoverBoost: 0.5, distance: 16, decay: 2, height: 2.2 }
  },

  /* ---------- Camera ----------
     offset  = how far the camera stands from its target (x, height, depth)
     target  = the point it looks at
     width   = how many world units must fit across the screen (the camera backs up on narrow screens) */
  camera: {
    fov: 38,
    overview: { offset: [0, 10, 5.8], target: [0, 1, 0.3], width: 11.5 },
    detail:   { offset: [0, 21, 9],   target: [0, 0.5, 0], width: 15.5 },
    station:  { back: 5.2, height: 8, lookAhead: 0.3, width: 11 },
    intro:    { from: [0, 7, 8], seconds: 2.4 },     // opening glide: start offset and length
    parallax: { x: 0.45, z: 0.3, smoothing: 3 }      // how far the mouse nudges the camera
  },

  /* ---------- Camera flights: seconds, and arc = how high the camera lifts mid-flight ---------- */
  flight: {
    toDetail:          { seconds: 1.6, arc: 0 },
    toStation:         { seconds: 1.8, arc: 3 },
    betweenStations:   { seconds: 1.8, arc: 5 },
    stationToDetail:   { seconds: 1.6, arc: 2 },
    toOverview:        { seconds: 1.6, arc: 0 }
  }
};
