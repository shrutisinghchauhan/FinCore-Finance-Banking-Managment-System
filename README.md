# FinCore — Banking Management System

**FinCore** is a full-stack banking management application built using **ASP.NET Core Web API, React.js, SQL Server, and Entity Framework Core**. It provides a modern interface for managing bank accounts, transferring funds, tracking transactions, and viewing financial analytics.

The application demonstrates RESTful API development, JWT-based authentication, relational database management, secure account ownership, and transactional consistency.

## Features

### User Authentication & Authorization
- User registration and login using JWT authentication.
- Secure password hashing using ASP.NET Core Identity's `PasswordHasher`.
- Role information included in authenticated user tokens.
- Protected backend endpoints using `[Authorize]`.
- User-specific access to bank accounts and transaction history.

### Account Management
- Create and manage bank accounts.
- View account details and available balances.
- Update account information.
- Activate and deactivate accounts.
- Account ownership enforced through authenticated user IDs.

### Money Transfers
- Transfer funds between bank accounts.
- Validate account status, currency compatibility, and sufficient balance.
- Prevent transfers to the same account.
- Ensure users can debit only accounts they own.
- Execute transfers using SQL database transactions with serializable isolation.
- Automatically record successful transfers in transaction history.

### Transaction History
- View completed fund transfers.
- Track sender account, receiver account, amount, description, and timestamp.
- Display transactions in descending chronological order.
- Restrict transaction visibility to transfers involving the authenticated user's accounts.

### Dashboard & Analytics
- Banking dashboard with account information and balances.
- Transaction summaries and financial analytics.
- React-based interface with dynamic data loading.
- Integration with authenticated backend APIs.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, JSX, CSS, Vite |
| Backend | C#, ASP.NET Core Web API, .NET 10 |
| Database | Microsoft SQL Server |
| ORM | Entity Framework Core |
| Authentication | JWT Bearer Authentication |
| Password Security | ASP.NET Core Identity PasswordHasher |
| API Architecture | RESTful APIs |
| Development Environment | Visual Studio 2022 |
| Version Control | Git, GitHub |

## System Architecture

```text
                  USER
                   |
                   v
             React Frontend
             (React + Vite)
                   |
                   | HTTP Requests / JSON
                   | JWT Bearer Token
                   v
           ASP.NET Core Web API
                   |
         +---------+----------+
         |         |          |
         v         v          v
       Auth     Accounts   Transfers
     Controller Controller Controller
         |         |          |
         +---------+----------+
                   |
                   v
          Entity Framework Core
                   |
                   v
             SQL Server
                   |
        +----------+-----------+
        |          |           |
        v          v           v
      Users     Accounts   Transactions
```

## Project Structure

```text
FinCore/
|
|-- FinCore.Server/
|   |-- Controllers/
|   |   |-- AuthController.cs
|   |   |-- AccountsController.cs
|   |   |-- TransfersController.cs
|   |
|   |-- Data/
|   |   |-- FinCoreDbContext.cs
|   |
|   |-- Models/
|   |   |-- AppUser.cs
|   |   |-- Account.cs
|   |   |-- BankTransaction.cs
|   |
|   |-- Migrations/
|   |-- Properties/
|   |-- Program.cs
|   |-- appsettings.json
|   |-- FinCore.Server.csproj
|
|-- fincore.client/
|   |-- src/
|   |   |-- App.jsx
|   |-- package.json
|   |-- vite.config.js
|
|-- FinCore.slnx
|-- .gitignore
|-- README.md
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive a JWT |

### Account Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/accounts` | Get authenticated user's accounts |
| GET | `/api/accounts/{id}` | Get a specific owned account |
| POST | `/api/accounts` | Create a bank account |
| PUT | `/api/accounts/{id}` | Update an owned account |

