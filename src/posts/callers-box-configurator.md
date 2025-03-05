---
title: Caller's Box Configurator
date: 2025-03-05
categories: ['Dance', 'Software']
tags: [contra, calling, choreography]
images:
  screenshot:
    src: screenshot.png
    alt: Screenshot of a firefox window showing a dance from the website The Caller's Box. The role terms used are Larks and Robins. Overlaid on top of the website is a settings popover with fields for specifying which role terms to use, whether to use "Right Shoulder Round," and whether to enable the plugin at all.
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/114110815251155305
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid02cWExUNNFsRM2kArxHZAWhgUEJaJ9zZL7AaBnNrxvxGGkqmwK2Qa19FtQreoJ4MfHl
---

{% image images.screenshot %}

Many contra dance callers use [The Caller's Box][], a phenomenal dance choreography database from Chris Page and Michael Dyck. For those of us who primarily call gender free dances, though, using it requires mental translation from gendered role terms to gender neutral ones. I've created a browser plugin, **Caller's Box Configurator**, to fix this.

[The Caller's Box]: https://www.ibiblio.org/contradance/thecallersbox/

{% button 'Caller’s Box Configurator (Firefox)' 'https://addons.mozilla.org/en-US/firefox/addon/caller-s-box-configurator/' %} {% button 'Caller’s Box Configurator (Chrome)' 'https://chromewebstore.google.com/detail/callers-box-configurator/hpppjgbgajmmmpgdkijddpjdlmckmcbo' %}

The plugin

* replaces "Men"/"Women" with either "Larks"/"Robins" or "Leads"/"Follows,"
* replaces "gypsy" with "right shoulder round"/"left shoulder round," and
* replaces any figures containing the above words with appropriate alternates.

There's a few limitations, all of which I'm open to resolving in the future (I accept [pull requests][]!):

* I wanted to avoid a [Scunthorpe Problem][scunthorpe][^1] so instead of a global find-and-replace, the Configurator takes a narrow approach that only replaces terms that can be definitively identified as roles or figures in the choreography of a dance. (On a technical level, it is searching for HTML elements which are linked to the glossary entries for the corresponding terms, e.g., `<a class="gloss" href="Glossary.htm#men">Men</a>`.)

  The upshot is that this _only_ replaces terms in the "Figures" section of dances. "Notes" are left untouched as is the site glossary itself. I'm open to experimentally adding support for replacing terms more broadly as a future feature.

[scunthorpe]: https://en.wikipedia.org/wiki/Scunthorpe_problem

[^1]: See a real example of a Scunthorpe Problem in a contra dance database in the [notes on this dance in ContraDB](https://contradb.com/dances/2351). CallerDB uses "gentlespoons"/"ladles" by default and somehow in the pipeline, the _figure name_ "mad robin" has been replaced in the notes here with "mad ladle!"

* The Configurator has not been tested with [The Caller's Extension][] by Paul Morris and I assume it doesn't work or doesn't work completely with it.

[The Caller's Extension]: https://addons.mozilla.org/en-US/firefox/addon/the-caller-s-extension/
[pull requests]: https://github.com/harrislapiroff/cb-configurator

* The Configurator also doesn't impact search. Searches have to be performed using original terms.

* I haven't yet figured out how to release a web extension for Safari, but I hope to soon.


***

A few technical notes:

This was the first time in many years that I've worked on a web extension. I'm pretty pleased with how consistent the [Web Extensions API][] is these days across browsers, though a few differences and limitations are irksome:

[Web Extensions API]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions

* Though Safari supports the Web Extensions API, it has a wholly different process for packaging and distributing which, as mentioned above, I haven't navigated yet.

* Firefox and Chrome have slightly different feature sets and, annoyingly, including configuration specific to one browser throws warnings or even errors in the other. (Specifically, Firefox supports a `page_action` property in the manifest which produces a button in the URL bar when on specific pages.) I'm working on a build pipeline that will build the same code for different browsers by including or excluding browser-specific code at build time. It's not hard, but it's annoying that it has to be done.

* There seems to be no standard way of creating and handling user configuration. Every extension seems to be expected to build and style a settings interface from scratch and decide on its own where it should be displayed. The flexibility is nice but, for something that must be a pretty common task, it would be nice to have some consistent defaults.

* Firefox's extension review process was much quicker than Chrome's. I submitted it on a Friday and was notified it was approved the following Monday. Chrome, I believe, took more than a week, though it's hard to say for sure, because I never got an email notification from them. I just checked periodically and noticed over a week later that it had been published.

* Vanilla Javascript and CSS are getting good enough that I'm feeling less and less need to integrate frontend compilation tools like [SASS][], [Webpack][], [ESBuild], etc. in small projects like this. For this plugin, I didn't bother.

[SASS]: https://sass-lang.com/
[Webpack]: https://webpack.js.org/
[ESBuild]: https://esbuild.github.io/
