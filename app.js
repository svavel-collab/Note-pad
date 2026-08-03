document.addEventListener('DOMContentLoaded', () => {
  const notesList = document.getElementById('notes-list');
  const newNoteBtn = document.getElementById('new-note-btn');

  let notes = JSON.parse(localStorage.getItem('my_notes')) || [];

  function saveNotes() {
    localStorage.setItem('my_notes', JSON.stringify(notes));
  }

  function renderNotes() {
    notesList.innerHTML = '';
    notes.forEach((note) => {
      const card = document.createElement('div');
      card.className = 'note-card';

      const textarea = document.createElement('textarea');
      textarea.className = 'note-textarea';
      textarea.value = note.text;
      textarea.placeholder = 'Skriv en anteckning...';

      textarea.addEventListener('input', (e) => {
        note.text = e.target.value;
        note.updatedAt = new Date().toLocaleString('sv-SE', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
        saveNotes();
        dateSpan.textContent = note.updatedAt;
      });

      const actions = document.createElement('div');
      actions.className = 'note-actions';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'note-date';
      dateSpan.textContent = note.updatedAt || new Date().toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Radera';
      deleteBtn.addEventListener('click', () => {
        notes = notes.filter((n) => n.id !== note.id);
        saveNotes();
        renderNotes();
      });

      actions.appendChild(dateSpan);
      actions.appendChild(deleteBtn);

      card.appendChild(textarea);
      card.appendChild(actions);

      notesList.appendChild(card);
    });
  }

  newNoteBtn.addEventListener('click', () => {
    const newNote = {
      id: Date.now(),
      text: '',
      updatedAt: new Date().toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    };
    notes.unshift(newNote);
    saveNotes();
    renderNotes();
  });

  renderNotes();
});
