---
title: Converting an old iMac to a 5K display
date: 2025-01-30
categories: [Software]
tags: [hardware, technology]
images:
  separating:
    src: 1-separating-tool.jpeg
    alt: The edge of a glass iMac screen with a black tool resembling a plastic pizza cutter being run along the edge between glass and aluminum.
    caption: Cutting the adhesive between the glass panel and the chassis using an [iFixit iMac fix kit](https://www.ifixit.com/products/imac-intel-27-2012-2019-adhesive-strips).
  separating-picks:
    src: 2-separating-picks.jpeg
    alt: iMac with a handful of blue plastic shaped like guitar picks inserted at various points around the edge of the displace, separating the glass from the aluminum.
    caption: Gently and gradually separating the glass from the chassis with [iFixit Opening Picks](https://www.ifixit.com/products/ifixit-opening-picks-set-of-6).
  full-chassis:
    src: 3-full-chassis.jpeg
    alt: An iMac chassis resting on its back on a table. The glass screen has been removed, exposing a number of black circuitboards and black plastic parts. The internals are a bit dusty.
    caption: An iMac full of components.
  panel-back:
    src: 4-panel-back.jpeg
    alt: A steel rectangle with two black ribbon cables running across it. It is edged with a perimeter of black glass.
    caption: Glass screen panel, seen from the back.
  speakers:
    src: 5-speakers.jpeg
    alt: Two large, irregularly shaped, black plastic objects with two speaker drivers on each—one on the bottom and one in the middle. They appear contoured to fit in the sides of a rounded iMac chassis.
    caption: The two internal speakers, charmingly asymmetrical and contoured to fit inside the iMac.
  circuitboards:
    src: 6-circuitboards.jpeg
    alt: Two large black and silver circuitboards. One has ports and a large grill attached. The other has copper coils and large capacitors.
    caption: The motherboard and power management unit.
  empty-chassis:
    src: 7-empty-chassis.jpeg
    alt: An iMac chassis with most of the component removed. Only a few stray wires remain.
    caption: The iMac with most of its stuff removed.
  functional-board:
    src: 8-functional-board.jpeg
    alt: The iMac glass screen, separated from the chassis, plugged into a green circuitboard with cables extending from it. On the screen is an image from a TV show and a configuration panel.
    caption: It works!
  board-taped:
    src: 9-board-taped.jpeg
    alt: The metal back of the iMac glass panel with the circuitboard and cables taped off to one side with blue painters tape.
    caption: Testing the placement of the driverboard by taping it down before holding the panel on the chassis.
  functioning:
    src: 11-functioning.jpeg
    alt: The iMac reassembled, except the glass panel is held on with blue painters tape running across the width of the screen.
    caption: The board fits in the chassis and it works while assembled! This was just testing though, so I'm holding it on with tape so it doesn't fall off and shatter, since there's no adhesive yet.
  back:
    src: 10-back.jpeg
    alt: The back of an iMac with a rectangular panel behind the stand removed from the chassis. A mess of cables and a green circuitboard extend from out the rectangular hole.
    caption: The back isn't the prettiest, but it's functional. I may 3D print a part to tidy it up a bit later.
  locked-down:
    src: 11-locked-down.jpeg
    alt: The metal back of the glass panel. The cables and circuitboard are now all stuck down to the panel with double-sided tape and zip-tie anchors.
    caption: Now that I know it fits, I lock down the position of the board and cables with double-sided tape and zip ties. (I 3D printed the [zip tie anchors](https://www.printables.com/model/132296-zip-tie-anchor)!)
  adhesive:
    src: 12-adhesive.jpeg
    alt: The empty iMac chassis with white strips attached to blue plastic numbered labels around the edge.
    caption: Time to attach the adhesive!
  done:
    src: 13-done.jpeg
    alt: The iMac fully reassembled and showing a desktop picture of a forest with a macOS System Settings window centered on the screen.
    caption: Fully sealed up and working!
  back-done:
    src: 14-back.jpeg
    alt: The back of the iMac, still showing a mess of cables protruding from a rectangular hole. They're slightly tidied with cable holders.
    caption: Another shot of the back, slightly tidied up.
  defect:
    src: 15-defect.jpeg
    alt: A corner of the imac screen showing a white pixel field. There's a pinkish tint at the edges and a slightly darkened splotch.
    caption: The defect in question.

# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

Last year my 2015 iMac died after nearly a decade of service. Around the same time I acquired a new Mac mini. Unlike the iMac, the Mac mini doesn't come with a built-in monitor, so I needed to acquire a new one. Unfortunately affordable displays are lower pixel density and typically lower quality than the iMac screen I was migrating away from. 5K monitors are $800+ and better quality ones – such as the [$1,600 Apple Studio Display][asd] – are much more expensive.

[asd]: https://www.apple.com/studio-display/

I decided I could save money and reduce electronics waste, by repurposing my still-intact iMac screen. Unfortunately, when Apple released the "Retina Display" 5K iMac, they also discontinued [the functionality][target display] that would allow one to use an iMac as a display just by plugging it in. Repurposing it would require buying a "driverboard" to serve as the liaison between my Mac mini and the iMac screen, gutting the iMac, and installing the driverboard inside the empty chassis.

[target display]: https://support.apple.com/en-us/105126

Fortunately, this is territory many have trodden before and there's a number of blog posts detailing the process online. I largely followed the instructions in [this post from Scott Yoshinaga][omp post], which was enormously helpful. The entire process took me several evenings over the course of a month – with time ordering parts and waiting for delivery between steps.[^1]

[omp post]: https://ohmypizza.com/2023/04/converting-a-5k-imac-into-an-external-5k-display

[^1]: As well as some out of town travel that delayed me.

*The major exception* to following Yoshinaga's blog post is that rather than purchasing a driverboard similar to the one he used from eBay, I searched AliExpress for boards and found ones with a variety of port arrangments and specs. I [selected one][driverboard] that supported a connection via a single Thunderbolt/USB-C DisplayPort cable, which reduced the number of adapters I'd need in order to use it with my Thunderbolt computers. Most listings of boards like this included an instruction to send a photo of your monitor panel to the shop in advance to verify that you were purchasing the right board, which I did and found reassuring. Nonetheless it was a pleasant surprise when it arrived and worked out-of-the box!

[driverboard]: https://www.aliexpress.us/item/3256806199842016.html?spm=a2g0o.order_list.order_list_main.5.f58b1802yMVsFj&gatewayAdapt=glo2usa

The breakdown of costs for this project:

<!-- note the no-break spaces in this table to preserve $ alignment -->

| Part                        | Cost        |
|-----------------------------|-------------|
| Driverboard                 |   $147.61   |
| USB-A extenders (1ft) ×2    |   $  6.33   |
| Audio cable extender (1ft)  |   $  6.36   |
| Thunderbolt cable (6ft)     |   $ 28.68   |
| 12V 6A AC adapter           |   $ 15.50   |
| iFixit iMac repair kit      |   $ 21.24   |
| **Total**                   | **$225.72** |

Quite a bit cheaper than a new $1,600 display! I did cheap out on the board and get one that only supports 8 bit color depth rather than the full possible 10 bit. Frankly I'm not sure I fully know what that means and I can't really tell the difference. The screen looks great. (And for reasons I'll elaborate on later, maximizing color accuracy didn't seem worth it for this screen.) I did have a few things already on hand that I needed, notably:

* iFixit screwdriver kit
* Zip ties/zip tie anchors
* The iMac

Even if I had to buy those, this still would have been much cheaper. Used iMacs of that generation can be found readily online for $200–400 and if you're lucky you can find a broken one that has the screen intact for even a bit cheaper.

Some photos of my process:

{% image images.separating %}

{% image images.separating-picks %}

{% image images.full-chassis %}

{% image images.panel-back %}

{% image images.speakers %}

{% image images.circuitboards %}

{% image images.empty-chassis %}

{% image images.functional-board %}

{% image images.board-taped %}

{% image images.functioning %}

{% image images.back %}

{% image images.locked-down %}

{% image images.adhesive %}

{% image images.done %}

{% image images.back-done %}

There are a few things I'm somewhat dissatisfied with:

The driverboard included USB-A ports for mouse and keyboard peripherals as well as an audio jack – all of which connect through the the computer that's attached via USB-C/Thunderbolt. This allows the display to also serve as a peripheral hub, which is extremely nice! I purchased 1 foot extenders to expose those ports outside the chassis. Unfortunately once I had it completed I noticed that my speakers produced a constant high-pitched tone when plugged in. I wish I had noticed this in my testing before I sealed it so I could have checked if there was some adjustment of cables that would fix it. As it stands, I can't use the audio port in that state. The USB-A peripheral ports work great, though!

The driverboard also had a speaker port, which I assume could be connected to the internal iMac speakers. It didn't come with a cable to do so, however, and it didn't seem worth figuring out what I would need *and* how to fit the board and speakers both in the chassis, just to have access to some speakers that are lower quality than my existing desk speakers.

Though I largely plan to use the monitor via the USB-C/Thunderbolt cable, I exposed an HDMI cable as well, just in case.

The attached buttonboard is pretty awkward and the ribbon cable it came with is pretty short. I have it poking out of the chassis, but haven't figured out any ergonomic place to attach it. I wish it supported OS control of the brightness and contrast and rendered the buttonboard unnecessary.

The chassis is larger than necessary since it used to have full iMac internals in it. It would have been pretty cool to figure out a way to build a custom chassis that was smaller and lighter – and more naturally incorporated the buttonboard and ports. But that was a bigger project that I was up for and I haven't seen yet anyone who has done so.

One reason I got a cheaper board that only supported 8-bit color depth instead of 10 was that the iMac display already has some image quality issues. I'm not sure if these were production defects I didn't notice until late or issues it acquired over its lifespan (I got it used, so I also don't know everything it's been through) but there's a pinkish tint to the edge of the panel and a splotch in one corner that looks like moisture damage or something. These are really only noticable when looking at something with a bright white background, however.

{% image images.defect %}

Overall, I'm really happy with this project. It saved me a lot of money on a new display and I had a lot of fun with the process of doing it. I'm considering buying another used iMac to build myself another a second 5k display!