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
    caption: I may 3D print some parts to tidy this up a bit later – in fact you can already see that I printed a backing for the buttonboard to make it sturdier.
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
    caption: The defects in question.
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/113918642210378397
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid05cQugqYam8AysmrSeuFbs1EyMjfV8tUAQCAfZFoojwNibkoK5wMYKTYfXWYMqKyml
---

Last year my 2015 (or possibly late 2014) iMac died after a decade of service. Around the same time I acquired a new Mac mini. Unlike the iMac, the Mac mini doesn't have a built-in monitor. I needed to acquire a new one. Unfortunately even newer displays in my price range would be a quality-of-life step down from the iMac screen I was migrating away from. New 5K monitors are $800+ and better quality ones – such as the [$1,600 Apple Studio Display][asd] – are much more expensive.

[asd]: https://www.apple.com/studio-display/

I opted to save money and reduce electronics waste by repurposing the still-intact iMac screen. Sadly, when Apple released the "Retina Display" 5K iMac in 2014, they discontinued [the functionality][target display] that allowed iMacs to serve as displays for other computers[^1]. Using it this way now requires buying a "driverboard" to serve as the liaison between my Mac mini and the iMac screen, gutting the iMac, and installing the driverboard inside the empty chassis.

[^1]: I believe, at the time, this was understandable, as none of the external ports on an iMac could support 5K video. It is a bit of a shame that they have never added this feature back though given the evidence that for all-in-one computers, some components are exhausted faster than others.

[target display]: https://support.apple.com/en-us/105126

Fortunately, this is territory many have trodden before and there's many public posts detailing the process. I largely followed the instructions in [this blog post from Scott Yoshinaga][omp post], which was enormously helpful. The entire process took me a few evenings over the course of three weeks – with waiting time for deliveries between steps.[^2]

[omp post]: https://ohmypizza.com/2023/04/converting-a-5k-imac-into-an-external-5k-display

[^2]: As well as some out of town travel that delayed me.

*The major exception* to my following Yoshinaga's blog post was this: rather than purchasing a driverboard similar to the one he used from eBay, I searched AliExpress for boards and found (among surprisingly many options) [one that supported a connection via a single Thunderbolt/USB-C DisplayPort cable][driverboard]. This reduced the number of adapters and cables I'd need in order to use it with my computers, which all have Thunderbolt ports. Most listings included an instruction to send a photo of your monitor panel to the shop in advance to verify that you were purchasing the right board, which I did and found reassuring. I was still nervous and so it was a pleasant surprise when it arrived and worked out-of-the box!

{% image images.functional-board %}

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

Quite a bit cheaper than a new $1,600 display! I did cheap out on the board and get one that only supports 8 bit color depth rather than the full possible 10 bit. Frankly I'm not sure I fully know what that means and I can't really tell the difference. The screen looks great. (And for reasons I'll explain later, maximizing color accuracy didn't seem worthwhile for this screen.) I had a few things already that saved me some money in purchases:

* iFixit screwdriver kit[^3]
* Zip ties/zip tie anchors
* The iMac

[^3]: Though in the event it did not contain the humongous T25 6-pointed star bit needed for one of the screws in the iMac and I had to improvise by using a slightly off-size triangular bit instead.

Even if I had bought those, this still was much cheaper. Even purchasing iMacs of that generation can be done readily for $200–400. If you're lucky you can find a broken one that has the screen intact for even a bit cheaper[^4].

[^4]: Though my experience is that those ones get snapped up pretty quickly and ones listed "for parts" on eBay usually have a cracked screen – which, alas, is the part I want.

The project was overall successful, though there are a few things I'm somewhat dissatisfied with:

The driverboard included USB-A ports for mouse and keyboard peripherals as well as an audio jack – all of which connect through to the computer that's attached via USB-C/Thunderbolt. This allows the display to also serve as a peripheral hub. That's not a thing I'm dissatisfied with; it's actually extremely nice! I purchased 1 foot extender cables to expose those ports outside the chassis. Unfortunately once I had it completed I noticed that my speakers produce a constant high-pitched tone when plugged in. I wish I had noticed this before I sealed it up! Maybe next time I open it, I'll see if it's fixable, but until then I can't use the audio port in that state. The USB-A ports work great, though.

The attached buttonboard is pretty awkward and the ribbon cable it came with is pretty short. I have it poking out of the chassis, but haven't figured out any ergonomic place to attach it. I wish it supported OS control of the brightness and contrast, because adjusting them with the buttonboard is *a process.*

{% image images.back %}

The chassis is larger than necessary since it used to have full iMac internals in it. It would have been pretty cool to figure out a way to build a custom chassis that was smaller and lighter – and more naturally incorporated the buttonboard and ports. But that was a bigger project that I was up for and I haven't seen yet anyone who has done so.

One reason I didn't prioritize maximizing the display's color capabilities was that it *already* has some image quality issues. I'm not sure if these were production defects I didn't notice until late or issues it acquired over its lifetime – I got it used, so I also don't know everything it's been through. there's a pinkish tint to the edge of the panel and a splotch in one corner that looks like moisture damage or something. These are really only noticable when looking at something with a bright white background, however.

{% image images.defect %}

The driverboard also has a speaker port, which I assume could be connected to internal iMac speakers. It didn't come with a cable to do so, however, and it didn't seem worth figuring out what I would need *and* how to fit the board and speakers both in the chassis, just to have access to speakers that are lower quality than my existing desk speakers.

Though I largely plan to use the monitor via the USB-C/Thunderbolt cable, I exposed an HDMI cable as well, just in case.

In spite any flaws, overall, I'm *delighted* with how this project turned out. It saved me a lot of money on a new display and I had a lot of fun with the process of doing it. I'm even considering buying *another* used iMac to build myself a second 5k display!

{% image images.done %}

A few more photos of my process:

{% image images.separating %}

{% image images.separating-picks %}

{% image images.full-chassis %}

{% image images.panel-back %}

{% image images.speakers %}

{% image images.circuitboards %}

{% image images.empty-chassis %}

{% image images.board-taped %}

{% image images.functioning %}

{% image images.locked-down %}

{% image images.adhesive %}

{% image images.back-done %}
