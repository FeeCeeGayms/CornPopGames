# CornKart

A 3D kart racer with five tracks: **Pripyat Run** in the Chernobyl Exclusion Zone,
**Swedish Winter** through a snowy Swedish town and countryside, **San Francisco**
over the city hills and the Golden Gate Bridge, **Transylvania** through haunted
forest and the gate of Bran Castle, and **Sydney Harbour** through the city streets,
the subway and over the Harbour Bridge. Pick **Apu** (the
default), **CornPop**, **Beardy**, **Peepo**, **Honkler** or **Qoq**, choose a vehicle (the **Cozy Coupe**, the
**Hotdog**, the **Semla Kart**, the **Peepo Beetle**, the **Clown Car** or the **Qoq Mobile**), pick a track, and race against five rivals.

The game opens on the **CornKart Fren Racer title screen**. The screen starts black,
the logo zooms in, and a white flash reveals an AI race on a random track behind it.
The camera cuts between chase, trackside, head-on, helicopter, wheel-level and
fly-over shots like an action replay. Press `Enter` or `Space`, or click or tap
anywhere, and the screen fades to black and opens the garage.

The garage has three steps:

1. **Racer**: your racer stands on the turntable. Pick one and press *Choose kart*.
2. **Kart**: the kart rolls in and parks behind your racer. Pick one and press
   *Choose track*.
3. **Track**: the map board on the back wall shows the track you pick. Set the class,
   laps and graphics, then press *Start race* and the track loads straight onto the
   starting grid.

*Back* (or `Esc`, or the Android back button) steps back through the garage, and
`Enter` moves on. The Android back button on the first step returns to the title screen. After a race, *Back to menu* returns to the garage with your picks
kept. The game remembers the last track you picked.

Each racer starts in their own vehicle (Apu in the Cozy Coupe, CornPop in the
Hotdog, Beardy in the Semla Kart, Peepo in the Peepo Beetle, Honkler in the Clown Car, Qoq in the Qoq Mobile), but anyone can drive anything. The Cozy Coupe is
lighter, with better acceleration and handling and a lower top speed. The Hotdog
is the fastest but heaviest to turn. The Semla Kart sits between them, with quick
acceleration and standard handling. The Peepo Beetle is a small open-top beetle
with good acceleration and handling, but it's light and easy to knock around. The Clown Car is long and fast on the
straights but slower to turn. The Qoq Mobile is a white chicken car with a big
chicken head on the hood and a fan of tail feathers: light and quick, with a good top speed and handling. The stat bars on the start screen
show the mix for the racer and vehicle you've picked.

Pause the race (`Esc`, or the back button on Android) to switch the **Camera**
between Normal and Close, which sits 50% nearer the kart. The game remembers
your choice.

## Android

Install `android/CornKart-debug.apk` on a phone (Android 7 or newer). You may need to
allow installs from your file manager or browser first. The game runs fully offline
in landscape, with touch buttons: ◀ ▶ steer, ▲ gas, ▼ brake, **DR** to hop and
drift. The back button pauses, and leaving the app pauses the race.

Phones start on the **Fast** graphics setting. **High** adds bloom glow, softer
shadows, grass and sharper rendering, and suits newer phones. Switch on the
start screen.

To rebuild the APK after changing the game:

```
node build.mjs .               # rebuild the web version
bash android/build-apk.sh      # makes android/CornKart-debug.apk
```

`build-apk.sh` needs a JDK and the Android build-tools (`aapt2`, `dx`, `zipalign`,
`apksigner`) plus an `android.jar`. It finds them under `$ANDROID_HOME`, or on
Ubuntu via `apt install android-sdk android-sdk-platform-23`. It copies the web game
into the app's assets, bundles the fonts so nothing loads from the internet, and
signs with a debug key. The `android/` folder is also a normal Gradle project:
run `build-apk.sh` once to fill the assets, then open the folder in Android
Studio to make a signed release build for the Play Store.

