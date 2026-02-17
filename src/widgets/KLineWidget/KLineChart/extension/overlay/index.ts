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

import type Nullable from '../../common/Nullable'

import OverlayImp, { type OverlayTemplate, type OverlayConstructor, type OverlayInnerConstructor } from '../../component/Overlay'

import fibonacci from './fibonacci'
import horizontalRay from './horizontalRay'
import horizontalSegment from './horizontalSegment'
import horizontalStraight from './horizontalStraight'
import parallelStraight from './parallelStraight'
import priceChannel from './priceChannel'
import priceLine from './priceLine'
import ray from './ray'
import segment from './segment'
import straight from './straight'
import verticalRay from './verticalRay'
import verticalSegment from './verticalSegment'
import verticalStraight from './verticalStraight'

import simpleAnnotation from './simpleAnnotation'
import simpleTag from './simpleTag'
import arrow from './arrow'
import parallelRay from './parallelRay'
import parallelSegment from './parallelSegment'
import bifurcate from './bifurcate'
import circle from './circle'
import triangle from './triangle'
import rect from './rect'
import parallelogram from './parallelogram'
import oval from './oval'
import fibonacciSegment from './fibonacciSegment'
import fibonacciChannel from './fibonacciChannel'
import fibonacciCircle from './fibonacciCircle'
import fibonacciExtension from './fibonacciExtension'
import fibonacciSector from './fibonacciSector'
import fibonacciSpiral from './fibonacciSpiral'
import gannBox from './gannBox'
import threeWaves from './threeWaves'
import fiveWaves from './fiveWaves'
import eightWaves from './eightWaves'
import continuousLine from './continuousLine'
import xabcd from './xabcd'
import abcd from './abcd'
import headShoulders from './headShoulders'
import triangleTruss from './triangleTruss'
import threePush from './threePush'
import mw from './mw'
import ruler from './ruler'
import timeRuler from './timeRuler'
import spaceRuler from './spaceRuler'
import horizontalChannel from './horizontalChannel'
import bullish from './bullish'

const overlays: Record<string, OverlayInnerConstructor> = {}

const extensions = [
  fibonacci,
  horizontalRay,
  horizontalSegment,
  horizontalStraight,
  parallelStraight,
  priceChannel,
  priceLine,
  ray,
  segment,
  straight,
  verticalRay,
  verticalSegment,
  verticalStraight,
  simpleAnnotation,
  simpleTag,
  arrow,
  parallelRay,
  parallelSegment,
  bifurcate,
  circle,
  triangle,
  rect,
  parallelogram,
  oval,
  fibonacciSegment,
  fibonacciChannel,
  fibonacciCircle,
  fibonacciExtension,
  fibonacciSector,
  fibonacciSpiral,
  gannBox,
  threeWaves,
  fiveWaves,
  eightWaves,
  continuousLine,
  xabcd,
  abcd,
  headShoulders,
  triangleTruss,
  threePush,
  mw,
  ruler,
  timeRuler,
  spaceRuler,
  horizontalChannel,
  bullish
]

extensions.forEach((template: OverlayTemplate) => {
  overlays[template.name] = OverlayImp.extend(template)
})

function registerOverlay<E = unknown>(template: OverlayTemplate<E>): void {
  overlays[template.name] = OverlayImp.extend(template)
}

function getOverlayInnerClass(name: string): Nullable<OverlayInnerConstructor> {
  return overlays[name] ?? null
}

function getOverlayClass(name: string): Nullable<OverlayConstructor> {
  return overlays[name] ?? null
}

function getSupportedOverlays(): string[] {
  return Object.keys(overlays)
}

export { registerOverlay, getOverlayClass, getOverlayInnerClass, getSupportedOverlays }
