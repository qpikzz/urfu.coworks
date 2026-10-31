import {
  STATUSES,
  createTask,
  addTask,
  removeTask,
  findTask,
  updateStatus,
  filterByStatus,
} from "./tasks.js";
import { formatTask, formatTaskList } from "./format.js";

export function createStore(initialTasks = []) {
  let tasks = [...initialTasks];

  return {
    get tasks() {
      return [...tasks];
    },
    add(input) {
      const task = createTask(input);
      tasks = addTask(tasks, task);
      return task;
    },
    remove(id) {
      tasks = removeTask(tasks, id);
    },
    find(id) {
      return findTask(tasks, id);
    },
    setStatus(id, status) {
      tasks = updateStatus(tasks, id, status);
    },
    filter(status) {
      return filterByStatus(tasks, status);
    },
    render() {
      return formatTaskList(tasks);
    },
  };
}

export {
  STATUSES,
  createTask,
  addTask,
  removeTask,
  findTask,
  updateStatus,
  filterByStatus,
  formatTask,
  formatTaskList,
};