## Play in a browser

Open `index.html` in Chrome, Edge or Firefox. There's no install step and no server.
Everything, including three.js, is bundled into `game.js`, and the racers' models are
in `assets/apu.js`, `assets/cornpop.js`, `assets/beardy.js`, `assets/peepo.js`, `assets/honkler.js` and `assets/qoq.js`.

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Accelerate / brake | `↑` `↓` or `W` `S` | A / X, or the triggers |
| Steer | `←` `→` or `A` `D` | Left stick or d-pad |
| Hop and drift | Hold `Space` or `Shift` while turning | Shoulder buttons |
| Look back | `C` | Y |
| Respawn on track | `R` | |
| Music on/off | `M` | |
| Pause | `Esc` or `P` | Start |

On phones and tablets, touch buttons show up during the race.

### Mechanics

The mechanics borrow from the two N64 games:

- **Drift and mini-turbo** (Mario Kart 64): hop into a drift and hold it. The sparks
  go white, then blue, then orange. Let go on blue for a mini-turbo, or on orange for
  a super mini-turbo.
- **Rocket start**: press the gas just as the "1" fades. Press it too early and you
  flood the engine.
- **Big air** (HSV / Beetle Adventure Racing): hill crests and ramps launch you
  for real. Hill 25 has a kicker at the top.
- **The Ridge Drop**: the road climbs a long ridge to a ramp, then falls away about
  20 metres to the forest floor. Hold the line, there's a sludge gap under the lip.
- **Park shortcut**: early in the lap, a cobbled lane cuts through the
  amusement park, past the ferris wheel and through the bumper-car pavilion. It's
  shorter, with a jump, but slower underfoot.
- **Secret tunnel**: on the climb to the ridge, a gap in the barrier
  leads into a lit service tunnel through the hill. Smash the plank barricade at
  the entrance. It skips the Ridge Drop and has its own boost crystals.
- **Sludge pit**: you need speed to clear it, so hit the boost pad before the ramp.
  Fall short and you sink, then respawn past the pit.
- **Barrel jump**: jump the row of radioactive barrels or squeeze through the gap.
  Hitting one spins you out.
- **Atomic Boost pickups** are the green crystals in rows across the road. Each one
  gives a temporary speed boost and comes back after 4 seconds.
- **Off-road** rubble slows you down, but a boost carries you straight through it.
- The **DOSE** meter and the Geiger counter both rise as you get close to hazards.

### Time of day and weather

Every race, and every title-screen race, rolls a random time of day (day, sunset or
night) and a weather that suits the track. The name shows at the start of the race
and next to the track name in the HUD.

- **Pripyat**: falling ash, or a radioactive storm with green acid rain, lightning
  and thunder.
- **Swedish Winter**: light snow, a snowstorm with thick fog and sideways snow, or
  clear and frosty.
- **San Francisco**: clear, rain with the odd thunderstorm, or thick fog rolling in.

Rain makes the tarmac shiny. Add `&time=night` or
`&weather=storm` to the URL to pin either one when testing.

### Swedish Winter

The lap leaves a snowy town of painted townhouses, climbs through farm country past
a giant Dala horse to the ski jump, drops down to a frozen lake, then crosses a
mountain pass and comes home past the church.

- **Semla sugar rush**: instead of atomic crystals, collect the semlor in rows across
  the road. Each one gives a speed boost.
- **Snowman jump**: jump the two rows of snowmen before the finish, or thread the gap.
- **The ski jump** (Hoppbacke): pads on the climb, a ramp at the top, and an icy
  ravine under the lip. The road falls away about 15 metres below.
- **Frozen creek**: a smaller gap by the lake. Fall short and you go through the ice.
- **Gamla stan**: a cobbled alley through the old town cuts the first corner.
- **Secret tunnelbana**: a boarded-up metro tunnel under the ski hill. Smash the planks
  where the road forks right on the climb.
