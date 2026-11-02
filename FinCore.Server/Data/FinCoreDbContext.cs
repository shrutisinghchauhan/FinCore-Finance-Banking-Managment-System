
using Microsoft.EntityFrameworkCore;
using FinCore.Server.Models;

namespace FinCore.Server.Data
{
    public class FinCoreDbContext : DbContext
    {
        public FinCoreDbContext(
            DbContextOptions<FinCoreDbContext> options)
            : base(options)
        {
        }

        public DbSet<Account> Accounts { get; set; }

        public DbSet<BankTransaction> BankTransactions { get; set; }

        // Registered FinCore users
        public DbSet<AppUser> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Account configuration
            modelBuilder.Entity<Account>()
                .Property(a => a.Balance)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.AccountNumber)
                .IsUnique();

            // NEW: One user can own multiple accounts.
            modelBuilder.Entity<Account>()
                .HasOne(a => a.AppUser)
                .WithMany(u => u.Accounts)
                .HasForeignKey(a => a.AppUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Transaction configuration
            modelBuilder.Entity<BankTransaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BankTransaction>()
                .HasIndex(t => t.CreatedAt);

            // User configuration
            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Email)
                .IsUnique();
        }
    }
}
