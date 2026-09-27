# To-Do List — JavaScript Logic & State Management

A fully functional, state-driven client-side To-Do List application built for the internship task **"JavaScript Logic & State Management."** It's built with plain **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no backend — and automatically saves your tasks in the browser using `localStorage`.

## 📁 Project Structure

```
todo-list/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## ✅ Features

- Full **CRUD**: create, read, update (edit) and delete tasks
- **Complete/uncomplete** toggle with visual styling (strike-through + tint)
- **Filtering**: All / Active / Completed, with a clear active filter style
- **localStorage persistence** — tasks survive page refresh and browser restarts
- **Event delegation** — one listener on the task list container handles every task's toggle, edit, save, cancel and delete actions
- **State-driven rendering** — the DOM is always rebuilt from the `tasks` array; nothing is hard-coded in HTML
- Live **task counters** ("X tasks" / "Y remaining")
- **Empty-state messages** that adapt to the active filter
- **Enter key** support for adding tasks and saving an edit
- **Input validation** — blank tasks are rejected, with an inline error message
- **Delete confirmation modal** before a task is removed
- Fully **responsive**, mobile-first design with no horizontal scrolling

## 🛠️ Technologies Used

- HTML5 (semantic structure)
- CSS3 (custom properties, Flexbox, media queries, transitions)
- Vanilla JavaScript (DOM manipulation, event delegation, localStorage)

## 🚀 How to Run the Project

1. Create a folder named `todo-list`.
2. Save `index.html`, `style.css`, `script.js` and `README.md` inside it (exact structure above).
3. Double-click `index.html` to open it in your browser.
4. No installation, build step, or server is required.

## 🧠 How the App Is Built (State Flow)

The app follows one consistent flow for every user action:

```
User action  →  Update state (tasks array)  →  Save to localStorage  →  Re-render UI
```

Key state variables in `script.js`:

```js
let tasks = [];            // the single source of truth for all tasks
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
```

Key functions:

| Function | Purpose |
|---|---|
| `addTask()` | Validates input, creates a task object, updates state, saves, renders |
| `renderTasks()` | Rebuilds the task list DOM entirely from the current state |
| `toggleTask(id)` | Flips a task's `completed` value |
| `startEditing(id)` / `saveEditedTask(id, text)` / `cancelEditing()` | Handle inline editing |
| `requestDeleteTask(id)` / `confirmDeleteTask()` | Show the confirm modal, then remove the task |
| `getFilteredTasks()` | Returns the tasks that match `currentFilter` |
| `saveTasks()` / `loadTasks()` | Read/write the `tasks` array to `localStorage` |

## 💾 How localStorage Works Here

Every time a task is added, edited, completed/uncompleted, or deleted, `saveTasks()` runs:

```js
localStorage.setItem('todo-list-tasks', JSON.stringify(tasks));
```

`JSON.stringify()` converts the JavaScript array into a text string, because `localStorage` can only store strings.

When the page loads, `loadTasks()` runs before anything is rendered:

```js
const savedData = localStorage.getItem('todo-list-tasks');
const parsed = JSON.parse(savedData);
```

`JSON.parse()` converts that saved string back into a real JavaScript array. The result is validated (checked that it's an array of proper task objects) before being used, so corrupted or unexpected data in `localStorage` won't crash the app — it just falls back to an empty list.

Because the state is reloaded from `localStorage` on every page load, **your tasks remain after refreshing or reopening the browser.**

## 🔄 CRUD Explanation

- **Create** — Typing in the input and clicking "Add Task" (or pressing Enter) builds a new `{ id, text, completed }` object and pushes it into the `tasks` array.
- **Read** — `renderTasks()` loops over the filtered tasks and creates the `<li>` elements dynamically; nothing is written by hand in `index.html`.
- **Update** — Clicking the ✏️ edit icon turns that task's text into an editable input. Saving (💾, or pressing Enter) trims and validates the new text, then updates that task object in the `tasks` array. Clicking the checkbox is also an "update" — it flips `completed`.
- **Delete** — Clicking 🗑️ opens a confirmation modal; confirming removes that task from the `tasks` array with `.filter()`.

Every one of these ends the same way: `saveTasks()` then `renderTasks()`.

## 🔍 Filtering Explanation

Three buttons (`All`, `Active`, `Completed`) each set `currentFilter` and call `renderTasks()`. `getFilteredTasks()` decides what to display:

```js
if (currentFilter === 'active') return tasks.filter(t => !t.completed);
if (currentFilter === 'completed') return tasks.filter(t => t.completed);
return tasks; // 'all'
```

The filter only changes what is *displayed* — the underlying `tasks` array (and what's saved to `localStorage`) always contains every task.

## 🎯 Event Delegation Explanation

Instead of attaching a click listener to every single task's edit/delete/save buttons (which would need to be re-attached every time the list re-renders), **one listener is placed on the shared `#taskList` container**:

```js
taskList.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.getAttribute('data-action'); // 'edit' | 'delete' | 'save-edit' | 'cancel-edit'
  const id = actionEl.getAttribute('data-id');
  // ...call the right function based on "action" and "id"
});
```

Each button carries `data-action` and `data-id` attributes. When any click bubbles up to `#taskList`, `event.target.closest('[data-action]')` finds the exact button that was clicked (even though it was created dynamically), and the code reads `data-id` to know which task to act on. The checkbox's `change` event is delegated the same way.

## 🧪 How to Test Every Requirement

1. **Create** — Type a task and click "Add Task" (or press Enter). It should appear at the bottom of the list, and the "X tasks" counter should increase.
2. **Read** — Reload the page; every task you added should still display (see "Refresh persistence" below).
3. **Update** — Click ✏️ on any task, change the text, click 💾 (or press Enter). The task text should update immediately.
4. **Delete** — Click 🗑️ on any task. A confirmation dialog appears; click "Delete" and the task should disappear and the counters should update.
5. **Complete** — Click the checkbox next to a task. Its text should get a strike-through and the background should tint green; the "remaining" counter should decrease.
6. **Active filter** — Click the "Active" button. Only uncompleted tasks should be visible.
7. **Completed filter** — Click the "Completed" button. Only completed tasks should be visible.
8. **localStorage** — Open your browser's DevTools → Application (or Storage) tab → Local Storage → your page's origin. You should see a key called `todo-list-tasks` containing a JSON string of your tasks.
9. **Refresh persistence** — Add a few tasks, mark some complete, then reload the browser (F5) or close and reopen the tab. All tasks and their completed states should still be there.
10. **Event delegation** — Open DevTools → Elements, delete a task and add a new one, then click that new task's edit/delete buttons. They work immediately with no extra listeners needing to be attached, because the single listener lives on `#taskList`, not on the individual buttons.
11. **Empty input validation** — Try clicking "Add Task" with the input empty (or only spaces). An inline error message appears and no task is added.
12. **Empty state** — Delete all tasks (or filter to "Completed" with none completed). You should see the "No tasks found" / "You're all caught up!" message.

---
Built with HTML5, CSS3 and vanilla JavaScript — no frameworks, no backend.
