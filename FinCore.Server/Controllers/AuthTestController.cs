
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinCore.Server.Controllers
{
    [ApiController]
    [Route("api/auth-test")]
    public class AuthTestController : ControllerBase
    {
        [Authorize]
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            return Ok(new
            {
                message = "JWT authentication successful.",
                userId = User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                ),
                name = User.FindFirstValue(
                    ClaimTypes.Name
                ),
                email = User.FindFirstValue(
                    ClaimTypes.Email
                ),
                role = User.FindFirstValue(
                    ClaimTypes.Role
                )
            });
        }
    }
}
