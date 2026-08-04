// LocalStorage Keys
const STORAGE_KEY = 'minimalist_notes_app_data';

// App State
let notes = [];
let currentNoteId = null;
let lastDeletedNote = null;
let undoTimeout = null;

// DOM Elements
let notesListView, editorView, notesList, searchInput, addBtn, noteTitleInput, noteContentInput, saveBtn, cancelBtn, toast, undoBtn;

function initDOMElements() {
  notesListView = document.getElementById('notes-list-view');
  editorView = document.getElementById('editor-view');
  notesList = document.getElementById('notes-list');
  searchInput = document.getElementById('search-input');
  addBtn = document.getElementById('add-btn');
  noteTitleInput = document.getElementById('note-title-input');
  noteContentInput = document.getElementById('note-content-input');
  saveBtn = document.getElementById('save-btn');
  cancelBtn = document.getElementById('cancel-btn');
  toast = document.getElementById('toast');
  undoBtn = document.getElementById('undo-btn');
}

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
  if (!notesList) return;
  notesList.innerHTML = '';
  
  const filteredNotes = notes.filter(note => 
    (note.title && note.title.toLowerCase().includes(filter.toLowerCase())) || 
    (note.content && note.content.toLowerCase().includes(filter.toLowerCase()))
  );

  filteredNotes.forEach(note => {
    const row = document.createElement('div');
    row.className = 'note-row';
    row.dataset.id = note.id;
    
    // Rak struktur: Title -> Date/Time -> Delete
    row.innerHTML = `
      <span class="note-title">${escapeHtml(note.title || 'Namnlös')}</span>
      <span class="note-meta">${formatDate(note.updatedAt)}</span>
      <button class="delete-btn" type="button" aria-label="Radera">✕</button>
    `;

    // Klick på raden öppnar anteckningen för redigering
    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        openEditor(note.id);
      }
    });

    // Klick på X-knappen raderar
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });
    }

    notesList.appendChild(row);
  });
}

// Navigation & Views
function showListView() {
  if (editorView) editorView.classList.add('hidden');
  if (notesListView) notesListView.classList.remove('hidden');
  currentNoteId = null;
  renderNotes(searchInput ? searchInput.value : '');
}

function openEditor(noteId = null) {
  currentNoteId = noteId;
  
  if (noteId) {
    const note = notes.find(n => String(n.id) === String(noteId));
    if (note) {
      noteTitleInput.value = note.title || '';
      noteContentInput.value = note.content || '';
    }
  } else {
    noteTitleInput.value = '';
    noteContentInput.value = '';
  }

  if (notesListView) notesListView.classList.add('hidden');
  if (editorView) editorView.classList.remove('hidden');
  if (noteTitleInput) noteTitleInput.focus();
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
    const note = notes.find(n => String(n.id) === String(currentNoteId));
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
  const noteIndex = notes.findIndex(n => String(n.id) === String(noteId));
  if (noteIndex > -1) {
    lastDeletedNote = { note: notes[noteIndex], index: noteIndex };
    notes.splice(noteIndex, 1);
    saveNotes();
    renderNotes(searchInput ? searchInput.value : '');
    showUndoToast();
  }
}

function showUndoToast() {
  clearTimeout(undoTimeout);
  if (toast) toast.classList.remove('hidden');
  
  undoTimeout = setTimeout(() => {
    if (toast) toast.classList.add('hidden');
    lastDeletedNote = null;
  }, 4000);
}

function undoDelete() {
  if (lastDeletedNote) {
    notes.splice(lastDeletedNote.index, 0, lastDeletedNote.note);
    saveNotes();
    renderNotes(searchInput ? searchInput.value : '');
    if (toast) toast.classList.add('hidden');
    lastDeletedNote = null;
    clearTimeout(undoTimeout);
  }
}

// Initialization & Event Binding
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  loadNotes();

  if (addBtn) addBtn.addEventListener('click', () => openEditor());
  if (saveBtn) saveBtn.addEventListener('click', saveCurrentNote);
  if (cancelBtn) cancelBtn.addEventListener('click', showListView);
  if (undoBtn) undoBtn.addEventListener('click', undoDelete);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderNotes(e.target.value));
  }

  renderNotes();
});
