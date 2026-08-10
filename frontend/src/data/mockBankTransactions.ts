export type BankTransaction = {
  id: string;
  date: string;
  merchant: string;
  category: SpendCategory | "Income" | "Refund";
  amount: number;
  type: "debit" | "credit";
};

export type SpendCategory =
  | "Food & Drink"
  | "Groceries"
  | "Transport"
  | "Shopping"
  | "Utilities"
  | "Entertainment"
  | "Healthcare"
  | "Travel";

export type BankAccount = {
  id: string;
  name: string;
  type: "savings" | "current";
  accountNumberMasked: string;
  ifsc: string;
  balance: number;
};

export type PaymentCard = {
  id: string;
  brand: "Mastercard";
  productName: string;
  kind: "debit" | "credit";
  last4: string;
  expiry: string;
  holderName?: string;
  /** Credit only */
  creditLimit?: number;
  amountUsed?: number;
  availableCredit?: number;
  dueDate?: string;
  minDue?: number;
};

export const MOCK_ACCOUNTS: BankAccount[] = [
  {
    id: "acc-current",
    name: "Everyday Current",
    type: "current",
    accountNumberMasked: "XXXXXX4421",
    ifsc: "MCBK0001234",
    balance: 128450.75,
  },
  {
    id: "acc-savings",
    name: "Goal Savings",
    type: "savings",
    accountNumberMasked: "XXXXXX8890",
    ifsc: "MCBK0001234",
    balance: 245000.0,
  },
];

export const MOCK_CARDS: PaymentCard[] = [
  {
    id: "card-debit",
    brand: "Mastercard",
    productName: "Mastercard Debit",
    kind: "debit",
    last4: "4421",
    expiry: "08/28",
  },
  {
    id: "card-credit",
    brand: "Mastercard",
    productName: "Mastercard Platinum Credit",
    kind: "credit",
    last4: "9012",
    expiry: "11/27",
    creditLimit: 200000,
    amountUsed: 47280.5,
    availableCredit: 152719.5,
    dueDate: "2026-08-22",
    minDue: 2364.0,
  },
];

export const MOCK_TRANSACTIONS: BankTransaction[] = [
  {
    id: "txn-1",
    date: "2026-08-08",
    merchant: "Uber Trip",
    category: "Transport",
    amount: 342.0,
    type: "debit",
  },
  {
    id: "txn-2",
    date: "2026-08-07",
    merchant: "Salary Credit",
    category: "Income",
    amount: 85000.0,
    type: "credit",
  },
  {
    id: "txn-3",
    date: "2026-08-07",
    merchant: "Amazon.in",
    category: "Shopping",
    amount: 2199.0,
    type: "debit",
  },
  {
    id: "txn-4",
    date: "2026-08-06",
    merchant: "Starbucks",
    category: "Food & Drink",
    amount: 485.5,
    type: "debit",
  },
  {
    id: "txn-5",
    date: "2026-08-05",
    merchant: "Electricity Bill",
    category: "Utilities",
    amount: 1875.0,
    type: "debit",
  },
  {
    id: "txn-6",
    date: "2026-08-04",
    merchant: "UPI Refund",
    category: "Refund",
    amount: 650.0,
    type: "credit",
  },
  {
    id: "txn-7",
    date: "2026-08-03",
    merchant: "Netflix",
    category: "Entertainment",
    amount: 649.0,
    type: "debit",
  },
  {
    id: "txn-8",
    date: "2026-08-02",
    merchant: "BigBasket",
    category: "Groceries",
    amount: 3240.25,
    type: "debit",
  },
  {
    id: "txn-9",
    date: "2026-08-02",
    merchant: "Swiggy",
    category: "Food & Drink",
    amount: 612.0,
    type: "debit",
  },
  {
    id: "txn-10",
    date: "2026-08-01",
    merchant: "IRCTC Mumbai Trip",
    category: "Travel",
    amount: 2450.0,
    type: "debit",
  },
  {
    id: "txn-11",
    date: "2026-07-31",
    merchant: "Apollo Pharmacy",
    category: "Healthcare",
    amount: 890.0,
    type: "debit",
  },
  {
    id: "txn-12",
    date: "2026-07-30",
    merchant: "Metro Card Top-up",
    category: "Transport",
    amount: 500.0,
    type: "debit",
  },
  {
    id: "txn-13",
    date: "2026-07-29",
    merchant: "Zomato",
    category: "Food & Drink",
    amount: 378.0,
    type: "debit",
  },
  {
    id: "txn-14",
    date: "2026-07-28",
    merchant: "Reliance Fresh",
    category: "Groceries",
    amount: 1560.0,
    type: "debit",
  },
];

const SPEND_ORDER: SpendCategory[] = [
  "Food & Drink",
  "Groceries",
  "Transport",
  "Travel",
  "Shopping",
  "Utilities",
  "Entertainment",
  "Healthcare",
];

export type CategorySpend = {
  category: SpendCategory;
  amount: number;
  pct: number;
};

export function getSpendingByCategory(
  transactions: BankTransaction[] = MOCK_TRANSACTIONS
): CategorySpend[] {
  const totals = new Map<SpendCategory, number>();
  for (const txn of transactions) {
    if (txn.type !== "debit") continue;
    if (!SPEND_ORDER.includes(txn.category as SpendCategory)) continue;
    const cat = txn.category as SpendCategory;
    totals.set(cat, (totals.get(cat) || 0) + txn.amount);
  }
  const rows = SPEND_ORDER.filter((c) => (totals.get(c) || 0) > 0).map((category) => ({
    category,
    amount: totals.get(category) || 0,
    pct: 0,
  }));
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return rows
    .map((r) => ({ ...r, pct: (r.amount / max) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthSpendTotal(transactions: BankTransaction[] = MOCK_TRANSACTIONS) {
  return transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthIncomeTotal(transactions: BankTransaction[] = MOCK_TRANSACTIONS) {
  return transactions
    .filter((t) => t.type === "credit" && t.category === "Income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalBankBalance(accounts: BankAccount[] = MOCK_ACCOUNTS) {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}
