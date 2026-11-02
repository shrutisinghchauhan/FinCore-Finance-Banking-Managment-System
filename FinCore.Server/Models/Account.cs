
using System.ComponentModel.DataAnnotations;

namespace FinCore.Server.Models
{
    public class Account
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AccountHolderName { get; set; } = string.Empty;

        public decimal Balance { get; set; }

        [Required]
        [MaxLength(3)]
        public string Currency { get; set; } = "INR";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        // NEW: ID of the registered user who owns this account.
        public int? AppUserId { get; set; }

        // NEW: Navigation property to the registered user.
        public AppUser? AppUser { get; set; }
    }
}
