
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinCore.Server.Data;
using FinCore.Server.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace FinCore.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AccountsController : ControllerBase
    {
        private readonly FinCoreDbContext _context;

        public AccountsController(FinCoreDbContext context)
        {
            _context = context;
        }

        // Get the authenticated user's ID from the JWT.
        private int? GetCurrentUserId()
        {
            var userIdValue =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(userIdValue, out int userId))
            {
                return userId;
            }

            return null;
        }

        // GET: api/accounts
        // Return only the logged-in user's accounts.
        [HttpGet]
        public async Task<IActionResult> GetAccounts()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized(new
                {
                    message = "Valid user identity is required."
                });

            var accounts = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.AppUserId == userId.Value)
                .OrderBy(a => a.Id)
                .ToListAsync();

            return Ok(accounts);
        }

        // GET: api/accounts/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAccount(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var account = await _context.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a =>
                    a.Id == id &&
                    a.AppUserId == userId.Value);

            if (account == null)
                return NotFound(new
                {
                    message = "Account not found."
                });

            return Ok(account);
        }

        // POST: api/accounts
        [HttpPost]
        public async Task<IActionResult> CreateAccount(
            [FromBody] CreateAccountRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(
                request.AccountHolderName))
            {
                return BadRequest(new
                {
                    message = "Account holder name is required."
                });
            }

            if (request.InitialBalance < 0)
            {
                return BadRequest(new
                {
                    message = "Initial balance cannot be negative."
                });
            }

            var account = new Account
            {
                AccountNumber = "FC" +
                    Guid.NewGuid()
                        .ToString("N")[..16]
                        .ToUpperInvariant(),

                AccountHolderName =
                    request.AccountHolderName.Trim(),

                Balance = request.InitialBalance,

                Currency = "INR",

                CreatedAt = DateTime.UtcNow,

                IsActive = true,

                // Automatically assign ownership.
                AppUserId = userId.Value
            };

            _context.Accounts.Add(account);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetAccount),
                new { id = account.Id },
                account
            );
        }

        // PUT: api/accounts/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAccount(
            int id,
            [FromBody] UpdateAccountRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(
                request.AccountHolderName))
            {
                return BadRequest(new
                {
                    message = "Account holder name is required."
                });
            }

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.Id == id &&
                    a.AppUserId == userId.Value);

            if (account == null)
                return NotFound(new
                {
                    message = "Account not found."
                });

            account.AccountHolderName =
                request.AccountHolderName.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Account updated successfully.",
                account
            });
        }

        // PUT: api/accounts/1/deactivate
        [HttpPut("{id:int}/deactivate")]
        public async Task<IActionResult> DeactivateAccount(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.Id == id &&
                    a.AppUserId == userId.Value);

            if (account == null)
                return NotFound(new
                {
                    message = "Account not found."
                });

            if (!account.IsActive)
            {
                return BadRequest(new
                {
                    message = "Account is already deactivated."
                });
            }

            account.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Account deactivated successfully.",
                account
            });
        }

        // PUT: api/accounts/1/activate
        [HttpPut("{id:int}/activate")]
        public async Task<IActionResult> ActivateAccount(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
                return Unauthorized();

            var account = await _context.Accounts
                .FirstOrDefaultAsync(a =>
                    a.Id == id &&
                    a.AppUserId == userId.Value);

            if (account == null)
                return NotFound(new
                {
                    message = "Account not found."
                });

            if (account.IsActive)
            {
                return BadRequest(new
                {
                    message = "Account is already active."
                });
            }

            account.IsActive = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Account activated successfully.",
                account
            });
        }
    }

    public class CreateAccountRequest
    {
        [Required]
        [MaxLength(100)]
        public string AccountHolderName { get; set; }
            = string.Empty;

        [Range(typeof(decimal), "0", "9999999999999999.99")]
        public decimal InitialBalance { get; set; }
    }

    public class UpdateAccountRequest
    {
        [Required]
        [MaxLength(100)]
        public string AccountHolderName { get; set; }
            = string.Empty;
    }
}
