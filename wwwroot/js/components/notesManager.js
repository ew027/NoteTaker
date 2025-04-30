// File: js/components/notesManager.js
export class NotesManager {
    constructor() {
        this.notes = [];
        this.container = document.getElementById('noteList');
        // Fetch notes when the manager is instantiated
        this.fetchNotes();
    }

    async fetchNotes() {
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            this.notes = await response.json();
            this.render();
        } catch (error) {
            console.error('Error fetching notes:', error);
            // Show error message to user
            this.container.innerHTML = '<div class="error-message">Failed to load notes. Please try again later.</div>';
        }
    }

    render() {
        if (!this.container) {
            console.error('Note container element not found');
            return;
        }

        this.container.innerHTML = '';

        if (this.notes.length === 0) {
            this.container.innerHTML = '<div class="empty-message">No notes found</div>';
            return;
        }

        this.notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div style="font-weight: 500">${note.title}</div>
                <div style="font-size: 0.875rem; color: #6b7280">${note.lastEdited}</div>
                <div class="tags">
                    ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            `;
            this.container.appendChild(noteEl);
        });
    }
}