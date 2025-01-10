---
title: Changing the color of a character in Adobe Illustrator with scripting
date: 2025-01-10
categories: [Software]
tags: [graphic design, javascript, web]
images:
  blue:
    src: image.png
    alt: Screenshot of a stanza of lyrics with lyric lines divided by slashes. All text is blue.
  gray:
    src: image-1.png
    alt: Screenshot of a stanza of lyrics with lyric lines divided by slashes. The text is blue, but the slashes are a light gray.
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

I've been working on a CD album insert for [Emma](https://emmaazelborn.com/) as a design project. It has a lot of song lyrics and for compactness we've replaced line breaks in the lyrics with slashes:

{% image images.blue %}

I thought it would be nice if the slashes played their role as more muted visual elements rather than looking like prime elements of the content, so I decided to color them all gray.

{% image images.gray %}

This was a tedious thing to do manually one-by-one for roughly 150 slashes. I also couldn't find a way to do it quickly in the Illustrator GUI – find and replace worked only on text, not formatting, and I couldn't find other functionality that would work. I ended up writing a quick script in Javascript to do it for me:

```js
const docRef = app.activeDocument;
const story = docRef.stories[0];
const characters = story.textRange.characters;
const charStyle = docRef.characterStyles.getByName('Slash');

// Find all the slashes
var slashes = [];
for (var i = 0; i < characters.length; i++) {
    if (characters[i].contents === '/') {
        slashes.push(characters[i]);
    }
}

// Color all the slashes gray
for (var i = 0; i < slashes.length; i++) {
    charStyle.applyTo(slashes[i]);
}
```

This was a reasonably quick and pretty satisfying solution. I did need to manually create the character style for slashes and name it "Slash." I could have had the script do this, but it was easier to do this one-off task by hand and let me test exactly which gray I wanted. Then I ran the script with **File › Scripts › Other Script...**.

Though it is incredibly cool that Illustrator supports scripting with Javascript, it also, annoyingly, doesn't support the modern language features I've gotten used to writing Javascript for [Node][] or browsers. This script is reasonably simple as is, but it could have been very short if I'd been able to use [`.filter()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) and [`.forEach()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach). Instead I had to do the clumsy filtering and for loops seen above[^1]. It didn't even let me use [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) or [`let`][let][^2]! I hope Adobe will update this in future versions.

[^1]: Yeah, yeah, I could have collapsed it into one loop if I wanted, _fine_.
[^2]: This was especially confusing because I am under the impression that [`let`][let] and [`const`][const] were introduced into the language at the same time and it clearly tolerates the latter. It's possible I was actually running into a different issue – the debugging capabilities also weren't great and I didn't look into it for too long.

[Node]: https://nodejs.org/
[let]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
[const]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const
