---
title: Switching to WebC
date: 2025-07-13
categories: [Software]
tags: [web, 11ty]
images:
  ide:
    src: ide.png
    alt: Screenshot of a code editor with a file named newsletter-form.webc open. The code is syntax highlighted, even the custom form-control element in the middle of the page and the CSS styles at the bottom.
    caption: Editing a WebC component in my code editor.
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/114846781704432154
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0xj85Hac7q1nnbZpxtNqzcuomxMGSJSM4AfyasYZ9rydUKYP1WYm7D6PHRwDFoiTHl
---

I've rewritten this blog's templates in [WebC][]. As with many architectural refactors, the site will largely look the same – with the exception of a few minor design tweaks I made in the process – but under the hood it's using an entirely new template engine.

[WebC]: https://www.11ty.dev/docs/languages/webc/

# What is WebC?

WebC is a template language created by [Eleventy][] creator [Zach Leatherman][] and maintained under the Eleventy project. It borrows syntax from HTML (and particularly [HTML Web Components][]) to render templates at build time[^1]. Example WebC syntax looks like this:

[^1]: I often refer to "build-time" when talking about Eleventy projects, which is similar to "server-side" for more traditional web applications. It's work that happens prior to serving the site rather than "client-side" in the browser.

[Eleventy]: https://www.11ty.dev/
[Zach Leatherman]: https://www.zachleat.com/
[HTML Web Components]: https://developer.mozilla.org/en-US/docs/Web/Web_Components

`post-card.webc`:

```html
<div class="card">
  <h1 :@text="post.title"></h1>
  <p :@text="post.description"></p>
</div>

<style webc:scoped>
  :host {
    border: 1px solid #ccc;
    padding: 20px;
  }

  h1 {
    font-size: 2em;
  }
</style>
```

`post-list.webc`:

```html
<post-card @webc:for="item in collections.posts" :@post="item"></post-card>
```

For reference, the same code in [Pug][] (the template language I switched away from) could look something like this:

[Pug]: https://pugjs.org/

`post-card.pug`:

```pug
.card
  h1= post.title
  p= post.description
```

`post-list.pug`:

```pug
each post in collections.posts
  include post-card.pug
```

And the styling would live elsewhere.

# The Good

Here are some of the things I like about WebC:

## Single-File Component Authoring

The single-file component authoring model is *excellent*. As seen in the example above, WebC is designed for each component to have markup (HTML) and styles (CSS) together in the same file, as well as behavior (javascript). I hadn't realized until I switched how much brainpower it takes switching between separate HTML, CSS, and JS files.

In my experience, this encourages cleaner, better-organized code on multiple fronts.

* The ability to include styles and javascript code in the same file encourages encapsulation and progressive enhancement. I write an HTML component that works and then I write styles and javascript in the same file that improve it.
* Not only can you include client-side code using `<script />` tags, but you can include build-time code using `<script webc:setup />`. In my experience this reduces [action-at-a-distance][] code. Processing that I might otherwise have put in a [shortcode][] instead ends up directly in the component that requires the processing.

[action-at-a-distance]: https://en.wikipedia.org/wiki/Action_at_a_distance_(computer_programming)
[shortcode]: https://www.11ty.dev/docs/shortcodes/

Now that I've used this authoring model for a few months, it's been pretty hard to go back to writing components any other way.

## HTML-Like Syntax

There are some unexpected advantages to having a syntax borrowed from HTML for my template language – mainly that the ecosystem of tools for authoring HTML just work for WebC without any need to install additional extensions. I just tell my code editor that I'm working with HTML syntax and off I go (notably this also gets HTML and CSS syntax highlighting and tooling for free).

{% image images.ide %}

# The Bad

I had high hopes for my switch to WebC, but I'm finding it hard to recommend unreservedly. Here are some of the issues I discovered along the way:

## Lack of Support and Community

I switched away from [Pug][] partially because, even though I like its compact syntax, I was tired of working in a language that wasn't well maintained and didn't have a good community to turn to for support. WebC is an official Eleventy project, which gave me hope that it would be different. Unfortunately, it hasn't seen any significant updates in a couple years and there are few enough people using it that when I asked [questions in the Eleventy Discord](https://discord.com/channels/741017160297611315/1389794802928980020) or [reported](https://github.com/11ty/webc/issues/225) and [added to](https://github.com/11ty/webc/issues/214#issuecomment-2677064030) issues on GitHub, I was largely met with silence. I find myself wondering if I've traded out one obscure unsupported language for another.

## Rough Edges

The above might be fine if WebC was already a mature language, but unfortunately it isn't – and unfortunately, like much of Eleventy's documentation, the WebC documentation isn't especially gentle or thorough.[^2] Error reporting is nigh non-existent. Most of the time I would either get a cryptic error message or building would fail silently with no error message at all. Because the documentation is rough, it wasn't always clear to me if I was encountering a bug or doing something incorrectly.

[^2]: To his great credit, Leatherman puts a lot of emphasis on video tutorials, and watching [some of those](https://www.youtube.com/watch?v=p0wDUK0Z5Nw) *was* very instructive for me!

It took me several months, on and off, of banging my head against it to find workarounds for all the issues I encountered, but I've finally gotten there. I've accumulated a list of WebC quirks that I'm hoping to publish later this week.

## No Client-Side Hydration

Though WebC is pretty good for simple progressive enhancement use-cases, if you have any components complex enough that require rendering templates on the client-side (i.e., [hydration][]), WebC doesn't support that and you'll need to turn to another library – which leaves me wishing I could go all in on building templates with that other library (whether Preact, Vue, or something else) instead. WebC supports that through a library called [Is-Land](https://www.11ty.dev/docs/languages/webc/#use-with-is-land), which I wasn't able to get working at all, even following the examples in the docs.

[hydration]: https://web.dev/articles/rendering-on-the-web#hydration

# Going Forward

Despite my complaints, I find the authoring model so smooth that I pushed through and rebuilt my website in WebC. I'm hoping this will make me faster at improving my website and adding features I've long dreamed of.[^3] Hopefully the WebC project will pick up and see more improvements soon – and maybe I'll even be able to help out.

[^3]: Comments sourced from around the web, more interactive playful design elements, a better way to search and filter posts, to name a few.
