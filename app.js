const titleInput = document.getElementById('note-title');
const textInput = document.getElementById('note-text');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const notesList = document.getElementById('notes-list');

let notes = JSON.parse(localStorage.getItem('my_notes')) || [];

function saveAndRender() {
  localStorage.setItem('my_notes', JSON.stringify(notes));
  renderNotes();
}

function renderNotes() {
  notesList.innerHTML = '';
  notes.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${note.title || 'Utan titel'}</h3>
      </div>
      <div class="card-body">
        <p>${note.text}</p>
      </div>
      <div class="card-footer">
        <small>${note.date}</small>
        <button onclick="deleteNote(${index})" class="delete-btn">Radera</button>
      </div>
    `;
    notesList.appendChild(card);
  });
}

// Spara anteckning
saveBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title && !text) return;

  const newNote = {
    title: title || 'Utan titel',
    text: text,
    date: new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
  };

  notes.unshift(newNote); // Lägg överst
  titleInput.value = '';
  textInput.value = '';
  saveAndRender();
});

// Rensa textfälten (om man ångrar sig medan man skriver)
clearBtn.addEventListener('click', () => {
  titleInput.value = '';
  textInput.value = '';
});

// Radera en enskild anteckning
window.deleteNote = function(index) {
  notes.splice(index, 1);
  saveAndRender();
};

// Initial rendering
renderNotes();

// Registrera Service Worker för offline-stöd
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
