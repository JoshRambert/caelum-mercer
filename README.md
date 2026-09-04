# Caelum Mercer

Personal site for independent app producer Caelum Mercer.
The painted lab scene is the canvas for the whole page. Every interactive element is positioned in image coordinates against the 16:9 artwork, so the live terminal feeds render inside the monitors that exist in the painting, Troutt is the open sketchbook lying on the desk, and Nimlo is projected out of the emitter puck beside it. About and contact stay in the header rather than painted onto a monitor, where they competed with the artwork's own code text. Click either for its description and store listings. The sun or moon scene follows the visitor's local time of day.

Screen and hologram coordinates were traced from the source artwork, not eyeballed — if the images are ever regenerated, the percentages in `site.css` need to be re-measured. `tools/grid.py` overlays a labelled percentage grid on a scene so boxes can be read off it, and `tools/trace-scene.py` reports the glowing monitor regions.

Scene artwork is generated at 16:9 and encoded by `tools/encode-scene.py` to 1920×1080. Use it rather than `sips`: the room is saturated cyan detail on near-black, so JPEG's default 4:2:0 chroma subsampling visibly smears the terminal text. Note also that the scene must not carry a fractional CSS `scale()` — a composite-time resample softens the artwork and every glyph drawn over it.

## Local Development

```bash
npx serve .
```

## Deploy

```bash
npx wrangler pages deploy . --project-name caelummercer
```

Live: https://caelummercer.pages.dev

## Links

- [Nimlo on the App Store](https://apps.apple.com/us/app/nimlo-workout-planner/id6761034073)
- [Nimlo on Google Play](https://play.google.com/store/apps/details?id=com.nimlo.android)
- [Troutt on the App Store](https://apps.apple.com/us/app/troutt/id1503217318)
