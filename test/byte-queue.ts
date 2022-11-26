import test from "ava";

import { ByteQueue } from "../src/index.js";
import { binary } from "./_common/binary.js";

function createQueue() {
	const queue = new ByteQueue();
	queue.enqueue(binary`0011`.array);
	queue.enqueue(binary`223344`.buffer);
	queue.enqueue(binary`5566`.nodeBuffer);
	queue.enqueue(binary`7788`.array);
	return queue;
}

test(`${ByteQueue.prototype.dequeue.name}: no args`, t => {
	const queue = createQueue();
	t.is(queue.byteLength, 9);

	t.deepEqual(queue.dequeue(), binary`001122334455667788`.array);
	t.is(queue.byteLength, 0);
});

test(`${ByteQueue.prototype.dequeue.name}: specific byte lengths, no remove`, t => {
	const queue = createQueue();
	t.deepEqual(queue.dequeue(1), binary`00`.array);
	t.is(queue.byteLength, 8);

	t.deepEqual(queue.dequeue(2), binary`1122`.array);
	t.is(queue.byteLength, 6);

	t.deepEqual(queue.dequeue(0, false), binary``.array);
	t.deepEqual(queue.dequeue(1, false), binary`33`.array);
	t.deepEqual(queue.dequeue(2, false), binary`3344`.array);
	t.deepEqual(queue.dequeue(5, false), binary`3344556677`.array);
	t.is(queue.byteLength, 6);

	t.deepEqual(queue.dequeue(5), binary`3344556677`.array);
	t.is(queue.byteLength, 1);

	t.deepEqual(queue.dequeue(2), binary`88`.array);
	t.is(queue.byteLength, 0);

	t.deepEqual(queue.dequeue(2), binary``.array);
	t.is(queue.byteLength, 0);
});

test(ByteQueue.prototype.dequeueInto.name, t => {
	const queue = createQueue();

	const a = new Uint8Array(1);
	t.is(queue.dequeueInto(a), 1);
	t.deepEqual(a, binary`00`.array);
	t.is(queue.byteLength, 8);

	const b = new ArrayBuffer(5);
	t.is(queue.dequeueInto(b, 2), 2);
	t.deepEqual(b, binary`1122000000`.buffer);
	t.is(queue.byteLength, 6);

	t.is(queue.dequeueInto(b, 0, false), 0);
	t.deepEqual(b, binary`1122000000`.buffer);
	t.is(queue.dequeueInto(b, 1, false), 1);
	t.deepEqual(b, binary`3322000000`.buffer);
	t.is(queue.dequeueInto(b, 2, false), 2);
	t.deepEqual(b, binary`3344000000`.buffer);
	t.is(queue.dequeueInto(b, 5, false), 5);
	t.deepEqual(b, binary`3344556677`.buffer);
	t.is(queue.byteLength, 6);

	const c = new Uint8Array(5);
	t.is(queue.dequeueInto(c, 7), 5);
	t.deepEqual(c, binary`3344556677`.array);
	t.is(queue.byteLength, 1);

	t.is(queue.dequeueInto(c), 1);
	t.deepEqual(c, binary`8844556677`.array);
	t.is(queue.byteLength, 0);

	t.is(queue.dequeueInto(c), 0);
	t.deepEqual(c, binary`8844556677`.array);
	t.is(queue.byteLength, 0);
});

test(ByteQueue.prototype.clear.name, t => {
	const queue = createQueue();
	queue.clear();
	t.is(queue.byteLength, 0);
	t.deepEqual(queue.dequeue(), binary``.array);
});
