import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [authUser, setAuthUser] = useState(null);
    const [authToken, setAuthToken] = useState("");
    const [authMode, setAuthMode] = useState("login");
    const [authName, setAuthName] = useState("");
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authBusy, setAuthBusy] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authNotice, setAuthNotice] = useState("");

    function authenticatedFetch(url, options = {}) {
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${authToken}`,
            },
        });
    }

    async function handleAuthSubmit(event) {
        event.preventDefault();
        setAuthBusy(true);
        setAuthError("");
        setAuthNotice("");
        try {
            const isRegister = authMode === "register";
            const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isRegister
                    ? { fullName: authName.trim(), email: authEmail.trim(), password: authPassword }
                    : { email: authEmail.trim(), password: authPassword }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                const details = result?.errors
                    ? Object.values(result.errors).flat().join(" ")
                    : null;
                throw new Error(result?.message || details || result?.title || "Authentication failed.");
            }
            if (isRegister) {
                setAuthMode("login");
                setAuthPassword("");
                setAuthNotice("Registration successful. Sign in to continue.");
            } else {
                if (!result?.token || !result?.user) throw new Error("Login response did not include a JWT token.");
                setAuthToken(result.token);
                setAuthUser(result.user);
                setAuthPassword("");
                setActivePage("dashboard");
            }
        } catch (err) {
            setAuthError(err.message || "Unable to connect to the authentication service.");
        } finally {
            setAuthBusy(false);
        }
    }

    function handleLogout() {
        setAuthUser(null);
        setAuthToken("");
        setAccounts([]);
        setTransactions([]);
        setFromAccountId("");
        setToAccountId("");
        setAuthPassword("");
        setAuthMode("login");
        setAuthNotice("");
        setAuthError("");
        setActivePage("dashboard");
    }

    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activePage, setActivePage] = useState("dashboard");

    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [transferring, setTransferring] = useState(false);
    const [transferMessage, setTransferMessage] = useState("");
    const [transferError, setTransferError] = useState("");

    const [newAccountName, setNewAccountName] = useState("");
    const [initialBalance, setInitialBalance] = useState("");
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [createAccountMessage, setCreateAccountMessage] = useState("");
    const [createAccountError, setCreateAccountError] = useState("");

    const [editingAccountId, setEditingAccountId] = useState(null);
    const [editAccountName, setEditAccountName] = useState("");
    const [savingAccount, setSavingAccount] = useState(false);
    const [editAccountMessage, setEditAccountMessage] = useState("");
    const [editAccountError, setEditAccountError] = useState("");
    const [changingStatusId, setChangingStatusId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");


    function beginEditAccount(account) {
        setEditingAccountId(account.id);
        setEditAccountName(account.accountHolderName);
        setEditAccountMessage("");
        setEditAccountError("");
    }

    function cancelEditAccount() {
        setEditingAccountId(null);
        setEditAccountName("");
        setEditAccountError("");
    }

    async function handleUpdateAccount(event) {
        event.preventDefault();
        setEditAccountError("");
        setEditAccountMessage("");

        const name = editAccountName.trim();
        if (!name || name.length > 100) {
            setEditAccountError("Enter a name between 1 and 100 characters.");
            return;
        }

        if (editingAccountId === null) return;
        setSavingAccount(true);
        try {
            const response = await authenticatedFetch(`/api/accounts/${editingAccountId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountHolderName: name }),
            });
            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.message || result?.title || "Unable to update account.");
            }
            await loadAccounts();
            setEditingAccountId(null);
            setEditAccountName("");
            setEditAccountMessage(`Account #${editingAccountId} updated successfully.`);
        } catch (err) {
            setEditAccountError(err.message || "Unable to update account.");
        } finally {
            setSavingAccount(false);
        }
    }

    async function handleAccountStatusChange(account) {
        const action = account.isActive ? "deactivate" : "activate";

        if (!window.confirm(`Are you sure you want to ${action} ${account.accountHolderName}?`)) {
            return;
        }

        setChangingStatusId(account.id);
        setStatusMessage("");
        setStatusError("");

        try {
            const response = await authenticatedFetch(`/api/accounts/${account.id}/${action}`, {
                method: "PUT",
            });
            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.message || result?.title || "Unable to change account status.");
            }

            const refreshed = await authenticatedFetch("/api/accounts");
            if (!refreshed.ok) {
                throw new Error("Status changed, but the account list could not refresh.");
            }
            setAccounts(await refreshed.json());
            setStatusMessage(result?.message || `Account #${account.id} status updated.`);
        } catch (err) {
            setStatusError(err.message || "Unable to change account status.");
        } finally {
            setChangingStatusId(null);
        }
    }

    async function loadAccounts() {
        try {
            setError("");
            const response = await authenticatedFetch("/api/accounts");

            if (!response.ok) {
                throw new Error("Unable to fetch accounts");
            }

            const data = await response.json();
            setAccounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadTransactions() {
        try {
            setTransactionsLoading(true);
            setTransactionsError("");

            const response = await authenticatedFetch("/api/transfers");

            if (!response.ok) {
                throw new Error("Unable to load transaction history.");
            }

            const data = await response.json();
            setTransactions(data);
        } catch (err) {
            setTransactionsError(err.message);
        } finally {
            setTransactionsLoading(false);
        }
    }

    useEffect(() => {
        if (authToken) {
            setLoading(true);
            loadAccounts();
            loadTransactions();
        }
    }, [authToken]);

    const totalBalance = accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0
    );

    const completedTransactions = transactions.filter(
        (transaction) =>
            transaction.status?.toLowerCase() === "completed"
    );

    const totalTransferred = completedTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
    );

    const transactionCount = transactions.length;

    const averageTransfer =
        completedTransactions.length > 0
            ? totalTransferred / completedTransactions.length
            : 0;

    const successRate =
        transactionCount > 0
            ? (completedTransactions.length / transactionCount) * 100
            : 0;

    const transferChartData = [...completedTransactions]
        .sort(
            (a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
        )
        .slice(-10);

    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(value);

    async function handleTransfer(event) {
        event.preventDefault();

        setTransferMessage("");
        setTransferError("");

        const transferAmount = Number(amount);

        if (!fromAccountId || !toAccountId) {
            setTransferError("Please select both accounts.");
            return;
        }
        if (!Number.isSafeInteger(Number(toAccountId)) ||
            Number(toAccountId) <= 0) {
            setTransferError("Enter a valid recipient account ID.");
            return;
        }

        if (fromAccountId === toAccountId) {
            setTransferError("Sender and receiver must be different.");
            return;
        }

        if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
            setTransferError("Enter a valid transfer amount.");
            return;
        }

        setTransferring(true);

        try {
            const response = await authenticatedFetch("/api/transfers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fromAccountId: Number(fromAccountId),
                    toAccountId: Number(toAccountId),
                    amount: transferAmount,
                    description,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Transfer could not be completed."
                );
            }

            setTransferMessage(
                `Successfully transferred ${formatCurrency(transferAmount)}.`
            );

            setAmount("");
            setDescription("");

            await loadAccounts();
            await loadTransactions();
        } catch (err) {
            setTransferError(err.message);
        } finally {
            setTransferring(false);
        }
    }

    async function handleCreateAccount(event) {
        event.preventDefault();
        setCreateAccountMessage("");
        setCreateAccountError("");

        const name = newAccountName.trim();
        const balance = Number(initialBalance);

        if (!name) {
            setCreateAccountError("Please enter the account holder name.");
            return;
        }
        if (initialBalance.trim() === "" || !Number.isFinite(balance) || balance < 0) {
            setCreateAccountError("Enter a valid initial balance of zero or more.");
            return;
        }

        setCreatingAccount(true);
        try {
            const response = await authenticatedFetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountHolderName: name,
                    initialBalance: balance,
                }),
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(
                    result?.message || result?.title || "Unable to create account."
                );
            }

            setNewAccountName("");
            setInitialBalance("");
            setCreateAccountMessage(`Account for ${name} created successfully.`);
            await loadAccounts();
        } catch (err) {
            setCreateAccountError(err.message || "Unable to create account.");
        } finally {
            setCreatingAccount(false);
        }
    }

    const pages = [
        { id: "dashboard", label: "Dashboard" },
        { id: "accounts", label: "Accounts" },
        { id: "transfers", label: "Transfers" },
        { id: "transactions", label: "Transactions" },
        { id: "analytics", label: "Analytics" },
        { id: "administration", label: "Administration" },
    ];

    if (!authUser) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-brand">FinCore<span>.</span></div>
                    <p className="auth-brand-subtitle">Finance Management</p>
                    <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
                    <p className="auth-description">
                        {authMode === "login" ? "Sign in to your FinCore workspace." : "Register to get started with FinCore."}
                    </p>
                    <form onSubmit={handleAuthSubmit} className="auth-form">
                        {authMode === "register" && (
                            <>
                                <label htmlFor="authName">Full name</label>
                                <input id="authName" type="text" value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    maxLength={100} autoComplete="name" required />
                            </>
                        )}
                        <label htmlFor="authEmail">Email address</label>
                        <input id="authEmail" type="email" value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            maxLength={256} autoComplete="email" required />
                        <label htmlFor="authPassword">Password</label>
                        <input id="authPassword" type="password" value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            minLength={authMode === "register" ? 8 : undefined}
                            autoComplete={authMode === "register" ? "new-password" : "current-password"} required />
                        {authError && <p className="error" role="alert">{authError}</p>}
                        {authNotice && <p className="transfer-success" role="status">{authNotice}</p>}
                        <button className="transfer-button" type="submit" disabled={authBusy}>
                            {authBusy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
                        </button>
                    </form>
                    <p className="auth-switch">
                        {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button type="button" onClick={() => {
                            setAuthMode(authMode === "login" ? "register" : "login");
                            setAuthError("");
                            setAuthNotice("");
                            setAuthPassword("");
                        }}>{authMode === "login" ? "Register" : "Sign in"}</button>
                    </p>
                    <p className="auth-footnote">Demo environment · Do not use real banking credentials</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <h2>FinCore.</h2>
                <p>Finance Management</p>

                <nav>
                    {pages.map((page) => (
                        <a
                            key={page.id}
                            href={`#${page.id}`}
                            className={activePage === page.id ? "active" : ""}
                            onClick={() => setActivePage(page.id)}
                        >
                            {page.label}
                        </a>
                    ))}
                </nav>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <p className="subtitle">Financial Management</p>
                        <h1>
                            {activePage === "dashboard"
                                ? "Welcome to FinCore"
                                : pages.find((p) => p.id === activePage)?.label}
                        </h1>
                    </div>

                    <div className="auth-profile">
                        <span className="profile">{authUser.fullName} · {authUser.role}</span>
                        <button type="button" className="refresh-button" onClick={handleLogout}>Logout</button>
                    </div>
                </header>

                {loading && <p>Loading accounts...</p>}

                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <>
                        {activePage === "dashboard" && (
                            <>
                                <section className="balance-card">
                                    <p>Total Balance</p>
                                    <h2>{formatCurrency(totalBalance)}</h2>
                                    <span>Across {accounts.length} accounts</span>
                                </section>

                                <section className="accounts-section">
                                    <h2>Your Accounts</h2>

                                    <div className="account-grid">
                                        {accounts.map((account) => (
                                            <div className="account-card" key={account.id}>
                                                <p>{account.accountHolderName}</p>
                                                <h3>{formatCurrency(account.balance)}</h3>
                                                <span>{account.accountNumber}</span>
                                                <small>{account.currency} Account</small>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}

                        {activePage === "accounts" && (
                            <section className="accounts-section">
                                <h2>All Accounts</h2>

                                <div className="account-grid">
                                    {accounts.map((account) => (
                                        <div className="account-card" key={account.id}>
                                            <p>{account.accountHolderName}</p>
                                            <h3>{formatCurrency(account.balance)}</h3>
                                            <span>{account.accountNumber}</span>
                                            <small>{account.currency} Account</small>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {activePage === "transfers" && (
                            <section className="transfer-section">
                                <div className="transfer-panel">
                                    <h2>Send Money</h2>
                                    <p className="transfer-subtitle">
                                        Transfer funds securely between FinCore demo accounts.
                                    </p>

                                    <form onSubmit={handleTransfer}>
                                        <label htmlFor="fromAccount">
                                            From Account
                                        </label>

                                        <select
                                            id="fromAccount"
                                            value={fromAccountId}
                                            onChange={(e) => setFromAccountId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select sender account</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id} disabled={!account.isActive}>
                                                    {account.accountHolderName} —{" "}
                                                    {formatCurrency(account.balance)}{!account.isActive ? " (Inactive)" : ""}
                                                </option>
                                            ))}
                                        </select>

                                        <label htmlFor="toAccount">
                                            Recipient Account ID
                                        </label>

                                        <input
                                            id="toAccount"
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="Enter recipient account ID"
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                            required
                                        />

                                        <p className="transfer-subtitle">
                                            Enter the recipient's FinCore account ID.
                                            You can also transfer between your own accounts.
                                        </p>

                                        <label htmlFor="amount">
                                            Amount (INR)
                                        </label>

                                        <input
                                            id="amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="Enter amount"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                        />

                                        <label htmlFor="description">
                                            Description (optional)
                                        </label>

                                        <input
                                            id="description"
                                            type="text"
                                            maxLength={250}
                                            placeholder="e.g. Monthly payment"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />

                                        {transferError && (
                                            <p className="error">{transferError}</p>
                                        )}

                                        {transferMessage && (
                                            <p className="transfer-success">
                                                {transferMessage}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className="transfer-button"
                                            disabled={transferring}
                                        >
                                            {transferring
                                                ? "Processing Transfer..."
                                                : "Transfer Money"}
                                        </button>
                                    </form>
                                </div>
                            </section>
                        )}

                        {activePage === "transactions" && (
                            <section className="transactions-section">
                                <div className="transactions-header">
                                    <div>
                                        <h2>Transaction History</h2>
                                        <p>Track all your FinCore money transfers.</p>
                                    </div>

                                    <button
                                        className="refresh-button"
                                        onClick={loadTransactions}
                                        disabled={transactionsLoading}
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {transactionsError && (
                                    <p className="error">{transactionsError}</p>
                                )}

                                {transactionsLoading ? (
                                    <p>Loading transactions...</p>
                                ) : transactions.length === 0 ? (
                                    <p>No transactions found.</p>
                                ) : (
                                    <div className="transactions-table-wrapper">
                                        <table className="transactions-table">
                                            <thead>
                                                <tr>
                                                    <th>Transaction</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {transactions.map((transaction) => {
                                                    const sender = accounts.find(
                                                        (a) => a.id === transaction.fromAccountId
                                                    );

                                                    const receiver = accounts.find(
                                                        (a) => a.id === transaction.toAccountId
                                                    );

                                                    return (
                                                        <tr key={transaction.id}>
                                                            <td>
                                                                <strong>#{transaction.id}</strong>
                                                                <span className="transaction-description">
                                                                    {transaction.description || "Money Transfer"}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {sender?.accountHolderName ||
                                                                    `Account ${transaction.fromAccountId}`}
                                                            </td>

                                                            <td>
                                                                {receiver?.accountHolderName ||
                                                                    `Account ${transaction.toAccountId}`}
                                                            </td>

                                                            <td className="transaction-amount">
                                                                {formatCurrency(transaction.amount)}
                                                            </td>

                                                            <td>
                                                                <span className="status-badge">
                                                                    {transaction.status}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {new Date(transaction.createdAt).toLocaleString(
                                                                    "en-IN",
                                                                    {
                                                                        dateStyle: "medium",
                                                                        timeStyle: "short",
                                                                    }
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {activePage === "analytics" && (
                            <section className="analytics-section">
                                <div className="analytics-header">
                                    <div>
                                        <h2>Financial Analytics</h2>
                                        <p>Insights from your FinCore transaction history.</p>
                                    </div>
                                    <button
                                        className="refresh-button"
                                        type="button"
                                        onClick={loadTransactions}
                                        disabled={transactionsLoading}
                                    >
                                        {transactionsLoading ? "Refreshing..." : "Refresh Data"}
                                    </button>
                                </div>

                                {transactionsError && (
                                    <p className="error">{transactionsError}</p>
                                )}

                                <div className="analytics-grid">
                                    <div className="analytics-card">
                                        <p>Total Transferred</p>
                                        <h3>{formatCurrency(totalTransferred)}</h3>
                                        <span>Completed transfer volume</span>
                                    </div>
                                    <div className="analytics-card">
                                        <p>Total Transactions</p>
                                        <h3>{transactionCount}</h3>
                                        <span>Recorded transactions</span>
                                    </div>
                                    <div className="analytics-card">
                                        <p>Average Transfer</p>
                                        <h3>{formatCurrency(averageTransfer)}</h3>
                                        <span>Per completed transfer</span>
                                    </div>
                                    <div className="analytics-card">
                                        <p>Completion Rate</p>
                                        <h3>{successRate.toFixed(1)}%</h3>
                                        <span>Completed / total transactions</span>
                                    </div>
                                </div>

                                <div className="analytics-chart-card">
                                    <h3>Transfer Activity</h3>
                                    <p>Latest 10 completed transfers</p>
                                    {transactionsLoading ? (
                                        <p>Loading transfer activity...</p>
                                    ) : transferChartData.length === 0 ? (
                                        <p>No completed transfers to display.</p>
                                    ) : (
                                        <div className="transfer-chart">
                                            {transferChartData.map((transaction) => {
                                                const maxAmount = Math.max(
                                                    ...transferChartData.map((t) => Number(t.amount)),
                                                    1
                                                );
                                                const height =
                                                    (Number(transaction.amount) / maxAmount) * 100;

                                                return (
                                                    <div className="chart-column" key={transaction.id}>
                                                        <span className="chart-value">
                                                            {formatCurrency(transaction.amount)}
                                                        </span>
                                                        <div className="chart-bar-area">
                                                            <div
                                                                className="chart-bar"
                                                                style={{ height: `${height}%` }}
                                                                title={formatCurrency(transaction.amount)}
                                                            />
                                                        </div>
                                                        <span className="chart-label">
                                                            #{transaction.id}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Administration: create demo bank accounts */}
                        {activePage === "administration" && (
                            <section className="transfer-section">
                                <div className="transfer-panel">
                                    <h2>Account Administration</h2>
                                    <p className="transfer-subtitle">
                                        Create a new FinCore demo bank account.
                                    </p>

                                    <form onSubmit={handleCreateAccount}>
                                        <label htmlFor="newAccountName">
                                            Account Holder Name
                                        </label>
                                        <input
                                            id="newAccountName"
                                            type="text"
                                            maxLength={100}
                                            placeholder="e.g. Rahul Sharma"
                                            value={newAccountName}
                                            onChange={(e) => setNewAccountName(e.target.value)}
                                            required
                                        />

                                        <label htmlFor="initialBalance">
                                            Initial Balance (INR)
                                        </label>
                                        <input
                                            id="initialBalance"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g. 25000"
                                            value={initialBalance}
                                            onChange={(e) => setInitialBalance(e.target.value)}
                                            required
                                        />

                                        {createAccountError && (
                                            <p className="error">{createAccountError}</p>
                                        )}
                                        {createAccountMessage && (
                                            <p className="transfer-success">
                                                {createAccountMessage}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className="transfer-button"
                                            disabled={creatingAccount}
                                        >
                                            {creatingAccount
                                                ? "Creating Account..."
                                                : "Create Account"}
                                        </button>
                                    </form>
                                </div>

                                <div className="transactions-section" style={{ marginTop: "28px" }}>
                                    <div className="transactions-header">
                                        <div>
                                            <h2>Manage Existing Accounts</h2>
                                            <p>Edit names and activate or deactivate accounts without deleting transaction history.</p>
                                        </div>
                                        <button type="button" className="refresh-button" onClick={loadAccounts}>
                                            Refresh Accounts
                                        </button>
                                    </div>

                                    {editAccountMessage && (
                                        <p className="transfer-success" role="status">{editAccountMessage}</p>
                                    )}
                                    {editAccountError && (
                                        <p className="error" role="alert">{editAccountError}</p>
                                    )}

                                    {statusMessage && (
                                        <p className="transfer-success" role="status">{statusMessage}</p>
                                    )}
                                    {statusError && (
                                        <p className="error" role="alert">{statusError}</p>
                                    )}

                                    {accounts.length === 0 ? (
                                        <p>No accounts found. Create one above to get started.</p>
                                    ) : (
                                        <div className="transactions-table-wrapper">
                                            <table className="transactions-table">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Account Holder</th>
                                                        <th>Account Number</th>
                                                        <th>Balance</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {accounts.map((account) => (
                                                        <tr key={account.id}>
                                                            <td>#{account.id}</td>
                                                            <td>{account.accountHolderName}</td>
                                                            <td>{account.accountNumber}</td>
                                                            <td>{formatCurrency(account.balance)}</td>
                                                            <td>
                                                                <span style={{
                                                                    color: account.isActive ? "#15803d" : "#b91c1c",
                                                                    fontWeight: 600
                                                                }}>
                                                                    {account.isActive ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="refresh-button"
                                                                    onClick={() => beginEditAccount(account)}
                                                                    disabled={savingAccount}
                                                                >
                                                                    Edit Account
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="refresh-button"
                                                                    style={{ marginLeft: "8px" }}
                                                                    onClick={() => handleAccountStatusChange(account)}
                                                                    disabled={changingStatusId !== null || savingAccount}
                                                                >
                                                                    {changingStatusId === account.id
                                                                        ? "Updating..."
                                                                        : account.isActive ? "Deactivate" : "Activate"}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {editingAccountId !== null && (
                                        <div className="transfer-panel" style={{ marginTop: "24px" }}>
                                            <h3>Edit Account #{editingAccountId}</h3>
                                            <p className="transfer-subtitle">Only the account holder name can be changed.</p>
                                            <form onSubmit={handleUpdateAccount}>
                                                <label htmlFor="editAccountName">Account Holder Name</label>
                                                <input
                                                    id="editAccountName"
                                                    type="text"
                                                    maxLength={100}
                                                    value={editAccountName}
                                                    onChange={(e) => setEditAccountName(e.target.value)}
                                                    required
                                                />
                                                <button type="submit" className="transfer-button" disabled={savingAccount}>
                                                    {savingAccount ? "Saving Changes..." : "Save Changes"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="refresh-button"
                                                    style={{ marginTop: "12px" }}
                                                    onClick={cancelEditAccount}
                                                    disabled={savingAccount}
                                                >
                                                    Cancel
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;