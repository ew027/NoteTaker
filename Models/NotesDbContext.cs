using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace Notes.Models
{
    public class NotesDbContext : DbContext
    {
        public NotesDbContext(DbContextOptions<NotesDbContext> options) : base(options) { }

        public DbSet<Note> Notes { get; set; }
        public DbSet<Tag> Tags { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure many-to-many relationship between Notes and Tags
            modelBuilder.Entity<Note>()
                .HasMany(n => n.Tags)
                .WithMany()
                .UsingEntity(j => j.ToTable("NoteTags"));

            // Configure Tag entity to include self-reference for hierarchy
            modelBuilder.Entity<Tag>()
                .HasMany(t => t.Children)
                .WithOne()
                .HasForeignKey(t => t.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Additional configurations to handle circular references
            modelBuilder.Entity<Tag>()
                .HasOne<Tag>()
                .WithMany()
                .HasForeignKey(t => t.ParentId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
