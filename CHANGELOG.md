# Changelog

## 7.0
+ **Breaking:** Rename `alloc` & `Allocator.alloc` to `allocSync`.
+ **Breaking:** Remove support for native node streams.
+ **Breaking:** Rename `ZeroingUniqueAllocator.release` to `zeroFill`.
+ **Breaking:** Rename `Deserializer.array` to `viewArray`.
+ **Breaking:** Rename `Deserializer.view` to `viewData`.
+ **Breaking:** Rename `Deserializer.slice` to `copy`.
+ **Breaking:** Add type safeguards against async functions where synchronous functions are expected.
+ Add `zeroFillBuffer` utility.
+ Add ``withZeroingUniqueAllocator` utility.
+ Add support for shared array buffers.

## 6.0
+ **Breaking:** Move `@mpt/binary/node` export to package exports map.
+ **Breaking:** Remove shared buffers in favor of custom allocators.

## 5.2
+ Upgrade to typescript 5.
+ Improved serializer performance by ~2x.
+ Add API for booleans and optional values:
  + `Serializer.use`
  + `Serializer.boolean`
  + `Serializer.none`
  + `Serializer.some`
  + `Serializer.useOption`
  + `Serializer.option`
  + `Deserializer.boolean`
  + `Deserializer.isSome`
  + `Deserializer.option`

## 5.1
+ Add optional padding parameter to `encodeBase64`.
+ Add `encodeBase32` function.
+ Export `setupSharedBuffer`.

## 5.0
+ **Breakig:** Drop CommonJS support.

## 4.1
+ Fix package export map.

## 4.0
+ **Breaking:** Drop support for NodeJS 16 or lower.
+ **Breaking:** Replace enums with type definitions.
+ Add explicit extensions to module imports.
