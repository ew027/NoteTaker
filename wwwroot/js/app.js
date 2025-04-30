// File: js/app.js
import { initializeResize } from './components/resizer.js';
import { TagInput } from './components/tagInput.js';
import { NotesManager } from './components/notesManager.js';
import { TagsManager } from './components/tagsManager.js';
import { Editor } from './components/editor.js';

let editor;
let notesManager;
let tagsManager;
let tagInput;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize objects when the DOM is fully loaded
    editor = new Editor();
    notesManager = new NotesManager();
    tagsManager = new TagsManager();
    tagInput = new TagInput(document.getElementById('tagInputWrapper'));
    
    initializeResize();

    //notesManager.render();
    tagsManager.render(document.getElementById('tagTree'));

    document.querySelectorAll('.view-toggle button').forEach(button => {
        button.addEventListener('click', () => {
            toggleView(button.getAttribute('data-view'));
        });
    });

    document.getElementById('noteList').addEventListener('click', (event) => {
        const noteItem = event.target.closest('.note-item');
        if (noteItem && noteItem.dataset.noteId) {
            const noteId = parseInt(noteItem.dataset.noteId);
            loadNoteForEditing(noteId);
        }
    });
});

// Add this new function to app.js
async function loadNoteForEditing(noteId) {
    try {
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) {
            throw new Error(`Error loading note: ${response.statusText}`);
        }

        const note = await response.json();
        editor.loadNote(note);
    } catch (error) {
        console.error('Failed to load note:', error);
        alert('Failed to load note for editing.');
    }
}

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            alert('save note');
        } else if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            alert('new note');
        } else if (event.ctrlKey && event.key === 't') {
            event.preventDefault();
            alert('enter tags');
        } else if (event.ctrlKey && event.key === 'e') {
            event.preventDefault();
            alert('edit note');
        }
        // Add more shortcuts as needed
    });
}

function toggleView(view) {
    document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[data-view="${view}"]`).classList.add('active');
    
    document.querySelector('.note-list').classList.toggle('active', view === 'notes');
    document.querySelector('.tag-tree').classList.toggle('active', view === 'tags');
}
