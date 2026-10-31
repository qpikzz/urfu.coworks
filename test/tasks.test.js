import test from "node:test";
import assert from "node:assert/strict";

import { createStore, createTask, formatTaskList } from "../src/index.js";

test("createTask validates input", () => {
  assert.throws(() => createTask({ id: "", title: "x" }), /id is required/);
  assert.throws(() => createTask({ id: "1", title: "  " }), /title is required/);
  assert.throws(
    () => createTask({ id: "1", title: "x", status: "blocked" }),
    /unknown status/,
  );
});

test("store adds and finds tasks", () => {
  const store = createStore();
  const task = store.add({ id: 1, title: "Write tests" });

  assert.equal(task.status, "todo");
  assert.equal(store.find("1").title, "Write tests");
  assert.equal(store.tasks.length, 1);
});

test("store rejects duplicate ids", () => {
  const store = createStore();
  store.add({ id: 1, title: "First" });

  assert.throws(() => store.add({ id: 1, title: "Second" }), /already exists/);
});

test("store updates status and removes tasks", () => {
  const store = createStore();
  store.add({ id: 1, title: "Ship it" });

  store.setStatus("1", "done");
  assert.equal(store.find("1").status, "done");

  store.remove("1");
  assert.equal(store.find("1"), null);
  assert.equal(store.tasks.length, 0);
});

test("store filters tasks by status", () => {
  const store = createStore();
  store.add({ id: 1, title: "One" });
  store.add({ id: 2, title: "Two" });
  store.setStatus(2, "done");

  assert.deepEqual(store.filter("done").map((task) => task.id), ["2"]);
  assert.deepEqual(store.filter("todo").map((task) => task.id), ["1"]);
  assert.throws(() => store.filter("blocked"), /unknown status/);
});

test("formatTaskList renders empty and non-empty lists", () => {
  assert.equal(formatTaskList([]), "No tasks yet.");

  const store = createStore();
  store.add({ id: 1, title: "One" });
  store.add({ id: 2, title: "Two" });
  store.setStatus(2, "done");

  assert.equal(formatTaskList(store.tasks), "[ ] 1  One\n[x] 2  Two");
});
