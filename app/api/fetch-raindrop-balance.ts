import { fetchQuery, init } from "@airstack/node";
import { pgDb } from "../db/pg-db";

const DEGEN_CONTRACT_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
const DEGEN_RAIN_WALLET = "0x14d2f413691Bc20cD9E7d87e2a88884E45e4Ab9d";

interface AirstackTokenTransfer {
  amount: string;
  formattedAmount: number;
  blockTimestamp: string;
}

if (!process.env.AIRSTACK_API_KEY) {
  throw new Error("AIRSTACK_API_KEY is required");
}
init(process.env.AIRSTACK_API_KEY);

export interface RaindropBalance {
  remaining: number | null;
  total: number | null;
}

async function fetchTokenTransfers(addresses: string[]) {
  const query = `query MyQuery {
    TokenTransfers(
      input: {filter: {
        from: {_in: ${JSON.stringify(addresses)}},
        to: { _eq: "${DEGEN_RAIN_WALLET}" },
        tokenAddress: {_eq:"${DEGEN_CONTRACT_ADDRESS}"}
      }, blockchain: base}
    ) {
      TokenTransfer {
        amount
        formattedAmount
        blockTimestamp
      }
    }
  }`;
  const { data } = await fetchQuery(query);
  const transfers: AirstackTokenTransfer[] =
    data.TokenTransfers?.TokenTransfer || [];
  return transfers;
}

async function getAllRaindropsUsedFromDb(fid: number): Promise<number> {
  try {
    const res = await pgDb
      .selectFrom((db) =>
        db
          .selectFrom("degen_raindrop")
          .where("fromFid", "=", fid.toString())
          .select((db) => db.fn.max("value").as("value"))
          .groupBy("castHash")
          .as("udr")
      )
      .select((db) => db.fn.sum("udr.value").as("total"))
      .executeTakeFirst();
    return Number(res?.total) || 0;
  } catch (e) {
    console.error(e);
  }
  return 0;
}

async function checkBalance(addresses: string[]): Promise<number> {
  console.log("Checking balance for", addresses);
  try {
    const transfers = await fetchTokenTransfers(addresses);
    const totalBalance = transfers.reduce((acc, t) => {
      if (!t.formattedAmount) return acc;
      return acc + t.formattedAmount;
    }, 0);
    return totalBalance;
  } catch (e) {
    console.error((e as any).message);
    return 0;
  }
}

function catchAndNull(e: Error) {
  console.error(e);
  return null;
}

export async function fetchRaindropBalance({
  fid,
  addresses,
}: {
  fid: number;
  addresses: string[];
}): Promise<RaindropBalance> {
  try {
    const promises = [
      checkBalance(addresses).catch(catchAndNull),
      getAllRaindropsUsedFromDb(fid).catch(catchAndNull),
    ];
    const [totalBalance, usedBalance] = await Promise.all(promises);
    if (totalBalance == null) {
      if (usedBalance == null) {
        return { remaining: null, total: null };
      }
      return { remaining: -Math.round(usedBalance), total: null };
    }
    const totalBalanceAfterFees = Math.round(totalBalance * 0.98);
    if (usedBalance == null) {
      return { remaining: null, total: totalBalanceAfterFees };
    }
    const remaining = Math.round(totalBalanceAfterFees - (usedBalance || 0));
    return {
      remaining,
      total: totalBalanceAfterFees,
    };
  } catch (e) {
    console.error(e);
    return { remaining: null, total: null };
  }
}
