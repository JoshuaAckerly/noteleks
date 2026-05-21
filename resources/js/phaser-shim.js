/**
 * Phaser shim for ES module context.
 *
 * Phaser is loaded from CDN as a classic (non-module) script which sets
 * window.Phaser. spine-phaser imports it with `import * as Phaser from 'phaser'`,
 * which fails in browsers with no import-map. This shim is aliased to 'phaser'
 * in the Vite config so that the spine-phaser chunk resolves Phaser from the
 * already-loaded global rather than attempting a bare bare-specifier import.
 *
 * This module is evaluated AFTER checkReady() confirms window.Phaser exists,
 * so accessing window.Phaser here is safe.
 */

const P = globalThis.Phaser;

export const Actions = P?.Actions;
export const Animations = P?.Animations;
export const Cameras = P?.Cameras;
export const Core = P?.Core;
export const Data = P?.Data;
export const Display = P?.Display;
export const DOM = P?.DOM;
export const Events = P?.Events;
export const Game = P?.Game;
export const GameObjects = P?.GameObjects;
export const Geom = P?.Geom;
export const Input = P?.Input;
export const Loader = P?.Loader;
export const Math = P?.Math;
export const Physics = P?.Physics;
export const Plugins = P?.Plugins;
export const Renderer = P?.Renderer;
export const Scale = P?.Scale;
export const Scene = P?.Scene;
export const Sound = P?.Sound;
export const Structs = P?.Structs;
export const Textures = P?.Textures;
export const Tilemaps = P?.Tilemaps;
export const Time = P?.Time;
export const Tweens = P?.Tweens;
export const Utils = P?.Utils;
export const VERSION = P?.VERSION;

export default P;
