---
title: Chord charts in InDesign
date: 2025-10-29
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
  songbook:
    src: HBL_4349.jpg
    alt: A purple songbook cover titled "Magnolia Sun" by Emma Azelborn, featuring a white magnolia flower illustration against a blue background with purple flowers.
  chordPage:
    src: HBL_4350.jpg
    alt: An open page from the songbook showing "Getting Easier" with chord symbols positioned above lyrics, demonstrating chord-over-lyrics formatting.
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/115458799783591919
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0w4XrjAzjV2Mhamke4LnrDwXgMGz8XeRRJYVdcuRFGxPBSjURMzP51wwWhcj51Hfal
---

{% image images.chordPage %}

Earlier this year, while designing the songbook for [Emma][]'s [Magnolia Sun][] album, I encountered the challenge of creating "[chord over lyrics][]" style chord charts.

[Emma]: https://emmaazelborn.com/
[Magnolia Sun]: https://emmaazelborn.com/projects/magnolia-sun/
[chord over lyrics]: https://en.wikipedia.org/wiki/Chord_chart#Format:_Chords_over_lyrics_(ASCII)

Emma provided me with a document of monospace-formatted lyrics with chords above each line, aligned exactly as she wanted them. She also wanted to indicate beats without chord changes – in this case using `/` marks, which is slightly less common for chord charts.

{% image images.ascii %}

I could have copied this into InDesign as is, changing the text styles for lines of chords to be distinct from lyrics and adjusting the spacing using the spacebar, but this would be frustrating if I made design revisions later that changed the metrics of my typefaces. I wasn't prepared to commit to the text styles from the outset. Changing typeface, size, weight, etc. would require me to redo the spacing manually for the entire book. Even if those styles *were* set in stone, proofreading changes would be an error-prone nightmare – changes to the lyrics would require also manually adjusting the chord spacing above them.

InDesign has a feature for positioning objects relative to a particular location in text: [anchored objects][]. With these, I was able to align chords above specific locations in the text and have them move when the text changed, maintaining their position relative to the text anchor.

[anchored objects]: https://helpx.adobe.com/indesign/using/anchored-objects.html

{% image images.anchored %}

Unfortunately, the process for creating an anchor requires navigating a tedious configuration modal, which I needed to do for every single chord change or beat marker – a total of over 1,000 instances.

{% image images.anchorSettings %}

Fortunately, I [have a hammer][illustrator-post] and I know a nail when I see one. I used [InDesign's scripting functionality][indesign-scripting] and, with some assistance from an LLM[^1], I was able to put together a script that would quickly add a chord annotation directly above wherever my cursor was:

[illustrator-post]: /2025/01/changing-the-color-of-a-character-in-adobe-illustrator-with-scripting/
[indesign-scripting]: https://helpx.adobe.com/indesign/using/scripting.html

[^1]: [Claude 3.7 Sonnet with Thinking][claude], my favored model for helping with coding tasks at the time I was working on this. Used via [GitHub Copilot][]'s VSCode integration. As of this writing, I'm more likely to be using [Anthropic][]'s own [Claude Code][].

[claude]: https://www.anthropic.com/news/visible-extended-thinking
[GitHub Copilot]: https://github.com/features/copilot
[Anthropic]: https://www.anthropic.com/
[Claude Code]: https://www.claude.com/product/claude-code

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
  <video src="/media/chord-charts-in-indesign/workflow.mov" autoplay controls loop playsinline></video>
</figure>

When Emma did an editing pass herself, I asked her to leave chords in the position that had been set for them relative to the anchor to minimize the risk of moving chords to the wrong location or losing track of where they were anchored. There were some instances where the default alignment wasn't close enough to what she wanted and in those situations it was helpful that InDesign's anchored objects *can* be moved freely when needed and still maintain their position relative to the anchor.

# A few notes on the script

Should you try to use this script yourself, here's a few things to note:

1. The script requires that paragraph styles for **"Chords"** and **"Beats"** already exist with those names.

2. Since Emma wanted beat markers, I wrote special handling to detect beats (so that it could apply the correct paragraph style) and to add non-breaking spaces between sequences of multiple beats (mostly used at the ends of lines for beats before the next line).

3. Unfortunately, I wrote a bug into the line that identifies when I was inserting a beat `/` intead of a chord. The script incorrectly classifies "slash chords" (which indicate a chord with a different bass note, like `G/A`) as beat markers because they contain a `/` character. There were few enough slash chords in the book that it would have been more work to fix this than to manually correct the few instances.

4. In the end, we decided on a slightly more ornate style for slash chords that was easier to format manually anyway.

   {% image images.slash %}

5. If I were doing this project again, I would have asked Emma to format the chords interspersed with the text, maybe offset with square brackets, e.g.,

   ```
   [C]it's been g[/]etting h[F]ard[/]er to [C]sing[/  /  /]
   ```

   or something similar. I think I could have written a script that would process that and create all the anchor objects in one go. By the time I had this insight, I figured it would take her as much time to redo the text doc as it would take me to finish formatting the chords one by one in InDesign.

***

The "Magnolia Sun" songbook and album both are [available for purchase online](https://emmaazelborn.bandcamp.com/).

{% image images.songbook %}

{% button "Buy the album" "https://emmaazelborn.bandcamp.com/album/magnolia-sun" %} {% button "Buy the songbook" "https://emmaazelborn.bandcamp.com/merch/magnolia-sun-songbook-liner-notes" %}

You can also listen on your [favorite streaming service](https://album.link/b/1983118898), wherever that may be.
