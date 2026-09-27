/* =====================================================================
   TO-DO LIST APP
   State-driven, vanilla JavaScript, localStorage persistence,
   event delegation for all task actions.
===================================================================== */

// ---------------------------------------------------------------------
// ELEMENT REFERENCES
// ---------------------------------------------------------------------
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const inputError = document.getElementById('inputError');
const taskList = document.getElementById('taskList');
const totalCount = document.getElementById('totalCount');
const remainingCount = document.getElementById('remainingCount');
const filterRow = document.getElementById('filterRow');
const emptyState = document.getElementById('emptyState');
const emptyTitle = document.getElementById('emptyTitle');
const emptySubtitle = document.getElementById('emptySubtitle');
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// ---------------------------------------------------------------------
// APPLICATION STATE
// ---------------------------------------------------------------------
// "tasks" holds every task object: { id, text, completed }
// "currentFilter" holds which filter is active: "all" | "active" | "completed"
// "taskIdPendingDelete" temporarily stores the id waiting for delete confirmation
// "editingId" tracks which task is currently being edited (or null)
let tasks = [];
let currentFilter = 'all';
let taskIdPendingDelete = null;
let editingId = null;

const STORAGE_KEY = 'todo-list-tasks';

// ---------------------------------------------------------------------
// LOCAL STORAGE — SAVE / LOAD
// ---------------------------------------------------------------------

// Save the current "tasks" array into localStorage as a JSON string
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Load tasks from localStorage when the page starts.
// Handles the case where localStorage is empty or contains invalid data.
function loadTasks() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    tasks = [];
    return;
  }

  try {
    const parsed = JSON.parse(savedData);
    // Make sure what we loaded is actually an array of valid task objects
    if (Array.isArray(parsed)) {
      tasks = parsed.filter(
        (task) =>
          task &&
          typeof task.id !== 'undefined' &&
          typeof task.text === 'string' &&
          typeof task.completed === 'boolean'
      );
    } else {
      tasks = [];
    }
  } catch (error) {
    // Invalid JSON in localStorage — start fresh instead of crashing
    console.error('Could not read saved tasks, starting with an empty list.', error);
    tasks = [];
  }
}

// ---------------------------------------------------------------------
// UNIQUE ID GENERATOR
// ---------------------------------------------------------------------
function generateId() {
  return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

// ---------------------------------------------------------------------
// CREATE — ADD A NEW TASK
// ---------------------------------------------------------------------
function addTask() {
  const rawText = taskInput.value;
  const trimmedText = rawText.trim();

  // Validation: do not allow empty tasks
  if (trimmedText.length === 0) {
    showInputError('Please type a task before adding it.');
    return;
  }

  if (trimmedText.length > 120) {
    showInputError('Task text is too long (max 120 characters).');
    return;
  }

  const newTask = {
    id: generateId(),
    text: trimmedText,
    completed: false,
  };

  // Update state -> save -> render (the app's standard flow)
  tasks.push(newTask);
  saveTasks();
  renderTasks();

  // Clear the input and any error message
  taskInput.value = '';
  clearInputError();
  taskInput.focus();
}

function showInputError(message) {
  inputError.textContent = message;
  taskInput.classList.add('input-invalid');
}

function clearInputError() {
  inputError.textContent = '';
  taskInput.classList.remove('input-invalid');
}

// ---------------------------------------------------------------------
// READ — FILTER TASKS FOR DISPLAY
// ---------------------------------------------------------------------
function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((task) => task.completed === false);
  }
  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.completed === true);
  }
  return tasks; // "all"
}

// ---------------------------------------------------------------------
// UPDATE — TOGGLE COMPLETE / EDIT TASK TEXT
// ---------------------------------------------------------------------
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return; // missing task id — nothing to do

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function startEditing(id) {
  editingId = id;
  renderTasks();
}

function saveEditedTask(id, newText) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const trimmed = newText.trim();

  // Do not allow saving an empty task while editing
  if (trimmed.length === 0) {
    // Keep the task in edit mode and let the user try again
    const input = taskList.querySelector(`.task-edit-input[data-id="${id}"]`);
    if (input) {
      input.style.borderColor = 'var(--danger-color)';
      input.placeholder = 'Task cannot be empty';
    }
    return;
  }

  task.text = trimmed;
  editingId = null;
  saveTasks();
  renderTasks();
}

function cancelEditing() {
  editingId = null;
  renderTasks();
}

// ---------------------------------------------------------------------
// DELETE — REMOVE A TASK (with confirmation modal)
// ---------------------------------------------------------------------
function requestDeleteTask(id) {
  taskIdPendingDelete = id;
  deleteModal.classList.add('show');
}

function closeDeleteModal() {
  taskIdPendingDelete = null;
  deleteModal.classList.remove('show');
}

function confirmDeleteTask() {
  if (taskIdPendingDelete === null) return;

  tasks = tasks.filter((task) => task.id !== taskIdPendingDelete);
  saveTasks();
  renderTasks();
  closeDeleteModal();
}

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
deleteModal.addEventListener('click', (event) => {
  if (event.target === deleteModal) closeDeleteModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && deleteModal.classList.contains('show')) {
    closeDeleteModal();
  }
});

