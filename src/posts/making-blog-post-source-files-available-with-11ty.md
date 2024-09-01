---
title: Making blog post source files available with 11ty
date: 2024-08-31
categories: [Software]
tags: [11ty, web, javascript]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/113060289182699491
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid0xKnxZNRbC4ZqsuMVcc91h7NACG9erXT5FRb4zBEQ8qKN9kKBEnJSPRn2F5JBJfhQl
---

You can now view the source file for any blog post on my site by replacing the trailing slash with `.txt` in the URL. For example, the source file for this post is available [here](/2024/08/making-blog-post-source-files-available-with-11ty.txt). You can also replace the trailing slash with the original file extension of the source. Most of my blog posts are composed in Markdown, so the extention will usually be `.md`, but my setup also supports the occasional `.ojs` (for [Observable notebooks][ojs]) or `.html` post. But `.txt` will always work.

[ojs]: /2023/11/11ty-and-observable/

I really like the idea the source code being available for my posts, as a resource for curious readers _and_ to have a permanent link to it to which I can refer (as in the self-referential paragraph above). Of course, the source for my entire blog setup, including all posts, is [available on GitHub][gh-chromamine]. But replicating the source on my own domain fulfills the [IndieWeb principles][] of "own your data" and building for "longevity."

[gh-chromamine]: https://github.com/harrislapiroff/chromamine.com
[IndieWeb principles]: https://indieweb.org/principles

I also like the idea that someone could use the source files in some automated way, since they can be easily derived from post URLs. Of course, the most likely person to have a use for them will be me.

***

This wasn't an entirely trivial feat to accomplish in Eleventy. Eleventy largely assumes that one source file generates one output file and I've found it challenging to compel it otherwise[^1].

[^1]: The one exception I've found is its [pagination feature][], which I have used to hack together, e.g., individual pages for [each tag][], using only a [single template file][].

[pagination feature]: https://www.11ty.dev/docs/pagination/
[each tag]: /archive/
[single template file]: https://github.com/harrislapiroff/chromamine.com/blob/main/src/tags.pug

I would love if I could provide Eleventy with multiple templates and multiple output formats for each input file. Imagine writing a blog post and generating the HTML page, a plain text file, a PDF, etc. If you like this idea too, please upvote [this issue on GitHub][multiple-outputs-issue]!

[multiple-outputs-issue]: https://github.com/11ty/eleventy/issues/2205

But until that's supported, I was able to hack together a solution using the `eleventy.after` event to trigger a function that copied the source files to the correct locations.

The overall process is that it

1. grabs the results of Eleventy's compilation,
2. narrows it down to just blog posts,
3. uses the input and output path of each blog post to calculate the appropriate output paths for the source code to be served on the site (e.g., mapping `./src/posts/making-blog-post-source-files-available-with-11ty.md` to both `_site/posts/2024/08/making-blog-post-source-files-available-with-11ty.md` and `making-blog-post-source-files-available-with-11ty.txt`),
4. and copies the source code for each blog appropriately.

Step by step explanations included in comments.

```js
// eleventy.config.js

module.exports = function(eleventyConfig) {
    // ...

    /* Copy raw source files to site
    * -------------------------------------*/
    eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
        // Match only blog post pages
        const blogPosts = results.filter(r => multimatch([r.inputPath], blogPostGlobs).length > 0)

        // Calculate a map from input source file to appropriate output locations
        const sourceFileInputOutputMap = blogPosts.map(({ inputPath, outputPath }) => {
            const extension = inputPath.split('.').pop()

            // Pop the trailing /index.html off the output path and add the extension
            const sourceOutputPath = outputPath.replace('/index.html', `.${extension}`)

            // We additionally copy the source with just a .txt extension so there's a
            // predictable URL it can be found at.
            // TODO: It would be nicer, at some point, to add this to the _redirects file
            // instead so the server can smoothly handle a redirect to the correct extension
            const txtSourceOutputPath = sourceOutputPath.replace(`.${extension}`, '.txt')

            return [
                [ inputPath, sourceOutputPath ],
                [ inputPath, txtSourceOutputPath ],
            ]
        }).flat()

        // Make copies from each source file to the output path
        console.log("[11ty] Copying source files to output directory...")
        await Promise.all(sourceFileInputOutputMap.map(
            ([ src, dest ]) => {
                console.log(`[11ty] Copying ${src} to ${dest}`)
                return fs.copyFile(src, dest)
            }
        ))
        console.log("[11ty] Finished copying source files to output directory")
    })

    // ...
}
```
