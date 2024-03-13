---
title: A 3D Printed Irish Whistle Stand
date: 2024-03-13
categories: [Miscellany]
tags: [3D printing, making, music]
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

Irish whistles[^1] each play a limited set of pitches and therefore come in a particular key: you can have a D whistle, a G whistle, etc. If you're a whistler, you might have a number of whistles that you switch between. Over the past several months I've been working on a design for a portable 3D printed whistle stand, to hold all these many whistles, as a Christmas gift[^2] for [my partner][emma] who plays the whistle.

[emma]: https://emmaazelborn.com/

![A table with a large green and white plastic object on it. The object has three wavy legs and evenly spaced along each leg is a green cylindrical mount with a short wooden dowel protruding from the top. It looks a bit like a multidimensional menorah. On the table are three spare dowels with green topped mounts attached to the end.](/media/3d-printed-irish-whistle-stand/stand.jpg)

This is the most engineered (_over_-engineered, perhaps?) design I've worked on and it's still not perfect; I'll get into the flaws later. Emma sketched out the original design concept to me one day – intending it to be made out of wood – but I took the concept and iterated on it in secret to produce this 3D printable design.

{% imagegrid %}
![The whistle stand disassembled on a table. It is made up of three wavy legs stacked on top of each other and in front of them a pile of wooden dowels mounted on green cylinders with black tabbed snap connectors at the bottom](/media/3d-printed-irish-whistle-stand/parts.jpg)

![The whistle stand now on a desk with a blue desk mat and plants in the background. There are tin whistles over each of the dowels standing straight up with the tallest in the middle and the shortest on the outsides.](/media/3d-printed-irish-whistle-stand/whistles.jpg)
{% endimagegrid %}

It's made up of three legs for the base, each with four holes that the round "dowel mounts" snap into. The dowels _are_ made of wood, held into the mounts by friction. It's designed to come apart so that it can be taken to a session, concert, or on travel. The parts are fairly large altogether, so it's not pocket-sized (especially if you include the size of the whistles), but it's adequate for taking on the go. The legs snap together with magnets and the dowels are carried loose.

# The Connector

Designing the connector between the base and the dowels took the bulk of my design time. I must have gone through testing 50 some odd iterations trying different designs and then tuning different parameters of each idea. I started off with a screw threads design, took a detour through a twist-and-lock design, before finally settling on the annular snap joint you see here.

