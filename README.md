# Caelum Mercer

Personal site for independent app producer Caelum Mercer.
The painted lab scene is the canvas for the whole page. Every interactive element is positioned in image coordinates against the 3:2 artwork, so the live terminal feeds render inside the monitors that exist in the painting, Troutt is the open sketchbook lying on the desk, and Nimlo is projected out of the emitter puck beside it. The monitors in the artwork are blank glowing glass — the only text on them is the scrolling feed. About and contact stay in the header. Click either product for its description and store listings. The sun or moon scene follows the visitor's local time of day.

Screen and hologram coordinates were traced from the source artwork, not eyeballed — if the images are ever regenerated, the percentages in `site.css` need to be re-measured. `tools/grid.py` overlays a labelled percentage grid on a scene so boxes can be read off it, and `tools/trace-scene.py` reports the glowing monitor regions.

Scene artwork is generated at 1536×1024 and encoded by `tools/encode-scene.py`. Use it rather than `sips`: the room is saturated cyan detail on near-black, so JPEG's default 4:2:0 chroma subsampling smears the glow. Note also that the scene must not carry a fractional CSS `scale()` — a composite-time resample softens the artwork and every glyph drawn over it.

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
