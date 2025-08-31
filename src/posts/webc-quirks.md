---
title: WebC Quirks
date: 2025-07-15
categories: [Software]
tags: [web, 11ty]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/114859251701200463
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid033z9UJ7bnrVL9qrgMKR2rjSKPBv7B2eKHJJ2tBo6cHhm3YqKcH3z5gmhueLintocCl
---

Earlier this week I [posted about rough edges I encountered using WebC][webc-post]. I wanted to follow up with specific technical details from the ones I documented in the process of converting my website to it. Disappointingly, when I've raised these issues in the [11ty/web](https://github.com/11ty/webc) GitHub repo or in the Eleventy Discord, I haven't been able to get any feedback to resolve them or even a suggested pathway for contributing fixes myself. I love the concepts behind WebC, but I'm struggling to recommend it to anyone until there's evidence of bugs being resolved over time.

[webc-post]: /2025/07/switching-to-webc/

I hope this post will be read in the spirit that I wrote it: not as an entitled litany of complaints about a project I'm not willing to fix myself, but as

1. clear (hopefully) documentation of bug reports,
2. a caution to would-be WebC users of the sorts of issues they're likely to encounter, and
3. a request to the Eleventy maintainers to provide a clear pathway for improving WebC so I can help this project, that I want to see succeed, grow.

# Variables aren't consistently passed down through the element tree, even in the same file

