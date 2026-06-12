// Jest's global test API (describe / it / expect) and RNTL's matcher type
// augmentations. TypeScript's automatic @types inclusion skips @types/jest
// here — it ships an `exports` map that bundler module-resolution doesn't
// auto-discover (unlike @types/node, which has none) — so reference it
// explicitly to make the globals available across colocated *.test.ts(x).
/// <reference types="jest" />
