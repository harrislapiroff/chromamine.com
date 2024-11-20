// It's necessary to use a javascript file to provide these data computations
// because we have a variety of different template formats in this file and
// computed frontmatter is always processed using the template language of the
// current page. We want to have the same permalink format for all blog posts
// without having to duplicate the logic in each template language.
export default {
    layout: 'monotheme/post.pug',
    categories: [],
    eleventyComputed: {
        // YYYY/MM/page-name/
        permalink: ({ page }) =>
            `${page.date.getFullYear()}/` +
            `${(page.date.getMonth() + 1).toString().padStart(2, '0')}/` +
            `${page.fileSlug}/`,
    },
}
