/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isValid } from './typeChecks'

const rgbaRegExp = /^[rR][gG][Bb][Aa]\(([\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\s]*,){3}[\s]*(1|1.0|0|0.[0-9])[\s]*\){1}$/

export function isRgba(color: string): boolean {
  return rgbaRegExp.test(color)
}

export function isHsla(color: string): boolean {
  return (/^[hH][Ss][Ll][Aa]\(([\s]*(360｜3[0-5][0-9]|[012]?[0-9][0-9]?)[\s]*,)([\s]*((100|[0-9][0-9]?)%|0)[\s]*,){2}([\s]*(1|1.0|0|0.[0-9])[\s]*)\)$/).test(color)
}

export function isTransparent(color: string): boolean {
  return color === 'transparent' ||
    color === 'none' ||
    /^[rR][gG][Bb][Aa]\(([\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\s]*,){3}[\s]*0[\s]*\)$/.test(color) ||
    /^[hH][Ss][Ll][Aa]\(([\s]*(360｜3[0-5][0-9]|[012]?[0-9][0-9]?)[\s]*,)([\s]*((100|[0-9][0-9]?)%|0)[\s]*,){2}([\s]*0[\s]*)\)$/.test(color)
}

export function rgbToHex(rgb: string): string {
  if (!isRgba(rgb)) {
    return rgb
  }
  const match = rgbaRegExp.exec(rgb)
  if (!isValid(match)) {
    throw new Error('Invalid RGB string format')
  }
  const r = parseInt(match[1], 10).toString(16)
  const g = parseInt(match[2], 10).toString(16)
  const b = parseInt(match[3], 10).toString(16)
  return `#${r.length === 1 ? `0${r}` : r}${g.length === 1 ? `0${r}` : r}${b.length === 1 ? `0${r}` : r}`
}

export function hexToRgb(hex: string, alpha?: number): string {
  const h = hex.replace(/^#/, '')
  const i = parseInt(h, 16)
  const r = (i >> 16) & 255
  const g = (i >> 8) & 255
  const b = i & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha ?? 1})`
}
export function colorToRgb(color: string): object {
  let r, g, b
  if (color.includes('rgba')) {
    const baseColor = color.replace('rgba(', '').replace(')', '').split(',')
    r = baseColor[0].trim()
    g = baseColor[1].trim()
    b = baseColor[2].trim()
  } else if (color.includes('rgb')) {
    const baseColor = color.replace('rgb(', '').replace(')', '').split(',')
    r = baseColor[0].trim()
    g = baseColor[1].trim()
    b = baseColor[2].trim()
  } else if (color.startsWith('#')) {
    let hex = color.substring(1)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    } else {
      r = 255; g = 255; b = 255
    }
  } else {
    r = 255; g = 255; b = 255
  }
  if(typeof r === 'string'){
    r = parseInt(r)
  }
  if(typeof g === 'string'){
    g = parseInt(g)
  } 
  if(typeof b === 'string'){
    b = parseInt(b)
  }
  
  return {
    r, g, b
  }
}
