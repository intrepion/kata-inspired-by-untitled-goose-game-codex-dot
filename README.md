# Puddle Trouble

An original little real-time orchard sandbox about a mischievous goose and a caretaker trying to get on with her work. Inspired by the playful stealth and reactive world of *Untitled Goose Game*, independently made with original code and drawn artwork; it is not affiliated with House House or Panic.

[Play online](https://intrepion.github.io/kata-inspired-by-untitled-goose-game-codex-dot/) (the published version may differ from local changes).

## Play locally

Open `index.html` in a modern browser, or run `python3 -m http.server` in this directory and visit `http://localhost:8000`. No build or installation is needed.

Move with arrows or WASD, hold Shift to run (4.2 versus 2.35 orchard units per second), press Space to pick up or drop nearby objects or operate the tap, and press H to honk. On a touch screen, hold the direction and run buttons; tap the action and honk buttons. The controls remain available with keyboard navigation. The game pauses when its browser tab is hidden.

Bring the basket and the caretaker’s hat to the straw nest and drop them, honk near the caretaker to knock her hat off, and turn on the tap. Press Space near the tap to operate it, even while holding another object. The caretaker immediately runs to the running tap. Carry the ribbon to the tap and use it there to tie it on and start the water; she must untie it, turn off the tap and return the ribbon. The caretaker patrols, investigates sounds, pursues a nearby thief, and returns displaced objects or shuts off the tap. Loose objects can also be nudged by walking into them. The ribbon is an extra toy. There is no timer or loss condition; the orchard remains open after the list is complete.

## Test

Run `node tests/game.test.js` and `node tests/controls.test.js` to check movement, caretaker reactions, goals, and keyboard and touch control wiring.

## License

MIT; see [LICENSE](LICENSE). The root `.gitignore` combines GitHub's global Linux, macOS, and Windows templates.

The experimental `?view=three` orchard uses a Three.js orthographic view when WebGL is available. The original view remains the default pending browser playtesting. Press Q or E to rotate the camera by a quarter turn; movement remains relative to the screen. The original canvas view is retained as a fallback if WebGL or module loading is unavailable. Three.js 0.180.0 is bundled under its MIT license in `vendor/three`.

The experimental view does not yet reproduce every original caretaker and object cue. Use the default view for the established presentation.

Low green hedges block the caretaker's view and force her to go around, but the goose can slip through. Breaking sight eventually ends a chase; honking can still be heard through cover. The status line reports when a hedge blocks her view.

The arrow shows the caretaker’s facing, and the pale ground area shows her sight: a 110° forward field out to 2.7 orchard units, plus a 0.7-unit close-awareness circle. Hedges block both. A carried object must remain visible for 0.6 seconds before a chase begins; once chasing, she searches briefly after losing sight. Honks can be heard through hedges.

## Arcade metadata

See [docs/arcade-metadata.md](docs/arcade-metadata.md) for the game-owned manifest and screenshot provenance.
