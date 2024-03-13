import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { DEFAULT_DEBUGGER_HUB_URL } from "./debug";
import { options } from "./satori-options";
import { baseUrl } from "./constants";
import { signUrl, verifySignedUrl } from "./signer";

type Page = "INITIAL" | "STATS";

type State = {
  page: Page;
};

const initialState: State = { page: "INITIAL" };

const FAKE_DATA = {
  tipAllowance: 42069,
  remainingAllowance: 1337,
  points: 123456,
  pointsLiquidityMining: 42000000,
  minRank: -1,
};

const reducer: FrameReducer<State> = (state, action) => {
  return {
    page: "STATS",
    // page: state.page === "INITIAL" ? "STATS" : "INITIAL",
  };
};

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

interface DegenStats {
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

async function fetchDegenStats(walletAddresses: string[]): Promise<DegenStats> {
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

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

interface UserData {
  displayName?: string;
  profileImage?: string;
}

interface StatsImageProps {
  stats: DegenStats;
  userData: UserData;
  addresses: string[];
}

function StatsItemContainer({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <div tw="flex flex-col w-full" style={{ gap: "0.75rem" }}>
      {children}
    </div>
  );
}

function StatsItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div tw="flex justify-between" style={{ gap: "3rem" }}>
      <div tw="flex text-sky-400">{label}</div>
      <div tw="flex">{value}</div>
    </div>
  );
}

function StatsSubItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div tw="flex text-3xl justify-between" style={{ gap: "3rem" }}>
      <div tw="flex text-slate-500">{label}</div>
      <div tw="flex text-slate-400">{value}</div>
    </div>
  );
}

function StatsImage(props: StatsImageProps) {
  const { stats, userData, addresses } = props;
  return (
    <div tw="flex text-5xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "3rem" }}>
        <div tw="flex items-center" style={{ gap: "2rem" }}>
          <div tw="flex flex-col relative">
            <img
              tw="w-28 h-28 rounded border-8 border-sky-400"
              src={userData.profileImage}
              alt="Profile"
              width="112"
              height="112"
            />
          </div>
          <div tw="flex flex-col" style={{ gap: "0.75rem" }}>
            <div tw="flex">{userData.displayName}</div>
            <div tw="flex text-3xl text-slate-400">
              {addresses.length} address
              {(addresses.length || 0) > 1 ? "es" : ""}
            </div>
          </div>
        </div>
        <div tw="flex flex-col text-4xl w-full" style={{ gap: "2rem" }}>
          <StatsItemContainer>
            <StatsItem
              label="Rank"
              value={
                stats.minRank === -1 ? (
                  <div tw="flex text-slate-400">Unranked</div>
                ) : (
                  <div tw="flex">{formatNumber(stats.minRank)}</div>
                )
              }
            />
          </StatsItemContainer>
          <StatsItemContainer>
            <StatsItem
              label="Allowance"
              value={formatNumber(stats.tipAllowance)}
            />
            <StatsSubItem
              label="- remaining"
              value={formatNumber(stats.remainingAllowance)}
            />
          </StatsItemContainer>
          <StatsItemContainer>
            <StatsItem
              label="Points"
              value={formatNumber(stats.points + stats.pointsLiquidityMining)}
            />
            <StatsSubItem label="- tips" value={formatNumber(stats.points)} />
            <StatsSubItem
              label="- liquidity mining"
              value={formatNumber(stats.pointsLiquidityMining)}
            />
          </StatsItemContainer>
        </div>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);

  const fidParam = searchParams?.["fid"];
  let fid: number | undefined = undefined;
  if (fidParam && state.page === "INITIAL") {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    const fullUrl = `${baseUrl}/?${params.toString()}`;
    try {
      verifySignedUrl(fullUrl);
      fid = parseInt(fidParam as string, 10);
    } catch (e) {
      // ignore
      console.warn("Invalid signed URL: ", fullUrl, e);
    }
  }

  let shareUrl: string | undefined = undefined;
  if (state.page === "STATS" && frameMessage?.requesterFid) {
    const params = new URLSearchParams();
    params.set("fid", frameMessage.requesterFid.toString());
    const fullUrl = `${baseUrl}/?${params.toString()}`;
    const signedUrl = signUrl(fullUrl);

    console.log("signedUrl", signedUrl);

    const shareRedirectParams = new URLSearchParams();
    shareRedirectParams.append("text", "My $DEGEN stats");
    shareRedirectParams.set("embeds[]", signedUrl);
    shareUrl = `https://warpcast.com/~/compose?${shareRedirectParams.toString()}`;
  }

  let image: React.ReactNode = null;
  if (state.page === "STATS" || fid) {
    const addresses = fid
      ? (await getAddressesForFid({ fid })).reduce((acc, a) => {
          if (a.type === "verified") {
            acc.push(a.address);
          }
          return acc;
        }, [] as string[])
      : frameMessage?.requesterVerifiedAddresses || [];
    const userData =
      (fid
        ? await getUserDataForFid({ fid })
        : frameMessage?.requesterUserData) || {};
    const stats = await fetchDegenStats(addresses);
    image = (
      <StatsImage stats={stats} addresses={addresses} userData={userData} />
    );
  } else {
    image = (
      <div tw="flex w-full h-full relative justify-center items-center">
        <div
          tw="flex w-full h-full justify-center items-center"
          style={{ opacity: 0.5 }}
        >
          <StatsImage
            stats={FAKE_DATA}
            addresses={["0x12345", "0x45678"]}
            userData={{
              displayName: "mad hatter 🎩",
              profileImage: `${baseUrl}/mad_hatter.jpg`,
            }}
          />
        </div>
        <div tw="flex absolute bg-lime-900/75 text-lime-400 px-12 py-8 rounded">
          Check your own $DEGEN stats!
        </div>
      </div>
    );
  }

  console.log("info: state is:", state);

  // then, when done, return next frame
  return (
    <div className="p-4">
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage aspectRatio="1.91:1" options={options}>
          <div tw="w-full h-full relative bg-slate-900 text-4xl text-sky-100 justify-center items-center flex flex-col">
            <div tw="flex w-full h-full p-12" style={{ gap: "3rem" }}>
              <div
                tw="flex h-full flex-col items-center w-64"
                style={{ gap: "2rem" }}
              >
                <div tw="flex flex-1 w-2 bg-violet-500" />
                <div tw="flex">
                  <img
                    src={`${baseUrl}/hat.png`}
                    alt="hat"
                    width="85"
                    height="72"
                  />
                </div>
                <div tw="flex flex-1 w-2 bg-violet-500" />
              </div>
              <div tw="flex flex-1 items-center pr-28">{image}</div>
            </div>
          </div>
        </FrameImage>
        <FrameButton>
          {state.page === "INITIAL"
            ? fid
              ? "Check my own stats"
              : "Check"
            : "Refresh"}
        </FrameButton>
        {shareUrl ? (
          <FrameButton action="link" target={shareUrl}>
            Share
          </FrameButton>
        ) : null}
      </FrameContainer>
    </div>
  );
}
