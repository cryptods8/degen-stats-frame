import { DailyTip, fetchAllDailyTips } from "./fetch-tips";

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
};
type PointsDegenApi = DegenApi<PointsDegenResponseItem>;
type TipAllowanceDegenApi = DegenApi<TipAllowanceDegenResponseItem>;

const pointsApi: PointsDegenApi = {
  path: "/api/airdrop2/season3/points",
};
const tipAllowanceApi: TipAllowanceDegenApi = {
  path: "/api/airdrop2/tip-allowance",
};
const liquidityMiningApi: PointsDegenApi = {
  path: "/api/liquidity-mining/season3/points",
};

async function fetchDegenData<T extends BaseDegenResponseItem>(
  api: DegenApi<T>,
  walletAddresses: string[]
): Promise<DegenResponse<T>[]> {
  const allFetches = walletAddresses.map((walletAddress) =>
    fetch(`${API_BASE_URL}${api.path}?address=${walletAddress}`).then((res) =>
      res.json()
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

async function fetchDailyTips(fid: number) {
  try {
    const start = Date.now();
    const dailyTips = await fetchAllDailyTips(fid);
    console.log(`Time for fetchAllDailyTips: ${Date.now() - start}ms`);
    return dailyTips;
  } catch (e) {
    console.error(e);
    return [];
  }
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
  return Math.max(0, stats.tipAllowance - validTips);
}

export async function fetchDegenAllowanceStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenAllowanceStats> {
  const [tipAllowanceRes, dailyTips] = await Promise.all([
    fetchDegenData(tipAllowanceApi, walletAddresses),
    fetchDailyTips(fid),
  ]);
  const res = combineTipAllowance(
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  );
  const validTips = getValidTips(dailyTips as DailyTip[], res.tipAllowance);
  const remainingAllowance = getRemainingAllowance(res, validTips);
  return { ...res, remainingAllowance };
}

export async function fetchDegenStats(
  fid: number,
  walletAddresses: string[]
): Promise<DegenStats> {
  const allApiFetches = [tipAllowanceApi, pointsApi, liquidityMiningApi].map(
    async (api) => fetchDegenData(api, walletAddresses)
  );
  const [tipAllowanceRes, pointsRes, liquidityMiningRes, dailyTips] =
    await Promise.all([...allApiFetches, fetchDailyTips(fid)]);
  const res = combineTipAllowance(
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  );
  const points = combinePoints(
    pointsRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const pointsLiquidityMining = combinePoints(
    liquidityMiningRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const validTips = getValidTips(dailyTips as DailyTip[], res.tipAllowance);
  const remainingAllowance = getRemainingAllowance(res, validTips);
  return { ...res, remainingAllowance, points, pointsLiquidityMining };
}
