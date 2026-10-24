import type { FinanceSettings } from './types';

export type LoanInput = {
  downPct?: number;
  termMonths?: number;
  balloonPct?: number;
  rate?: number;
};

export type LoanResult = {
  price: number;
  down: number;
  balloon: number;
  loan: number;
  term: number;
  rate: number;
  monthly: number;
  principal: number;
  cost: number;
  total: number;
};

/**
 * Annuity loan with optional balloon (loppuerä).
 * Loan = price − down payment + opening fee. Monthly = annuity + monthly handling fee.
 */
export function monthlyPayment(price: number, f: FinanceSettings, input: LoanInput = {}): LoanResult {
  const downPct = input.downPct ?? f.defaultDownPct;
  const term = input.termMonths ?? f.defaultTermMonths;
  const balloonPct = input.balloonPct ?? 0;
  const rate = input.rate ?? f.interestRate;

  const down = (price * downPct) / 100;
  const balloon = (price * balloonPct) / 100;
  const loan = Math.max(0, price - down + f.openingFee);
  const r = rate / 100 / 12;
  const n = Math.max(1, term);

  const annuity = r === 0
    ? (loan - balloon) / n
    : ((loan - balloon / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n));

  const monthly = Math.max(0, annuity) + f.monthlyFee;
  const interest = annuity * n + balloon - loan;
  const cost = interest + f.openingFee + f.monthlyFee * n;
  const total = down + monthly * n + balloon;
  const principal = loan - f.openingFee - balloon;

  return { price, down, balloon, loan, term: n, rate, monthly, principal, cost, total };
}
