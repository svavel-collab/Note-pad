let notes = JSON.parse(localStorage.getItem('notes')) || [];
let activeNoteId = null;
let lastDeletedNote = null;
let toastTimeout = null;
let activeTimeFilter = 'all';

const notesList = document.getElementById('notes-list');
const editor = document.getElementById('editor');
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');
const filterChips = document.querySelectorAll('.chip');
const addBtn = document.getElementById('add-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undo-btn');

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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

function renderNotes() {
  notesList.innerHTML = '';
  const query = searchInput.value.trim().toLowerCase();
  const now = Date.now();

  const filtered = notes.filter(note => {
    // Filter på titel
    const titleMatch = (note.title || '').toLowerCase().includes(query);
    if (!titleMatch) return false;

    // Filter på tidsintervall
    if (activeTimeFilter === 'all') return true;

    const noteTime = Number(note.updatedAt) || 0;
    const daysDiff = (now - noteTime) / (1000 * 60 * 60 * 24);

    if (activeTimeFilter === '1') {
      const noteDate = new Date(noteTime).toDateString();
      const todayDate = new Date().toDateString();
      return noteDate === todayDate;
    }

    if (activeTimeFilter === '7') return daysDiff <= 7;
    if (activeTimeFilter === '30') return daysDiff <= 30;

    return true;
  });

  filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  filtered.forEach((note, index) => {
    const row = document.createElement('div');
    row.className = 'note-row';
    row.style.borderLeftColor = colors[index % colors.length];
    
    // Behållare för titel och text-preview
    const contentBox = document.createElement('div');
    contentBox.className = 'note-content-preview';

    const titleEl = document.createElement('span');
    titleEl.className = 'note-title';
    titleEl.textContent = note.title || 'Namnlös';

    const cleanContent = (note.content || '').replace(/\s+/g, ' ').trim();
    
    contentBox.appendChild(titleEl);
    
    if (cleanContent) {
      const snippetEl = document.createElement('span');
      snippetEl.className = 'note-snippet';
      snippetEl.textContent = cleanContent;
      contentBox.appendChild(snippetEl);
    }

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

    row.appendChild(contentBox);
    row.appendChild(metaEl);
    row.appendChild(delBtn);

    row.addEventListener('click', () => openEditor(note.id));

    notesList.appendChild(row);
  });
}

searchToggleBtn.addEventListener('click', () => {
  const isHidden = searchContainer.classList.toggle('hidden');
  if (!isHidden) {
    searchInput.focus();
  } else {
    searchInput.value = '';
    activeTimeFilter = 'all';
    updateChipUI();
    renderNotes();
  }
});

filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    activeTimeFilter = chip.getAttribute('data-days');
    updateChipUI();
    renderNotes();
  });
});

function updateChipUI() {
  filterChips.forEach(c => {
    if (c.getAttribute('data-days') === activeTimeFilter) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
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
  searchContainer.classList.add('hidden');
  editor.classList.remove('hidden');
}

function closeEditor() {
  activeNoteId = null;
  editor.classList.add('hidden');
  notesList.classList.remove('hidden');
  renderNotes();
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
    renderNotes();
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
    renderNotes();
  }
});

addBtn.addEventListener('click', () => openEditor());
saveBtn.addEventListener('click', saveNote);
cancelBtn.addEventListener('click', closeEditor);
searchInput.addEventListener('input', () => renderNotes());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

renderNotes();
