---
title: Share Links Thoughtfully With an iOS Shortcut
date: 2025-07-09
categories: []
tags: []
excerpt: The web is full of links that are designed to track and surveil the people who share and receive them.
images:
  sharesheet:
    src: share-sheet.jpg
    alt: An iOS share sheet with the Clean Copy Link shortcut highlighted by a red circle
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

_[Jump to shortcut &darr;](#download-shortcut)_

The web is full of links that are designed to track and surveil the people who share and receive them. With these links, corporations can gather data about your interests and associate it with information they already have about you. They can use it to construct a social graph, internally drawing connections between people who share links to those who receive them.

I'm focusing on two techniques for this sort of thing:

* **URL shorteners:** These provide a short URL that redirects to a longer one. This lets the company that generates the short URL serve as an intermediary on your way to visiting the page, letting them track your behavior. Additionally, this obscures the original URL, making it harder to see the destination before you visit.
* **Query parameters:** These are keywords appended to the end of a URL which give the site you're visiting information about where you came from or even your identity. Often times sites that use these embed scripts from third parties like Facebook and Google, allowing those corporations greater insight into your behavior around the web.

In some cases, you don't even need to follow a link for it to share information about you, since some messengers and apps visit the link *from your device* before you even click it to generate a preview.[^1]

These are examples of links designed to track your movements around the web:

* <code style="word-break: break-all; max-width: 100%;">https://apple.news/AauFyDXCoSNOY6RVcJB3CGA</code> [^2]
* <code style="word-break: break-all; max-width: 100%;">https://t.co/S8ClxKvEtY</code> [^3]
* <code style="word-break: break-all; max-width: 100%;">https://chromamine.com/2025/07/share-links-thoughtfully-with-my-ios-shortcut/?utm_source=blog-post</code>
* <code style="word-break: break-all; max-width: 100%;">https://chromamine.com/2025/07/share-links-thoughtfully-with-my-ios-shortcut/?fbclid=IwY2xjawLbtGFleHRuA2FlbQIxMQBicmlkETFZekM2NFBCMlY5bDI3Q3dkAR4sSgYyJrvmhlClmy0c7hi5A45Jew2dDVQKZSS-cR2qA6h5HwxahvUGPyfzpA_aem_q3OBre7SBd0XHgWgR1iywA</code> (This one actually won't tell Facebook anything about you because *my site* doesn't embed any Facebook scripts, but *in theory it could*.)

More recently I started seeing links like this as well:

* <code style="word-break: break-all; max-width: 100%;">https://share.google/KKg1GjP4QTxp2Pvj5</code>[^4]

Someone told me that a Google Chrome update on Android made this the default behavior for sharing links, which to me seems like a newly crossed line on the integration of routine surveillance into Google's software.

## The Shortcut

I want to encourage people to be kind to their friends and followers by stripping tracking data from links they share. You can do this by only sharing expanded versions of links and by removing tracking query parameters.

If you're on iOS (or macOS) you can use this simple shortcut I created to do so:

<a id="download-shortcut"></a>

{% button "Download “Clean Copy Link” &darr;" "/media/share-links-thoughtfully-with-my-ios-shortcut/Clean Copy Link.shortcut" %}

or

{% button "Install “Clean Copy Link” from iCloud" "https://www.icloud.com/shortcuts/f8b4ceae5a2449d999a415bed99b936e" %}

The shortcut will appear in any OS-native share sheet (in some apps you may have to press "More options" or a similar button to see it):

{% image images.sharesheet %}

It will unwrap links from any URL shorteners, strip them of query parameters, and copy it to your clipboard for pasting.

## Limitations

A few caveats:

* This will break any links that _depend_ on legitimate query parameters, since there are non-surveillance uses for them as well. You will need to be attentive to those occasions when using this shortcut.
* This is a shortcut for someone _sharing_ a link to use as a courtesy to whomever they are sharing it with. It does not provide much protection for someone receiving a link to use it, since the unwrapping process still happens on their device.

## Room for Improvement

I made this shortcut pretty quickly! There's some improvements that could be made:

* An Android-compatible implementation, since it was an Android feature that inspired me to publish this.
* More intelligent stripping of query parameters, perhaps limited to a denylist of parameters known to be used for tracking.
* An option to preview the URL before copying it.

I may make these improvements myself at some point, but if anyone else wants to get to it first and share it back to me, I'd be happy to publish an update.

[^1]: A number of messengers [like Signal](https://signal.org/blog/i-link-therefore-i-am/) fetch previews on the sender's device, transferring the privacy exposure to the person who was likely already visited the site.Some apps (like Discord and Slack) fetch previews on the intermediaries' servers, which can be more privacy-preserving in some senses and less in others.
[^2]: Unwrapped: [https://www.statnews.com/2025/07/09/measles-america-breaks-33-year-record-anti-vaccine-sentiment-key-factor-behind-outbreaks/](https://www.statnews.com/2025/07/09/measles-america-breaks-33-year-record-anti-vaccine-sentiment-key-factor-behind-outbreaks/)
[^3]: Unwrapped: [https://chromamine.com/2025/07/share-links-thoughtfully-with-my-ios-shortcut/](https://chromamine.com/2025/07/share-links-thoughtfully-with-my-ios-shortcut/)
[^4]: Unwrapped: [https://www.nbcboston.com/news/local/somerville-cat-mayor-election/3759084/](https://www.nbcboston.com/news/local/somerville-cat-mayor-election/3759084/)