* [GitHub 11ty/webc issue #214 →](https://github.com/11ty/webc/issues/214)

Sometimes variables have to be reiterated on components to get passed through the subtree or unexpected behavior occurs, in particular passing variables through a component that uses slots doesn't seem to work. For example, this did not work:

```html
<div webc:root="override">
    Tags:
    <link-list-commas>
        <li webc:for="tag of tags"><a :href="`/tags/${slugify(tag)}`" @raw="tag"></a></li>
    </link-list-commas>
</div>
```

Instead of rendering a list of tags, the `<li>` simply renders as an `[object Object]` string. The fix, I found, was to add `:@tags="tags"` to the `<link-list-commas>` element.

```html
<div webc:root="override">
    Tags:
    <!-- [!code word:\:@tags="tags"] -->
    <link-list-commas :@tags="tags"> <!-- [!code highlight] -->
        <li webc:for="tag of tags"><a :href="`/tags/${slugify(tag)}`" @raw="tag"></a></li>
    </link-list-commas>
</div>
```

# Nested slots don't work

* [GitHub 11ty/webc issue #111 (comment) →](https://github.com/11ty/webc/issues/111#issuecomment-2659994048)
* [Discord post Feb 14, 2025 →](https://discord.com/channels/741017160297611315/1340021840785182840/1340021840785182840)

I wanted to create a `<page />` component that would have all the boilerplate HTML for rendering a page:

`page.webc`:

```html
<!doctype html>
<html>
    <head><!-- [snip] --></head>
    <body>
        <site-layout>
            <site-header slot="header"></site-header>
            <main slot="main">
                <slot></slot>
            </main>
        </site-layout>
    </body>
</html>
```

And then the layout component (used in `page.webc`) puts content into a header/body/sidebar layout:

`site-layout.webc`:

```html
<div class="header"><slot name="header"></slot></div>
<div class="main"><slot name="main"></slot></div>
<div class="sidebar"><slot name="sidebar"></slot></div>
```

And then finally the template to be rendered:

`post.webc`:

```html
<page webc:nokeep>
    <!--- The div below never renders --->
    <div @raw="$data.content"></div>
</page>
```

I expected that the result of this would be that content would be filed into the main div of the site layout. Unfortunately, it simply didn't render the children of the `<page />` in `post.webc`anywhere.

This is a complicated enough example that I'm still not sure if it's a bug or something I'm doing wrong. As with the other issues, though, I wasn't able to get any feedback by posting it on GitHub or in Discord.

# `webc:setup` doesn't have access to frontmatter data

* [GitHub 11ty/11ty-website pull request #1790 →](https://github.com/11ty/11ty-website/pull/1790)

This doesn't work because `title` is not set, even if `title` is available in the frontmatter:

```html
<script webc:setup>
    const uppercaseTitle = title.toUpperCase();
</script>

<h1 @raw="uppercaseTitle"></h1>
```

This workaround works:

```html
<script webc:setup>
    const uppercase = t => t.toUpperCase(); // [!code highlight]
</script>

<!-- [!code word:uppercase(title)] -->
<h1 @raw="uppercase(title)"></h1> <!-- [!code highlight] -->
```

This makes sense, once this is understood: `webc:setup` scripts are run _once per component file_ not for every instance. But it should be documented. I put in a documentation pull request for it, which hasn't yet received feedback.

# `webc:for` doesn't work with Sets, Maps, or possibly other non-Array iterables

* [GitHub 11ty/webc issue #179 →](https://github.com/11ty/webc/issues/179)

Though the WebC docs explicitly say `webc:for` works for sets[^1] and all iterables, I could not get it to work in my testing.

[^1]: [Quote](https://www.11ty.dev/docs/languages/webc/#webcfor-loops):

      > Use webc:for to loop over data with HTML. It works with Objects and any Iterable (String, Array, Map, Set, etc).

This:

```html
<ul>
    <li webc:for="item of new Set(['one', 'two', 'three'])" @raw="item"></li>
</ul>
```

raised an error:

```
[11ty] Problem writing Eleventy templates:
[11ty] 1. Having trouble rendering webc template ./src/tags.webc (via TemplateContentRenderError)
[11ty] 2. loopContent.map is not a function (via TypeError)
```

This worked:

```html
<ul>
    <!-- [!code word:Array.from(new Set(['one', 'two', 'three'\]))] -->
    <li webc:for="item of Array.from(new Set(['one', 'two', 'three']))" @raw="item"></li> <!-- [!code highlight] -->
</ul>
```

In my testing,I got similar behavior when using `<script webc:setup>` to create the variables.

# Can't use imports in `<script webc:setup>`
* [GitHub 11ty/webc issue #225 →](https://github.com/11ty/webc/issues/225)
* [Discord post July 1, 2025 →](https://discord.com/channels/741017160297611315/1389794802928980020/1389794802928980020)

None of these examples work:

```html
<script webc:setup>
  import Fetch from '@11ty/eleventy-fetch'
</script>

<script webc:setup>
  const Fetch = await import('@11ty/eleventy-fetch')
</script>

<script webc:setup>
  const Fetch = require('@11ty/eleventy-fetch')
</script>
```

All silently fail, while preventing the build.

:::update
**Fri Aug 15, 2025:** In fact the second example here does work but requires a different way of unpacking the result. This works:

```html
<script webc:setup>
  const { default: Fetch } = await import('@11ty/eleventy-fetch') // [!code highlight]
</script>
```

Additionally, things should be smoother on the import front once [this change](https://github.com/11ty/webc/pull/229) lands.
:::

# Error reporting is bad

What makes many of the issues I encountered all the more challenging is that WebC error reporting tends to be inscrutable or non-existent. Often I just get:

```
Check the dynamic attribute: `@raw="myFunction()"`
```

or something similar, with a stack trace that doesn't always include useful information.

`webc:setup` scripts sometimes (always?) seem to not raise errors at all. Sometimes, WebC just bails without building with no explanation at all. This can be particularly confusing if you're in watch mode and assuming that builds are succeeding when you don't see errors.

Sometimes the error is in the middle of the output instead of at the end. (This seems to be mostly true on my sites that have `eleventy.after` listeners wired up that have output.)

I don't think I've ever seen a WebC error that told me simply what I was doing wrong. Every error has required investigation.

In general, I would like to see:

* Stack traces with a list of templates involved in rendering, to help identify the context of the error. The alternative has been guess-and-check or to code defensively for scenarios I'm uncertain of (the "I don't know when this variable is null, but sometimes it is, so we'll handle it" approach).
* Specific fix messages for common errors.
* Errors collected and reported at the *end* of build output (even after `eleventy.after` listeners run, in my opinion), not midway through.
* Never fail silently.

# Conclusion

I'm sure there are more issues than the ones I encountered in development – in fact, I know there are ones I encountered and didn't document, just because I couldn't figure out what was going wrong, so I simply rearchitected around them. I love WebC's concepts, design, and architecture. But it has too many rough edges for me to recommend it to your average web developer, let alone a beginner trying to get a basic site up and running. At the same time, going back to something else like Liquid or Nunjucks feels like a frustrating prospect, when I've experienced the glorious WebC authoring model.

Ultimately, I'd love to see WebC become _the_ language I recommend for building an Eleventy site. Its position as an official Eleventy project that integrates well makes it well placed for that role. It isn't there yet.
