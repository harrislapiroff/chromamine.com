---
title: Switching to WebC
date: 2025-07-04
categories: [Software]
tags: [web, 11ty]
# eleventyExcludeFromCollections: true
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

I've just switched this blog from using [Pug](https://pugjs.org/api/getting-started.html) for layout templates to [WebC](https://github.com/11ty/webc).

When I started this migration I was eager to switch to a template language that would be easy to work with and well-maintained. Now that I've made the switch, my feelings about WebC are much more complicated. The migration took me roughly six months of development, on and off, running into a ton of rough edges and with several false starts.

# The Good

Here's some of the things I like about WebC:

## Single-File Component Authoring

The single-file component authoring model is *excellent*. I hadn't realized how much brainpower I was expending on switching back and forth between HTML, CSS, and javascript files until I didn't have to do it anymore. It's very powerful being able to want to edit just one part of my site and being able to do it entirely in one file.

Similarly, being able to add build-time processing using [`<script webc:setup>` at the component level](https://www.11ty.dev/docs/languages/webc/#using-java-script-to-setup-your-component) also feels like an upgrade from writing template tags and filters in a distant location. The whole authoring experience feels very ergonomic.

It's really hard to go back to any other way after writing this way for a while.

## Static File Bundling

As a counterpart to the above, it's really nice that WebC automatically collects all the styles and scripts associated with my components and bundles them into a single file.

## HTML-Like Syntax

One annoyance of using Pug was that it's obscure and doesn't have a strong ecosystem around it. This has obvious side-effects like not being able to find a lot of support when I'm stuck on something, but also crops up in more subtle quality-of-life ways, for example:

* Not having a great IDE extension for it
* Not having syntax highlighting for it everywhere (for example posting on my blog or Discord)

WebC may be similarly obscure, but its syntax matches HTML very closely, so most of the time, tools made for editing and sharing HTML Just Work™.

# The Bad

I wish it were all sunshines and rainbows, but, alas. Here's some misgivings I have about WebC:

## HTML-Like Syntax

I'm somewhat undecided on how I feel about WebC borrowing so much syntax from HTML and Web Components. I'm an experienced web developer, so I'm mostly able to navigate the distinctions with ease, but I worry the language is less accessible to developers who might have a harder time understanding what's WebC, what's Web Components, and what's HTML – and especially who might have a harder time understanding what is only part of the build-time code and what actually gets rendered on the page.

## Rough Edges

I ran into a ton of bugs and unexpected behavior when working with WebC. The documentation also isn't great, so there were a lot of times when I encountered an issue and didn't know whether it was a bug or whether I had misunderstood how it was supposed to work. And though WebC is an official Eleventy project, it hasn't been widely adopted and it hasn't seen many updates in recent years, so I haven't been able to get much support from the community in solving issues I ran into. I'm feeling a little worried that I've traded out one obscure language for another.

A lot of this is pretty vague, but I have a list of specific quirks I ran into that I'm finalizing for publication as a future post.

## No Client-Side Hydration

Though WebC is pretty good for simple progressive enhancement use-cases, if you have any components complex enough that require rendering templates on the client-side, WebC doesn't support that and you'll need to turn to another library. WebC supports that through a library called [Is-Land](https://www.11ty.dev/docs/languages/webc/#use-with-is-land), which I wasn't able to get working at all following the examples in the docs.

# Going Forward

I'm hoping the advantages of WebC will speed up my development going forward and let me add features to my site that I've long had planned (a better interface for drilling into my archive with search and filtering, pulling data from my various web presences, etc.) but I'm a little nervous the rough edges will continue to slow me down. I'll keep trying it for now and see how it goes.
