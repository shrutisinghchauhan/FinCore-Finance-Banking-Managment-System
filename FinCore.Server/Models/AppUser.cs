
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FinCore.Server.Models
{
    public class AppUser
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "User";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // NEW: A registered user can own multiple bank accounts.
        public ICollection<Account> Accounts { get; set; }
            = new List<Account>();
    }
}
