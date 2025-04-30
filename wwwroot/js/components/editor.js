// File: js/components/editor.js
export class Editor {
    constructor() {
        this.tinyMDE = new TinyMDE.Editor({ element: "tinymde" });
        var commandBar = new TinyMDE.CommandBar({
            element: "tinymde-toolbar",
            editor: this.tinyMDE,
        });
    }
}