// ---------------------------------------------------------------------
// RENDER — BUILD THE DOM FROM THE CURRENT STATE
// (Tasks are never hard-coded in HTML — everything is generated here)
// ---------------------------------------------------------------------
function renderTasks() {
  const visibleTasks = getFilteredTasks();

  // Clear the current list before rebuilding it
  taskList.innerHTML = '';

  visibleTasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.setAttribute('data-id', task.id);

    if (editingId === task.id) {
      // ---- EDIT MODE ----
      li.innerHTML = `
        <input
          type="text"
          class="task-edit-input"
          data-id="${task.id}"
          value="${escapeHtml(task.text)}"
          maxlength="120"
        >
        <div class="task-actions">
          <button class="icon-btn save-btn" data-action="save-edit" data-id="${task.id}" type="button" title="Save">💾</button>
          <button class="icon-btn delete-btn" data-action="cancel-edit" data-id="${task.id}" type="button" title="Cancel">✕</button>
        </div>
      `;
    } else {
      // ---- NORMAL VIEW MODE ----
      li.innerHTML = `
        <input
          type="checkbox"
          class="task-checkbox"
          data-action="toggle"
          data-id="${task.id}"
          ${task.completed ? 'checked' : ''}
          aria-label="Mark task as ${task.completed ? 'active' : 'completed'}"
        >
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="icon-btn edit-btn" data-action="edit" data-id="${task.id}" type="button" title="Edit task">✏️</button>
          <button class="icon-btn delete-btn" data-action="delete" data-id="${task.id}" type="button" title="Delete task">🗑️</button>
        </div>
      `;
    }

    taskList.appendChild(li);
  });

  // Focus the edit input automatically when entering edit mode
  if (editingId !== null) {
    const editInput = taskList.querySelector(`.task-edit-input[data-id="${editingId}"]`);
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
  }

  updateStats();
  updateEmptyState(visibleTasks.length);
}

// Escape user-entered text before inserting it into innerHTML,
// so task text can never break the layout or inject HTML.
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------------------------------------------------------------------
// STATS — TOTAL / REMAINING COUNTERS
// ---------------------------------------------------------------------
function updateStats() {
  const total = tasks.length;
  const remaining = tasks.filter((task) => !task.completed).length;

  totalCount.textContent = `${total} task${total === 1 ? '' : 's'}`;
  remainingCount.textContent = `${remaining} remaining`;
}

// ---------------------------------------------------------------------
// EMPTY STATE
// ---------------------------------------------------------------------
function updateEmptyState(visibleCount) {
  if (visibleCount > 0) {
    emptyState.classList.remove('show');
    return;
  }

  emptyState.classList.add('show');

  if (tasks.length === 0) {
    emptyTitle.textContent = "You're all caught up!";
    emptySubtitle.textContent = 'Add a task above to get started.';
  } else if (currentFilter === 'active') {
    emptyTitle.textContent = 'No tasks found';
    emptySubtitle.textContent = 'No active tasks — nice work!';
  } else if (currentFilter === 'completed') {
    emptyTitle.textContent = 'No tasks found';
    emptySubtitle.textContent = 'You have not completed any tasks yet.';
  } else {
    emptyTitle.textContent = 'No tasks found';
    emptySubtitle.textContent = 'Try a different filter.';
  }
}

// ---------------------------------------------------------------------
// FILTERING
// ---------------------------------------------------------------------
function setFilter(filterName) {
  currentFilter = filterName;

  // Update the active button style
  const buttons = filterRow.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    btn.classList.toggle('active-filter', btn.getAttribute('data-filter') === filterName);
  });

  renderTasks();
}

filterRow.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button) return;
  setFilter(button.getAttribute('data-filter'));
});

// ---------------------------------------------------------------------
// EVENT LISTENERS — ADD TASK
// ---------------------------------------------------------------------
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

taskInput.addEventListener('input', () => {
  if (inputError.textContent) {
    clearInputError();
  }
});

// ---------------------------------------------------------------------
// EVENT DELEGATION — ALL TASK ACTIONS (toggle / edit / save / cancel / delete)
// A single listener on the shared container (#taskList) handles every
// task button, instead of attaching listeners to each dynamic element.
// ---------------------------------------------------------------------
taskList.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.getAttribute('data-action');
  const id = actionEl.getAttribute('data-id');

  if (action === 'edit') {
    startEditing(id);
  } else if (action === 'delete') {
    requestDeleteTask(id);
  } else if (action === 'save-edit') {
    const input = taskList.querySelector(`.task-edit-input[data-id="${id}"]`);
    if (input) saveEditedTask(id, input.value);
  } else if (action === 'cancel-edit') {
    cancelEditing();
  }
});

// Checkbox "change" events also go through delegation
taskList.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  toggleTask(checkbox.getAttribute('data-id'));
});

// Allow Enter/Escape while editing a task inline
taskList.addEventListener('keydown', (event) => {
  const editInput = event.target.closest('.task-edit-input');
  if (!editInput) return;

  if (event.key === 'Enter') {
    saveEditedTask(editInput.getAttribute('data-id'), editInput.value);
  } else if (event.key === 'Escape') {
    cancelEditing();
  }
});

// ---------------------------------------------------------------------
// INITIALIZE THE APP
// ---------------------------------------------------------------------
function initApp() {
  loadTasks();      // restore saved tasks from localStorage (if any)
  renderTasks();     // build the UI from the loaded state
}

initApp();
