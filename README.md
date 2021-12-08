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
import { Serializer } from "@mpt/binary";

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
import { StreamDeserializer } from "@mpt/binary";

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