- **Ice road**: a ploughed road straight across the frozen lake. It's the biggest
  shortcut, but the ice is slippery (you slide and steer less sharply) and there's a
  hole in the ice to jump.
- **Secret mine**: a boarded-up mine shaft under the mountain pass, on the left
  just after the lake.

### San Francisco

The lap leaves the Embarcadero by the Ferry Building, climbs Nob Hill and Russian
Hill past rows of Victorian houses and a cable car, drops to the Marina and crosses
the Golden Gate Bridge. It loops over the Marin Headlands and comes back across the
bay by jumping a raised drawbridge.

- **Steep hills**: the hill streets climb and drop at up to about 35%. You slow down
  going up, speed up coming down, and fly off every crest.
- **Giant jumps**: ramps on top of both city hills launch you down the far side; a
  headlands gully has a creek to clear; and the drawbridge is open, so you take off
  from one raised leaf and fly over the water. Hit the boost pads before it. Fall
  short and you splash into the bay.
- **The Golden Gate Bridge**: a long straight high over the water, with railings so
  you can't fall off, and boost pads in the middle.
- **Sourdough rush**: collect the sourdough loaves for a speed boost.
- Two sets of **traffic cones** block the road.
- **The crooked street**: a winding brick street between flower beds. It forks right
  at the top of Russian Hill and cuts down to the Marina.
- **Secret Nob Hill tunnel**: a boarded-up tunnel straight under Nob Hill. It forks
  right at the bottom of the first climb.
- **Secret headlands tunnel**: a boarded-up army tunnel through the headlands. It
  forks right just after the bridge.

### Transylvania

Out of Bran village, up through the dark Carpathian forest, and through the gatehouse
of Bran Castle on its crag. The road then runs down past a blood ravine and the old
graveyard, over the castle moat and back into the village. Sausages stand impaled on
sharpened stakes all along the forest road. It's usually dusk or night here, under a
full moon.

- **Bats**: swarms circle over the road and block your view. Get close and half of
  them flutter past your face while the rest gather into a towering vampire standing
  in your lane. Hit him and you spin out. Once you're past, he turns back into bats.
- **Garlic** gives you a boost.
- **Jack-o'-lanterns**: two rows block the road. Jump them or thread the gap.
- **Blood ravine** and **castle moat**: hit the boost pads and jump them. Fall short
  and you splash into the blood.
- **Graveyard lane**: a cobbled shortcut between the headstones. It forks right after
  the long descent.
- **Secret dungeon**: a boarded-up passage straight through the castle crag. It forks
  right on the climb to the castle.
- The weather here can be clear, thick fog, or a thunderstorm with lightning.

### Sydney Harbour

The grid is on George Street. The lap jumps the crests of Bridge Street, drops down
Macquarie Street to Circular Quay and dives into the old Wynyard subway, which climbs
inside Observatory Hill and comes out high on the approach to the Sydney Harbour
Bridge. Off the far end it leaps Lavender Bay at Luna Park, runs back under the
bridge's own approach along the Kirribilli shore, and returns beneath the harbour
through the Harbour Tunnel, launching out of it into the Domain and back to the city.
The Opera House, Sydney Tower, the ferries crossing the harbour and the Luna Park
big wheel are all there. The scenery keeps well back from the road (the taller a
building, the further back it stands) and the land stays low beside it, so the track
ahead is always in view.

- **Jumps everywhere**: crests on George, Bridge, Macquarie and Park Streets, a ramp
  at Kirribilli, the launch out of the Harbour Tunnel, and the jump over Lavender Bay.
  Fall short there and you splash into the bay.
- **High and low roads**: the low road runs along the quay by the water; the
  **Cahill Expressway** high road forks left just after the quay begins, runs on
  columns right over it and ends in a drop back down. Coming off the bridge, the road
  loops round and passes under the bridge approach you just drove down.
