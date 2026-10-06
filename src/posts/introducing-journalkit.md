---
title: Introducing Journalkit
date: 2026-10-05
categories: [Software]
tags: [life, writing, machine learning]
excerpt: "Journalkit is a piece of software for a specific kind of person: someone who wants to design their own physical daily journal for handwriting in, but prefers to think in code, modules, and measurements while doing so."
# eleventyExcludeFromCollections: true
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

Journalkit is a piece of software for a specific need and a specific kind of person: someone who wants to design their own physical daily journal for writing in, but prefers to think in code, modules, and measurements while doing so.

{% button "Use JournalKit →" "http://harrislapiroff.github.io/journalkit/" %} {% button "Download Harris’s Pages 105mm × 170mm (.zip) ↓" "/media/introucing-journalkit/out.zip" %}

![](/media/introducing-journalkit/img-8746.jpg)

At various times in my life I've tried to keep a daily(-ish) journal, but never successfully in the long term. I wanted to give it another go. I want my journal to serve a few purposes:

* **Productivity:** Help me organize the day ahead of me in the morning and reflect on how it went in the evening.
* **Mindfulness:** Take space to reflect on my thoughts and feelings from the day.
* **Life record:** Months or years later, I'd like to be able to look back and see what I was thinking or feeling at a given time, maybe even look for trends in things that made me feel good or bad or habits that made my life better or worse.

For a time I was using [CGP Grey/Cortex’s seasons journal][seasons] and I've taken a lot of inspiration from that[^1]. That journal is deliberately designed to be flexible, with pages of unlabeled boxes. There's hinted at purpose to the pages, but it's not prescribed. Over daily use for a time, I found specific ways I liked to use those boxes.

[seasons]: https://chromamine.com/2024/01/season-of-tidiness/

[^1]: Including swiping their half-complete/full-complete checkbox design wholesale.

At the same time, I found myself falling off the wagon. That’s OK. A daily habit can still be useful even if you don’t do it literally *every* day and, as [Ruthie][] regularly reminds me, if a particular tool or system brings benefit to your life, even if you don’t stick with it, it still brought that benefit while you used it. For those of us who need regular novelty in the systems of our daily life, that novelty can be well worth chasing.

[Ruthie]: https://ruthiebyers.com/

Now that I had a better understanding of my daily journaling desires, I could design a journal to fit my specific needs. In the process I would make something that was a bit “stickier” for me personally. When I make something, I find it more compelling than alternatives, because it’s bespoke to my needs *but also* because using it gives me the feeling of accomplishment and joy that comes from having scratched my own itch.

I first started laying it out in Illustrator and InDesign, but found the process tedious – making modules line up on a grid, then carefully remaking it when I decided to rearrange. I found myself compromising on my ideal design to do things that were easier technically.

So, instead, I specced out my ideal system for writing out journal page templates *in code*, then handed that spec to an [LLM coding agent][claude] to flesh out and implement into a framework. With some iteration (which continues even now), I arrived at something that let me experiment with page designs freely and flexibly. The library itself is "[vibe-coded][]" but the ideas feel wholly mine. And then I used it to make my journal.

[claude]: https://code.anthropic.com/
[vibe-coded]: https://en.wikipedia.org/wiki/Vibe_coding

I printed a week's worth of pages, iterated on the design based on how using them felt, tried it for a few more weeks, iterated some more and then added some weekly pages, working my way out from the more granular daily journaling to broader swaths of time.

{% imagegrid %}
  ![Daily page front side with morning and evening mood logging, reflection, task lists, and gratitude](/media/introducing-journalkit/daily-recto.svg)
  ![Daily page back side with added writing space and more tasks](/media/introducing-journalkit/daily-verso.svg)
  ![Weekly page front size with a theme, daily habits, and a week calendar](/media/introducing-journalkit/week-recto.svg)
  ![Weekly page back side with weeklong tasks and writing space](/media/introducing-journalkit/week-verso.svg)
{% endimagegrid %}

{% button "Download Harris’s Pages (.zip) ↓" "/media/introucing-journalkit/out.zip" %}

## Notes on the Physical Journal

My journal uses a cheap but attractive faux-leather A6 binder that I found on Amazon. Using a binder lets me fill in printed pages, add new pages when I redesign them, and retire old pages to my archives, eventually.

Most paper advertised as A6 binder paper on Amazon is actually a larger size. This turns out to be nice, because A6 paper is *small*, but the sizes aren't especially standardized. I bought a set that was 105mm x 170mm, which I like, but which only seems to be sold by one seller. I noticed that a slightly more standard size seems to be "Personal" 95mm x 172mm. Not wanting to be limited to a single seller, I tried switching to that, but it turns out the extra centimeter of width is significant! My trusty old Brother laser printer can't handle paper any narrower than that! So I've switched back to the quirky size and bought a bunch to last me a while. If I run out and it stops being sold, I'll cross that bridge when I get there.

