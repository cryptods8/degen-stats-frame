/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { signUrl, verifySignedUrl } from "../signer";
import { createShareUrl } from "../utils";
import { baseUrl } from "../constants";

function constructCastActionUrl(params: { url: string }): string {
  // Construct the URL
  const baseUrl = "https://warpcast.com/~/add-cast-action";
  const urlParams = new URLSearchParams({
    url: params.url,
  });

  return `${baseUrl}?${urlParams.toString()}`;
}

const handleRequest = frames(async (ctx) => {
  const { message, validationResult, searchParams } = ctx;
  const isAllowance = searchParams.p === "/allowance";
  const isCastAction = searchParams.ca === "1";
  const isSelf = searchParams.self === "1";
  const path = isAllowance ? "/allowance" : "";

  const requesterFid = validationResult?.isValid
    ? isCastAction && !isSelf
      ? message?.castId?.fid
      : message?.requesterFid
    : undefined;
  const fidParam = searchParams.fid;
  let fid: number | undefined = undefined;
  if (fidParam && !requesterFid) {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.delete("p");
    const fullUrl = `${baseUrl}${path}?${params.toString()}`;
    try {
      verifySignedUrl(fullUrl);
      fid = parseInt(fidParam as string, 10);
    } catch (e) {
      // ignore
      console.warn("Invalid signed URL: ", fullUrl, e);
    }
  }

  let shareUrl: string | undefined = undefined;
  let tipUrl: string | undefined = undefined;
  if (requesterFid && requesterFid === message?.requesterFid) {
    shareUrl = createShareUrl(path, requesterFid);
    tipUrl = "https://warpcast.com/ds8/0x3a3d159f";
  }

  const imageParams = new URLSearchParams({
    page: requesterFid ? "INITIAL" : "STATS",
  });
  const shownFid = requesterFid ?? fid;
  if (shownFid) {
    imageParams.set("fid", shownFid.toString());
  }
  const imageUrl = `${baseUrl}/api${path}/images?${imageParams.toString()}`;
  const signedImageUrl = signUrl(imageUrl);

  const buttonQuery: Record<string, string> = {};
  if (isAllowance) {
    buttonQuery.p = "/allowance";
  }
  if (isCastAction) {
    buttonQuery.ca = "1";
  }

  const actionLink = `${baseUrl}/api/actions/${
    isAllowance ? "allowance" : "stats"
  }`;

  return {
    image: signedImageUrl,
    imageOptions: { aspectRatio: isAllowance ? "1.91:1" : "1:1" },
    buttons: [
      <Button
        action="post"
        target={{
          pathname: "/",
          query: buttonQuery,
        }}
      >
        {requesterFid
          ? "Refresh"
          : isAllowance
          ? "Check my own allowance"
          : "Check my own stats"}
      </Button>,
      isCastAction ? (
        <Button
          action="post"
          target={{ pathname: "/", query: { ...buttonQuery, self: "1" } }}
        >
          {isSelf ? "Refresh mine" : "Check mine"}
        </Button>
      ) : (
        <Button
          action="link"
          target={constructCastActionUrl({ url: actionLink })}
        >
          Install cast action
        </Button>
      ),
      tipUrl ? (
        <Button action="link" target={tipUrl}>
          🎩 Tip
        </Button>
      ) : undefined,
      shareUrl ? (
        <Button action="link" target={shareUrl}>
          Share
        </Button>
      ) : undefined,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
