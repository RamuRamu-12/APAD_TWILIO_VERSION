import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { trackEvent } from "../../lib/analytics";
import { config } from "../../lib/config";
import {
  MOCK_ACCOUNTS,
  MOCK_CARDS,
  MOCK_TRANSACTIONS,
  getMonthIncomeTotal,
  getMonthSpendTotal,
  getSpendingByCategory,
  getTotalBankBalance,
  type PaymentCard,
} from "../../data/mockBankTransactions";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CardFace({
  card,
  holderName,
}: {
  card: PaymentCard;
  holderName: string;
}) {
  const isCredit = card.kind === "credit";
  return (
    <div className={`mc-card-face ${isCredit ? "mc-card-face--credit" : ""}`}>
      <div className="mc-card-top">
        <span className="mc-card-product">{card.productName}</span>
        <span className="mc-circles mc-circles--on-card" aria-hidden="true" />
      </div>
      <p className="mc-card-number">•••• •••• •••• {card.last4}</p>
      <div className="mc-card-bottom">
        <div>
          <span className="mc-card-label">Cardholder</span>
          <span className="mc-card-value">{holderName}</span>
        </div>
        <div>
          <span className="mc-card-label">Expires</span>
          <span className="mc-card-value">{card.expiry}</span>
        </div>
        <div>
          <span className="mc-card-label">Type</span>
          <span className="mc-card-value" style={{ textTransform: "capitalize" }}>
            {card.kind}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    trackEvent("portal_view", { userId: user?.id });
  }, [user?.id]);

  const firstName = user?.name?.split(" ")[0] || "Cardholder";
  const holderName = user?.name || "Cardholder";
  const categorySpend = getSpendingByCategory();
  const monthSpend = getMonthSpendTotal();
  const monthIncome = getMonthIncomeTotal();
  const totalBalance = getTotalBankBalance();
  const debitCard = MOCK_CARDS.find((c) => c.kind === "debit");
  const creditCard = MOCK_CARDS.find((c) => c.kind === "credit");
  const creditUsedPct =
    creditCard?.creditLimit && creditCard.amountUsed != null
      ? Math.min((creditCard.amountUsed / creditCard.creditLimit) * 100, 100)
      : 0;

  const brandName = config.appName?.includes("APAD")
    ? "Mastercard Portal"
    : config.appName || "Mastercard Portal";

  return (
    <div className="mc-bank animate-fade-in">
      <header className="mc-bank-header">
        <div className="mc-brand-row">
          <span className="mc-circles" aria-hidden="true" />
          <span className="mc-brand-name">{brandName}</span>
        </div>
        <p className="mc-bank-welcome">
          Welcome back, <strong>{firstName}</strong>
        </p>
      </header>

      <section className="mc-summary-strip" aria-label="Account summary">
        <div className="mc-summary-tile">
          <span className="mc-card-label">Total bank balance</span>
          <p className="mc-summary-value">{formatInr(totalBalance)}</p>
          <span className="mc-summary-sub">{MOCK_ACCOUNTS.length} accounts</span>
        </div>
        <div className="mc-summary-tile">
          <span className="mc-card-label">Spent this period</span>
          <p className="mc-summary-value is-spend">{formatInr(monthSpend)}</p>
          <span className="mc-summary-sub">Food, travel & daily needs</span>
        </div>
        <div className="mc-summary-tile">
          <span className="mc-card-label">Income credited</span>
          <p className="mc-summary-value is-income">{formatInr(monthIncome)}</p>
          <span className="mc-summary-sub">Salary & credits</span>
        </div>
        {creditCard && (
          <div className="mc-summary-tile">
            <span className="mc-card-label">Credit available</span>
            <p className="mc-summary-value">
              {formatInr(creditCard.availableCredit || 0)}
            </p>
            <span className="mc-summary-sub">
              Used {formatInr(creditCard.amountUsed || 0)} of{" "}
              {formatInr(creditCard.creditLimit || 0)}
            </span>
          </div>
        )}
      </section>

      <div className="mc-bank-layout mc-bank-layout--wide">
        <div className="mc-bank-col">
          <section aria-label="Your cards">
            <h2 className="mc-section-title">Your cards</h2>
            <div className="mc-cards-stack">
              {debitCard && <CardFace card={debitCard} holderName={holderName} />}
              {creditCard && <CardFace card={creditCard} holderName={holderName} />}
            </div>
          </section>

          {creditCard && (
            <section className="mc-panel mc-credit-panel" aria-label="Credit card details">
              <h2 className="mc-section-title" style={{ marginTop: 0 }}>
                Credit card details
              </h2>
              <div className="mc-credit-grid">
                <div>
                  <span className="mc-card-label">Card</span>
                  <span className="mc-card-value">{creditCard.productName}</span>
                </div>
                <div>
                  <span className="mc-card-label">Ending in</span>
                  <span className="mc-card-value">{creditCard.last4}</span>
                </div>
                <div>
                  <span className="mc-card-label">Credit limit</span>
                  <span className="mc-card-value">
                    {formatInr(creditCard.creditLimit || 0)}
                  </span>
                </div>
                <div>
                  <span className="mc-card-label">Amount used</span>
                  <span className="mc-card-value">
                    {formatInr(creditCard.amountUsed || 0)}
                  </span>
                </div>
                <div>
                  <span className="mc-card-label">Payment due</span>
                  <span className="mc-card-value">
                    {creditCard.dueDate ? formatDate(creditCard.dueDate) : "—"}
                  </span>
                </div>
                <div>
                  <span className="mc-card-label">Minimum due</span>
                  <span className="mc-card-value">
                    {formatInr(creditCard.minDue || 0)}
                  </span>
                </div>
              </div>
              <div className="mc-util-track" aria-hidden="true">
                <div className="mc-util-fill" style={{ width: `${creditUsedPct}%` }} />
              </div>
              <p className="mc-balance-hint">
                {creditUsedPct.toFixed(0)}% of limit used
              </p>
            </section>
          )}

          <section className="mc-panel" aria-label="Bank accounts">
            <h2 className="mc-section-title" style={{ marginTop: 0 }}>
              Bank accounts
            </h2>
            <ul className="mc-account-list">
              {MOCK_ACCOUNTS.map((acc) => (
                <li key={acc.id} className="mc-account-row">
                  <div>
                    <span className="mc-txn-merchant">{acc.name}</span>
                    <span className="mc-txn-meta">
                      {acc.type === "savings" ? "Savings" : "Current"} ·{" "}
                      {acc.accountNumberMasked} · IFSC {acc.ifsc}
                    </span>
                  </div>
                  <span className="mc-account-bal">{formatInr(acc.balance)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mc-bank-col">
          <section className="mc-panel" aria-label="Spending by category">
            <h2 className="mc-section-title" style={{ marginTop: 0 }}>
              Spending breakdown
            </h2>
            <p className="mc-balance-hint" style={{ marginBottom: "1.1rem" }}>
              How much you spent on food, travel, and daily needs
            </p>
            <ul className="mc-spend-list">
              {categorySpend.map((row) => (
                <li key={row.category} className="mc-spend-row">
                  <div className="mc-spend-top">
                    <span className="mc-spend-cat">{row.category}</span>
                    <span className="mc-spend-amt">{formatInr(row.amount)}</span>
                  </div>
                  <div className="mc-spend-track">
                    <div
                      className="mc-spend-fill"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mc-txn-panel" aria-label="Recent transactions">
            <div className="mc-txn-header">
              <h2>Recent transactions</h2>
              <span className="mc-txn-count">{MOCK_TRANSACTIONS.length} shown</span>
            </div>
            <ul className="mc-txn-list">
              {MOCK_TRANSACTIONS.map((txn) => (
                <li key={txn.id} className="mc-txn-row">
                  <div className="mc-txn-main">
                    <span className="mc-txn-merchant">{txn.merchant}</span>
                    <span className="mc-txn-meta">
                      {formatDate(txn.date)} · {txn.category}
                    </span>
                  </div>
                  <span
                    className={`mc-txn-amount ${
                      txn.type === "credit" ? "is-credit" : "is-debit"
                    }`}
                  >
                    {txn.type === "credit" ? "+" : "−"}
                    {formatInr(txn.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mc-bank-footer-links">
        <Link to="/profile" className="nav-btn">
          Profile
        </Link>
      </div>
    </div>
  );
}