It also turns out my Brother printer refuses to duplex print paper that's as small as this, so I end up printing a batch of one-sided *recto* pages and then run the same prints through a second time to print the *verso* side.

I can imagine things about the physical journal that could be nicer – I'd like a built in pocket sized for an AirTag so I worry less about losing it, I'd like pockets sized especially for the tools I want to keep inside it (small metal straightedge, sheets of decorative and functional stickers), I'd prefer a magnetic clasp to a snap – so I'm tempted to learn some basic leatherworking to make my own journal cover... but that will have to be a project for a future date.

ADD PHYSICAL PHOTOS HERE

## Using JournalKit

JournalKit takes a YAML definition of a page template and generates SVGs, PNGs, and PDFs from that definition. It’s inspired by the structure of static site generators, like the [one the powers this site](https://chromamine.com/2023/10/eleventy/).

A quick start with JournalKit looks like:

```sh
# First-time to install and start a new project
pipx install journalkit
journalkit init my-journal && cd my-journal

# Watch the project for updates and continuously generate output files including PDFs
journalkit watch --pdf
# OR build the project just once
journalkit build --pdf
```

Here’s the YAML input for my actual daily journal page:

```yaml scroll title="daily.yaml"
document: daily

page:
  size: [105, 170]
  # Every margin is an even number: the module grid is 2mm and is anchored to
  # the page, so an odd margin would put the whole text block off-grid.
  margins:
    top: 2
    bottom: 8
    inner: 16      # binding side — enough to clear the stitching
    outer: 5       # odd, so that the text block width (95 - 16 - 5) is even

grid:
  module: 2        # every module snaps to this
  dots:
    spacing: 4
    origin: [0, 2]     # page-anchored, so dots line up across modules
    radius: 0.125

defaults:
  gap: 2           # default vertical gap between modules

theme:
  ink: "#000"            # one colour for strokes, text and dots
  stroke_width: 0.25pt
  font:
    family: Montserrat
  label:
    size: 8pt
    weight: 500
    dy: 4          # baseline below the module's top edge. The 3.55 default
                   # optically centres an 8pt cap in a 5mm row; rows are 6mm
                   # on this grid, so (6 + 1.976) / 2 ≈ 4 centres it again.
  heading:
    size: 12pt
    weight: 700
  dots:
    reserve_label: text

# Drawn on every page; `inner` mirrors automatically between recto and verso.
decorations:
  - type: rule
    edge: inner
    offset: 4        # even, so the rule sits on the 2mm grid like everything else

templates:

  daily-front:
    side: right
    content:
      - type: fields
        height: 6
        columns:
          - {label: DATE, width: 28}
          - {label: "LOC."}            # takes the rest

      # Blank line for the day's theme or title — "First day in Spain!".
      # Unlabelled on purpose: it is one writing line, matching the row above.
      - type: box
        height: 6

      - type: heading
        text: MORNING
        icon: sunrise
        gap: 2

      - type: rating
        label: MOOD
        icon: mood
        count: 5
        gap: 0

      - type: box
        label: NOTES/REFLECTION
        height: fill
        dots: true

      - type: checklist
        rows: 3
        row_height: 4
        row_gap: 2

      - type: heading
        text: EVENING
        icon: moon
        gap: 4

      - type: rating
        label: MOOD
        icon: mood
        count: 5
        gap: 0

      - type: box
        label: NOTES/REFLECTION
        height: fill          # absorbs whatever is left
        dots: true

      - type: box
        label: GRATITUDE
        height: 26
        dots: true

      # Footer nudge to keep the weekly spread in sync with the dailies.
      - type: text
        text: "DON’T FORGET TO UPDATE YOUR WEEKLIES"
        align: center
        size: 8pt
        gap: 8
        weight: 400

  daily-back:
    side: left
    content:
      - type: box
        label: CONTINUED
        height: fill
        dots: true

      - type: checklist
        rows: 8
        row_height: 4
        row_gap: 2


pages:
  - template: daily-front
  - template: daily-back
```

And the output is the daily pages seen above.

JournalKit comes with a suite of customizable, rearrangeable [modules][], but it also supports defining [your own modules as Python code][custom-modules]. 

[modules]: https://harrislapiroff.github.io/journalkit/reference/modrules/
[custom-modules]: https://harrislapiroff.github.io/journalkit/guide/custom-modules/

This is a very niche piece of software, but I've found it handy and a joy to use, so maybe someone else out there will find something useful about it as well.

{% button "Use JournalKit →" "http://harrislapiroff.github.io/journalkit/" %}
