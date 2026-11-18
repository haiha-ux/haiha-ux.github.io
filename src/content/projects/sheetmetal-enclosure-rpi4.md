---
title: "Sheet-metal enclosure for a Raspberry Pi 4, IP65 target"
summary: "A two-part box in 1.5 mm aluminium 5052 for a Raspberry Pi 4, built as true sheet metal with bends, flat DXF blanks and A3 drawings. It has an EPDM gasket and cable glands, and the design aims at IP65 without claiming it."
domain: cad
repo: sheetmetal-enclosure-rpi4
metrics:
  - { label: "Flat patterns", value: "DXF equals the unfolded STEP to 0.000 mm, 8 bends in the body and 4 in the lid", hero: "0.000 mm" }
  - { label: "Holes", value: "18 + 12 fold back onto STEP holes, 0.000 mm error" }
  - { label: "Gasket", value: "EPDM compressed 25%, stopped by 2.25 mm spacers" }
star: { planet: saturn }
year: 2026
featured: false
order: 25
---
## What didn't work

IP65 is a design target. Nothing has been cut, bent, welded or tested, and I am not claiming a rating.

The stud that seals the Pi mounting holes is a PEM IFHA-M2.5-12. PEM rates the clinched joint IPX7 and IPX9K, but tested it in other alloys and not in 5052, so it needs a test coupon before anyone relies on it. The bottom corners cannot be closed by filler alone, so they need a welded patch and a leak test. And the bends use a K-factor of 0.42 from a fabricator's calculator for 1.6 mm sheet. A real air bend in 1.5 mm gives an inside radius nearer 1.9 mm, so the radius has to come from the shop that will bend it, and the flats should be re-run before cutting.
