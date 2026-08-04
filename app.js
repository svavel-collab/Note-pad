// LocalStorage Keys
const STORAGE_KEY = 'minimalist_notes_app_data';

// App State
let notes = [];
let currentNoteId = null;
let lastDeletedNote = null;
let undoTimeout = null;

// DOM Elements
const notesListView = document.getElementById('notes-list-view');
const editorView = document.getElementById('editor-view');
const notesList = document.getElementById('notes-list');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undo-btn');

// Helper Functions
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Storage Operations
function loadNotes() {
  const data = localStorage.getItem(STORAGE_KEY);
  notes = data ? JSON.parse(data) : [];
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// UI Rendering
function renderNotes(filter = '') {
  notesList.innerHTML = '';
  
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(filter.toLowerCase()) || 
    note.content.toLowerCase().includes(filter.toLowerCase())
  );

  filteredNotes.forEach(note => {
    const row = document.createElement('div');
    row.className = 'note-row';
    
    // Rak struktur: Title -> Date/Time -> Delete
    row.innerHTML = `
      <span class="note-title">${escapeHtml(note.title || 'Namnlös')}</span>
      <span class="note-meta">${formatDate(note.updatedAt)}</span>
      <button class="delete-btn" aria-label="Radera">✕</button>
    `;

    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        openEditor(note.id);
      }
    });

    row.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });

    notesList.appendChild(row);
  });
}

// Navigation & Views
function showListView() {
  editorView.classList.add('hidden');
  notesListView.classList.remove('hidden');
  currentNoteId = null;
  renderNotes(searchInput.value);
}

function openEditor(noteId = null) {
  currentNoteId = noteId;
  
  if (noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      noteTitleInput.value = note.title;
      noteContentInput.value = note.content;
    }
  } else {
    noteTitleInput.value = '';
    noteContentInput.value = '';
  }

  notesListView.classList.add('hidden');
  editorView.classList.remove('hidden');
  noteTitleInput.focus();
}

// Actions
function saveCurrentNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title && !content) {
    showListView();
    return;
  }

  const timestamp = Date.now();

  if (currentNoteId) {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
      note.title = title;
      note.content = content;
      note.updatedAt = timestamp;
    }
  } else {
    const newNote = {
      id: 'note_' + timestamp + '_' + Math.random().toString(36).substr(2, 9),
      title,
      content,
      updatedAt: timestamp
    };
    notes.unshift(newNote);
  }

  saveNotes();
  showListView();
}

function deleteNote(noteId) {
  const noteIndex = notes.findIndex(n => n.id === noteId);
  if (noteIndex > -1) {
    lastDeletedNote = { note: notes[noteIndex], index: noteIndex };
    notes.splice(noteIndex, 1);
    saveNotes();
    renderNotes(searchInput.value);
    showUndoToast();
  }
}

function showUndoToast() {
  clearTimeout(undoTimeout);
  toast.classList.remove('hidden');
  
  undoTimeout = setTimeout(() => {
    toast.classList.add('hidden');
    lastDeletedNote = null;
  }, 4000);
}

function undoDelete() {
  if (lastDeletedNote) {
    notes.splice(lastDeletedNote.index, 0, lastDeletedNote.note);
    saveNotes();
    renderNotes(searchInput.value);
    toast.classList.add('hidden');
    lastDeletedNote = null;
    clearTimeout(undoTimeout);
  }
}

// Event Listeners
if (addBtn) addBtn.addEventListener('click', () => openEditor());
if (saveBtn) saveBtn.addEventListener('click', saveCurrentNote);
if (cancelBtn) cancelBtn.addEventListener('click', showListView);
if (undoBtn) undoBtn.addEventListener('click', undoDelete);

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderNotes(e.target.value);
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  renderNotes();
});
