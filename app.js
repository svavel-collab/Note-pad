let notes = JSON.parse(localStorage.getItem('notes')) || [];
let activeNoteId = null;
let lastDeletedNote = null;
let toastTimeout = null;

const notesList = document.getElementById('notes-list');
const editor = document.getElementById('editor');
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undo-btn');

// Smart datumformatering: visar enbart klockslag om anteckningen är från idag
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp) || timestamp);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  } else {
    const dateStr = date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  }
}

function saveToStorage() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function renderNotes(filter = '') {
  notesList.innerHTML = '';
  
  const filtered = notes.filter(n => 
    (n.title && n.title.toLowerCase().includes(filter.toLowerCase())) || 
    (n.content && n.content.toLowerCase().includes(filter.toLowerCase()))
  );

  // Sortera nyast först
  filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  filtered.forEach(note => {
    const row = document.createElement('div');
    row.className = 'note-row';
    
    const titleEl = document.createElement('span');
    titleEl.className = 'note-title';
    titleEl.textContent = note.title || 'Namnlös';

    const metaEl = document.createElement('span');
    metaEl.className = 'note-meta';
    metaEl.textContent = formatDate(note.updatedAt);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', 'Radera');
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });

    row.appendChild(titleEl);
    row.appendChild(metaEl);
    row.appendChild(delBtn);

    row.addEventListener('click', () => openEditor(note.id));

    notesList.appendChild(row);
  });
}

function openEditor(id = null) {
  activeNoteId = id;
  if (id) {
    const note = notes.find(n => n.id === id);
    if (note) {
      noteTitleInput.value = note.title;
      noteContentInput.value = note.content;
    }
  } else {
    noteTitleInput.value = '';
    noteContentInput.value = '';
  }
  notesList.classList.add('hidden');
  document.querySelector('.search-container').classList.add('hidden');
  editor.classList.remove('hidden');
}

function closeEditor() {
  activeNoteId = null;
  editor.classList.add('hidden');
  notesList.classList.remove('hidden');
  document.querySelector('.search-container').classList.remove('hidden');
  renderNotes(searchInput.value);
}

function saveNote() {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title && !content) {
    closeEditor();
    return;
  }

  const now = Date.now();

  if (activeNoteId) {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      note.title = title;
      note.content = content;
      note.updatedAt = now;
    }
  } else {
    notes.push({
      id: 'note_' + now,
      title: title || 'Namnlös',
      content: content,
      updatedAt: now
    });
  }

  saveToStorage();
  closeEditor();
}

function deleteNote(id) {
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    lastDeletedNote = { note: notes[index], index };
    notes.splice(index, 1);
    saveToStorage();
    renderNotes(searchInput.value);
    showToast();
  }
}

function showToast() {
  clearTimeout(toastTimeout);
  toast.classList.remove('hidden');
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

undoBtn.addEventListener('click', () => {
  if (lastDeletedNote) {
    notes.splice(lastDeletedNote.index, 0, lastDeletedNote.note);
    saveToStorage();
    lastDeletedNote = null;
    toast.classList.add('hidden');
    renderNotes(searchInput.value);
  }
});

addBtn.addEventListener('click', () => openEditor());
saveBtn.addEventListener('click', saveNote);
cancelBtn.addEventListener('click', closeEditor);
searchInput.addEventListener('input', (e) => renderNotes(e.target.value));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

renderNotes();
