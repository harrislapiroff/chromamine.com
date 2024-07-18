import { getResolvers as OFgetResolvers } from '@observablehq/framework/dist/resolvers.js'

// A wrapper around Observable's resolvers that allows us to override some
// of them with out own
export function getResolvers(page, {root, path, normalizePath, loaders}) {
    const resolvers = OFgetResolvers(page, {root, path, normalizePath, loaders})
    return resolvers
}
