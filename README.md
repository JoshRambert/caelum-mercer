# Caelum Mercer

Personal site for independent app producer Caelum Mercer.
The painted lab scene is the canvas for the whole page. Every interactive element is positioned in image coordinates against the 3:2 artwork, so the live terminal feeds render inside the monitors that exist in the painting, and Troutt and Nimlo stand as holograms on the desk. Click a hologram for its description and store listings. The sun or moon scene follows the visitor's local time of day.

Screen and hologram coordinates were traced from the source artwork, not eyeballed — if the images are ever regenerated, the percentages in `site.css` need to be re-measured.

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
