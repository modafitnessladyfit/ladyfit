import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface BuyerInfo {
  name: string;
  phone: string;
  email: string;
}

const BUYER_KEY = "ladyfit-buyer";
const BUYER_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 365 dias

interface StoredBuyer {
  info: BuyerInfo;
  savedAt: number;
}

function loadBuyer(): BuyerInfo | null {
  try {
    const raw = localStorage.getItem(BUYER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBuyer>;
    if (!parsed.savedAt || !parsed.info || Date.now() - parsed.savedAt > BUYER_TTL_MS) {
      localStorage.removeItem(BUYER_KEY);
      return null;
    }
    return parsed.info;
  } catch {
    return null;
  }
}

interface BuyerCtx {
  buyer: BuyerInfo | null;
  remember: (info: BuyerInfo) => void;
  forget: () => void;
}

const BuyerContext = createContext<BuyerCtx | null>(null);

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [buyer, setBuyer] = useState<BuyerInfo | null>(null);

  useEffect(() => {
    setBuyer(loadBuyer());
  }, []);

  function remember(info: BuyerInfo) {
    setBuyer(info);
    const payload: StoredBuyer = { info, savedAt: Date.now() };
    localStorage.setItem(BUYER_KEY, JSON.stringify(payload));
  }

  function forget() {
    setBuyer(null);
    localStorage.removeItem(BUYER_KEY);
  }

  return (
    <BuyerContext.Provider value={{ buyer, remember, forget }}>{children}</BuyerContext.Provider>
  );
}

export function useBuyer() {
  const ctx = useContext(BuyerContext);
  if (!ctx) throw new Error("useBuyer must be used inside BuyerProvider");
  return ctx;
}
