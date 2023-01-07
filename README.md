# @mpt/binary
Utilities for binary data serialization & encoding

# Installation
```bash
npm i @mpt/binary
```
```ts
import { ... } from "@mpt/binary";
```

## Serialization / deserialization
```ts
const data = new Serializer()
    .uint8(42)
    .prefixedUTF8(Serializer.prototype.uint16, "Hello World!")
    .serialize();

// data: Uint8Array { 2a 00 0c 48 65 6c 6c 6f 20 57 6f 72 6c 64 21 }

const deserializer = new Deserializer(data);

deserializer.uint8();
// => 42

deserializer.utf8(deserializer.uint16());
// => "Hello World!"
```

## Readable stream deserialization
```ts
const res = await fetch("https://example.com/example-payload");

const deserializer = new StreamDeserializer(res.body);

await deserializer.deserialize(d => {
    return d.uint8();
});
// => 42

await deserializer.deserialize(d => {
    return d.utf8(d.uint16());
});
// => "Hello World!"
```

## Encoding
```ts
encodeBase64(new TextEncoder().encode("Hello World!"));
// => "SGVsbG8gV29ybGQh"

new TextDecoder().decode(decodeBase64("SGVsbG8gV29ybGQh"));
// => "Hello World!"
```
Supported encodings:
+ hex
+ base64
+ base64url
+ base32 (encode only)

### Memory Usage
Some encoders/decoders in this library make use of an internal shared buffer to avoid memory allocations if possible.
```ts
setupSharedBuffer(2048);
```
