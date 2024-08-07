import { pgDb } from "../../db/pg-db";
import { fetchAllowanceFromDownshift } from "../fetch-allowance-from-downshift";
import {
  RaindropBalance,
  fetchRaindropBalance,
} from "../fetch-raindrop-balance";
import { fetchAllowanceFromEdit } from "./fetch-allowance-from-edit";
import { DailyTip, fetchAllDailyTips } from "./fetch-tips";
import { getDailyAllowanceStart } from "./utils";

const API_BASE_URL = "https://www.degen.tips";

type DegenResponse<T extends BaseDegenResponseItem> = T[];

interface BaseDegenResponseItem {
  display_name: string;
}
interface PointsDegenResponseItem extends BaseDegenResponseItem {
  points: string;
}
interface TipAllowanceDegenResponseItem extends BaseDegenResponseItem {
  tip_allowance: string;
  remaining_allowance: string;
  user_rank: string;
}

type DegenApi<T extends BaseDegenResponseItem> = {
  path: string;
  full?: boolean;
  fetchByFid?: boolean;
};
type PointsDegenApi = DegenApi<PointsDegenResponseItem>;
type TipAllowanceDegenApi = DegenApi<TipAllowanceDegenResponseItem>;

const pointsApi: PointsDegenApi = {
  path: "https://api.degen.tips/airdrop2/current/points",
  full: true,
};
const tipAllowanceApi: TipAllowanceDegenApi = {
  path: "/api/airdrop2/tip-allowance",
  fetchByFid: true,
};
const liquidityMiningApi: PointsDegenApi = {
  path: "https://api.degen.tips/liquidity-mining/current/points",
  full: true,
};

function getApiBasePath(api: DegenApi<any>) {
  return api.full ? api.path : `${API_BASE_URL}${api.path}`;
}

async function fetchDegenData<T extends BaseDegenResponseItem>(
  api: DegenApi<T>,
  fid: number,
  walletAddresses: string[]
): Promise<DegenResponse<T>[]> {
  console.log("fetchDegenData", getApiBasePath(api));
  const allFetches = api.fetchByFid
    ? [fetch(`${getApiBasePath(api)}?fid=${fid}`).then((res) => res.json())]
    : walletAddresses.map((walletAddress) =>
        fetch(
          `${getApiBasePath(api)}?${
            api.full ? "wallet" : "address"
          }=${walletAddress}`
        ).then((res) => res.json())
      );
  return Promise.all(allFetches);
}

export interface DegenAllowanceStats {
  minRank: number;
  tipAllowance: number;
  remainingAllowance: number;
}

export interface DegenStats extends DegenAllowanceStats {
  points: number;
  pointsLiquidityMining: number;
  raindropBalance?: RaindropBalance;
}

function combinePoints(
  responses: DegenResponse<PointsDegenResponseItem>[] | undefined
): number {
  return (responses || []).reduce((acc, curr) => {
    if (curr[0]) {
      return acc + parseInt(curr[0].points);
    }
    return acc;
  }, 0);
}

async function getAllTipsFromApi(fid: number): Promise<number> {
  try {
    const start = Date.now();
    const dailyTips = await fetchAllDailyTips(fid);
    console.log(`Time for fetchAllDailyTips: ${Date.now() - start}ms`);
    return dailyTips.reduce((acc, curr) => acc + curr.value, 0);
  } catch (e) {
    console.error(e);
  }
  return 0;
}

async function getAllTipsFromDb(fid: number): Promise<number> {
  try {
    const from = getDailyAllowanceStart();
    const res = await pgDb
      .selectFrom((db) =>
        db
          .selectFrom("degen_tip")
          .where("fromFid", "=", fid.toString())
          .where("castTimestamp", ">=", from)
          .select((db) => db.fn.max("value").as("value"))
          .groupBy("castHash")
          .as("udt")
      )
      .select((db) => db.fn.sum("udt.value").as("total"))
      .executeTakeFirst();
    return Number(res?.total) || 0;
  } catch (e) {
    console.error(e);
  }
  return 0;
}

