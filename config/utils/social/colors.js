/* CSS `lch()` evaluated in JavaScript.
 *
 * The site's palette (src/static/styles/_variables.sass) is written entirely in
 * CSS `lch()`, and several of its colors — the pinks especially — sit well
 * outside the sRGB gamut. Social images are rasterized to sRGB PNGs, so those
 * colors have to be resolved here the same way a browser resolves them, or the
 * cards come out a visibly different hue from the site.
 *
 * This implements CSS Color 4: `lch()` is CIE LCH on a D50 white point, and an
 * out-of-gamut color is mapped by reducing its *OkLCh* chroma until clipping it
 * is imperceptible, rather than clipping sRGB channels directly (channel
 * clipping shifts hue badly at these chromas).
 * See https://www.w3.org/TR/css-color-4/#gamut-mapping
 */

const D50 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585]

const KAPPA = 24389 / 27
const EPSILON = 216 / 24389

// Just-noticeable difference in OkLab, and the chroma search resolution, both
// as specified by the CSS gamut mapping algorithm.
const JND = 0.02
const SEARCH_EPSILON = 0.0001

const multiply = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2])

// D50-relative XYZ -> linear sRGB, with the Bradford adaptation to D65 folded
// in (the combined matrix given in CSS Color 4).
const XYZ_D50_TO_LINEAR_SRGB = [
  [3.1341359569958707, -1.6173863321612538, -0.4906619460083532],
  [-0.978795502912089, 1.916254567259524, 0.03344273116131949],
  [0.07195537988411677, -0.2289768264158322, 1.405386058324125]
]

const LINEAR_SRGB_TO_XYZ_D65 = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
]

const XYZ_D65_TO_LINEAR_SRGB = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
]

const XYZ_D65_TO_LMS = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
]

const LMS_TO_XYZ_D65 = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.1122868032803170, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
]

const LMS_TO_OKLAB = [
  [0.2104542683093140, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.4285922420485799, 0.4505937096174110],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
]

const OKLAB_TO_LMS = [
  [1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
  [1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
  [1.0000000000000000, -0.0894841775298119, -1.2914855480194092]
]

function lchToXyzD50 (l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)

  const fy = (l + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200

  const x = fx ** 3 > EPSILON ? fx ** 3 : (116 * fx - 16) / KAPPA
  const y = l > KAPPA * EPSILON ? fy ** 3 : l / KAPPA
  const z = fz ** 3 > EPSILON ? fz ** 3 : (116 * fz - 16) / KAPPA

  return [x * D50[0], y * D50[1], z * D50[2]]
}

const linearSrgbToOklab = (rgb) =>
  multiply(LMS_TO_OKLAB, multiply(XYZ_D65_TO_LMS, multiply(LINEAR_SRGB_TO_XYZ_D65, rgb)).map(Math.cbrt))

const oklabToLinearSrgb = (lab) =>
  multiply(XYZ_D65_TO_LINEAR_SRGB, multiply(LMS_TO_XYZ_D65, multiply(OKLAB_TO_LMS, lab).map((v) => v ** 3)))

const oklchToLinearSrgb = ([l, c, h]) =>
  oklabToLinearSrgb([l, c * Math.cos(h), c * Math.sin(h)])

const deltaEOK = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

const inGamut = (rgb) => rgb.every((c) => c >= -1e-6 && c <= 1 + 1e-6)

const clip = (rgb) => rgb.map((c) => Math.min(1, Math.max(0, c)))

// Gamma-encode linear-light sRGB.
const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

const toHex = (rgb) =>
  '#' + rgb.map((c) => Math.round(encode(c) * 255).toString(16).padStart(2, '0')).join('')

function gamutMap (linear) {
  const [okL, okA, okB] = linearSrgbToOklab(linear)
  if (okL >= 1) return [1, 1, 1]
  if (okL <= 0) return [0, 0, 0]

  const okH = Math.atan2(okB, okA)
  let low = 0
  let high = Math.hypot(okA, okB)
  let best = clip(linear)

  while (high - low > SEARCH_EPSILON) {
    const chroma = (low + high) / 2
    const candidate = oklchToLinearSrgb([okL, chroma, okH])

    if (inGamut(candidate)) {
      low = chroma
      best = clip(candidate)
      continue
    }

    // Compare the clipped rendering against the color actually requested at
    // this chroma — not against the original — as the spec's loop does.
    const clipped = clip(candidate)
    if (deltaEOK(linearSrgbToOklab(clipped), linearSrgbToOklab(candidate)) < JND) {
      low = chroma
      best = clipped
    } else {
      high = chroma
    }
  }

  return best
}

/* Resolve a CSS `lch(l% c h)` color to an sRGB hex string.
 *
 * `l` is 0–100, `c` is absolute chroma (not a percentage) and `h` is in
 * degrees — the three numbers exactly as they appear in the stylesheet.
 */
export function lch (l, c, h) {
  const linear = multiply(XYZ_D50_TO_LINEAR_SRGB, lchToXyzD50(l, c, h))
  return toHex(inGamut(linear) ? clip(linear) : gamutMap(linear))
}
