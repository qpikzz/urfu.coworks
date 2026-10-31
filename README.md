# coworks

Small utilities for tracking tasks in a team workspace.

## Install

```bash
npm install
```

## Usage

```js
import { createStore, formatTaskList } from "coworks";

const store = createStore();

store.add({ id: 1, title: "Write the README" });
store.add({ id: 2, title: "Add tests" });

store.setStatus(2, "done");

console.log(store.render());
// [ ] 1  Write the README
// [x] 2  Add tests
```

## API

| Function | Description |
| --- | --- |
| `createStore(initialTasks)` | Creates a task store with optional initial tasks. |
| `store.add({ id, title, status })` | Adds a task and returns it. |
| `store.remove(id)` | Removes a task by id. |
| `store.find(id)` | Returns a task or `null`. |
| `store.setStatus(id, status)` | Changes the status of a task. |
| `store.filter(status)` | Returns tasks with the given status. |
| `store.render()` | Returns a printable list of tasks. |
| `formatTask(task)` | Formats a single task. |
| `formatTaskList(tasks)` | Formats a list of tasks. |

Statuses: `todo`, `in-progress`, `done`.

## Tests

```bash
npm test
```