function getValidTips(tips: DailyTip[], tipAllowance: number) {
  return [...tips]
    .sort((a, b) => a.timestamp - b.timestamp)
    .reduce((acc, tip) => {
      if (acc + tip.value > tipAllowance) {
        return acc;
      }
      acc += tip.value;
      return acc;
    }, 0);
}

function combineTipAllowance(
  responses: DegenResponse<TipAllowanceDegenResponseItem>[]
): DegenAllowanceStats {
  return responses.reduce(
    (acc, curr) => {
      if (curr[0]) {
        acc.tipAllowance += parseInt(curr[0].tip_allowance);
        acc.remainingAllowance += parseInt(curr[0].remaining_allowance);
        const rank = parseInt(curr[0].user_rank);
        acc.minRank = acc.minRank === -1 ? rank : Math.min(acc.minRank, rank);
      }
      return acc;
    },
    { tipAllowance: 0, remainingAllowance: 0, minRank: -1 }
  );
}

function getRemainingAllowance(
  stats: DegenAllowanceStats,
  validTips: number
): number {
  // return Math.min(stats.remainingAllowance, Math.max(0, stats.tipAllowance - validTips));
  // return Math.max(0, stats.tipAllowance - validTips);
  return stats.tipAllowance - validTips;
}

const getAllTips =
  process.env.TIPS_DATASOURCE === "db" ? getAllTipsFromDb : getAllTipsFromApi;

// const getAllowanceData;

async function getAllowanceDataFromOfficialApi(fid: number) {
  const [tipAllowanceRes, dailyTips] = await Promise.all([
    fetchDegenData(tipAllowanceApi, fid, []),
    getAllTips(fid),
  ]);
  const res = combineTipAllowance(
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  );
  const remainingAllowance = getRemainingAllowance(res, dailyTips);
  return { ...res, remainingAllowance };
}

const defaultAllowanceData: DegenAllowanceStats = {
  tipAllowance: 0,
  remainingAllowance: 0,
  minRank: -1,
};

async function getAllowanceDataFromEdit(fid: number) {
  const tipAllowanceRes = await fetchAllowanceFromEdit(fid);
  return tipAllowanceRes
    ? {
        tipAllowance: tipAllowanceRes.tip_allowance
          ? parseInt(tipAllowanceRes.tip_allowance, 10)
          : 0,
        remainingAllowance: tipAllowanceRes.remaining_allowance
          ? parseInt(tipAllowanceRes.remaining_allowance, 10)
          : 0,
        minRank: tipAllowanceRes.user_rank
          ? parseInt(tipAllowanceRes.user_rank, 10)
          : -1,
      }
    : defaultAllowanceData;
}

async function getAllowanceDataFromDownshift(fid: number) {
  const tipAllowanceRes = await fetchAllowanceFromDownshift(fid);
  return tipAllowanceRes
    ? {
        tipAllowance: tipAllowanceRes.allowance,
        remainingAllowance: tipAllowanceRes.remainingAllowance,
        minRank: tipAllowanceRes.userRank ?? -1,
      }
    : defaultAllowanceData;
}

async function safeGetAllowanceData(
  fid: number,
  fn: (fid: number) => Promise<DegenAllowanceStats>
): Promise<DegenAllowanceStats> {
  try {
    return await fn(fid);
  } catch (e) {
    console.error(e);
    return defaultAllowanceData;
  }
}

const getAllowanceData = getAllowanceDataFromDownshift;

export async function fetchDegenAllowanceStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenAllowanceStats> {
  return await getAllowanceData(fid);
}

export async function fetchDegenStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenStats> {
  const allApiFetches = [pointsApi, liquidityMiningApi].map(async (api) =>
    fetchDegenData(api, fid, walletAddresses)
  );
  const [pointsRes, liquidityMiningRes, allowanceRes] = await Promise.all([
    ...allApiFetches,
    getAllowanceData(fid),
    // fetchRaindropBalance({ fid, addresses: walletAddresses }),
  ]);
  const points = combinePoints(
    pointsRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const pointsLiquidityMining = combinePoints(
    liquidityMiningRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  return {
    ...(allowanceRes as DegenAllowanceStats),
    points,
    pointsLiquidityMining,
  };
}
