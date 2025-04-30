// File: js/components/tagInput.js
export class TagInput {
    constructor(container) {
        this.container = container;
        this.input = container.querySelector('input');
        this.tags = new Set();
        this.availableTags = ['work', 'personal', 'ideas', 'todo', 'important', 'draft'];
        this.dropdown = null;
        this.selectedIndex = -1;

        this.setupEventListeners();

        this.container.__tagInput = this;
    }

    setupEventListeners() {
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.container.addEventListener('click', () => this.input.focus());
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    handleInput() {
        const value = this.input.value.trim();
        if (value) {
            this.showDropdown(value);
        } else {
            this.closeDropdown();
        }
    }

    handleKeydown(e) {
        if ((e.key === 'Enter' || e.key === 'Tab') && this.input.value.trim()) {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.dropdown) {
                const selected = this.getFilteredTags()[this.selectedIndex];
                if (selected) {
                    this.addTag(selected);
                }
            } else {
                this.addTag(this.input.value.trim());
            }
        } else if (e.key === 'Backspace' && !this.input.value) {
            const tags = Array.from(this.container.getElementsByClassName('tag-pill'));
            if (tags.length) {
                this.removeTag(tags[tags.length - 1].dataset.tag);
            }
        } else if (e.key === 'ArrowDown' && this.dropdown) {
            e.preventDefault();
            this.selectedIndex = Math.min(
                this.selectedIndex + 1,
                this.getFilteredTags().length - 1
            );
            this.updateDropdownSelection();
        } else if (e.key === 'ArrowUp' && this.dropdown) {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
            this.updateDropdownSelection();
        }
    }

    getFilteredTags() {
        const value = this.input.value.toLowerCase();
        return this.availableTags.filter(tag => 
            tag.toLowerCase().includes(value) && !this.tags.has(tag)
        );
    }

    showDropdown(value) {
        const filteredTags = this.getFilteredTags();
        
        if (this.dropdown) {
            this.container.removeChild(this.dropdown);
        }

        if (!filteredTags.length) {
            this.dropdown = null;
            return;
        }

        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        
        filteredTags.forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = tag;
            item.addEventListener('click', () => this.addTag(tag));
            this.dropdown.appendChild(item);
        });

        this.container.appendChild(this.dropdown);
        this.selectedIndex = -1;
    }

    updateDropdownSelection() {
        if (!this.dropdown) return;
        
        const items = this.dropdown.getElementsByClassName('autocomplete-item');
        Array.from(items).forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }

    closeDropdown() {
        if (this.dropdown) {
            this.container.removeChild(this.dropdown);
            this.dropdown = null;
        }
        this.selectedIndex = -1;
    }

    addTag(tag) {
        if (this.tags.has(tag)) return;
        
        const tagEl = document.createElement('div');
        tagEl.className = 'tag-pill';
        tagEl.dataset.tag = tag;
        tagEl.innerHTML = `
            <span>${tag}</span>
            <span class="remove" onclick="event.stopPropagation(); tagInput.removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        this.container.insertBefore(tagEl, this.input);
        this.tags.add(tag);
        this.input.value = '';
        this.closeDropdown();
    }

    removeTag(tag) {
        const tagEl = this.container.querySelector(`[data-tag="${tag}"]`);
        if (tagEl) {
            tagEl.remove();
            this.tags.delete(tag);
        }
    }

    getTags() {
        return Array.from(this.tags);
    }
}
