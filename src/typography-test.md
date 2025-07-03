---
title: Typography Test
date: 2023-10-17
categories: ['None']
tags: [none]
eleventyExcludeFromCollections: true
layout: page.webc
xposts:
    - label: None
      url: https://example.com/
images:
  constraint:
    src: constraint-warning.png
    caption: A constraint warning dialog in SolveSpace
    alt: A dialog box showing a constraint warning with red text and an error icon.
  extruded:
    src: extruded-w-d-constraint.png
    caption: An extruded object with dimension constraints
    alt: A 3D CAD model showing an extruded cylindrical object with dimension lines and constraints.
  stand:
    src: stand.jpg
    caption: A 3D printed Irish whistle stand
    alt: A wooden-colored 3D printed stand holding several Irish whistles in organized slots.
dances:
  - title: Festival Reel
    author: Will Mentor
    formation: Becket
    choreo:
      a1:
        - Slice L
        - Long lines F&B
      a2:
        - Star L (hands-across)
        - Star R (hands-across)
      b1:
        - Robins DSD
        - Larks DSD
      b2:
        - Ptr B&Sw
    notes:
      a1: _Slice_, not slide.
      b1: Robins can pull into the DSD if they like
      general: All figures end where they started until the progression.
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

# Heading Level One

Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

## Heading Level Two

Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

### Heading Level Three

Lorem ipsum dolor sit amet, [consectetur adipiscing](https://example.com/) elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

#### Heading Level Four

Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

##### Heading Level Five

Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. cras elementum ultrices diam. maecenas ligula massa, varius a, semper congue, euismod non, mi. proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.

* Bullet List
* Bullet List
* Bullet List

Text between lists!

1. Numbered List
2. Numbered List
3. Numbered List

```python
def foo():
    print("Hello World!")
```

This text includes a `bit of` code.

{% button "Test Button" "https://example.com" %}

{% stl "/media/3d-cad-with-solvespace/cap-58mm-lo.stl" %}

---

## Blockquotes

> This is a blockquote. Lorem ipsum dolor sit amet, consectetur adipiscing elit. sed non risus. suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.

> Another blockquote with **bold text** and *italic text* and `inline code`.

## Footnotes

This paragraph contains a footnote reference[^1] and another one[^2]. Footnotes are rendered with custom styling and interactive popovers.

## Update and Note Containers

::: update
This is an update container. It has special styling with a colored border and label.
:::

::: note
This is a note container. It also has special styling to draw attention to important information.
:::

## Dance Card Shortcode

{% dancecard dances "Festival Reel" %}

## Image Grid Shortcode

{% imagegrid %}
![Constraint Warning](/media/3d-cad-with-solvespace/constraint-warning.png)
![Extruded with Dimension Constraint](/media/3d-cad-with-solvespace/extruded-w-d-constraint.png)
![Irish Whistle Stand](/media/3d-printed-irish-whistle-stand/stand.jpg)
{% endimagegrid %}

## Image Shortcode

{% image images.constraint %}
{% image images.extruded %}
{% image images.stand %}

## Abbreviations

The <abbr title="World Health Organization">WHO</abbr> was founded in 1948.

## Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2 with **bold text**

## Nested Lists

1. First level
   * Second level
     - Third level
     - Another third level item
   * Another second level item
2. Back to first level

## Links with Reference Style

This is a [reference-style link][example] and another [one][example2].

[example]: https://example.com/
[example2]: https://example.org/ "Optional title"

[^1]: This is the first footnote. It contains some additional information that might be useful to the reader.
[^2]: This is the second footnote. Footnotes can contain **bold text**, *italic text*, and even `inline code`.
