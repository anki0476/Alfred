import { test } from "node:test";
import assert from "node:assert/strict";
import { VoiceGesture, isVoiceShortcut } from "../lib/voice-gesture";

function setup(allowed = true) {
  const events: string[] = [];
  const gesture = new VoiceGesture({
    start: () => {
      events.push("start");
      return allowed;
    },
    finish: () => events.push("finish"),
    latch: (value) => events.push(`latch:${value}`),
  });
  return { gesture, events };
}

test("hold records once; release finishes after the double-tap window", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { gesture, events } = setup();
  gesture.press(1000);
  gesture.press(1100);
  gesture.release();
  t.mock.timers.tick(349);
  assert.deepEqual(events, ["start"]);
  t.mock.timers.tick(1);
  assert.deepEqual(events, ["start", "latch:false", "finish"]);
});

test("double-tap latches across key releases, double-tap again finishes once", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { gesture, events } = setup();
  gesture.press(1000);
  gesture.release();
  t.mock.timers.tick(100);
  gesture.press(1100);
  gesture.release();
  t.mock.timers.tick(500);
  assert.deepEqual(events, ["start", "latch:true"]);
  gesture.press(2000);
  gesture.release();
  gesture.press(2100);
  gesture.release();
  t.mock.timers.tick(500);
  assert.equal(events.filter((e) => e === "finish").length, 1);
});

test("focus loss or Done finishes pending capture and cancels release timer", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { gesture, events } = setup();
  gesture.press(1000);
  gesture.release();
  gesture.finish();
  t.mock.timers.tick(500);
  assert.equal(events.filter((e) => e === "finish").length, 1);
  gesture.toggleHandsFree();
  gesture.finish();
  assert.equal(events.filter((e) => e === "finish").length, 2);
});

test("blocked recording cannot latch or finish another capture", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { gesture, events } = setup(false);
  gesture.press(1000);
  gesture.release();
  gesture.press(1100);
  gesture.release();
  t.mock.timers.tick(500);
  assert.ok(!events.includes("latch:true"));
  assert.ok(!events.includes("finish"));
});

test("a failed microphone start resets the next gesture", () => {
  const { gesture, events } = setup();
  gesture.press(1000);
  gesture.reset();
  gesture.press(1100);
  assert.equal(events.filter((e) => e === "start").length, 2);
  assert.ok(!events.includes("latch:true"));
  gesture.finish();
});

test("shortcut matches only Ctrl Shift Z, without other modifiers or composition", () => {
  const chord = {
    code: "KeyZ",
    ctrlKey: true,
    shiftKey: true,
    altKey: false,
    metaKey: false,
    isComposing: false,
  };
  assert.ok(isVoiceShortcut(chord));
  for (const change of [
    { ctrlKey: false },
    { shiftKey: false },
    { altKey: true },
    { metaKey: true },
    { isComposing: true },
    { code: "KeyA" },
  ])
    assert.ok(!isVoiceShortcut({ ...chord, ...change }));
});
