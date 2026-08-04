let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Koppla knappar för att skapa nya anteckningar
  document.getElementById('toggle-form-btn').addEventListener('click', toggleForm);
  document.getElementById('cancel-btn').addEventListener('click', toggleForm);
  document.getElementById('save-btn').addEventListener('click', saveNewNote);

  // Koppla knappar för redigeringsmodalen
  document.getElementById('close-modal-btn').addEventListener('click', closeReadModal);
  document.getElementById('save-edit-btn').addEventListener('click', saveEditedNote);

  // Koppla knappar för backup (export/import)
  document.getElementById('export-btn').addEventListener('click', exportNotes);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-input').click();
  });
  document.getElementById('import-input').addEventListener('change', importNotes);

  // Ladda in sparade anteckningar från localStorage vid start
  loadNotes();
});

function toggleForm() {
  const form = document.getElementById('note-form');
  form.classList.toggle('hidden');
  
  if (form.classList.contains('hidden')) {
    clearFields();
  }
}

function saveNewNote() {
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title) {
    alert('Vänligen fyll i en titel.');
    return;
  }

  const notes = JSON.parse(localStorage.getItem('notes')) || [];

  const newNote = {
    id: Date.now(),
    title: title,
    content: content,
    date: new Date().toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  };

  notes.unshift(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));

  clearFields();
  toggleForm();
  loadNotes();
}

function loadNotes() {
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = '';

  const notes = JSON.parse(localStorage.getItem('notes')) || [];

  if (notes.length === 0) {
    notesList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Inga anteckningar sparade.</p>';
    return;
  }

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';

    card.innerHTML = `
      <div class="note-info">
        <h3>${escapeHtml(note.title)}</h3>
        <small>${note.date}</small>
      </div>
      <button class="btn-delete">Radera</button>
    `;

    // Klicka på kortet för att öppna och redigera
    card.addEventListener('click', () => {
      openNote(note.id);
    });

    // Klicka på radera-knappen
    const deleteBtn = card.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteNote(note.id);
    });

    notesList.appendChild(card);
  });
}

function openNote(id) {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  const note = notes.find(n => n.id === id);

  if (note) {
    currentEditingId = id;
    document.getElementById('edit-title').value = note.title;
    document.getElementById('view-date').innerText = 'Skapad: ' + note.date;
    document.getElementById('edit-body').value = note.content || '';
    document.getElementById('read-modal').classList.remove('hidden');
  }
}

function saveEditedNote() {
  if (!currentEditingId) return;

  const newTitle = document.getElementById('edit-title').value.trim();
  const newContent = document.getElementById('edit-body').value.trim();

  if (!newTitle) {
    alert('Titeln kan inte vara tom.');
    return;
  }

  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  
  notes = notes.map(note => {
    if (note.id === currentEditingId) {
      return {
        ...note,
        title: newTitle,
        content: newContent
      };
    }
    return note;
  });

  localStorage.setItem('notes', JSON.stringify(notes));
  closeReadModal();
  loadNotes();
}

function closeReadModal() {
  currentEditingId = null;
  document.getElementById('read-modal').classList.add('hidden');
}

function deleteNote(id) {
  if (!confirm('Är du säker på att du vill radera anteckningen?')) {
    return;
  }

  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes = notes.filter(note => note.id !== id);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
}

// EXPORT-FUNKTION
function exportNotes() {
  const notes = localStorage.getItem('notes') || '[]';
  const blob = new Blob([notes], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `anteckningar_backup_${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// IMPORT-FUNKTION
function importNotes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedNotes = JSON.parse(e.target.result);
      
      if (!Array.isArray(importedNotes)) {
        throw new Error('Ogiltigt filformat');
      }

      if (!confirm('Vill du ersätta dina nuvarande anteckningar med filens innehåll?')) {
        event.target.value = ''; // Återställ filväljaren
        return;
      }

      localStorage.setItem('notes', JSON.stringify(importedNotes));
      loadNotes();
      alert('Anteckningarna har importerats!');
    } catch (err) {
      alert('Fel vid import: Filen innehåller inte giltig anteckningsdata.');
    }
    event.target.value = ''; // Återställ filväljaren för nästa gång
  };

  reader.readAsText(file);
}

function clearFields() {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registrerad:', reg.scope))
      .catch((err) => console.error('Service Worker misslyckades:', err));
  });
}
