namespace Notes.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string LastEdited { get; set; }
        public List<Tag> Tags { get; set; } = new List<Tag>();
        public string HtmlText { get; set; }
        public string MarkdownText { get; set; }
    }

    public class Tag
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int ParentId { get; set; }
        public List<Tag> Children { get; set; } = new List<Tag>();
    }
}
