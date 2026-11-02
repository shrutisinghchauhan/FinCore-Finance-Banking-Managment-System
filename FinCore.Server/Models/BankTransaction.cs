
using System.ComponentModel.DataAnnotations;

namespace FinCore.Server.Models
{
    public class BankTransaction
    {
        public int Id { get; set; }

        public int FromAccountId { get; set; }

        public int ToAccountId { get; set; }

        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = "Transfer";

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Completed";

        [MaxLength(250)]
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
