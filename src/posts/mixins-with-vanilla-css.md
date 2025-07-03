---
title: Mixins in Vanilla CSS
date: 2025-07-03
categories: [Software]
tags: [web]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/114787860720919130
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0CRWgcx8cJmq4wBV31R7tmVqW2xowW29SGJkJJD8MS8fT6LABC1N3wpFT1RVzESXcl
---

I'm in the process of a major technical rearchitecture of this website[^1] and as part of that restructure I'm foregoing the use of [CSS preprocessor SASS](https://sass-lang.com) in favor of vanilla CSS. Vanilla web technologies have improved significantly in the past decade. Reducing dependencies like SASS makes my code more portable and future-proof.

[^1]: More on this later if/when I ever complete it.

Lots of features I used SASS for, such as [variables](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) and [nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting), are now a part of native CSS. But one feature I've been really missing is [mixins](https://sass-lang.com/documentation/at-rules/mixin/) – a way to share styles across multiple components. In the current version of my website, I have a bit of SASS like this (much simplified from the actual code):

```sass
@mixin labeled-box($label, $color)
    border: 0.1rem solid $color
    color: $color
    // [snip]

    &::before
        display: block
        content: $label
        // [snip]

.update
    @include labeled-box("Update", var(--color-update))

.note
    @include labeled-box("Note", var(--color-text-alert))
```

I was able to approximately replicate this structure in vanilla CSS using the behavior of custom properties (variables)!

```css
.update, .note {
    border: 0.1rem solid var(--color);
    color: var(--color);
    /* [snip] */
    &::before {
      display: block;
      content: var(--label);
      /* [snip] */
    }
}

.update {
  --color: var(--color-update);
  --label: "Update";
}

.note {
  --color: var(--color-text-alert);
  --label: "Note";
}
```

This isn't a unique discovery – after independently happening upon this technique, I searched around and found [this article detailing the same approach](https://mjswensen.com/blog/you-might-not-need-sass-modern-css-techniques/).

It also has some downsides over the SASS mixin syntax – for one thing, you need to have a comprehensive list of the selectors you want to apply the mixin to in the place where you define the mixin – but it's a serviceable workaround until [native CSS mixins](https://www.w3.org/TR/css-mixins-1/) land.