![A chaotic pile of 3D printed parts of different colors all on a table. It's a mix of cylindrical parts with knurled caps and different connectors—screws, snaps, and twist lock—and rectangular blocks with holes in the middle as well as a couple complete mini whistle stands with only four holes. Some parts appear to have failed midway through and are either missing bits or degrade into stringy plastic on one end.](/media/3d-printed-irish-whistle-stand/chaos.jpg)

![2D cutaway diagram of two joined components. A green component in the center has ridges on either side that fit into the valleys of the grey components around the perimeter.](/media/3d-printed-irish-whistle-stand/joint.svg)

Once I settled on the annular snap joint, though, I discovered through stress testing that the tabs on the joint broke too easily. One of the downsides of 3D printed components is that they are printed from the bed up[^3] layer by layer. Layers fuse together imperfectly, so 3D prints tend to be weak along the layer lines. It turned out this was especially true of the matte green filament that I wanted to use for this part, which was disappointing because I preferred it aesthetically for this design to some of the filaments that turned out to be stronger in my testing! Fortunately I realized I could still print the cap of the part in the matte filament, but switch midway through the print to a stronger black filament – which would be hidden when the part was engaged.

{% imagegrid %}
![A wooden dowel attached to a cylindrical object with a knurled green cap where the cylinder meets the dowel and on the other side a black snap connector.](/media/3d-printed-irish-whistle-stand/joint.jpg)
![The same wooden dowel attached to the cylindrical object but now the black snap connector is hidden, buried inside of a green box.](/media/3d-printed-irish-whistle-stand/joint-engaged.jpg)
{% endimagegrid %}


# Mid-Print Insertions

I also wanted to add weights to the legs, both to increase the stability of the whole apparatus and give them a more premium feel. I ended up designing cavities into the model into which I could insert pennies mid-print[^4][^5]. The result was that each leg required three pauses mid-print:

1. a pause to insert magnets at the bottom (you have to use a dab of superglue to hold magnets in place – otherwise they run the risk of being drawn upward to the magnetic components of the printer hotend),
2. a pause at the halfway mark to change from the green filament to the white, and
3. a pause at the top to insert the top magnets and the pennies.

![A 3D printer with a print in progress on the bed. The print is wavy and green on the bottom, but the upper layers that are printing now are white. The inside is filled with a wavy pattern of plastic, known as "gyroid infill." There are holes for the dowel mounts to snap into but between those holes are holes in which pennies and cylindrical nickel plated magnets have been embedded.](/media/3d-printed-irish-whistle-stand/insertions.jpg)

# Future Work

While I have delivered the gift (partially as an attempt not to keep designing for months without knowing how well it works already) there's already a couple areas I'd like to improve in future versions. I've made it clear to Emma that the gift is the design, not the physical object, and we will continue to print further iterations of it until it meets her needs.

## Connector stability

I set out trying to design a connector that would:

1. hold fast and, in particular, be able to hold the middle of the base where all three parts join together, and
2. be quick to assemble and disassemble, even if you have to do ten of them at a time,

My annular snap joint achieves criteria 2, but only partially achieves criteria 1. The center connection is fairly unstable with a whistle on it and I'll have to improve it in future iterations – especially because one of Emma's pieces of feedback upon receipt was that it would be nice to be able to grab the entire assembly from the center to move it once the whistles are on.

![The whistle stand on a desk, loaded with whistles, but the large whistle in the center is leaning to the left, the connector at its base having come dislodged](/media/3d-printed-irish-whistle-stand/leaning.jpg)

It's possible I need a stronger connector design – or possibly even just for the center piece. One of my original goals was to have all of the posts be interchangeable, but I think it would be reasonable to have a slightly different design for the center post. Perhaps I'll give the twist-and-lock connector another go.

## Top finish

3D printing is done layer by layer vertically, line by line, and I spend a lot of time trying to compensate for the visible extrusion lines to produce objects that are attractive and aesthetically polished. I tried a few different methods of finishing the top and finally settled on "ironing" in which the hot printer nozzle makes a final pass over the top layer at a fraction of the extrusion width to smooth out the lines. It also extrudes a small amount a filament as it goes to fill in the micro-gaps in the finish.

This is fairly effective, but, for whatever reason, there are some noticeable uneven bits in the finish of the base. I'd like to dial in my ironing settings – or come up with a different method of finishing the top that I prefer.

## Different shapes

The three-legged design came from Emma's original drawings (with my own aesthetic flourishes) but as I've been designing this I've been considering other shapes it could take, some of them potentially more stable or compact. A simple square with 3×3 mounts could take the same connectors but be somewhat more compact. Or perhaps there's a hinged base design that could fold up trifold-style, making it compact to travel, compact when laid out on a surface, and unfussy to assemble.

Of course, whether or not I explore these depends on whether there's interest in them – whether from Emma or someone else. I'm not a whistle player myself and have no need for a million different whistle stands – or even one.

# Details

The model was designed in [OpenSCAD][] – which some designers consider a form of masochism – using the [BOSL2 library][] – which makes it slightly less masochistic. I highly recommend it.

* The code is available on [GitHub][]
* Pregenerated models in a variety of configurations (different amounts of tolerance, different numbers of posts) are available on [Printables][].

[OpenSCAD]: https://www.openscad.org/
[BOSL2 library]: https://github.com/BelfrySCAD/BOSL2
[GitHub]: https://github.com/harrislapiroff/whistlestand
[Printables]: https://www.printables.com/model/802190-modern-irish-whistle-stand

[^1]: Sometimes called tin whistles (despite rarely being made of tin) or penny whistles.
[^2]: You may note that it is now March, famously *not* the month Christmas is in.
[^3]: At least for common "fused deposition modeling" (FDM) printers which lay plastic down out of a nozzle. Resin printers, by contrast, print downward from a hanging plate as it ascends up out of the liquid resin.
[^4]: As far as I can tell this is not illegal and in fact even destroying US coins is not illegal [so long as you do it in small quantities and don't aim to profit off of the material value of the metal](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-I/part-82), which is why those novelty penny press machines are permissible – though I'm not even destroying them here. N.b., this is not true for the coins of all countries.
[^5]: There's some joke about penny whistles in here.
