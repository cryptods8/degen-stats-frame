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
import { DEFAULT_DEBUGGER_HUB_URL } from "./debug";
// import { baseUrl as fallbackBaseUrl } from "./constants";
import { signUrl, verifySignedUrl } from "./signer";
import { currentURL } from "./utils";

type Page = "INITIAL" | "STATS";

type State = {
  page: Page;
  // ts?: number;
};

const initialState: State = { page: "INITIAL" };

const reducer: FrameReducer<State> = (state, action) => {
  return {
    page: "STATS",
    // ts: Date.now(),
    // page: state.page === "INITIAL" ? "STATS" : "INITIAL",
  };
};

function createShareUrl(baseUrl: string, fid: number): string {
  const params = new URLSearchParams();
  params.set("fid", fid.toString());
  const fullUrl = `${baseUrl}/?${params.toString()}`;
  const signedUrl = signUrl(fullUrl);

  // console.log("signedUrl", signedUrl);

  const shareRedirectParams = new URLSearchParams();
  // shareRedirectParams.append("text", "My $DEGEN stats");
  shareRedirectParams.set("embeds[]", signedUrl);
  return `https://warpcast.com/~/compose?${shareRedirectParams.toString()}`;
}

const hubHttpUrl =
  process.env.NODE_ENV === "development"
    ? DEFAULT_DEBUGGER_HUB_URL
    : "https://hubs.airstack.xyz";
const hubRequestOptions =
  process.env.NODE_ENV === "development"
    ? undefined
    : { headers: { "x-airstack-hubs": process.env.AIRSTACK_API_KEY! } };

export default async function Home({ searchParams }: NextServerPageProps) {
  const currentUrl = currentURL("");
  console.log("currentUrl", currentUrl.toString());
  const baseUrl = currentUrl.origin;

  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl,
    hubRequestOptions,
  });

  if (frameMessage && !frameMessage.isValid) {
    console.warn("Invalid frame message", frameMessage);
    throw new Error("Invalid frame message");
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
    shareUrl = createShareUrl(baseUrl, frameMessage.requesterFid);
  }

  const imageParams = new URLSearchParams({ page: state.page });
  const shownFid = state.page === "STATS" ? frameMessage?.requesterFid : fid;
  if (shownFid) {
    imageParams.set("fid", shownFid.toString());
  }
  const imageUrl = `${baseUrl}/api/images?${imageParams.toString()}`;
  const signedImageUrl = signUrl(imageUrl);

  return (
    <div>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage src={signedImageUrl} />
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
