const hslToRgb = (h: number, s: number, l: number) => {
  let r: number
  let g: number
  let b: number

  if (s == 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const randomColor = () => {
  const h = Math.round(Math.random() * 360) / 360
  const s = randomNumber(70, 90) / 100
  const l = randomNumber(75, 90) / 100
  const rgbValue = hslToRgb(h, s, l)
  let rgb = ""
  for (let i = 0; i < 3; i++) {
    const c = rgbValue[i].toString(16)
    rgb += `00${c}`.substr(c.length)
  }
  return rgb
}