- **BridgeClimb**: fork right just after the first pylon and drive straight up the
  steel arch of the Harbour Bridge, over the flags at the top and down the far side.
- **Opera House forecourt**: fork right on Macquarie Street, up the steps, round the
  sails and off the end of the podium back onto the quay.
- **Secret Luna Park**: boarded up behind the giant grinning face. It forks left at the
  bottom of the bridge's far approach and cuts through the park.
- **Meat pies** give you a boost, and two rows of **traffic cones** block the road.
- Two long tunnels on the main road: the Wynyard subway and the Harbour Tunnel, with
  boost pads under the water.

## The look

Every track is dressed like a modern kart racer. `src/dressing.js` adds, on every track:

- painted **curbs** and padded **barriers** (or tyre walls) round the outside of every bend,
  and **chevron boards** pointing the way through the tight ones
- an inflatable **start arch** with a big screen and real **start lights** that count down
  with the race, flagpoles, and **grandstands** full of cheering fans
- **sponsor boards** along the straights, strings of **bunting** across the road, a
  **CornKart blimp** circling overhead, and hot-air balloons in San Francisco
- drifting motes of light: radioactive specks in Pripyat, will-o'-wisps in Transylvania

Each track picks its own colours with a `dressing` block in its def: hazard yellow and
green in Pripyat, blue and yellow in Sweden, Golden Gate orange in San Francisco,
purple and pumpkin orange in Transylvania, green and gold in Sydney. Nothing in it changes the physics, and it keeps
clear of every building, tree and landmark the track already placed.

The renderer (`src/graphics.js`) draws a stylised sky with puffy sun-lit clouds, a sun disc,
stars at night and the northern lights over Sweden on clear nights. Fog glows towards the
sun and thins with height, a colour grade gives the bright kart-racer look, and on High a
vignette and speed lines kick in when you boost. Trees have soft rounded canopies that
sway in the wind, grass waves, and the San Francisco bay has rolling waves.

## Sound and music

All the music and most of the sound effects play real instruments from a General MIDI
SoundFont (the 24.1 MB "Mega Sound" bank). `tools/make-soundbank.py` picks out the 45
instruments the game uses and packs them into `assets/sounds.js`, about 2.4 MB, and each
instrument is levelled so they all play at about the same loudness. The Geiger clicks are
still synthesised, and if the bank ever fails to load, every effect falls back to its old
synth sound.

The sound plays on three separate channels: music, effects and the engine. The kart
engine is synthesised on its own channel and never uses the sound font, so effects can't
cut into it. There's no rain sound.

