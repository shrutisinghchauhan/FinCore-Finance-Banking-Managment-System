using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinCore.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountUserOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AppUserId",
                table: "Accounts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AppUserId",
                table: "Accounts",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Users_AppUserId",
                table: "Accounts",
                column: "AppUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Users_AppUserId",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_AppUserId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "Accounts");
        }
    }
}
