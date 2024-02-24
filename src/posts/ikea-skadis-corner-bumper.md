---
title: An IKEA Skådis Corner Bumper
date: 2024-02-24
categories: [Miscellany]
tags: [3D printing, making, IKEA hacking]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/111988277008883669
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid023Hg3fvXT3mU6CMHGYwoq8KZfEBEXMzD6DKKTUgxPX1U6Ps7pJbGtNd8xjHeaZYhdl
---

This week I had a couple IKEA Skådis pegboards delivered[^1]. Each of them arrived with the corners mildly scuffed.

![An IKEA Skådis pegboard with the corner scuffed and the brown of the particleboard showing through a tear in the black finish.](/media/ikea-skadis-corner-bumper/corner-scuff.jpg)  
_The other board was slightly less bad, but still had a visible scuff in one corner._

I thought about trying to exchange them, but the damage was so minor. Also, I figured that there was a decent chance this is just the level of quality one gets from IKEA QA/shipping and I'd be likely to get boards with similar cosmetic issues after a time-consuming exchange process. So instead, I got out my calipers and in about an hour had a simple design for some corner bumpers. I wanted to produce something that was clean and discreet enough that it would look like it could have been sold with the product.

![3D render of an L shaped yellow bumper designed slot over the corner of a board.](/media/ikea-skadis-corner-bumper/scad.png)

They printed cleanly on my Prusa MINI+ and I'm happy with the results. They cover up the existing damage and, while the need to protect the boards hung on the wall is limited, they will protect all the corners from future damage should I move them.

{% imagegrid %}
![Seven L shaped corner bumpers standing vertically on a 3D printer print bed.](/media/ikea-skadis-corner-bumper/print-bed.jpg)
![The corner of a pegboard, now with a corner bumper slotted over the corner.](/media/ikea-skadis-corner-bumper/corner-bumper.jpg)
{% endimagegrid %}

I printed them in black so they'd blend in, but I'm considering printing some in a brightly colored filament to give my walls a shot of color.

![An IKEA Skådis board mounted on a wall. There are boxes and trays mounted on the board and an adjustable wrench hangs from a hook. On each corner of the board is a black bumper.](/media/ikea-skadis-corner-bumper/on-wall.jpg)

The model is available [on Printables][] – and in [OpenSCAD][] code[^2]:

```openscad
include <BOSL2/std.scad>
include <BOSL2/rounding.scad>

corner_radius = 10;
wall_thickness = 1.5;
floor_thickness = 10;
straight_edge_length = 20;
board_thickness = 5;

outer_radius = corner_radius + wall_thickness;
floor_inner_radius = outer_radius - floor_thickness;

wall = union([
    ring(
        r1 = corner_radius,
        r2 = outer_radius,
        angle = 90,
        n = 50,
    ),
    back(
        corner_radius,
        left(
            straight_edge_length,
            square([straight_edge_length, wall_thickness])
        )
    ),
    fwd(
        straight_edge_length,
        right(
            corner_radius,
            square([wall_thickness, straight_edge_length])
        )
    ),
]);

floor = union([
    ring(
        r1 = floor_inner_radius,
        r2 = outer_radius,
        angle = 90,
        n = 50,
    ),
    fwd(
        straight_edge_length,
        right(
            floor_inner_radius,
            square([floor_thickness, straight_edge_length])
        )
    ),
    back(
        floor_inner_radius,
        left(
            straight_edge_length,
            square([straight_edge_length, floor_thickness])
        )
    )
]);

offset_sweep(floor, wall_thickness, bottom=os_chamfer(1))
position(TOP + BACK)
offset_sweep(wall, board_thickness, anchor = BOTTOM + BACK)
position(TOP + BACK)
offset_sweep(floor, wall_thickness, top=os_chamfer(1), anchor = BOTTOM + BACK);
```

[^1]: Organizing my space is part of my [Season of Tidiness](/2024/01/season-of-tidiness/), which involves buying some home organizing supplies.
[^2]: Requires [BOSL2][], which has become indispensable in my OpenSCAD design process.

[on Printables]: https://www.printables.com/model/778267-ikea-skadis-corner-bumper
[OpenSCAD]: https://www.openscad.org/
[BOSL2]: https://github.com/BelfrySCAD/BOSL2
