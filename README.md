# Potential Desk

A 3D portfolio. A gold emblem sits on a metal desk. Select it and the camera
rises to show five tags. Select a tag and the camera flies across the desk to
that section's card.

## Run it

Open `index.html` in a browser. It needs an internet connection for Three.js
and the web fonts. No build step.

## Files

```
index.html          page structure and script order
css/
  styles.css        all styling, with colours and fonts as tokens at the top
js/
  content.js        EDIT THIS: your name and the five sections
  utils.js          easing, lerp, seeded random
  textures.js       draws the desk, section cards, paper and pass on canvases
  world.js          builds the 3D scene: lights, desk, props, stations, emblem
  camera.js         camera poses, fly-to animation, mouse parallax
  nav.js            state machine: overview, detail, station
  ui.js             HTML tabs, tags, buttons, keyboard
  main.js           renderer, picking, render loop
```

The scripts are plain files that share one `PD` object, so the page also works
when opened straight from disk. Load order is listed in `index.html`.

## Common changes

| I want to change...             | Edit                                              |
|---------------------------------|---------------------------------------------------|
| My name, section text           | `js/content.js`                                   |
| Colours, fonts, tag look        | `:root` tokens and `.tag` in `css/styles.css`     |
| Card layout or card colours     | `card()` in `js/textures.js`                      |
| Blade shape or colour           | `shape` and `material` in `js/world.js`           |
| Props on the desk               | "Desk and props" in `js/world.js`                 |
| Camera angle or distance        | `pose()` in `js/camera.js`                        |
| Flight length                   | the seconds passed to `fly()` in `js/nav.js`      |

## Controls

- Click the emblem, then a tag or blade
- Tabs at the top jump to any section
- Keys: `1` to `5` jump to a section, arrows move between sections, `Esc` goes back
