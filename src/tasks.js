const STATUSES = ["todo", "in-progress", "done"];

export function createTask({ id, title, status = "todo", createdAt = new Date().toISOString() }) {
  if (!id) {
    throw new Error("task id is required");
  }
  if (!title || !title.trim()) {
    throw new Error("task title is required");
  }
  if (!STATUSES.includes(status)) {
    throw new Error(`unknown status: ${status}`);
  }

  return {
    id: String(id),
    title: title.trim(),
    status,
    createdAt,
  };
}

export function addTask(tasks, task) {
  if (tasks.some((existing) => existing.id === task.id)) {
    throw new Error(`task already exists: ${task.id}`);
  }
  return [...tasks, task];
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== String(id));
}

export function findTask(tasks, id) {
  return tasks.find((task) => task.id === String(id)) ?? null;
}

export function updateStatus(tasks, id, status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`unknown status: ${status}`);
  }
  const found = findTask(tasks, id);
  if (!found) {
    throw new Error(`task not found: ${id}`);
  }
  return tasks.map((task) => (task.id === found.id ? { ...task, status } : task));
}

export function filterByStatus(tasks, status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`unknown status: ${status}`);
  }
  return tasks.filter((task) => task.status === status);
}

export { STATUSES };
