# Nikku's Pro Water Anglers Classic

A tournament bass-fishing game in the spirit of *Bassin's Black Bass with Hank
Parker* (SNES), built with [Phaser 4](https://phaser.io/) + TypeScript + Vite.

Most art is **runtime-generated placeholder graphics** — the game is fully
playable, and every placeholder is designed to be swapped for real pixel art
later without touching game logic (see [Swapping in real assets](#swapping-in-real-assets)).

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production build to dist/
```

## The game

- **Tournament mode** — a 4-event circuit (2–3 days each) against 15 CPU
  anglers. Each day runs 6:00 AM–2:00 PM on the game clock. Only bass
  (largemouth / smallmouth / spotted) count at the weigh-in; your livewell
  holds 5 and you cull the smallest automatically. Heaviest total wins;
  placement earns circuit points toward Angler of the Year. Progress is
  saved to `localStorage` between days.
- **Free fishing** — pick any of the 4 lakes, no clock pressure.

### A day on the water

1. **Lake map** (top-down): drive the boat with the arrow keys. Moving burns
   daylight faster than sitting still. The depth finder shows depth, bottom
   cover, and fish-activity marks. `SPACE` fishes the spot under the boat,
   `T` opens the tackle box, `L` shows the livewell, `ENTER` (twice) heads in
   early for weigh-in.
2. **Cast view** (side-on water column): aim with `LEFT/RIGHT`, `SPACE` to
   start the power meter, `SPACE` again to cast (white line = sweet spot).
   Hold `SPACE` to reel, tap to twitch. Sinking lures fall on a slack line;
   crankbaits dive while reeled. Fish AI reacts to lure type, color, depth,
   cover, weather, time of day, and line weight. On `!!! STRIKE !!!` press
   `SPACE` to set the hook.
3. **The fight**: hold `SPACE` to reel, release to let it run. Redline the
   tension and the line snaps; leave it slack too long and the hook pulls.
   Heavier line survives more tension but draws fewer strikes.

## Code layout

```
src/
  main.ts                 game config + scene registry
  data/                   pure data, no Phaser — tune the game here
    types.ts              shared types
    species.ts            12 fish species: size, habits, lure/depth prefs
    lures.ts              8 lures + line tests
    lakes.ts              4 lakes as ASCII grids (validated at load)
    anglers.ts            CPU competitors + skill ratings
    tournaments.ts        circuit schedule, points table, day clock
  state/GameState.ts      the singleton: tournament progress, livewell,
                          tackle, clock, save/load
  systems/fishing.ts      spot scoring + fish population spawning
  ui/
    theme.ts              palette, text styles, panel chrome
    placeholders.ts       all runtime-generated placeholder textures
  scenes/
    BootScene             loads real PNGs, generates placeholders
    TitleScene, MenuScene, HowToScene
    LakeSelectScene       free-fishing lake picker w/ minimap
    TournamentScene       day briefing + standings
    LakeScene             boat navigation hub
    TackleScene           lure/color/line overlay (pauses parent)
    CastScene             casting, retrieve, fish AI, strikes
    FightScene            tension/stamina tug-of-war
    CatchScene            landed-fish card + livewell/cull logic
    WeighInScene          daily leaderboard, CPU weight simulation
    CircuitScene          season points + champion screen
```

Scene flow:

```
Boot > Title > Menu ┬> Tournament > Lake ┬> Cast <> Fight > Catch ┐
                    │       ^            │     ^                  │
                    │       │            └─────┴──────────────────┘
                    │       └── WeighIn (end of day) > Circuit
                    └> LakeSelect > Lake (free fishing)
```

## Swapping in real assets

All placeholder textures are created in `src/ui/placeholders.ts`, which
documents every key it generates (map tiles, boat, lure icons, angler,
etc.). To replace one:

1. Drop the PNG under `public/assets/...`.
2. Load it in `BootScene.preload()` under the **same texture key**.
3. Remove (or skip) the matching block in `placeholders.ts`.

Nothing else changes — scenes only reference texture keys. The fish PNGs in
`public/assets/fish/` are already real art and are used for catch cards,
tinted dark as underwater silhouettes.

Lakes are ASCII grids in `src/data/lakes.ts` (`#` land, `.`/`,`/`:` water by
depth, `W`eeds, `T`imber, `R`ock, `D`ock, `S` launch). Edit the strings to
reshape a lake — a validator throws at load if a row is the wrong length.

## Ideas for future work

- Real tile/boat/angler pixel art, animated water, sound and music
- A behind-the-boat pseudo-3D cast view like the original (the side-view
  water column is a placeholder presentation; the fish/lure model already
  tracks distance + depth, which maps directly onto that view)
- Fish fight jumps/dives tied to species, rod choice, drag setting
- Seasons and water temperature driving fish depth patterns
- Named CPU anglers with per-lake tendencies and rivalry dialogue
- Password-style save codes for the retro feel (localStorage already works)
