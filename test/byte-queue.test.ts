import { ByteQueue } from "@mpt/binary";
import { deepStrictEqual, strictEqual } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "./common/binary.js";

await suite("byte-queue", async () => {
	function createQueue() {
		const queue = new ByteQueue();
		queue.enqueue(binary`0011`.array);
		queue.enqueue(binary`223344`.buffer);
		queue.enqueue(binary`5566`.nodeBuffer);
		queue.enqueue(binary`7788`.array);
		return queue;
	}

	await test(`${ByteQueue.prototype.dequeue.name}: no args`, t => {
		const queue = createQueue();
		strictEqual(queue.byteLength, 9);

		deepStrictEqual(queue.dequeue(), binary`001122334455667788`.array);
		strictEqual(queue.byteLength, 0);
	});

	await test(`${ByteQueue.prototype.dequeue.name}: specific byte lengths, no remove`, t => {
		const queue = createQueue();
		deepStrictEqual(queue.dequeue(1), binary`00`.array);
		strictEqual(queue.byteLength, 8);

		deepStrictEqual(queue.dequeue(2), binary`1122`.array);
		strictEqual(queue.byteLength, 6);

		deepStrictEqual(queue.dequeue(0, false), binary``.array);
		deepStrictEqual(queue.dequeue(1, false), binary`33`.array);
		deepStrictEqual(queue.dequeue(2, false), binary`3344`.array);
		deepStrictEqual(queue.dequeue(5, false), binary`3344556677`.array);
		strictEqual(queue.byteLength, 6);

		deepStrictEqual(queue.dequeue(5), binary`3344556677`.array);
		strictEqual(queue.byteLength, 1);

		deepStrictEqual(queue.dequeue(2), binary`88`.array);
		strictEqual(queue.byteLength, 0);

		deepStrictEqual(queue.dequeue(2), binary``.array);
		strictEqual(queue.byteLength, 0);
	});

	await test(ByteQueue.prototype.dequeueInto.name, t => {
		const queue = createQueue();

		const a = new Uint8Array(1);
		strictEqual(queue.dequeueInto(a), 1);
		deepStrictEqual(a, binary`00`.array);
		strictEqual(queue.byteLength, 8);

		const b = new ArrayBuffer(5);
		strictEqual(queue.dequeueInto(b, 2), 2);
		deepStrictEqual(b, binary`1122000000`.buffer);
		strictEqual(queue.byteLength, 6);

		strictEqual(queue.dequeueInto(b, 0, false), 0);
		deepStrictEqual(b, binary`1122000000`.buffer);
		strictEqual(queue.dequeueInto(b, 1, false), 1);
		deepStrictEqual(b, binary`3322000000`.buffer);
		strictEqual(queue.dequeueInto(b, 2, false), 2);
		deepStrictEqual(b, binary`3344000000`.buffer);
		strictEqual(queue.dequeueInto(b, 5, false), 5);
		deepStrictEqual(b, binary`3344556677`.buffer);
		strictEqual(queue.byteLength, 6);

		const c = new Uint8Array(5);
		strictEqual(queue.dequeueInto(c, 7), 5);
		deepStrictEqual(c, binary`3344556677`.array);
		strictEqual(queue.byteLength, 1);

		strictEqual(queue.dequeueInto(c), 1);
		deepStrictEqual(c, binary`8844556677`.array);
		strictEqual(queue.byteLength, 0);

		strictEqual(queue.dequeueInto(c), 0);
		deepStrictEqual(c, binary`8844556677`.array);
		strictEqual(queue.byteLength, 0);
	});

	await test(ByteQueue.prototype.clear.name, t => {
		const queue = createQueue();
		queue.clear();
		strictEqual(queue.byteLength, 0);
		deepStrictEqual(queue.dequeue(), binary``.array);
	});
});
