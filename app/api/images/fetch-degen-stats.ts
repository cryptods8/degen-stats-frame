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
  path: "/api/airdrop2/season2/points",
};
const tipAllowanceApi: TipAllowanceDegenApi = {
  path: "/api/airdrop2/tip-allowance",
};
const liquidityMiningApi: PointsDegenApi = {
  path: "/api/liquidity-mining/season2/points",
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

export interface DegenStats {
  minRank: number;
  points: number;
  pointsLiquidityMining: number;
  tipAllowance: number;
  remainingAllowance: number;
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

export async function fetchDegenStats(walletAddresses: string[]): Promise<DegenStats> {
  const allApiFetches = [tipAllowanceApi, pointsApi, liquidityMiningApi].map(
    async (api) => fetchDegenData(api, walletAddresses)
  );
  const [tipAllowanceRes, pointsRes, liquidityMiningRes] = await Promise.all(
    allApiFetches
  );
  const res = (
    (tipAllowanceRes as DegenResponse<TipAllowanceDegenResponseItem>[]) || []
  ).reduce(
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
  const points = combinePoints(
    pointsRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  const pointsLiquidityMining = combinePoints(
    liquidityMiningRes as DegenResponse<PointsDegenResponseItem>[] | undefined
  );
  return { ...res, points, pointsLiquidityMining };
}