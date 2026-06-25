import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppData, Company, Bank, CreditCard, Transaction, CashCounts, DEFAULT_CASH_COUNTS,
  KasaEntry, KasaTransaction, KasaSettings, DEFAULT_KASA_SETTINGS,
} from './types';
import { loadData, saveData, uid } from './storage';

interface StoreCtx {
  data: AppData;
  ready: boolean;
  // Companies
  addCompany: (c: Omit<Company, 'id' | 'createdAt' | 'balance'> & { balance?: number }) => Promise<void>;
  updateCompany: (id: string, patch: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  // Banks
  addBank: (b: Omit<Bank, 'id' | 'createdAt'>) => Promise<void>;
  updateBank: (id: string, patch: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  // Cards
  addCard: (c: Omit<CreditCard, 'id' | 'createdAt' | 'used'> & { used?: number }) => Promise<void>;
  updateCard: (id: string, patch: Partial<CreditCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  // Transactions
  addCompanyPurchase: (companyId: string, amount: number, note?: string) => Promise<void>;
  addCashPayment: (companyId: string, amount: number, note?: string) => Promise<void>;
  addCardPayment: (companyId: string, cardId: string, amount: number, note?: string) => Promise<void>;
  addCardSpend: (cardId: string, amount: number, note?: string) => Promise<void>;
  addBankPayCard: (bankId: string, cardId: string, amount: number, note?: string) => Promise<void>;
  addBankDeposit: (bankId: string, amount: number, note?: string) => Promise<void>;
  addBankWithdraw: (bankId: string, amount: number, note?: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Cash counts (Evde)
  updateCashCount: (key: keyof CashCounts, value: number) => Promise<void>;
  setCashCounts: (c: CashCounts) => Promise<void>;
  // Kasa
  addKasaEntry: (name: string) => Promise<void>;
  updateKasaEntry: (id: string, patch: Partial<KasaEntry>) => Promise<void>;
  deleteKasaEntry: (id: string) => Promise<void>;
  addKasaTransaction: (tx: Omit<KasaTransaction, 'id' | 'date'>) => Promise<void>;
  deleteKasaTransaction: (id: string) => Promise<void>;
  updateKasaSettings: (patch: Partial<KasaSettings>) => Promise<void>;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    companies: [], banks: [], cards: [], transactions: [],
    cashCounts: { ...DEFAULT_CASH_COUNTS },
    kasaEntries: [], kasaTransactions: [],
    kasaSettings: { ...DEFAULT_KASA_SETTINGS },
  });
  const [ready, setReady] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await loadData();
        setData(d);
      } catch (e) {
        console.warn('[StoreProvider] load error', e);
      }
    })();
  }, []);

  const persist = useCallback(async (next: AppData) => {
    setData(next);
    await saveData(next);
  }, []);

  // ---------- Companies ----------
  const addCompany: StoreCtx['addCompany'] = async (c) => {
    const company: Company = {
      id: uid(),
      name: c.name,
      type: c.type,
      balance: c.balance ?? 0,
      phone: c.phone,
      note: c.note,
      createdAt: new Date().toISOString(),
    };
    await persist({ ...data, companies: [...data.companies, company] });
  };
  const updateCompany: StoreCtx['updateCompany'] = async (id, patch) => {
    await persist({
      ...data,
      companies: data.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };
  const deleteCompany: StoreCtx['deleteCompany'] = async (id) => {
    await persist({
      ...data,
      companies: data.companies.filter((c) => c.id !== id),
      transactions: data.transactions.filter((t) => t.companyId !== id),
    });
  };

  // ---------- Banks ----------
  const addBank: StoreCtx['addBank'] = async (b) => {
    const bank: Bank = { id: uid(), createdAt: new Date().toISOString(), ...b };
    await persist({ ...data, banks: [...data.banks, bank] });
  };
  const updateBank: StoreCtx['updateBank'] = async (id, patch) => {
    await persist({
      ...data,
      banks: data.banks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };
  const deleteBank: StoreCtx['deleteBank'] = async (id) => {
    await persist({
      ...data,
      banks: data.banks.filter((b) => b.id !== id),
      transactions: data.transactions.filter((t) => t.bankId !== id),
    });
  };

  // ---------- Cards ----------
  const addCard: StoreCtx['addCard'] = async (c) => {
    const card: CreditCard = {
      id: uid(),
      createdAt: new Date().toISOString(),
      used: c.used ?? 0,
      ...c,
    } as CreditCard;
    await persist({ ...data, cards: [...data.cards, card] });
  };
  const updateCard: StoreCtx['updateCard'] = async (id, patch) => {
    await persist({
      ...data,
      cards: data.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };
  const deleteCard: StoreCtx['deleteCard'] = async (id) => {
    await persist({
      ...data,
      cards: data.cards.filter((c) => c.id !== id),
      transactions: data.transactions.filter((t) => t.cardId !== id),
    });
  };

  // ---------- Transactions ----------
  const pushTx = (next: AppData, tx: Transaction): AppData => ({
    ...next,
    transactions: [tx, ...next.transactions],
  });

  const addCompanyPurchase: StoreCtx['addCompanyPurchase'] = async (companyId, amount, note) => {
    let next = { ...data };
    next.companies = next.companies.map((c) =>
      c.id === companyId ? { ...c, balance: c.balance + amount } : c
    );
    next = pushTx(next, {
      id: uid(), type: 'company_purchase', amount, date: new Date().toISOString(), companyId, note,
    });
    await persist(next);
  };

  const addCashPayment: StoreCtx['addCashPayment'] = async (companyId, amount, note) => {
    let next = { ...data };
    next.companies = next.companies.map((c) =>
      c.id === companyId ? { ...c, balance: c.balance - amount } : c
    );
    next = pushTx(next, {
      id: uid(), type: 'cash_payment', amount, date: new Date().toISOString(), companyId, note,
    });
    await persist(next);
  };

  const addCardPayment: StoreCtx['addCardPayment'] = async (companyId, cardId, amount, note) => {
    let next = { ...data };
    next.companies = next.companies.map((c) =>
      c.id === companyId ? { ...c, balance: c.balance - amount } : c
    );
    next.cards = next.cards.map((c) =>
      c.id === cardId ? { ...c, used: c.used + amount } : c
    );
    next = pushTx(next, {
      id: uid(), type: 'card_payment', amount, date: new Date().toISOString(), companyId, cardId, note,
    });
    await persist(next);
  };

  const addCardSpend: StoreCtx['addCardSpend'] = async (cardId, amount, note) => {
    let next = { ...data };
    next.cards = next.cards.map((c) =>
      c.id === cardId ? { ...c, used: c.used + amount } : c
    );
    next = pushTx(next, {
      id: uid(), type: 'card_spend', amount, date: new Date().toISOString(), cardId, note,
    });
    await persist(next);
  };

  const addBankPayCard: StoreCtx['addBankPayCard'] = async (bankId, cardId, amount, note) => {
    let next = { ...data };
    next.banks = next.banks.map((b) =>
      b.id === bankId ? { ...b, balance: b.balance - amount } : b
    );
    next.cards = next.cards.map((c) =>
      c.id === cardId ? { ...c, used: Math.max(0, c.used - amount) } : c
    );
    next = pushTx(next, {
      id: uid(), type: 'bank_pay_card', amount, date: new Date().toISOString(), bankId, cardId, note,
    });
    await persist(next);
  };

  const addBankDeposit: StoreCtx['addBankDeposit'] = async (bankId, amount, note) => {
    let next = { ...data };
    next.banks = next.banks.map((b) =>
      b.id === bankId ? { ...b, balance: b.balance + amount } : b
    );
    next = pushTx(next, {
      id: uid(), type: 'bank_deposit', amount, date: new Date().toISOString(), bankId, note,
    });
    await persist(next);
  };

  const addBankWithdraw: StoreCtx['addBankWithdraw'] = async (bankId, amount, note) => {
    let next = { ...data };
    next.banks = next.banks.map((b) =>
      b.id === bankId ? { ...b, balance: b.balance - amount } : b
    );
    next = pushTx(next, {
      id: uid(), type: 'bank_withdraw', amount, date: new Date().toISOString(), bankId, note,
    });
    await persist(next);
  };

  const deleteTransaction: StoreCtx['deleteTransaction'] = async (id) => {
    const tx = data.transactions.find((t) => t.id === id);
    if (!tx) return;
    let next = { ...data };
    // reverse the effects
    switch (tx.type) {
      case 'company_purchase':
        next.companies = next.companies.map((c) =>
          c.id === tx.companyId ? { ...c, balance: c.balance - tx.amount } : c
        );
        break;
      case 'cash_payment':
        next.companies = next.companies.map((c) =>
          c.id === tx.companyId ? { ...c, balance: c.balance + tx.amount } : c
        );
        break;
      case 'card_payment':
        next.companies = next.companies.map((c) =>
          c.id === tx.companyId ? { ...c, balance: c.balance + tx.amount } : c
        );
        next.cards = next.cards.map((c) =>
          c.id === tx.cardId ? { ...c, used: Math.max(0, c.used - tx.amount) } : c
        );
        break;
      case 'card_spend':
        next.cards = next.cards.map((c) =>
          c.id === tx.cardId ? { ...c, used: Math.max(0, c.used - tx.amount) } : c
        );
        break;
      case 'bank_pay_card':
        next.banks = next.banks.map((b) =>
          b.id === tx.bankId ? { ...b, balance: b.balance + tx.amount } : b
        );
        next.cards = next.cards.map((c) =>
          c.id === tx.cardId ? { ...c, used: c.used + tx.amount } : c
        );
        break;
      case 'bank_deposit':
        next.banks = next.banks.map((b) =>
          b.id === tx.bankId ? { ...b, balance: b.balance - tx.amount } : b
        );
        break;
      case 'bank_withdraw':
        next.banks = next.banks.map((b) =>
          b.id === tx.bankId ? { ...b, balance: b.balance + tx.amount } : b
        );
        break;
    }
    next.transactions = next.transactions.filter((t) => t.id !== id);
    await persist(next);
  };

  const resetAll: StoreCtx['resetAll'] = async () => {
    await persist({
      companies: [], banks: [], cards: [], transactions: [],
      cashCounts: { ...DEFAULT_CASH_COUNTS },
      kasaEntries: [], kasaTransactions: [],
      kasaSettings: { ...DEFAULT_KASA_SETTINGS },
    });
  };

  const updateCashCount: StoreCtx['updateCashCount'] = async (key, value) => {
    const safe = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    await persist({
      ...data,
      cashCounts: { ...(data.cashCounts || DEFAULT_CASH_COUNTS), [key]: safe },
    });
  };

  const setCashCounts: StoreCtx['setCashCounts'] = async (c) => {
    await persist({ ...data, cashCounts: { ...c } });
  };

  // ---------- Kasa ----------
  const addKasaEntry: StoreCtx['addKasaEntry'] = async (name) => {
    const entry: KasaEntry = {
      id: uid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    await persist({ ...data, kasaEntries: [...(data.kasaEntries || []), entry] });
  };
  const updateKasaEntry: StoreCtx['updateKasaEntry'] = async (id, patch) => {
    await persist({
      ...data,
      kasaEntries: (data.kasaEntries || []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };
  const deleteKasaEntry: StoreCtx['deleteKasaEntry'] = async (id) => {
    await persist({
      ...data,
      kasaEntries: (data.kasaEntries || []).filter((e) => e.id !== id),
      kasaTransactions: (data.kasaTransactions || []).filter((t) => t.entryId !== id),
    });
  };
  const addKasaTransaction: StoreCtx['addKasaTransaction'] = async (tx) => {
    const newTx: KasaTransaction = {
      id: uid(),
      date: new Date().toISOString(),
      ...tx,
    };
    await persist({
      ...data,
      kasaTransactions: [newTx, ...(data.kasaTransactions || [])],
    });
  };
  const deleteKasaTransaction: StoreCtx['deleteKasaTransaction'] = async (id) => {
    await persist({
      ...data,
      kasaTransactions: (data.kasaTransactions || []).filter((t) => t.id !== id),
    });
  };
  const updateKasaSettings: StoreCtx['updateKasaSettings'] = async (patch) => {
    await persist({
      ...data,
      kasaSettings: { ...(data.kasaSettings || DEFAULT_KASA_SETTINGS), ...patch },
    });
  };

  return (
    <Ctx.Provider
      value={{
        data, ready,
        addCompany, updateCompany, deleteCompany,
        addBank, updateBank, deleteBank,
        addCard, updateCard, deleteCard,
        addCompanyPurchase, addCashPayment, addCardPayment, addCardSpend,
        addBankPayCard, addBankDeposit, addBankWithdraw,
        deleteTransaction,
        updateCashCount, setCashCounts,
        addKasaEntry, updateKasaEntry, deleteKasaEntry,
        addKasaTransaction, deleteKasaTransaction, updateKasaSettings,
        resetAll,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
