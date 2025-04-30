// File: js/components/editor.js
// Update this file: js/components/editor.js
export class Editor {
    constructor() {
        this.tinyMDE = new TinyMDE.Editor({ element: "tinymde" });
        var commandBar = new TinyMDE.CommandBar({
            element: "tinymde-toolbar",
            editor: this.tinyMDE,
        });

        // Add these lines to handle the buttons
        this.setupButtonHandlers();
    }

    // Add this new method
    setupButtonHandlers() {
        const saveButton = document.getElementById('saveNote');
        const cancelButton = document.getElementById('cancelEdit');

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveNote());
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.cancelEdit());
        }
    }

    // Add these methods to handle save and cancel actions
    async saveNote() {
        try {
            const content = this.tinyMDE.content;
            const title = content.split('\n')[0].replace(/^# /, '') || 'Untitled Note';
            const tagInput = document.getElementById('tagInputWrapper').__tagInput;
            const tags = tagInput ? tagInput.getTags().map(tag => ({ name: tag })) : [];

            // Get current note ID if editing an existing note
            const noteId = this.currentNoteId || 0;

            const noteData = {
                id: noteId,
                title: title,
                lastEdited: new Date().toLocaleString(),
                markdownText: content,
                htmlText: this.tinyMDE.htmlContent,
                tags: tags
            };

            // Update existing note or create a new one
            const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
            const method = noteId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(noteData)
            });

            if (!response.ok) {
                throw new Error(`Error saving note: ${response.statusText}`);
            }

            const savedNote = await response.json();
            console.log('Note saved successfully:', savedNote);

            // Trigger notes list update
            window.dispatchEvent(new CustomEvent('note-saved', { detail: savedNote }));

            // Update UI as needed
            this.currentNoteId = savedNote.id;
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note. Please try again.');
        }
    }

    cancelEdit() {
        // Reset the editor content
        this.tinyMDE.content = '';

        // Clear the tags
        const tagInput = document.getElementById('tagInputWrapper').__tagInput;
        if (tagInput) {
            tagInput.getTags().forEach(tag => tagInput.removeTag(tag));
        }

        // Reset current note reference
        this.currentNoteId = null;

        // Optionally notify other components
        window.dispatchEvent(new CustomEvent('edit-cancelled'));
    }

    // Add this to load note content for editing
    loadNote(note) {
        if (!note) return;

        this.currentNoteId = note.id;
        this.tinyMDE.content = note.markdownText || '';

        // Load tags if they exist
        const tagInput = document.getElementById('tagInputWrapper').__tagInput;
        if (tagInput && note.tags) {
            // Clear existing tags first
            tagInput.getTags().forEach(tag => tagInput.removeTag(tag));

            // Add note tags
            note.tags.forEach(tag => tagInput.addTag(tag.name));
        }
    }
}