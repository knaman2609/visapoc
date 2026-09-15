# Map geometry

`src/data/geo/india.js` and `src/data/geo/world.js` are generated, not written.
They hold SVG path strings, already projected and simplified, so the app ships
no mapping library and makes no network call to draw a map.

## Regenerating

```sh
mkdir -p /tmp/geo
curl -o /tmp/geo/india.geojson \
  https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/india.geojson
curl -o /tmp/geo/world.topo.json \
  https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json

node tools/geo/build-india.mjs /tmp/geo .
node tools/geo/build-world.mjs /tmp/geo .
```

## What each does

**India** — the source is district boundaries. Districts are mapped to the six
zones the book uses, then dissolved: every edge that appears twice in opposite
directions is interior and is dropped, and what is left is stitched back into
rings. A state that sits wholly inside another one in the same zone (Chandigarh,
Puducherry, Dadra & Nagar Haveli) can leave its border behind when the vertices
on the two sides do not match, so rings contained by a larger ring of the same
zone are removed — an island is kept, because it is inside nothing. Mercator.

**World** — the source is Natural Earth 110m. Countries are grouped into the
corridors the international book travels but kept whole rather than dissolved,
because a reader looking at "United Kingdom & Europe" wants to see which
countries are in it. Natural Earth stores Russia and Fiji as rings that run
straight through ±180°, which a flat projection draws as a band across the whole
map, so every ring is unwrapped into one continuous span and the copies of it
that fall inside the map are cut out at the seam. Antarctica is left off.
Robinson.

Both are simplified with Douglas–Peucker on the projected pixels, so the
tolerance in the scripts means what it says at the viewBox they emit.
