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

Sometimes variables have the be reiterated on components to get passed through the subtree or unexpected behavior occurs. For example, in this example of `tags.webc`

```html
<script webc:setup>
    const slugify = str => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
</script>

<div webc:root="override">
    Tags:
    <link-list-commas>
        <li webc:for="tag of tags"><a :href="`/tags/${slugify(tag)}`" @raw="tag"></a></li>
    </link-list-commas>
</div>
```

in some contexts, instead of rendering a list of tags, the `<li>`s simply render as a single `[object Object]` string. The fix, I found, was to add `:@tags="tags"` to the `<link-list-commas>` element.

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
