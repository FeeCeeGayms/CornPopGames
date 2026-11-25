# CornQuake — v0.35

CornPop vs the Qoqs: a Quake-style shooter in three episodes (Crypt of Hornt, The Rotten Apple, The Pidser Cave).
Until v0.33 the game was called "CornPop in the Pidser Cave".

- `game/` the game: plain ES modules + three.js r169, no build step. `index.html` is the start page; serve the folder from
  any static host (GitHub Pages, itch.io, `python -m http.server`).
- `android/` the Android app: a full-screen WebView around `game/` (see below).
- `test/` headless test and screenshot tools.
- `tools/sfx/` the sound-effect generator (Python: numpy, scipy; ffmpeg to encode).

## v0.35: every remaining sound effect replaced

Until now only four sounds were recordings (shotgun, soaker hose, candy corn gun, the turd launcher's fart). Everything else was a
few oscillators and filtered noise made on the spot in `audio.js`. All of those are replaced: 101 sounds in 134 takes, 160 seconds
of audio.

- **How they are made.** `tools/sfx/make_sfx.py` designs each sound in layers and renders it offline (48 kHz), with the kit in
  `tools/sfx/dsp.py`: a throat (pulse train through moving vowel formants, growl, breath) for the creatures and CornPop; struck-object
  partials for metal, bells, cans and pickups; crack + body + sub + debris for explosions; swept noise for swings and teleports; a
  brass voice for Trop's trumpet; made-up rooms (tight, room, hall, cave, street) for the echo. Sounds that repeat a lot have two or
  three takes (`pain`, `pain#2`, `pain#3`) and a little random pitch, so the same one never plays twice running.
- **What changed.** Doors, lifts, buttons, locks, breaking crates; keys, pizza, health, ammo, weapon pickups; jump, land, pain, death;
  every enemy's sight, pain and death voice (Qoq, Marv, Boojo, Ballinki, Frenta, Beans, Trop, BCM, rats, chickens); all the newer
  weapons (pizza cutter, cola launcher, sauce stream, rail, jelly, fondue, meatball rockets) and their explosions; splashes, squelches,
  sizzles; thunder (near and far); and the loops: fire, wind, machinery, electrical hum, steam, rain, the level drone, the candy
  corn gun's barrel motor. Ballinki's fart now uses the recorded fart, lower and longer.
- **Levels.** Every sound is levelled by the loudest 50 ms of its mid range (150 Hz to 9 kHz) against the recorded shotgun, then placed
  with its own gain. Sub-heavy sounds (thuds, boss steps, thunder) keep enough mid range to be heard on a phone speaker. A limiter
  sits on the effects bus so a crowd of full-level samples cannot clip.
- **In the game.** `assets/sfx/sfxpack.webm.bin` (Opus, 1.2 MB) or `sfxpack.mp4.bin` (AAC, 2.0 MB, for browsers without Opus) is
  fetched on the first tap or key and decoded in about half a second. Layout: `[uint32 header length][JSON {name: [offset, length,
  gain, pitch jitter, loop seconds?], "#lead": s}][one small audio file per sound]`. Loop files carry half a second of their next
  lap, so the loop points sit inside the file whatever padding a decoder adds. The old synth is still in `audio.js`: it plays until
  the pack has loaded, and if the pack cannot be decoded.
- **Rebuild the sounds:** `python3 tools/sfx/make_sfx.py` (writes both packs into `game/assets/sfx/`). `python3 tools/sfx/spec_sheet.py
  <dir>` draws spectrograms of every sound.
- **Checked:** every pack entry decodes in both formats (ffmpeg) and in Chromium (WebM); none is silent or clipped; loop seams are
  continuous; with the pack loaded no sound name reaches the synth (`test/sfx.mjs`). **Not checked:** how they sound. They were
  designed and measured, not listened to; and the AAC pack was decoded with ffmpeg only, not in Safari.

## v0.34: CornQuake, the live title screen, a new Android app

- **Name**: the game is CornQuake everywhere (page title, web manifest, wordmark, Android label). Episode 3 keeps its name,
  The Pidser Cave. Saved options and progress keep their old storage keys, so nothing is lost in the browser.
- **Title screen** (`js/titlescene.js`): a live scene on the game canvas behind the menu. CornPop stands on cracked, glowing
  ground with the sausage shotgun raised in his right hand (his arm is put on the gun every frame with a two-bone solve over
  his idle animation), a wall of fire behind him, embers on the wind, the crypt's spires with a flame in each tip, an
  eclipsed sun, falling rocks and the odd flash in a boiling sky. He grins now and then. The camera drifts. On a wide screen
  he stands on the left and the menu sits on the right; upright, the wordmark is on top and the menu at the bottom.
  The wordmark is SVG text stretched to a fixed width, so it fits whatever font the device has.
- **Android** (`android/`): a new app, `com.cornquake.game`, label CornQuake, version 0.35.0 (code 35) as of v0.35, minSdk 24, target 34.
  - `MainActivity` serves `assets/www` to the WebView from a private https origin (`https://appassets.androidplatform.net/`)
    through `shouldInterceptRequest`, with byte ranges for the music. ES modules do not load from `file://`.
  - Landscape, immersive full screen, screen kept on, Back = Escape (twice to quit), the game pauses when the app is left.
  - Build: `apt install aapt zipalign apksigner dalvik-exchange android-sdk-platform-23`, then
    `VC=34 VN=0.34.0 android/build_apk.sh out.apk`. No Gradle or Android Studio needed.
  - **Signing key: `android/signing/cornquake.jks` (store and key password `cornquake`, alias `cornquake`). Keep it.**
    An update only installs over the old version when it is signed with the same key.
  - It is a different app from the old "CornPop: Pidser Cave" APK (new package name, new key): it installs next to it and
    does not carry that app's saved progress over.
  - The packer (aapt) unpacks `.gz` assets and drops the ending, so the models sit in the APK as plain `.glb`; the game and
    the activity both handle that.

## v0.33: PBR surfaces, rebuilt weapons, Gothic crypt, New York subways, the Hornt Crimes Unit

**PBR surfaces** (`js/pbr.js`, world shader in `js/game.js`)
- Every world texture gets an HD material set when a map loads: the 64-pixel original is cleaned of its speckle, enlarged
  4x (Scale2x with a colour tolerance, so stair-stepped diagonals come out as clean slopes), and given a micro surface that
  suits the material (grit, brushed streaks, wood grain, weave). Masonry, tiles, planks and plates are rebuilt block by
  block at full resolution: the courses and joints are read off the original, then each block gets its own colour, bevelled
  and chipped edges and a recessed joint.
- Each set has a normal map, a roughness map and a cavity map (packed in one texture: RG normal, B roughness, A cavity).
- The world shader lights them with the six lamps nearest the camera (faded in and out so none pop): bump-mapped diffuse on
  top of the baked lightmaps, GGX highlights, a sky/room reflection for metals, and a shared detail map that breaks up tiling.
  Glossy floors and wet streets feed the existing screen-space reflection. Gun fire throws real light on the room (`game.flashLight`).
- Material kinds (roughness, metalness, relief) are picked from the texture's name: see `KINDS` in `js/pbr.js`.
- Options: "PBR materials" On/Off. The Retro preset never uses it. Medium enlarges 2x instead of 4x.

**Weapons** (`js/guns.js`)
- Piss super soaker, sausage shotgun, cola can launcher, candy corn minigun, turd launcher and pizza cutter are new models:
  lathed barrels and tanks, extruded side profiles with rounded edges, bent tube, and PBR materials with generated maps
  (brushed and blued steel, chrome, brass, walnut, clear-coated toy plastic, knurled rubber). Labels and gauges are drawn textures.
- The sauce gun, spaghetti railgun, jelly blaster and fondue gun keep their shapes but get rounded edges, round cylinders
  and the same materials (`refine()`).
- Every maker returns the same `userData` the weapon classes animate, so the weapon code is unchanged.

**Episode 1, Crypt of Hornt** (`js/ruins.js`, `js/hdtex.js`, sky shader)
- New set pieces: the great spire (plinth, twin domed chapels at its foot, ribbed shaft with glowing lancets, flared crown,
  domed head with a fire in the tip), pinnacles of the same family, Gothic gateways with pointed arches and a rose,
  blind arcades along the long walls, lancet and rose windows burning from inside, pointed ribs under the hall beams,
  iron candle wheels. The horizon grows the same spires.
- Weather: meteors (`sky.meteors`), heat shimmer (`haze`), coloured lightning on more maps, embers mixed into the rain.

**Episode 2, The Rotten Apple** (`js/subway.js`, `js/rats.js`, `js/nyc.js`)
- `autoSubway` digs a station under a building at the end of a map's build: doorway under green globes, a staircase down
  the side of the hall, platform with columns, benches, mosaics, ads and a dying tube, track pit with a parked train, third
  rail and tunnel mouths. It only changes cells inside the building. Stations: E2M2, E2M3, E2M4, E2M6, E2M8
  (E2M1 already ends in one; E2M5 and E2M7 have no building big enough).
- Rats: a procedural model with its own small AI (`Rat` in `js/rats.js`). They are vermin: the kill count ignores them.
- Buildings get a bracketed cornice, a stone water table and a drainpipe on every side that faces the street.

**Episode 3, The Pidser Cave** (`js/ruins.js` bunker mode, `js/hdtex.js`)
- Sausage-link columns, brick pizza ovens, strings of sausages under the beams, great pizzas hung on the walls.
- The Hornt Crimes Unit: department seal inlaid in the floors, detective desks with monitor banks, the case board with red
  string, wanted posters, lockers, camera walls, the unit's sign.

## Tests (`test/`, need Playwright + Chromium; serve `game/` on a port first)
- `err.mjs <port> <from> <to>` loads maps and reports page and shader errors.
- `blockcheck.mjs <port> <from> <to>` checks that no decoration cuts a walkable area in two (8-unit lattice, doors open).
- `subwalk.mjs <port> <from> <to>` walks in from the street, down the station stairs, back up and out.
- `smoke.mjs <port> <level>` stands in the station, fires every weapon and lets the rats come.
- `title.mjs <port> <out.png> [w h]` screenshots the title screen; `quit.mjs` plays New Game, quits and checks the title comes back.
- `sfx.mjs <port> [level]` loads the sound pack in the game and checks every sound decodes, is not silent, and that no sound
  name falls through to the synth; `sfxtime.mjs <port>` times the pack load in an idle page.
- `tour.mjs`, `pieces.mjs`, `views.mjs`, `guns.mjs`, `gunview.mjs`, `texsheet.mjs` take screenshots.

Not in this build: the single-file HTML (its build script was not in the web repository this version was rebuilt from).
