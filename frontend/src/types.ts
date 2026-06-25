export type CompanyType = 'supplier' | 'customer';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  // Pozitif: bizim onlara borcumuz, Negatif: onların bize borcu
  balance: number;
  phone?: string;
  note?: string;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  accountName?: string;
  balance: number;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bankName: string;
  limit: number;
  used: number;
  statementDay: number; // 1-31 hesap kesim günü
  dueDayOffset: number; // hesap kesiminden kaç gün sonra son ödeme
  color?: string;
  createdAt: string;
}

export type TransactionType =
  | 'company_purchase' // şirketten ürün aldık -> borç arttı
  | 'cash_payment' // şirkete elden ödeme -> borç azaldı
  | 'card_payment' // şirkete kartla ödeme -> şirket borcu azaldı + kart kullanımı arttı
  | 'card_spend' // bireysel kart harcaması -> kart kullanımı arttı
  | 'bank_pay_card' // banka hesabından kart ödemesi -> banka azaldı + kart kullanımı azaldı
  | 'bank_deposit' // banka hesabına para ekle
  | 'bank_withdraw'; // banka hesabından para çek

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  companyId?: string;
  cardId?: string;
  bankId?: string;
}

export interface CashCounts {
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  d5: number;
}

export const DEFAULT_CASH_COUNTS: CashCounts = {
  d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, d5: 0,
};

export function cashTotal(c: CashCounts): number {
  return (
    (c.d200 || 0) * 200 +
    (c.d100 || 0) * 100 +
    (c.d50 || 0) * 50 +
    (c.d20 || 0) * 20 +
    (c.d10 || 0) * 10 +
    (c.d5 || 0) * 5
  );
}

// ---------- Kasa (POS) ----------
export interface KasaEntry {
  id: string;
  name: string;
  createdAt: string;
}

export interface KasaTransaction {
  id: string;
  entryId: string;
  date: string;
  note?: string;
  tutar: number;              // Nakit kısmı
  pos: number;                // POS kısmı
  commissionRatePct: number;  // % (örn 1.99)
  taxRatePct: number;         // % (örn 5)
}

export interface KasaSettings {
  defaultCommissionPct: number; // %
  defaultTaxPct: number;        // %
}

export const DEFAULT_KASA_SETTINGS: KasaSettings = {
  defaultCommissionPct: 1.99,
  defaultTaxPct: 5,
};

export interface KasaCalc {
  commission: number;
  tax: number;
  net: number;
  gross: number;
}

export function calcKasa(tx: {
  tutar: number; pos: number; commissionRatePct: number; taxRatePct: number;
}): KasaCalc {
  const commission = (tx.pos || 0) * ((tx.commissionRatePct || 0) / 100);
  const tax = commission * ((tx.taxRatePct || 0) / 100);
  const gross = (tx.tutar || 0) + (tx.pos || 0);
  const net = gross - commission - tax;
  return { commission, tax, net, gross };
}

export interface AppData {
  companies: Company[];
  banks: Bank[];
  cards: CreditCard[];
  transactions: Transaction[];
  cashCounts: CashCounts;
  kasaEntries: KasaEntry[];
  kasaTransactions: KasaTransaction[];
  kasaSettings: KasaSettings;
}
