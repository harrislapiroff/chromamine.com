---
title: Chord charts in InDesign
date: 2025-04-05
categories: [Software]
tags: [graphic design, javascript, web, LLMs]
images:
  ascii:
    src: ascii.png
    alt: Screenshot of a monospace text document with lines of lyrics interspersed with lines of chord symbols. The chord symbols are aligned above the word that corresponds to the moment of chord change.
  anchored:
    src: anchored.png
    alt: Lyrics text set in an elegant serif font. Above each line of lyrics is a line of chords in the same font, but bolder.
  anchorSettings:
    src: settings.png
    alt: A settings panel titled "Insert Anchored Object" with a suite of dropdowns, number inputs, and checkboxes to configure.
  slash:
    src: slash.png
    alt: A line of lyrics labeled "Outro." Above the lyrics is a line of chords, one of which is C/D where the C is raised above a diagonal slash and the D is lowered below it, like a fraction.
xposts:
  - label: Mastodon
    url: TBD
  - label: Facebook
    url: TBD
---

In working on the design for the songbook for [Emma][]'s [Magnolia Sun][] album, I was presented with a technical problem — how to create "[chord over lyrics][]" style chord charts, with no musical staves, just lines of chord annotatons interspersed with lines of lyrics.

[Emma]: https://emmaazelborn.com/
[Magnolia Sun]: https://distrokid.com/hyperfollow/emmaazelborn1/magnolia-sun
[chord over lyrics]: https://en.wikipedia.org/wiki/Chord_chart#Format:_Chords_over_lyrics_(ASCII)

She provided me with a document of monospace formatted lyrics with chords above each line, aligned directly about the lyric she wanted them on. In a slightly less usual format for these style of chord charts, she also wanted to indicated beats without chord changes – in that case using `/` marks.

{% image images.ascii %}

I could have just formatted these in InDesign as is, alternating lines of chords and lyrics and spacing out the chords with spaces. I quickly realized that this would be frustrating if I made design revisions later that would change the metrics of my selected typefaces – changing the typeface, changing the size, changing the weight/optical size, etc. of either chords or lyrics. Even without changes like those, proofreading changes would be an error-prone nightmare if we changed a line of lyrics without remembering to adjust the line of chords above it.

InDesign has a feature for positioning objects relative to a particular point in text, [anchored objects][]. With these, I was able to align chords above specific locations in the text and have them move when the text changed, maintaining their position relative to the text anchor.

{% image images.anchored %}

Unfortunately the process for creating an anchor is a tedious process of configuration. It would be a lot to do the 1,000+ times required to format the songbook.

{% image images.anchorSettings %}

