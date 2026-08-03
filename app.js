document.addEventListener('DOMContentLoaded', loadNotes);

// Växlar visning av formuläret (+ knappen)
function toggleForm() {
  const form = document.getElementById('note-form');
  form.classList.toggle('hidden');
  
  // Rensa fälten när man stänger eller öppnar
  if (form.classList.contains('hidden')) {
    clearFields();
  }
}

function saveNote() {
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
  toggleForm(); // Dölj formuläret efter sparande
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
      <button class="btn-delete" onclick="deleteNote(${note.id})">Radera</button>
    `;

    notesList.appendChild(card);
  });
}

function deleteNote(id) {
  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes = notes.filter(note => note.id !== id);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
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
