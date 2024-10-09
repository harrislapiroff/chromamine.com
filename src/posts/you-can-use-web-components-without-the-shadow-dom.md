---
title: You can use Web Components without the shadow DOM
date: 2024-10-05
categories: [Software]
tags: [web, javascript]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/113258394344115095
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0jQrDsP6VR2bG2DkRiBmhoUChLTaA8dHCAQCG9nR81cSikoMeEAgMfSBs8Sp6LP6rl
---

I've been hearing a lot lately about [Web Components][], a set of fairly recent web technologies seemingly poised to replace some of the role frameworks like React have filled for much of the past decade. As far as I can tell React and Web Components have overlap on solving this problem:

[Web Components]: https://developer.mozilla.org/en-US/docs/Web/API/Web_components

1. Create fragments of web UIs that can be reused across a project or multiple projects.

React also covers a couple other problems that Web Components do not – as far as I know – so Web Components are not a full-replacement, nor is using React and Web Components mutually exclusive. In particular React also:

1. Provides a framework for managing state data for components.
2. Handles rendering and updating the DOM as required by state changes.

This week I took my first dive into building a project with Web Components[^1] and have some newly informed thoughts about them. As mentioned in the [Mozilla overview][Web Components], Web Components consist primarily of these three technologies: Custom Elements, the Shadow DOM, and HTML Templates.

[^1]: I was partially inspired by [Eleventy][]'s recent inclusion of [WebC][], a template language based on Web Components. Though I wasn't experimenting specifically with WebC this week, it's likely that I'll switch to it the next time I overhaul my site templates – which can't be too far off given the web designer itch to regularly redesign.

[Eleventy]: https://www.11ty.dev/
[WebC]: https://www.11ty.dev/docs/languages/webc/

I really enjoyed using the Custom Elements API, but I admit to being bewildered by the Shadow DOM. It seems to be primarily a way to isolate my component, styles and all, from the rest of the website.

I imagine this is great for building component library to be used by many people across different sites, but for adding interactivity to one site, I *want* my components to share styles! My sites should feature consistent typography and colors. A button is a button anywhere.

At first I thought, maybe I wasn't getting it. If I'm using the Custom Elements API without the other pieces, am I just replacing the [DOMContentLoaded][] pattern with a different bit of syntactic sugar? Maybe Web Components weren't what I was looking for.

[DOMContentLoaded]: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event

But when I searched around, I felt validated to discover a number of [other frontend developers having the same experience][fem-article] I was, including several whose work I've followed for many years[^2]! Like me, these developers were delighted by the custom elements API, but unpersuaded by the shadow DOM. They build their web components using what they call the "light DOM" just the same old DOM that's always there.

[fem-article]: https://frontendmasters.com/blog/light-dom-only/

[^2]: [Jeremy Keith][] and [Eric Meyer][] in particular were influential for me when I was a blossoming wee high school web developer.

[Jeremy Keith]: https://adactio.com/journal/20618
[Eric Meyer]: https://meyerweb.com/eric/thoughts/2023/11/01/blinded-by-the-light-dom/

So what are the advantages of the Custom Elements API if you're not going to use the Shadow DOM alongside it? I identified a few in my work:

# 1. Obvious Markup

In the past I relied on special class name patterns to indicate that an element was javascript enhanced. For example the HTML for a carousel might look like this, with `js-carousel` being a class used by javascript to identify elements on the page to add functionality to:

```html
<div class="carousel js-carousel">
  <img src="...">
  <img src="...">
  <img src="...">
</div>
```

With Custom Elements, I could instead write:

```html
<homepage-carousel>
  <img src="...">
  <img src="...">
  <img src="...">
</homepage-carousel>
```

Because Web Components _must_ have hyphens and native HTML elements _must_ not, it's immediately obvious from the markup that this is a javascript enhanced object. No hunting for the CSS class and hoping I and my collaborators were consistent about our naming conventions. No removing a class thinking it wasn't used by CSS anywhere, only to discover it _was_ used by javascript.

# 2. Instantiation is More Consistent

The old way of ensuring javascript interactivity got added to an element looked like this:

```js
function initCarousel(el) {
  // ... do some stuff
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.js-carousel').forEach(initCarousel);
});
```

Essentially saying: when the document has fully loaded (minus, perhaps, styles and other assets) run this function on every element with the class `js-carousel` on the page. If you're an object-oriented programmer, perhaps:

```js
class Carousel {
  constructor(el) {
    // ... do some stuff
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.js-carousel').forEach(el => new Carousel(el));
});
```

With the Custom Elements API it looks like this:

```js
class HomepageCarousel extends HTMLElement {
  connectedCallback() {
    // ... do some stuff
  }
}

customElements.define('homepage-carousel', HomepageCarousel);
```

In some places it's a little wordier, but I think it's clearer what's happening. And it comes with one other advantage: Where the previous methods only worked if the carousel was present on the page when it first loaded – and you had to add additional javascript if you were going to add elements dynamically – the new method works immediately for elements that are added to the page (i.e., "connected") at any time.

# 3. They're Progressive Enhancement Friendly

The HTML inside a custom element renders as normal HTML, even if javascript never loads. This makes it straightforward to build a custom element with default HTML that might make sense in a no javascript context. For example a carousel element might look like this:

```html
<homepage-carousel>
  <img src="...">
  <img src="...">
  <img src="...">
</homepage-carousel>
```

Without any javascript, all three images will render in sequence, a reasonable alternative for a carousel that preserves the complete information for any robots or humans browsing the site with javascript off.

Then, in the javascript definition, I can add code that will hide two images, show one, and rotate through them.

This is a contrast to the common React Single Page App model where the entire site is typically owned by React and if React and javascript fail to load, the site does not function.

# 4. Other Advantages?

Though I didn't get to explore them thoroughly, I suspect there's a few other advantages as well, even without the Shadow DOM. For example the lifecycle methods that come with custom elements seem useful for managing code that should run when elements are removed or, especially, when their attributes are updated.

One thing that wasn't clear to me is to what extent I should rely on attributes for state management. For example, would it make sense to have HTML that looks like this:

```html
<homepage-carousel autoplay="true" slide="0">
  <img src="...">
  <img src="...">
  <img src="...">
</homepage-carousel>
```

And then an `attributeChangedCallback` that would respond to changes by enabling or disabling autoplay or moving to a different slide? As well as a number of internal event handlers responsible for changing those attributes?

# What about `<template>` and `<slot>`

One annoyance with Web Components is that it doesn't seem possible to use [`<template>` and `<slot>`](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) usefully without the Shadow DOM. I would love an option to use a browser-native template engine while still working with elements up here in the light DOM!
