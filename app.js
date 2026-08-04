let notes = JSON.parse(localStorage.getItem('notes')) || [];
let activeNoteId = null;
let lastDeletedNote = null;
let toastTimeout = null;
let activeTimeFilter = 'all';
let currentSortMode = 'date'; // 'date', 'alpha', 'color'
let selectedColor = '#3b82f6';

const notesList = document.getElementById('notes-list');
const editor = document.getElementById('editor');
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const sortBtn = document.getElementById('sort-btn');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');
const filterChips = document.querySelectorAll('.chip');
const addBtn = document.getElementById('add-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undo-btn');
const colorDots = document.querySelectorAll('.color-dot');

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
    const titleMatch = (note.title || '').toLowerCase().includes(query);
    if (!titleMatch) return false;

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

  // Sortering
  filtered.sort((a, b) => {
    if (currentSortMode === 'alpha') {
      return (a.title || '').localeCompare(b.title || '', 'sv');
    } else if (currentSortMode === 'color') {
      const colorComp = (a.color || '#3b82f6').localeCompare(b.color || '#3b82f6');
      if (colorComp !== 0) return colorComp;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    } else {
      // Datum (standard)
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
  });

  filtered.forEach((note) => {
    const row = document.createElement('div');
    row.className = 'note-row';
    row.style.borderLeftColor = note.color || '#3b82f6';
    
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

// Sorteringsknapp
sortBtn.addEventListener('click', () => {
  if (currentSortMode === 'date') {
    currentSortMode = 'alpha';
    sortBtn.title = 'Sorterar: A-Ö';
  } else if (currentSortMode === 'alpha') {
    currentSortMode = 'color';
    sortBtn.title = 'Sorterar: Färg';
  } else {
    currentSortMode = 'date';
    sortBtn.title = 'Sorterar: Datum';
  }
  renderNotes();
});

// Sök-toggle
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

// Färgval i editorn
colorDots.forEach(dot => {
  dot.addEventListener('click', () => {
    colorDots.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    selectedColor = dot.getAttribute('data-color');
  });
});

function setColorPicker(color) {
  selectedColor = color || '#3b82f6';
  colorDots.forEach(d => {
    if (d.getAttribute('data-color') === selectedColor) {
      d.classList.add('active');
    } else {
      d.classList.remove('active');
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
      setColorPicker(note.color);
    }
  } else {
    noteTitleInput.value = '';
    noteContentInput.value = '';
    setColorPicker('#3b82f6');
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
      note.color = selectedColor;
      note.updatedAt = now;
    }
  } else {
    notes.push({
      id: 'note_' + now,
      title: title || 'Namnlös',
      content: content,
      color: selectedColor,
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
