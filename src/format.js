const STATUS_LABELS = {
  todo: "[ ]",
  "in-progress": "[~]",
  done: "[x]",
};

function pad(value, width) {
  return String(value).padEnd(width, " ");
}

export function formatTask(task) {
  const label = STATUS_LABELS[task.status] ?? "[?]";
  return `${label} ${task.id} ${task.title}`;
}

export function formatTaskList(tasks) {
  if (tasks.length === 0) {
    return "No tasks yet.";
  }

  const idWidth = Math.max(...tasks.map((task) => task.id.length));
  return tasks
    .map((task) => {
      const label = STATUS_LABELS[task.status] ?? "[?]";
      return `${label} ${pad(task.id, idWidth)}  ${task.title}`;
    })
    .join("\n");
}

export { STATUS_LABELS };