Fortunately, I [have a hammer][illustrator-post] and I know a nail when I see one. I used [InDesign's scripting functionality][indesign-scripting] and, with some assistance from an LLM[^1], I was able to put together a script that would quickly add a chord annotation directly above wherever my cursor was:

[illustrator-post]: /2025/01/changing-the-color-of-a-character-in-adobe-illustrator-with-scripting/
[indesign-scripting]: https://helpx.adobe.com/indesign/using/scripting.html

[^1]: [Claude 3.7 Sonnet with Thinking][claude], my favored model for helping with coding tasks lately.

[claude]: https://www.anthropic.com/news/visible-extended-thinking

```js
// insert-chord.jsx
// Script to insert a chord symbol above a line of text

(function() {
    var CHORD_PARAGRAPH_STYLE = "Chords"
    var BEAT_PARAGRAPH_STYLE = "Beats"

    // Check if a document is open
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // Check if there's a text insertion point
    if (app.selection.length === 0 || 
        !(app.selection[0].hasOwnProperty("baseline") || 
          app.selection[0].constructor.name === "InsertionPoint")) {
        alert("Please place your cursor in a text frame first.");
        return;
    }
    
    // Get the current insertion point
    var insertionPoint;
    if (app.selection[0].constructor.name === "InsertionPoint") {
        insertionPoint = app.selection[0];
    } else {
        insertionPoint = app.selection[0].insertionPoints[0];
    }
    
    // Prompt for chord name
    var chordName = prompt("Enter chord name (e.g., A, Gdim, C#m):", "");
    
    // If user cancels or enters empty string, exit
    if (chordName === null || chordName === "") {
        return;
    }

    // If the chord is a series of slashes, separate them with nonbreaking spaces
    if (/\/+/.test(chordName)) {
        const isBeat = true;
        chordName = chordName.replace(/\//g, "/\xa0\xa0")
    }
    
    // Start a transaction for undo
    app.doScript(function() {
        try {            
            // Create an anchored text frame
            var anchoredFrame = insertionPoint.textFrames.add();
            
            // Set frame content
            anchoredFrame.contents = chordName;
            
            // Apply the appropriate paragraph style
            try {
                var styleName = isBeat ? BEAT_PARAGRAPH_STYLE : CHORD_PARAGRAPH_STYLE;
                var chordStyle = doc.paragraphStyles.itemByName(styleName);
                if (chordStyle.isValid) {
                    anchoredFrame.texts[0].appliedParagraphStyle = chordStyle;
                } else {
                    alert("Warning: '" + styleName + "' paragraph style not found. Using default style.");
                }
            } catch (e) {
                alert("Error applying style: " + e);
            }
            
            // Position the anchored frame above the line, centered above the anchor point
            anchoredFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_LEFT_ANCHOR;
            anchoredFrame.anchoredObjectSettings.anchoredPosition = AnchorPosition.ANCHORED;
            anchoredFrame.anchoredObjectSettings.horizontalAlignment = HorizontalAlignment.CENTER_ALIGN;
            anchoredFrame.anchoredObjectSettings.verticalAlignment = VerticalAlignment.BOTTOM_ALIGN;
            anchoredFrame.anchoredObjectSettings.verticalReferencePoint = VerticallyRelativeTo.TOP_OF_LEADING;
            anchoredFrame.anchoredObjectSettings.horizontalReferencePoint = AnchoredRelativeTo.ANCHOR_LOCATION;
            anchoredFrame.anchoredObjectSettings.pinPosition = false;
            
            // Enable auto-sizing of the text frame
            anchoredFrame.textFramePreferences.autoSizingType = AutoSizingTypeEnum.HEIGHT_AND_WIDTH;
            anchoredFrame.textFramePreferences.autoSizingReferencePoint = AutoSizingReferenceEnum.BOTTOM_CENTER_POINT;

            // Disable wrapping (for cases like "/  /  /")
            anchoredFrame.textWrapPreferences.textWrapMode = TextWrapModes.NONE
        } catch (err) {
            alert("Error: " + err);
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Insert Chord");
    
})();
```

I was able to bind the script to a keyboard shortcut, which produced a reasonably smooth workflow for adding chords over lyrics.

<figure>
  <video src="/media/chord-charts-in-indesign/workflow.mov" autoplay controls />
</figure>

I encouraged Emma to try to leave the chords in their default position relative to the text anchors when she was editing, to minimize the risk we moved some chord to the wrong location, but in some cases, when she wasn't able to get the alignment exactly right, it was helpful the InDesign's anchored objects *could* be moved freely and would still retain their position relative to the anchor.

# A few notes on the script

1. This script requires that paragraph styles for **"Chords"** and **"Beats"** already exist.

2. Since Emma wanted beat markers, I some special handling to the script, both to detect beats (so that it could apply the correct paragraph style) and to add non-breaking spaces between sequences of multiple beats, to space them out (mostly used at the ends of lines for beats before the next line).

3. Unfortunately I miswrote the line that detects the beat format and it would fire false positives on "slash chords" (which indicate a chord with a different bass note) such as `G/A`. Fortunately there were few enough slash chords in the book that it would have been more work to fix this than just correct the few instances there were.

4. In the end we decided on a slightly more ornate style for slash chords that was easier to format manually anyway.

   {% image images.slash %}

5. If I were doing this project again, I would have asked Emma to format the chords interspersed with the text, maybe offset with square brackets, e.g.,

   ```
   [C]it's been g[/]etting h[F]ard[/]er to [C]sing[/  /  /]
   ```

   or something similar, which would have made it easier to write a script that could process the text as a single stream and automatically create the anchor objects for me. By the time I had this insight I figured it would have taken her as much time to redo her text doc as it would take me to just do it in InDesign.


# Working with an LLM

For this project I opted to go all in on prompting [Claude][claude] to write much of the code for me via [GitHub Copilot][]'s VSCode integration.

[GitHub Copilot]: https://github.com/features/copilot

Claude didn't get everything right, but it got enough that it saved me a lot of research. It generated almost all of the validation at the start of the script, which I would have skipped if I had done it myself, but which did save me some debugging later on when I misnamed a paragraph style. It also created the `app.doScript` wrapper. This wasn't functionality I knew about, but which allowed me to undo the entire script as a single action, which made the workflow of using it much smoother.

Mostly it *didn't* get the code for positioning the anchor settings right and when I gave it increasingly specific instructions for fixing it, it either continued to get it wrong or make up APIs that didn't exist and threw errors. It wrote some code in this section that I was able to use as a guide for what to look up and how to structure it, but ultimately I wrote most of that bit myself.

This turned out to be a good candidate for working heavily with an LLM and only doing minimal checking of its code. Not quite "[vibe coding][]" but something a little further toward that end than writing it myself. It was a one-off script where the fact *that it works* was much more important to me than understanding *how it works*. Additionally InDesign's scripting capabilities are *very poorly* documented and I didn't want to spend more time than I had to with it. The official docs are limited to [this single brief page][id-docs] or a [long PDF][id-pdf]. I found a prety [helpful third party site][id-3p] that was painful to browse for a human, but helpful for the bits I ultimately did have to write myself.

[vibe coding]: https://en.wikipedia.org/wiki/Vibe_coding
[id-docs]: https://helpx.adobe.com/indesign/using/scripting.html
[id-pdf]: https://helpx.adobe.com/content/dam/help/en/indesign/using/scripting/adobe-introduction-to-scripting.pdf
[id-3p]: https://www.indesignjs.de/extendscriptAPI/indesign-latest/

***

The songbook is not yet printed or available for purchase online, but the album Magnolia Sun is and, I may be biased, but it's a wonderful record and I can't recommend it enough.

{% button "Buy Magnolia Sun on Bandcamp" "https://emmaazelborn.bandcamp.com/album/magnolia-sun" %}

You can also listen on your favorite streaming service, wherever that may be.