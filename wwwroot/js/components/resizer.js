// File: js/components/resizer.js
import { StorageManager } from '../utils/storage.js';

const STORAGE_KEYS = {
    LEFT_PANEL: 'notes-app-left-width',
    RIGHT_PANEL: 'notes-app-right-width'
};

const DEFAULT_SIZES = {
    left: 256,
    right: 256
};

export function initializeResize() {
    const leftHandle = document.querySelector('.resize-handle.left');
    const rightHandle = document.querySelector('.resize-handle.right');
    const sidebar = document.querySelector('.sidebar');
    const rightPanel = document.querySelector('.right-panel');
    
    // Restore saved dimensions
    sidebar.style.width = `${StorageManager.load(STORAGE_KEYS.LEFT_PANEL, DEFAULT_SIZES.left)}px`;
    rightPanel.style.width = `${StorageManager.load(STORAGE_KEYS.RIGHT_PANEL, DEFAULT_SIZES.right)}px`;
    
    function handleResize(handle, panel, isLeft) {
        let startX, startWidth;
        
        function startResizing(e) {
            startX = e.pageX;
            startWidth = parseInt(getComputedStyle(panel).width, 10);
            document.documentElement.classList.add('resizing');
            handle.classList.add('dragging');
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResizing);
        }
        
        function resize(e) {
            if (isLeft) {
                const newWidth = startWidth + (e.pageX - startX);
                if (newWidth >= 150 && newWidth <= 500) {
                    panel.style.width = `${newWidth}px`;
                }
            } else {
                const newWidth = startWidth - (e.pageX - startX);
                if (newWidth >= 150 && newWidth <= 500) {
                    panel.style.width = `${newWidth}px`;
                }
            }
        }
        
        function stopResizing() {
            document.documentElement.classList.remove('resizing');
            handle.classList.remove('dragging');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
            
            // Save the new width to localStorage
            const newWidth = parseInt(getComputedStyle(panel).width, 10);
            const storageKey = isLeft ? STORAGE_KEYS.LEFT_PANEL : STORAGE_KEYS.RIGHT_PANEL;
            StorageManager.save(storageKey, newWidth);
        }
        
        handle.addEventListener('mousedown', startResizing);
    }
    
    handleResize(leftHandle, sidebar, true);
    handleResize(rightHandle, rightPanel, false);
}

