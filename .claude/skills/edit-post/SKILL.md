---
name: edit-post
description: Review a blog post in src/posts/ and propose edits — copyediting, structural feedback, frontmatter and media checks, and pre-publish readiness. Never modifies the post; suggestions go in the conversation or, for long or heavily edited posts, an annotated artifact. Use when asked to review, proofread, edit, tighten, give feedback on, or check a post (draft or published) before publishing.
---

# Reviewing and editing blog posts

Posts live in `src/posts/<slug>.md` (occasionally `.ojs` or `.html`). Media for a
post lives in `src/media/<slug>/`. Drafts carry `eleventyExcludeFromCollections: true`
and usually commented-out `xposts`.

## 1. Figure out the job

- **Which post?** If none is named, use the untracked or most recently modified
  file in `src/posts/` (`git status --short src/posts`), or ask if it's ambiguous.
- **Never edit the post.** Whatever the wording of the request ("edit", "fix",
  "tighten", "clean up"), don't change the post file, its frontmatter, or its media.
  Write every change as a proposal for the author to accept or reject. That holds
  even if the author asks you to "just apply" changes while this skill is active.
  Say they can ask outside the review if they want you to make the changes.
- **How deep?** Default to a light copyedit plus a short note on structure. Only
  propose restructuring or big cuts when asked.

Read the whole post before commenting. For context on voice, skim one or two
recent published posts in the same category.

## 2. Voice — preserve it

This is a personal blog written in the first person. The goal is the author's
post, made cleaner — not a rewrite in a different voice.

Keep:
- Conversational asides, parentheticals, and footnote jokes (`[^2]: In a list
  that is of non-trivial length.`). These are the voice, not clutter.
- Italics for spoken emphasis (`*well*`, `*purpose*`).
- Sentence fragments and short punchy closers used deliberately.
- Opinions stated plainly. Don't hedge or soften claims the author made on purpose.

Avoid:
- Adding filler transitions, summaries, or "In conclusion" paragraphs.
- Replacing specific words with generic ones, or plain words with fancy ones.
- Introducing em-dash-heavy, listicle, or marketing-style prose.
- Adding headings to short essays that don't need them.

## 3. What to check

**Mechanics**
- Typos, doubled or missing words (e.g. "at of"), agreement, tense consistency.
- Double spaces, including before footnote refs and after periods.
- Dashes: the site mostly uses a spaced en dash (` – `) for asides; some posts use
  unspaced em dashes (`—`). Flag *mixing within one post* and suggest the one the
  post uses most; don't convert a post wholesale unless asked.
- Repeated words in close proximity ("dabbled … dabbled", "social … social").
- Overlong sentences that lose the reader; suggest a split only where it helps.

**Structure**
- Does the opening get to the point? Does the ending land, or trail off?
- Paragraph order, redundant paragraphs, a missing beat in the argument.
- Footnotes: each `[^n]` has a definition and vice versa; numbering is in order.
  Definitions may sit right after their paragraph or at the end — both are used.

**Markdown features this site supports** (`config/markdown.js`)
- Footnotes, abbreviations, `{.class}` attributes (markdown-it-attrs), heading anchors.
- Containers: `::: note … :::` and `::: update … :::` (updates usually start
  "As of <date>, …").
- Reference-style links (`[text][]` + `[text]: url`) are common; check every
  reference has a definition.
- Code blocks support `title="file.js"` and `scroll`/`scroll=N` (see CLAUDE.md).

**Links and media**
- Links point where the text implies; flag obviously wrong or placeholder URLs
  (`TBD`, `example.com`). Don't fetch every link unless asked.
- Images have meaningful alt text that describes the image, not "image of…".
  Alt text in frontmatter `images:` entries is required too.
- Media paths resolve (`/media/<slug>/…` or relative to the post).

**Frontmatter**
- Allowed keys: `title, date, categories, tags, xposts, images, excerpt,
  seoImage, seoDescription, dances, eleventyExcludeFromCollections, layout,
  permalink`. Anything else is a typo.
- `categories` should be one of the existing ones: `Miscellany`, `Software`,
  `Dance`, `Life`. Empty `categories: []` / `tags: []` on a draft is a to-do.
- Suggest tags from those already in use
  (`grep -h '^tags:' src/posts/*.md | sort | uniq -c | sort -rn`) before
  inventing new ones; keep tags consistent in case and spelling (e.g. `contra`,
  `calling`, `web`, `machine learning`).
- `title` is in the case the author chose; flag only if inconsistent with itself.
- `date` matches the intended publish date.
- Consider suggesting an `excerpt` or `seoDescription` if the opening sentence
  would make a poor social preview.

**Dance posts**: cross-check dance titles and authors against
`scripts/data/dances.json`.

## 4. Run the checks

```bash
npm run validate -- --errors-only   # media refs, frontmatter, image GPS
```

Report anything it flags for the post under review. (Ignore unrelated warnings
elsewhere in the repo unless they're quick wins worth mentioning.)

## 5. Deliver

Pick the format once you've drafted your findings. Count the words of prose
(`wc -w`, ignoring frontmatter):

- **In the conversation**: the post is under ~1,000 words *and* you have fewer
  than ~15 suggestions, none of them structural rewrites of whole paragraphs.
- **Annotated artifact**: anything longer, or a post that needs heavy editing
  (many suggestions, reordered or rewritten paragraphs, big cuts).

If it's borderline, use the conversation and offer the artifact in one line.

### In the conversation

Group by severity:

1. **Must fix**: errors, broken links/footnotes, validate failures.
2. **Suggestions**: wording, structure, repetition. Quote the original text and
   give the proposed replacement (`"at of college"` → `"of college"`), with a
   few words of why when it isn't obvious.
3. **Pre-publish checklist** (drafts only): categories, tags, excerpt, xposts.

Keep it proportionate: a 300-word post gets a short review. Lead with one or two
sentences on what's working and the single most important change, if any.

### Annotated artifact

The artifact shows the **original post, word for word**, with each suggestion
attached to the passage it's about. It's a marked-up manuscript, not a cleaned-up
rewrite.

1. Load the `artifact-design` skill before writing the page.
2. Write a single HTML file in the scratchpad directory (e.g. `<slug>-review.html`)
   and publish it with the Artifact tool. Title it `Review: <post title>`.
3. Contents:
   - **Header**: post title, word count, review date, and a short summary: what's
     working, the one or two most important changes, and counts by severity.
   - **The post body**, rendered as readable prose (paragraphs, headings, lists,
     block quotes, footnotes) but keep the original text intact. Frontmatter goes
     in its own panel at the top with its annotations.
   - **Annotations** on exact spans of the original: highlight the span and attach
     a note with the severity (must fix / suggestion / question), the proposed
     replacement text if there is one (shown as a deletion and insertion), and
     a brief reason. Color-code by severity, and number the annotations so the
     author can refer to them ("take 3, 7 and 12").
   - Put structural notes (move a paragraph, cut a section) on the paragraph
     they're about, with the proposed new text in full if you're suggesting a
     rewrite.
   - **Pre-publish checklist** at the end, for drafts.
   - Margin notes beside the text on wide screens. On narrow screens, notes
     should open inline below their paragraph.
   - A toggle to show the text with all suggestions applied, so the author can
     read the result. The original stays the default view.
4. In the conversation, give the link, the summary, and the must-fix items. Don't
   repeat every annotation.

Annotation text is quoted from the post, so make sure each highlighted span
matches the source exactly. A suggestion pinned to text that isn't there can't
be acted on.

Don't publish the post, remove the draft flag, fill in `xposts`, or commit.
That's `npm run blog publish <slug>`, and it's the author's call.
