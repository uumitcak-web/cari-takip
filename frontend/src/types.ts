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

export interface AppData {
  companies: Company[];
  banks: Bank[];
  cards: CreditCard[];
  transactions: Transaction[];
}
