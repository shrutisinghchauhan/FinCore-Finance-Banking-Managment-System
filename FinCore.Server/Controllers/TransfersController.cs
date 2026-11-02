
using FinCore.Server.Data;
using FinCore.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;

namespace FinCore.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class TransfersController : ControllerBase
    {
        private readonly FinCoreDbContext _context;

        public TransfersController(FinCoreDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(value, out var userId)
                ? userId
                : null;
        }

        // POST: api/transfers
        [HttpPost]
        public async Task<IActionResult> Transfer(
            [FromBody] TransferRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Valid user identity is required."
                });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message = "Transfer amount must be positive."
                });
            }

            if (request.FromAccountId == request.ToAccountId)
            {
                return BadRequest(new
                {
                    message = "Cannot transfer to the same account."
                });
            }

            await using var dbTransaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            // Sender must belong to the logged-in user.
            var sender = await _context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.Id == request.FromAccountId &&
                    a.AppUserId == userId.Value);

            if (sender == null)
            {
                return NotFound(new
                {
                    message = "Sender account not found."
                });
            }

            // Receiver may belong to another user.
            var receiver = await _context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.Id == request.ToAccountId);

            if (receiver == null)
            {
                return NotFound(new
                {
                    message = "Receiver account not found."
                });
            }

            if (!sender.IsActive)
            {
                return BadRequest(new
                {
                    message = "Sender account is deactivated."
                });
            }

            if (!receiver.IsActive)
            {
                return BadRequest(new
                {
                    message = "Receiver account is deactivated."
                });
            }

            if (sender.Currency != receiver.Currency)
            {
                return BadRequest(new
                {
                    message = "Account currencies must match."
                });
            }

            if (sender.Balance < request.Amount)
            {
                return BadRequest(new
                {
                    message = "Insufficient balance."
                });
            }

            sender.Balance -= request.Amount;
            receiver.Balance += request.Amount;

            var transaction = new BankTransaction
            {
                FromAccountId = sender.Id,
                ToAccountId = receiver.Id,
                Amount = request.Amount,
                Type = "Transfer",
                Status = "Completed",
                Description = request.Description?.Trim() ?? "",
                CreatedAt = DateTime.UtcNow
            };

            _context.BankTransactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(new
            {
                message = "Transfer completed successfully.",
                transactionId = transaction.Id,
                amount = transaction.Amount,
                senderBalance = sender.Balance,
                receiverBalance = receiver.Balance
            });
        }

        // GET: api/transfers
        // Return transactions involving the logged-in user's accounts.
        [HttpGet]
        public async Task<IActionResult> GetTransfers()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Valid user identity is required."
                });
            }

            var transfers = await _context.BankTransactions
                .AsNoTracking()
                .Where(transaction =>
                    _context.Accounts.Any(account =>
                        account.AppUserId == userId.Value &&
                        (account.Id == transaction.FromAccountId ||
                         account.Id == transaction.ToAccountId)))
                .OrderByDescending(transaction => transaction.CreatedAt)
                .ToListAsync();

            return Ok(transfers);
        }
    }

    public class TransferRequest
    {
        [Range(1, int.MaxValue)]
        public int FromAccountId { get; set; }

        [Range(1, int.MaxValue)]
        public int ToAccountId { get; set; }

        [Range(typeof(decimal), "0.01", "9999999999999999.99")]
        public decimal Amount { get; set; }

        [MaxLength(250)]
        public string? Description { get; set; }
    }
}
