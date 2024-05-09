import { pgDb } from "../../db/pg-db";
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
  fetchByFid?: boolean;
};
type PointsDegenApi = DegenApi<PointsDegenResponseItem>;
type TipAllowanceDegenApi = DegenApi<TipAllowanceDegenResponseItem>;

const pointsApi: PointsDegenApi = {
  path: "/api/airdrop2/season4/points",
};
const tipAllowanceApi: TipAllowanceDegenApi = {
  path: "/api/airdrop2/tip-allowance",
  fetchByFid: true,
};
const liquidityMiningApi: PointsDegenApi = {
  path: "/api/liquidity-mining/season3/points",
};

async function fetchDegenData<T extends BaseDegenResponseItem>(
  api: DegenApi<T>,
  fid: number,
  walletAddresses: string[]
): Promise<DegenResponse<T>[]> {
  const allFetches = api.fetchByFid
    ? [fetch(`${API_BASE_URL}${api.path}?fid=${fid}`).then((res) => res.json())]
    : walletAddresses.map((walletAddress) =>
        fetch(`${API_BASE_URL}${api.path}?address=${walletAddress}`).then(
          (res) => res.json()
        )
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
      .selectFrom("degen_tip")
      .where("fromFid", "=", fid.toString())
      .where("castTimestamp", ">=", from)
      .select((db) => db.fn.sum("value").as("total"))
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

export async function fetchDegenAllowanceStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenAllowanceStats> {
  const [tipAllowanceRes, dailyTips] = await Promise.all([
    fetchDegenData(tipAllowanceApi, fid, walletAddresses),
    getAllTips(fid),
  ]);
  const res = combineTipAllowance(
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  );
  const remainingAllowance = getRemainingAllowance(res, dailyTips);
  return { ...res, remainingAllowance };
}

export async function fetchDegenStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenStats> {
  const allApiFetches = [tipAllowanceApi, pointsApi, liquidityMiningApi].map(
    async (api) => fetchDegenData(api, fid, walletAddresses)
  );
  const [tipAllowanceRes, pointsRes, liquidityMiningRes, dailyTips] =
    await Promise.all([...allApiFetches, getAllTips(fid)]);
  const res = combineTipAllowance(
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  );
  const points = combinePoints(
    pointsRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const pointsLiquidityMining = combinePoints(
    liquidityMiningRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const remainingAllowance = getRemainingAllowance(res, dailyTips as number);
  return { ...res, remainingAllowance, points, pointsLiquidityMining };
}