The songs ship as separate, pre-rendered files: `tools/make-music.mjs` plays each song
from `src/music.js` through the sample bank and encodes one seamless loop as Opus at
96 kbps (`assets/music/<id>.ogg`, about 180 to 270 kB a song). Each one is also wrapped as
`assets/music/<id>.js`, which the game loads only when that song is needed, so it works
from a plain file and inside the Android app. If a browser can't decode Opus, the game
plays the song live from the sample bank instead. After changing a song, rerun
`node tools/make-music.mjs` (it needs Playwright's Chromium and ffmpeg).

Each track has its own song, and the menus and garage have a kart-pop theme:

- **Menus**: bright kart pop in C major (finger bass, Rhodes, square lead, glockenspiel)
- **Pripyat**: a dark, driving synth tune in A minor on the dance kit
- **Swedish Winter**: a quick polka with accordion, fiddle, double bass and sleigh bells
- **San Francisco**: a funk groove with slap bass, Rhodes stabs, sax and brass
- **Transylvania**: a spooky waltz with harpsichord, organ, celesta, choir and timpani
- **Sydney Harbour**: twangy surf rock with tremolo guitar, organ and brass

### Playing a sound

Any instrument can be played by name from anywhere that has the audio object:

```js
audio.sampler.note('brass', 'C5', { dur: 0.3, vel: 0.9 })   // a note, held 0.3 s
audio.sampler.note('kit', 'snare', { at: 0.5 })              // a drum hit, half a second from now
audio.sampler.chord('pad', ['A3', 'C4', 'E4'], { dur: 2 })    // a chord
```

Notes are written like `C4` (middle C), `F#3` or `Bb2`, or as MIDI numbers. Options are
`at` (delay in seconds), `dur` (how long to hold it; leave it out for drums and one-shot
effects), `vel` (0 to 1), `slide` (a note to glide to), `rate` (speed up or slow down a
sample) and `pan`. The instrument names are listed in `tools/make-soundbank.py`, and the
drum names (`kick`, `snare`, `hat`, `open`, `crash`, `ride`, `tomLo`, `clap`, `tamb`,
`cowbell`, `jingle` and more) are at the top of `src/sampler.js`.

Game sound effects are in `src/audio.js`, one line each in `_sample()`, for example:

```js
case 'drift1': s('glock', 'E6', { vel: 0.5 }); return true;
```

`SFX_GAIN` at the top of the file trims how loud each effect is. The boost, pickup and
turbo sounds are a cartoon boing made by `_boing(pitch, { gain, dur })` in the same
file, not samples.

### Writing a song

Songs live in `src/music.js` as plain text. A part plays one instrument and loops its own
list of bars. Each bar is a row of tokens spread evenly across it, so 4 tokens are quarter
notes, 8 are eighths and 1 fills the whole bar:

```js
myTrack: {
  bpm: 140, steps: 16,
  parts: [
    { inst: 'fingerBass', vol: 0.3, bars: ['C2 C3 C2 C3 C2 C3 G2 B2', 'A1 A2 A1 A2 A1 A2 E2 G2'] },
    { inst: 'pad', vol: 0.2, bars: ['C4+E4+G4', 'A3+C4+E4'] },              // one chord a bar
    { inst: 'square', vol: 0.6, bars: ['E5 - D5 C5 - - G4 -', '. . . . A4 - - -'] },
    { kit: 'kit', vol: 0.3, hits: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' } },
  ],
},
```

`-` keeps holding the last note, `.` is a rest and `A3+C4+E4` is a chord. In drum lines
each character is one step: `x` a hit, `X` an accent, `o` a soft ghost note. Give a drum a
list of strings to play a different pattern each bar, like `crash: ['x', '.', '.', '.']`
for a crash every fourth bar. A part can also take `legato` (how much of each note is held,
0 to 1), `oct` (shift it by octaves) and `pan`, and a song takes an overall `vol`. A song
named after a track's `id` plays on that track; `audio.setSong('name')` switches songs.
The M key turns the music on and off in a race.

### A new instrument

Add a line to `BANK` in `tools/make-soundbank.py` with a name, the SoundFont bank and
program number, and the lowest and highest notes you want, then rebuild the bank:

```
python3 tools/make-soundbank.py path/to/24.1mg_mega_sound_v2.0_bank.SF2
```

It needs Python 3 with numpy. The SoundFont itself isn't shipped with the game.

## Adding characters and karts

The roster is in `src/characters.js` and vehicles are in `src/karts/`. Any racer can
drive any vehicle, and the player picks both on the start screen. After you
change anything under `src/`, rebuild `game.js` once:

```
npm install        # first time only
npm run build
```

### A new character

1. **Model.** Use a rigged humanoid `.glb`. Standard bone names (Mixamo, Meshy and
   most auto-riggers) work as they are. Wrap it for the game:
   ```
   node tools/glb-to-js.mjs path/to/hotrod.glb hotrod
   ```
   This writes `assets/hotrod.js`. Add `<script src="assets/hotrod.js"></script>`
   next to the other model lines at the bottom of `page.html`. Keep textures at
   1024 px or below so the file stays small. Apu was shrunk from 16.9 MB to 2.8 MB
   by simplifying the mesh, shrinking textures and dropping unused animations.
   `python3 tools/slim-glb.py in.glb out.glb --keep Idle_3,Happy_jump_f` does the texture,
   quantisation and animation part in one go (Qoq went from 19 MB to 4 MB).
2. **Roster entry.** Add an object to `CHARACTERS` in `src/characters.js`. The first
   entry is the default racer.
   ```js
   {
     id: 'hotrod', name: 'Hot Rod', tagline: 'Never cools down.', icon: '🔥',
     model: 'hotrod',          // the key you gave glb-to-js
     height: 1.35,             // standing height in metres at kart scale
     vehicle: 'hotdog',        // the vehicle picked by default
     stats: { speed: 4, accel: 2, handling: 3, weight: 4 },   // 1 to 5 each
     idleClip: 'Idle',         // standing next to the kart on the menu
     celebrate: { seated: false, win: 'Dance', podium: 'Dance', lose: 'Stomp' },
     rivalNames: ['Ash Rod', 'Glow Rod', 'Toxic Rod', 'Bog Rod', 'Rust Rod'],
   }
   ```
   Lower `COMING_SOON` by one so the select screen keeps six slots. `celebrate`
   names the model's own animation clips for after the race. With `seated: true`
   the racer stays in the kart, which suits sitting clips like Apu's cheer and clap.
   Otherwise they hop out and play the clip standing.

The game seats any humanoid driver for you. `src/driver.js` bends the legs and arms
into a seated pose, puts the hips on the kart's seat, and moves the steering wheel
to wherever the hands end up. Animation clips from the model are used for the
finish-line celebration, as set in `celebrate`.

### A new vehicle

1. Copy `src/karts/coupe.js`, `src/karts/beetle.js`, `src/karts/clown.js`, `src/karts/semla.js` or `src/karts/hotdog.js` to something like
   `src/karts/rocket.js` and change the shapes. Keep the same return object:
   - `group` and `body`
   - `wheels`: each one with `pivot`, `wheel`, `front`, `side` and `radius`
   - `steering`, `column` and `placeWheel`
   - `exhausts`: where the boost flames come out
   - `tailLights`
   - `seat.hip`: where the driver's hips go
   - `size` and `collisionRadius`

   Forward is +Z, units are metres, and the ground is y = 0.
2. Add it to `VEHICLES` in `src/karts/index.js` with a name, an icon, the builder,
   a stat bonus (added to the driver's stats), and a few `rivalPaints` for the AI.
   It appears on the start screen straight away.

Static parts are merged automatically to keep drawing fast. Anything that has to
move on its own, like the steering wheel, goes in the keep list in `buildKart`.

### A new track

`src/tracks/pripyat.js`, `src/tracks/sweden.js`, `src/tracks/sanfrancisco.js` and `src/tracks/sydney.js` are the templates. It holds the spline control points
(`[x, height, z]`), the ramps, pits, boost pads, pickup rows, barrel rows and
puddles (none of the tracks use them now), all placed by distance along the track. `branches` adds shortcuts: each
one leaves the main road at `from` and rejoins at `to`, with its own points, surface
and features. Give a branch `tunnel: [start, end]` (fractions of its length) to bury
that stretch under the hill, or `tunnels: [[from, to], ...]` in metres for more than
one. The main road takes `tunnels` too (Sydney's subway and Harbour Tunnel), with
`wallColor` and `portalColor` on the track def. It also has a `buildScenery`
function for the landmarks. Add your track to `TRACKS` in `src/main.js`, and it shows
up as a chip on the start screen.

A track can change the look and the hazards without touching the engine:

- `theme`: snow ground instead of grass (`ground: 'snow'`), icy water or bay water in
  the pits (`pit: 'water'` or `'bay'`), pickups (`pickup: 'semla'`, `'sourdough'` or `'pie'`),
  puddles (`puddle: 'ice'` or `'oil'`), barrels (`barrel: 'snowman'` or `'cone'`), the messages they show, boost and particle colours, tunnel
  lamp colour, and whether the DOSE meter shows (`radiation: false`).
- `sky`, `light` and `fog` set the sky colours, sun angle and haze for a clear day.
  `weathers` lists the weathers the track can roll (`'ash'`, `'storm'`, `'snow'`,
  `'blizzard'`, `'frost'`, `'clear'`, `'rain'`, `'fog'`, `'thunder'`). `times` can weight
  day, sunset and night, and `nightLight` brightens the moonlight on a dark track. They're defined in
  `src/conditions.js`, which also turns the day look into sunset and night.
- `lakes` adds frozen lakes: flat ice you can drive on, with holes cut wherever a
  ramp's pit lands on the ice.
- `sea` (`{ level, bed }`) and `waters` (ellipses) add open water: the ground is carved
  down to the sea bed and a water surface covers it. Drive into it and you splash.
  `islands` raises rocky islands out of it.
- A `{ type: 'bridge', s, len }` feature turns a stretch of road into a bridge:
  railings keep you on it, and the ground and water underneath are left alone.
  Add `viaduct: true` for a road raised on columns over open ground, like Sydney's
  Cahill Expressway: the land underneath keeps its own shape, so another road can
  pass below it. `pillars: false` and `parapet: false` leave out the columns and
  the concrete walls when the scenery draws its own (the Harbour Bridge).
- `terrainReach` (default 5, in 40 m steps) is how far away a road still shapes the
  land. Raise it on a spread-out track so the hills don't show seams.
- `viewSlope` (Sydney uses `0.12`) keeps the land low beside open road: it may only
  rise this many metres per metre away from the road edge, curving up further out, so
  banks and hills never hide the track ahead. Hills over tunnels and round their mouths
  are left alone.
- `bats` places swarms of bats (`{ s, d }`, or `{ path, s }` on a branch) that turn into
  vampires as you get close. Themes also take `pit: 'blood'`, `puddle: 'blood'`,
  `pickup: 'garlic'` and `barrel: 'pumpkin'`.
- A branch can use `surface: 'cobble'`, `'brick'` or `'ice'`, and a tunnel branch can set
  `wallColor` and `portalColor`.

Anything a theme leaves out falls back to Pripyat's look.

## Files

- `index.html`, `game.js`, `assets/`: the playable game.
- `page.html`: the page source. `build.mjs` turns it into `index.html` and inlines the
  logo (`assets/logo.webp`) so the page needs no extra files.
- `src/`: the game source. The title-screen race and its cameras are in `attract.js`, the garage is in `garage.js`, kart physics are in `kart.js`, the track and terrain in
  `track.js`, time of day and weather in `conditions.js`, the rivals in `ai.js`, race rules in `race.js`, and the sky, fog, colour grade, foliage and bloom in `graphics.js`, and the curbs,
  barriers, start arch, grandstands and other trackside dressing in `dressing.js`.
- `android/`: the Android app (a full-screen WebView around the web game),
  `build-apk.sh`, Gradle files, and the built `CornKart-debug.apk`.
- `src/audio.js`, `src/sampler.js`, `src/music.js`: sound effects, the sample player and the songs.
- `assets/sounds.js`: the instrument samples, built by `tools/make-soundbank.py` (which
  uses `tools/sf2lib.py` to read the SoundFont).
- `assets/music/`: each song as an Opus file and its script wrapper, made by
  `tools/make-music.mjs`.
- `tools/glb-to-js.mjs`: wraps a model so the game can load it.
- `tools/slim-glb.py`: shrinks a rigged model (smaller textures, packed vertex data).
- `tools/make-icons.mjs`: renders the Android launcher icon from the logo.

The two N64 ROMs were used only as a reference for mechanics. They aren't included
or used by the game. All the vehicles wear a generic CornKart badge instead of any real
brand logo.
