import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AVAILABLE_TOKENS } from "../config/supportedTokens";
// -----------------------------------------------------------------------------
// Token configuration (user-provided)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface TokenData {
  tokenId: string;
  symbol: string;
  name: string;
  priceUsd: number;
  decimals: number;
  thumb: string;
  large: string;
}

// -----------------------------------------------------------------------------
// Helpers – fetch prices from Pyth and SaucerSwap
// -----------------------------------------------------------------------------
import { PriceServiceConnection } from "@pythnetwork/price-service-client";

async function fetchPythToken(): Promise<TokenData> {
  console.log("fetsh pyth");
  const priceId =
    "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd"; // HBAR/USD
  const conn = new PriceServiceConnection("https://hermes.pyth.network");

  const feeds = await conn.getLatestPriceFeeds([priceId]);
  if (!feeds || feeds.length === 0) {
    throw new Error("Brak danych z Pyth API dla podanego priceId");
  }
  const [feed] = feeds;
  const p = feed?.getPriceNoOlderThan(60);
  if (!p) throw new Error("HBAR price too old or missing");

  const def = AVAILABLE_TOKENS.find((t) => t.name === "HBAR")!;
  console.log(def);
  return {
    tokenId: def.address,
    symbol: def.name,
    name: def.name,
    priceUsd: Number(p.price) * Math.pow(10, p.expo),
    decimals: def.decimals,
    thumb: def.thumb,
    large: def.large,
  };
}

async function fetchSaucerTokens(): Promise<TokenData[]> {
  console.log("fetsh sauce");

  const res = await fetch("https://api.saucerswap.finance/tokens/known", {
    headers: {
      "x-api-key": "875e1017-87b8-4b12-8301-6aa1f1aa073b",
      Accept: "application/json",
    },
  });
  let list: any[] = (await res.json()) || [];
  //const list: any[] = [];
  console.log("sauce fethed");
  console.log(list);
  if (list.length < 1) list = [];
  const supportedAddresses = AVAILABLE_TOKENS.map((t) => t.name).filter(
    (name) => name !== "HBAR"
  );
  console.log(supportedAddresses);
  const matched = list.filter((token) =>
    supportedAddresses.includes(token.symbol)
  );
  console.log(matched);
  return matched.map((token) => {
    const def = AVAILABLE_TOKENS.find((t) => t.name === token.symbol)!;
    console.log();
    return {
      tokenId: def.address,
      symbol: def.name,
      name: def.name,
      priceUsd: token.priceUsd,
      decimals: def.decimals,
      thumb: def.thumb,
      large: def.large,
    };
  });
}

// -----------------------------------------------------------------------------
// Context logic
// -----------------------------------------------------------------------------
interface TokenContextType {
  tokens: Record<string, TokenData>;
}

const TokensContext = createContext<TokenContextType>({ tokens: {} });

export const TokensProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = async () => {
    try {
      const [hbar, saucerTokens] = await Promise.all([
        fetchPythToken(),
        fetchSaucerTokens(),
      ]);
      const merged = [hbar, ...saucerTokens];

      const map: Record<string, TokenData> = {};
      for (const t of merged) map[t.tokenId] = t;
      console.log("FETCHED");
      console.log(map);
      setTokens(map);
    } catch (e) {
      console.error("Failed to fetch token data", e);
    }
  };

  useEffect(() => {
    console.log("firstFetsh");
    fetchAll();
    timer.current = setInterval(fetchAll, 60_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ tokens }), [tokens]);

  return (
    <TokensContext.Provider value={value}>{children}</TokensContext.Provider>
  );
};
export function useRewardShares(
  tokenId: string,
  amount: bigint,
  duration: bigint,
  boostAmt: bigint = 0n
): bigint {
  console.log("new reward shares");
  const tokens = useTokens();
  return useMemo(() => {
    console.log(tokenId);
    console.log(tokens);
    const token = tokens[tokenId];
    console.log("before");
    if (!token) return 0n;
    console.log("after");
    const rewardPerShare = calculateRewardShares(
      token,
      amount,
      duration,
      boostAmt
    );
    console.log("reward per share");
    console.log(rewardPerShare);
    return rewardPerShare;
  }, [
    tokens,
    tokenId,
    amount.toString(),
    duration.toString(),
    boostAmt.toString(),
  ]);
}

export function calculateRewardShares(
  token: TokenData,
  amount: bigint,
  duration: bigint,
  boostAmt: bigint = 0n
): bigint {
  // 1) wartość stake'a w USD (uint‑like) – bez ułamków powyżej centa
  console.log(token.priceUsd);
  const priceMicroUsd = BigInt(Math.round(token.priceUsd * 1e6)); // 153 283n
  console.log(priceMicroUsd);
  const divisor = 10n ** BigInt(token.decimals); // exact 10^dec
  console.log(divisor);
  console.log(amount);
  // amount is already a BigInt (raw smallest-unit amount)
  const usdValueTimes1e6 =
    (amount * priceMicroUsd) / BigInt(1e4 * 10 ** token.decimals);
  console.log(usdValueTimes1e6);
  if (usdValueTimes1e6 < 100n) {
    // < 1 USD
    return 0n;
  }
  console.log(duration);
  // 2) rewardShares = USD × czas (sek)
  let shares = (usdValueTimes1e6 * duration) / BigInt(1e6);

  // 3) boost – identyczny algorytm co on‑chain
  if (boostAmt >= 100_000_000n) {
    const boost = Math.min(
      Math.floor(Math.log2(Number(boostAmt / 100_000_000n))),
      25
    );
    shares = (shares * BigInt(100 + boost)) / 100n;
  }
  return shares;
}
export function useTokens() {
  return useContext(TokensContext).tokens;
}

/** Zwraca wartość `amount` danego tokena w USD (≈ centy dokładność) */
export function getTokenUsdValue(token: TokenData, amount: bigint): number {
  if (!token) return 0;
  // przelicz na jednostki „ludzkie” (np. 8 dec → /10^8)
  const readable = Number(amount) / 10 ** token.decimals;
  return readable * token.priceUsd;
}

/** React-hook: automatycznie przelicza, gdy zmieni się cena lub amount */
export function useTokenUsdValue(tokenId: string, amount: bigint): number {
  const tokens = useTokens();
  return useMemo(() => {
    const token = tokens[tokenId];
    return getTokenUsdValue(token, amount);
    // zależności – aktualizuj, gdy zmieni się cena lub amount
  }, [tokens, tokenId, amount.toString()]);
}
