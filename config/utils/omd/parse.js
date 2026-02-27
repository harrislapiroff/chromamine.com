import Token from 'markdown-it/lib/token.mjs'
import { md as baseMd } from '../../markdown.js'

/**
 * Extract inline ${...} expressions from markdown source, replacing them
 * with placeholder spans. Handles balanced braces.
 */
function extractInlineExpressions(source, cells) {
  let result = ''
  let i = 0

  while (i < source.length) {
    // Look for ${ but not inside fenced code blocks
    if (source[i] === '$' && source[i + 1] === '{') {
      // Count balanced braces to find the end
      let depth = 0
      let start = i + 2
      let j = i + 1

      while (j < source.length) {
        if (source[j] === '{') {
          depth++
        } else if (source[j] === '}') {
          depth--
          if (depth === 0) {
            const expr = source.slice(start, j)
            const cellId = `inline-${cells.length}`
            cells.push({ id: cellId, source: expr, type: 'inline' })
            result += `<span data-cell="${cellId}"></span>`
            i = j + 1
            break
          }
        }
        j++
      }

      // If we never closed the brace, treat it as literal text
      if (depth !== 0) {
        result += source[i]
        i++
      }
    } else {
      result += source[i]
      i++
    }
  }

  return result
}

/**
 * Skip over fenced code blocks so we don't extract ${} from them.
 * Returns the source with inline expressions extracted only from prose sections.
 */
function extractInlineExpressionsFromProse(source, cells) {
  let result = ''
  let i = 0
  const lines = source.split('\n')
  let inFence = false
  let fenceChar = ''
  let fenceLen = 0
  let proseBuffer = ''

  for (const line of lines) {
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length

    if (!inFence) {
      // Check for start of a fenced code block
      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/)
      if (fenceMatch && indent < 4) {
        // Flush prose buffer with expression extraction
        result += extractInlineExpressions(proseBuffer, cells)
        proseBuffer = ''
        result += line + '\n'
        inFence = true
        fenceChar = fenceMatch[1][0]
        fenceLen = fenceMatch[1].length
        continue
      }
      proseBuffer += line + '\n'
    } else {
      result += line + '\n'
      // Check for end of fenced code block
      const closeMatch = trimmed.match(new RegExp(`^${fenceChar === '`' ? '`' : '~'}{${fenceLen},}\\s*$`))
      if (closeMatch) {
        inFence = false
      }
    }
  }

  // Flush remaining prose
  if (proseBuffer) {
    result += extractInlineExpressions(proseBuffer, cells)
  }

  return result
}

/**
 * Parse an .omd file into HTML + executable cells.
 *
 * - ```js blocks are extracted as executable cells
 * - ```js echo blocks are rendered as highlighted code AND extracted
 * - ```javascript blocks are rendered as highlighted code only
 * - ${expr} in prose is extracted as inline cells
 */
export function parseOmd(source) {
  const cells = []

  // Step 1: Extract inline expressions from prose (not from code blocks)
  const processedSource = extractInlineExpressionsFromProse(source, cells)

  // Step 2: Parse with the base markdown-it instance, then post-process
  // the token stream to intercept executable code blocks.
  const env = {}
  const tokens = baseMd.parse(processedSource, env)

  // Walk tokens and replace ```js fences with cell placeholders
  const processedTokens = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'fence') {
      const info = token.info.trim()

      // ```js — execute only (hide source)
      if (info === 'js') {
        const cellId = `cell-${cells.length}`
        cells.push({ id: cellId, source: token.content, type: 'block' })

        // Replace with an HTML block containing the placeholder div
        const placeholder = new Token('html_block', '', 0)
        placeholder.content = `<div data-cell="${cellId}"></div>\n`
        processedTokens.push(placeholder)
        continue
      }

      // ```js echo — execute AND display source
      if (info === 'js echo') {
        const cellId = `cell-${cells.length}`
        cells.push({ id: cellId, source: token.content, type: 'block' })

        // Render the code block as highlighted source using a fence with 'js' info
        // (shiki will highlight it) and then append the placeholder
        const codeFence = new Token('fence', 'code', 0)
        codeFence.info = 'js'
        codeFence.content = token.content
        codeFence.markup = token.markup
        codeFence.map = token.map
        processedTokens.push(codeFence)

        const placeholder = new Token('html_block', '', 0)
        placeholder.content = `<div data-cell="${cellId}"></div>\n`
        processedTokens.push(placeholder)
        continue
      }
    }

    // All other tokens pass through unchanged
    processedTokens.push(token)
  }

  // Render the processed tokens
  const html = baseMd.renderer.render(processedTokens, baseMd.options, env)

  return { html, cells }
}
