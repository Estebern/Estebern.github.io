# Potential Desk

A 3D portfolio. A gold emblem sits on a metal desk. Select it and the camera
rises to show five tags. Select a tag and the camera flies across the desk to
that section's card.

## Run it

Open `index.html` in a browser. It needs an internet connection for Three.js
and the web fonts. No build step.

## Where things live

```
index.html              page structure and the script order
css/styles.css          all styling; colours and fonts are tokens at the top

js/
  content.js            YOUR TEXT: name and the five sections
  config.js             EVERY NUMBER AND COLOUR: palette, props list, positions, camera, timings
  utils.js              easing, lerp, seeded random

  textures/             pictures drawn with code, one file each
    desk.js             metal desk tile
    card.js             section card (split into small steps: header, title, bullets, barcode, footer)
    sheet.js            loose paper sheet
    pass.js             name pass
    index.js            gathers the files above

  world/                the 3D scene, one file per part
    lights.js           sun and sky
    desk.js             the floor
    props.js            objects on the desk (the list is in config.js)
    stations.js         the five section cards
    emblem.js           gold blades, disc, glow, hover effect
    index.js            builds all of the above

  camera.js             camera poses, fly-to animation, mouse parallax
  nav.js                which screen you are on, and how you move between them
  ui.js                 HTML tabs, tags, buttons, keyboard
  main.js               renderer, click picking, render loop
```

The scripts are plain files that share one `PD` object, so the page also works
when opened straight from disk. Load order is listed in `index.html`.

## "I want to change..." cheat sheet

| I want to change...                      | Go to                                              |
|------------------------------------------|----------------------------------------------------|
| My name or section text                  | `js/content.js`                                    |
| Any colour in the 3D scene               | `palette` in `js/config.js`                        |
| Colours of the page (tabs, tags)         | `:root` tokens in `css/styles.css`                 |
| Move, remove or duplicate a prop         | `props` list in `js/config.js`                     |
| Where the five cards sit                 | `stations` in `js/config.js`                       |
| Blade shape, size, glow                  | `emblem` in `js/config.js`                         |
| Camera angle or distance                 | `camera` in `js/config.js`                         |
| Speed of camera moves                    | `flight` in `js/config.js`                         |
| Speed of the blades opening              | `emblem.openSeconds` in `js/config.js`             |
| How a section card looks                 | the step functions in `js/textures/card.js`        |
| Sun brightness or direction              | `lights` in `js/config.js`                         |

## How to add things

**A prop** (another paper sheet, pawn, nut...): open `js/config.js`, find `props`,
copy a line of the same type, change `x` and `z`. Done.

**A new kind of prop** (a mug, a plant...):
1. In `js/world/props.js`, add a function to `PD.propBuilders`. Copy the `nut` one and change the shape.
2. In `js/config.js`, add a line to `props` with `type` set to your new name.

**A new texture** (a picture drawn with code):
1. Create `js/textures/mything.js` that sets `PD.drawers.mything = function (kit, arg) { ... return kit.tex(canvas, true); }`. Copy `sheet.js` as a start.
2. Add its `<script>` tag in `index.html`, above `js/textures/index.js`.
3. Use it anywhere in the world code with `textures.mything()`.

**A new part of the 3D world** (a lamp, a second emblem...):
1. Create `js/world/lamp.js` with `PD.buildLamp = function (THREE, scene, textures) { ... }`.
2. Add its `<script>` tag in `index.html`, above `js/world/index.js`.
3. Call `PD.buildLamp(THREE, scene, textures)` inside `js/world/index.js`.

## Controls

- Click the emblem, then a tag or blade
- Tabs at the top jump to any section
- Keys: `1` to `5` jump to a section, arrows move between sections, `Esc` goes back
