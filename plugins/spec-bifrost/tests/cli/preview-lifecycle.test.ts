import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { installPreviewShutdownHandlers } from "../../src/cli/previewLifecycle.ts";

class FakeProcess extends EventEmitter {
  readonly exitCodes: number[] = [];

  exit(code?: number): never {
    this.exitCodes.push(code ?? 0);
    return undefined as never;
  }
}

test("preview shutdown handlers close server on termination signals once", async () => {
  const fakeProcess = new FakeProcess();
  let closeCount = 0;

  installPreviewShutdownHandlers(
    {
      close: async () => {
        closeCount += 1;
      }
    },
    fakeProcess
  );

  fakeProcess.emit("SIGTERM");
  fakeProcess.emit("SIGINT");
  fakeProcess.emit("SIGHUP");
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(closeCount, 1);
  assert.deepEqual(fakeProcess.exitCodes, [0]);
});

test("preview shutdown handlers can be removed", async () => {
  const fakeProcess = new FakeProcess();
  let closeCount = 0;

  const removeHandlers = installPreviewShutdownHandlers(
    {
      close: async () => {
        closeCount += 1;
      }
    },
    fakeProcess
  );

  removeHandlers();
  fakeProcess.emit("SIGTERM");
  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(closeCount, 0);
  assert.deepEqual(fakeProcess.exitCodes, []);
});
