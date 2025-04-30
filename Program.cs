using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Notes.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JSON serialization to handle circular references in tag hierarchies
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Add EF Core with SQLite
builder.Services.AddDbContext<NotesDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=notes.db"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<NotesDbContext>();
    dbContext.Database.Migrate();
}

//var summaries = new List<Note>
//{
//    new Note { Title = "First Note", LastEdited = "1h ago", Tags = new List<string> { "tag1", "tag2" } },
//    new Note { Title = "Second Note", LastEdited = "2h ago", Tags = new List<string> { "tag3", "tag4" } },
//    new Note { Title = "Third Note", LastEdited = "5h ago", Tags = new List<string> { "tag5", "tag6" } }
//};

// Get all notes (without HtmlText and MarkdownText)
app.MapGet("/api/notes", async (NotesDbContext db) =>
{
    var notes = await db.Notes
        .Include(n => n.Tags)
        .Select(n => new
        {
            n.Id,
            n.Title,
            n.LastEdited,
            Tags = n.Tags.Select(t => new { t.Id, t.Name, t.ParentId })
        })
        .ToListAsync();

    return Results.Ok(notes);
})
.WithName("GetNotes")
.WithOpenApi();

// Get a single note based on ID
app.MapGet("/api/notes/{id}", async (int id, NotesDbContext db) =>
{
    var note = await db.Notes
        .Include(n => n.Tags)
        .FirstOrDefaultAsync(n => n.Id == id);

    if (note == null)
        return Results.NotFound();

    return Results.Ok(note);
})
.WithName("GetNote")
.WithOpenApi();

// Get all notes matching a list of tags (by name)
app.MapGet("/api/notes/bytags", async (string[] tagNames, NotesDbContext db) =>
{
    if (tagNames == null || tagNames.Length == 0)
        return Results.BadRequest("Tag names are required");

    // Find all notes that contain ALL of the specified tags
    var notes = await db.Notes
        .Include(n => n.Tags)
        .Where(n => tagNames.All(tagName =>
            n.Tags.Any(t => t.Name == tagName)))
        .Select(n => new
        {
            n.Id,
            n.Title,
            n.LastEdited,
            Tags = n.Tags.Select(t => new { t.Id, t.Name, t.ParentId })
        })
        .ToListAsync();

    return Results.Ok(notes);
});

app.MapPost("/api/notes", async (Note note, NotesDbContext db) =>
{
    if (note == null)
        return Results.BadRequest("Note is required");

    // Process tags - add any new ones
    if (note.Tags != null && note.Tags.Any())
    {
        var processedTags = new List<Tag>();
        foreach (var tag in note.Tags)
        {
            // Check if tag already exists by name
            var existingTag = await db.Tags
                .FirstOrDefaultAsync(t => t.Name == tag.Name);

            if (existingTag != null)
            {
                processedTags.Add(existingTag);
            }
            else
            {
                // This is a new tag
                var newTag = new Tag
                {
                    Name = tag.Name,
                    ParentId = tag.ParentId
                };
                db.Tags.Add(newTag);
                await db.SaveChangesAsync(); // Save to get ID
                processedTags.Add(newTag);
            }
        }
        note.Tags = processedTags;
    }

    db.Notes.Add(note);
    await db.SaveChangesAsync();

    return Results.Created($"/api/notes/{note.Id}", note);
});

app.MapPut("/api/notes/{id}", async (int id, Note updatedNote, NotesDbContext db) =>
{
    var existingNote = await db.Notes
        .Include(n => n.Tags)
        .FirstOrDefaultAsync(n => n.Id == id);

    if (existingNote == null)
        return Results.NotFound();

    // Update note properties
    existingNote.Title = updatedNote.Title;
    existingNote.LastEdited = updatedNote.LastEdited;
    existingNote.HtmlText = updatedNote.HtmlText;
    existingNote.MarkdownText = updatedNote.MarkdownText;

    // Process tags
    if (updatedNote.Tags != null)
    {
        // Clear existing tags
        existingNote.Tags.Clear();

        // Add tags, creating new ones if needed
        foreach (var tag in updatedNote.Tags)
        {
            Tag tagToAdd;

            if (tag.Id > 0)
            {
                // Existing tag, find it
                tagToAdd = await db.Tags.FindAsync(tag.Id)
                    ?? throw new InvalidOperationException($"Tag with ID {tag.Id} not found");
            }
            else
            {
                // New tag or tag without ID, check if it exists by name
                tagToAdd = await db.Tags.FirstOrDefaultAsync(t => t.Name == tag.Name);

                if (tagToAdd == null)
                {
                    // Create new tag
                    tagToAdd = new Tag
                    {
                        Name = tag.Name,
                        ParentId = tag.ParentId
                    };
                    db.Tags.Add(tagToAdd);
                    await db.SaveChangesAsync(); // Save to get ID
                }
            }

            existingNote.Tags.Add(tagToAdd);
        }
    }

    await db.SaveChangesAsync();
    return Results.Ok(existingNote);
});

app.MapPut("/api/tags/{id}/parent/{parentId}", async (int id, int parentId, NotesDbContext db) =>
{
    var tag = await db.Tags.FindAsync(id);
    if (tag == null)
        return Results.NotFound($"Tag with ID {id} not found");

    // If parentId is not 0, ensure parent exists
    if (parentId != 0)
    {
        var parentTag = await db.Tags.FindAsync(parentId);
        if (parentTag == null)
            return Results.NotFound($"Parent tag with ID {parentId} not found");

        // Check for circular reference
        if (id == parentId || await IsCircularReference(db, parentId, id))
            return Results.BadRequest("Setting this parent would create a circular reference");
    }

    tag.ParentId = parentId;
    await db.SaveChangesAsync();
    return Results.Ok(tag);
});

// Get all tags in hierarchical structure
app.MapGet("/api/tags", async (NotesDbContext db) =>
{
    var allTags = await db.Tags.ToListAsync();

    // Build hierarchical structure
    var rootTags = allTags
        .Where(t => t.ParentId == 0)
        .ToList();

    BuildTagHierarchy(rootTags, allTags);

    return Results.Ok(rootTags);
});

app.MapFallbackToFile("index.html");

app.Run();

// Helper function to build tag hierarchy
void BuildTagHierarchy(List<Tag> parentTags, List<Tag> allTags)
{
    foreach (var parent in parentTags)
    {
        parent.Children = allTags
            .Where(t => t.ParentId == parent.Id)
            .ToList();

        if (parent.Children.Any())
        {
            BuildTagHierarchy(parent.Children, allTags);
        }
    }
}

// Helper function to check for circular references in tag hierarchy
async Task<bool> IsCircularReference(NotesDbContext db, int currentTagId, int originalTagId)
{
    var currentTag = await db.Tags.FindAsync(currentTagId);
    if (currentTag == null || currentTag.ParentId == 0)
        return false;

    if (currentTag.ParentId == originalTagId)
        return true;

    return await IsCircularReference(db, currentTag.ParentId, originalTagId);
}