### Money Transfers

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transfers` | Transfer funds between accounts |
| GET | `/api/transfers` | Retrieve user-specific transaction history |

Protected endpoints require a valid JWT in the HTTP Authorization header.

## Money Transfer Workflow

1. The user logs in and receives a JWT authentication token.
2. React sends a transfer request to the ASP.NET Core backend.
3. The backend validates the authenticated user's identity.
4. The sender account is verified to belong to the logged-in user.
5. The receiver account is located using its account ID.
6. The backend validates account status, currency, and available balance.
7. A SQL transaction is initiated using serializable isolation.
8. The sender's balance is debited and the receiver's balance is credited.
9. A transaction record is stored in SQL Server.
10. The database transaction is committed and the API returns a success response.

The database transaction ensures that the balance updates and transaction record are committed together or rolled back together if the operation fails.

## Getting Started

### Prerequisites

- .NET 10 SDK
- Node.js and npm
- Microsoft SQL Server or SQL Server LocalDB
- Visual Studio 2022 with ASP.NET and web development support
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FinCore.git
cd FinCore
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Configure the Backend

Configure the SQL Server connection string and JWT authentication settings using ASP.NET Core configuration.

For local development, use .NET User Secrets or environment variables to store sensitive values such as the JWT signing key. Do not commit production credentials or signing keys to GitHub.

Required JWT settings:

```text
Jwt:Issuer
Jwt:Audience
Jwt:Key
```

The JWT signing key must be at least 32 bytes.

### 3. Apply Database Migrations

Open the solution in Visual Studio.

In **Tools → NuGet Package Manager → Package Manager Console**, select `FinCore.Server` as the default project and run:

```powershell
Update-Database
```

This applies the existing Entity Framework Core migrations to your configured SQL Server database.

### 4. Install Frontend Dependencies

Open a terminal in the frontend folder:

```bash
cd fincore.client
npm install
```

### 5. Run the Application

Open `FinCore.slnx` in Visual Studio.

Set `FinCore.Server` as the startup project and run using **F5**.

The backend uses ASP.NET Core and the frontend uses React with Vite. In the current local development configuration, the backend HTTPS address is:

```text
https://localhost:7186/
```

Development ports may vary depending on the launch profile.

## Database Design

FinCore uses three primary entities:

**AppUser**
- Stores user information, hashed passwords, and roles.
- Has a one-to-many relationship with bank accounts.

**Account**
- Stores account information, currency, balance, and activation status.
- Contains an `AppUserId` foreign key to identify the account owner.

**BankTransaction**
- Stores sender and receiver account IDs, transfer amount, transaction type, status, description, and creation timestamp.

## Security Considerations

The application includes several security controls:

- Password hashing rather than plaintext password storage.
- JWT-based authentication for protected endpoints.
- Server-side account ownership checks.
- Validation of transfer amounts and account status.
- SQL transactions for atomic fund transfers.
- User-specific transaction visibility.

**Note:** FinCore is an educational and portfolio project, not a production banking system. Production deployment would require additional security controls, financial audit mechanisms, stronger authorization policies, comprehensive automated testing, and operational safeguards.

## Future Enhancements

- Role-based administrative authorization.
- Password reset and email verification.
- Multi-factor authentication.
- Advanced transaction filtering and reporting.
- Pagination and search for transaction history.
- Automated unit and integration tests.
- Improved audit logging and monitoring.
- Cloud deployment and CI/CD integration.

## Learning Outcomes

This project demonstrates practical understanding of:

- Full-stack application development.
- RESTful API design and HTTP request handling.
- React frontend and ASP.NET Core backend integration.
- JWT authentication and authorization.
- Entity Framework Core and relational database modeling.
- ACID transactions and database isolation.
- Secure multi-user account ownership.
- Git-based version control.

## Author

**Shruti Chauhan**

Integrated B.Tech + M.Tech, Information Technology  
ABV-Indian Institute of Information Technology and Management, Gwalior

---

**FinCore — A full-stack banking application demonstrating secure API development and transactional data management.**
