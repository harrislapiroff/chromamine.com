---
title: Eleventy
date: 2023-10-07
categories: ['Software']
tags: ['web', 'eleventy']
# xposts:
#     - label: Facebook
#       url: TBD
#     - label: Mastodon
#       url: TBD
---

I love the idea of static site generators (sometimes known as SSGs or SSBs – static site builders). They eschew the complexity of modern CMSes such as Wordpress. Instead of server-side code and databases, a static site generator is a script that, when run, transforms a folder of text files and templates into HTML.

There are advantages to SSGs over CMSes:

* **They're portable and cheap:** You can host an SSG site anywhere that can host HTML files – including many free services.
* **They have a built-in escape strategy:** If you decide to switch platforms later, you can take your folder of Markdown (or similar text-formatted) files elsewhere. No complicated database migrations or exports are required.
* **They're fast:** All the processing happens at build time so the server doesn't need to run custom code to serve the files.

There's also some disadvantages. Namely: you can't include features that typically require server-side code, such as native commenting or search. They're not ideal for complicated multi-user setups with permissions and editorial workflows. They also aren't appropriate for non-technical authors since they're generally run from a [command-line][] and require committing to a git repository[^1].

[command-line]: https://en.wikipedia.org/wiki/Command-line_interface

I've long used [Jekyll][], a venerable and capable SSG, for small projects and blogs. Jekyll is simple to use and has been supported out-of-the-box by [GitHub Pages][] for many years.

[Jekyll]: https://jekyllrb.com/
[GitHub Pages]: https://pages.github.com/

For this blog I experimented with [Eleventy][], stylized "11ty." It has commonalities with Jekyll but offers more hooks for deeper customization. It's also written in Javascript — a language I know well and can use to customize the setup to my heart's content.

[Eleventy]: https://www.11ty.dev/

It's similar enough to Jekyll that I was able to migrate over my [contra dance caller and organizer site][contra] with almost no modifications. It's flexible enough that I almost feel not like I'm using a prebuilt system and more like I'm constructing my own system out of the building blocks Eleventy provides. You can see my entire [Eleventy configuration][config], but here's a few custom things I'm doing:

* Using Markdown footnotes and customizing how they display
* Using indented [SASS] instead of CSS and [Pug] for my HTML templates[^2]
* Adding my own custom filters for formatting dates and numbers

[contra]: /contra/
[config]: https://github.com/harrislapiroff/chromamine.com/blob/main/eleventy.config.js
[SASS]: https://sass-lang.com/
[Pug]: https://pugjs.org/

I'm excited to push the boundaries of what SSGs can do. Here's a few things I'm looking forward to experimenting with:

* Blog posts in formats other than Markdown: In particular, I do a lot of data visualization using [Observable notebooks][observable] and I'm interested in devising a way to natively self-host those.
* Pulling comments on posts from other platforms such as [Mastodon][][^3]. I imagine this will take the form of a periodically run [GitHub Action][] that looks for comments on other platforms and commits them to the repo.
* Integrating some sort of search. I'm planning to explore client-side search engines, like [Lunr][], but if that turns out to be too bandwidth intensive, I'll investigate hosted options, like [Google Programmable Search Engine][gpse].

[observable]: https://observablehq.com/@harrislapiroff?tab=profile
[Mastodon]: https://social.coop/@harris
[GitHub Action]: https://github.com/features/actions
[Lunr]: https://lunrjs.com/
[gpse]: https://programmablesearchengine.google.com/about/

Overall, I'm very happy with how Eleventy is working out for me and excited about exploring its possibilities.

(Someday soon, I will write a blog post that isn't a meta-post about the blog itself. In the meantime, I just migrated over an [old blog post][dragonflies] about my life a decade ago, if you want something different.)

[dragonflies]: /2013/08/dragonflies/

[^1]: I don't think these are necessarily inherent to the concept of SSGs – and there have been attempts at [user-friendly GUI editors][prose] – but it is at least how they are typically generated and hosted now.
[^2]: I've been a sucker for indented languages, ever since I learned Python in college. I think they look more elegant and they eliminate whole classes of syntax errors. I may have to give up on Pug though – it's a somewhat fussy language that's not well documented or maintained and doesn't play nice with Eleventy's default filters.
[^3]: Inspired by [Jeff][] who pulls in comments from various platforms to display on his blog.

[Jeff]: https://jefftk.com/
[prose]: https://prose.io/
