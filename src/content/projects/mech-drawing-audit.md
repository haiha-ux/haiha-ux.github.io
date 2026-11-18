---
title: "Production drawing for a NEMA 17 motor plate, checked against the model"
summary: "An ISO A3 drawing of a 6061 aluminium plate that holds a NEMA 17 stepper beside a 2020 extrusion, with GD&T and datums A to D. Scripts read the DXF itself and check every dimension against the STEP, then check the fit with the motor, the extrusion and six screws."
domain: cad
repo: mech-drawing-audit
metrics:
  - { label: "Independent checks", value: "93 run, 0 failed", hero: "93 checks" }
  - { label: "Motor flange to extrusion", value: "1.65 mm clearance, no interference with the 6 screws" }
  - { label: "Plate", value: "65 x 50 x 10 mm, Ø22 H8 bore on the motor boss" }
star: { planet: saturn }
year: 2026
featured: false
order: 26
---
## What didn't work

Nothing has been machined or measured. The motor and the extrusion in the assembly are plain envelopes, not vendor models, and the T-nut and the lip of the slot are not modelled at all. With a lip of about 1.8 mm the M5 screw bites only about 0.6 to 0.7 diameters into the nut, under the 1.5 to 2 usually wanted, so check the T-nut you buy. An M5 x 12 does not fit a 6 mm slot.

The motor thread in the Novanta data sheet is only 3.8 mm deep, which gives the M3 screws about one diameter of engagement. I cut the tightening torque to 0.6 Nm because of it, and other makers quote up to 4.5 mm. The checks prove that the drawing and the model agree and that nominal parts do not collide. They do not prove that the tolerance frames suit your motor.
