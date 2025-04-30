// File: js/components/tagsManager.js
export class TagsManager {
    constructor() {
        this.tags = {
            work: {
                ideas: [],
                todo: []
            },
            personal: {}
        };
        this.container = document.getElementById('tagTree');
    }

    render(container, items = this.tags, level = 0) {
        Object.entries(items).forEach(([tag, children]) => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-item';
            tagEl.style.paddingLeft = `${level * 16 + 24}px`;
            tagEl.innerHTML = `
                <i class="fas ${Object.keys(children).length ? 'fa-angle-right' : 'fa-tag'}"></i>
                ${tag}
            `;
            container.appendChild(tagEl);
            this.render(container, children, level + 1);
        });
    }
}