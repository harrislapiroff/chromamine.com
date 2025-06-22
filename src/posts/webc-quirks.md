---
title: webc-quirks
date: 2025-02-28
categories: []
tags: []
eleventyExcludeFromCollections: true
xposts:
  - label: Mastodon
    url: TBD
  - label: Facebook
    url: TBD
---

# Variables aren't consistently passed down through the element tree, even in the same file

Sometimes variables have the be reiterated on components to get passed through the subtree or unexpected behavior occurs. For example, in this example of `tags.webc`, this did not work:

```html
<div webc:root="override">
    Tags:
    <link-list-commas>
        <li webc:for="tag of tags"><a :href="`/tags/${slugify(tag)}`" @raw="tag"></a></li>
    </link-list-commas>
</div>
```

Instead of rendering a list of tags, the `<li>`s simply render as a single `[object Object]` string. The fix, I found, was to add `:@tags="tags"` to the `<link-list-commas>` element.

```html
<script webc:setup>
    const slugify = str => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
</script>

<div webc:root="override">
    Tags:
    <link-list-commas :@tags="tags">
        <li webc:for="tag of tags"><a :href="`/tags/${slugify(tag)}`" @raw="tag"></a></li>
    </link-list-commas>
</div>
```

I have no idea why this was necessary, why it caused `[object Object]` to render instead of HTML, or even what the difference was between the cases where I needed this code and where I didn't.

# webc:setup scripts don't have access to the collections object in components

If writing a component, this won't work:

```html
<script webc:setup>
    const tags = collections.tags;
</script>
```

but it will work if instead of being used as a component like `<webc-component></webc-component>` the file is being used as a layout `layout: webc-component.webc`.

The workaround is to generate data in the layout and pass it to the component as a property.

`layout.html`:

```html
<script webc:setup>
    const tags = collections.tags;
</script>

<webc-component :@tags="tags"></webc-component>
```

`webc-component.webc`:

```html
<div webc:for="tag of tags">
    <span @raw="tag"></span>
</div>
```

This actually makes a sense because it means components can't access global data and must be better encapsulated. But it should be documented.

# `webc:setup` doesn't have access to frontmatter data

This doesn't work because `title` is not set:

```html
<script webc:setup>
    const uppercaseTitle = title.toUpperCase();
</script>

<h1 @raw="uppercaseTitle"></h1>
```

but this workaround does:

```html
<script webc:setup>
    const uppercase = t => t.toUpperCase();
</script>

<h1 @raw="uppercase(title)"></h1>
```

Again, this actually makes sense once you understand it: `webc:setup` scripts are run _once per component file_ not for every instance. But, again, it should be documented.

# `webc:for` doesn't work with sets

At least it doesn't every time. More testing required to find out if it works sometimes.

This didn't work:

```html
<script webc:setup>
  const years = new Set(posts.map(p => p.date.getFullYear()))
</script>

<div webc:for="year of years">
  <!--- ... --->
</div>
```

This did:

```html
<script webc:setup>
  const years = Array.from(new Set(posts.map(p => p.date.getFullYear())))
</script>

<div webc:for="year of years">
  <!--- ... --->
</div>
```


# Error reporting is quite bad

WebC errors tend to be inscrutable or non-existent. Often I just get a:

```
Check the dynamic attribute: `@raw="myFunction()"`
```

or something similar, with a stack trace that is quite long and doesn't always include useful information.

Sometimes, WebC doesn't generate an error at all, just bails without building.

Sometimes the error is in the middle of the output instead of at the end. (This seems to be mostly true on my sites that have `eleventy.after` listeners wired up that have output.)

I don't think I've ever seen a WebC error that told me simply what I was doing wrong. Every error has required investigation.