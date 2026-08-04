// --- DATALAGER ---
let notes = JSON.parse(localStorage.getItem('bare_notes')) || [];
let deletedNote = null;
let deletedIndex = null;
let toastTimeout = null;

// --- DOM-ELEMENT ---
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteId');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const toast = document.getElementById('toast');
const undoBtn = document.getElementById('undoBtn');

// --- HJÄLPFUNKTIONER ---
function saveToStorage() {
  localStorage.setItem('bare_notes', JSON.stringify(notes));
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  
  // Format: YY-MM-DD (t.ex. 26-08-04)
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  // Format: HH:MM (t.ex. 03:15)
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `${yy}-${mm}-${dd} ${time}`;
}

// --- RENDERING ---
function renderNotes(filterText = '') {
  notesContainer.innerHTML = '';

  const filteredNotes = notes.filter(note => {
    const text = filterText.toLowerCase();
    return note.title.toLowerCase().includes(text) || note.content.toLowerCase().includes(text);
  });

  if (filteredNotes.length === 0) {
    notesContainer.innerHTML = `<div class="empty-state">${filterText ? 'Inga träffar' : 'Inga sparade anteckningar'}</div>`;
    return;
  }

  // Sortera med nyast först
  filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);

  filteredNotes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.onclick = (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        openModalForEdit(note.id);
      }
    };

    card.innerHTML = `
      <div class="note-info">
        <span class="note-title">${escapeHTML(note.title)}</span>
        <span class="note-date">${formatDate(note.updatedAt)}</span>
      </div>
      <button class="delete-btn" title="Radera">&times;</button>
    `;

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.onclick = () => deleteNote(note.id);

    notesContainer.appendChild(card);
  });
}

// --- MODAL-HANTERING ---
function openModalForNew() {
  modalTitle.textContent = 'Ny anteckning';
  noteIdInput.value = '';
  noteTitleInput.value = '';
  noteContentInput.value = '';
  modalOverlay.classList.add('active');
  noteTitleInput.focus();
}

function openModalForEdit(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  modalTitle.textContent = 'Redigera anteckning';
  noteIdInput.value = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content;
  modalOverlay.classList.add('active');
  noteTitleInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

// --- FORMULÄR OCH SPARA ---
noteForm.onsubmit = (e) => {
  e.preventDefault();
  const id = noteIdInput.value;
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title || !content) return;

  if (id) {
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].title = title;
      notes[index].content = content;
      notes[index].updatedAt = Date.now();
    }
  } else {
    const newNote = {
      id: Date.now().toString(),
      title: title,
      content: content,
      updatedAt: Date.now()
    };
    notes.unshift(newNote);
  }

  saveToStorage();
  renderNotes(searchInput.value);
  closeModal();
};

// --- RADERA OCH ÅNGRA ---
function deleteNote(id) {
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) return;

  deletedNote = notes[index];
  deletedIndex = index;

  notes.splice(index, 1);
  saveToStorage();
  renderNotes(searchInput.value);

  showToast();
}

function showToast() {
  clearTimeout(toastTimeout);
  toast.classList.add('visible');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    deletedNote = null;
    deletedIndex = null;
  }, 4000);
}

undoBtn.onclick = () => {
  if (deletedNote !== null && deletedIndex !== null) {
    notes.splice(deletedIndex, 0, deletedNote);
    saveToStorage();
    renderNotes(searchInput.value);
    
    toast.classList.remove('visible');
    clearTimeout(toastTimeout);
    deletedNote = null;
    deletedIndex = null;
  }
};

// --- EVENT LISTENERS ---
openModalBtn.onclick = openModalForNew;
closeModalBtn.onclick = closeModal;
searchInput.oninput = (e) => renderNotes(e.target.value);

modalOverlay.onclick = (e) => {
  if (e.target === modalOverlay) closeModal();
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW aktiv'))
      .catch((err) => console.error('SW-fel:', err));
  });
}

renderNotes();
