/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { signUrl, verifySignedUrl } from "../signer";
import { createShareUrl } from "../utils";
import { baseUrl } from "../constants";

const handleRequest = frames(async (ctx) => {
  const { message, validationResult, searchParams } = ctx;
  const isAllowance = searchParams.p === "/allowance";
  const path = isAllowance ? "/allowance" : "";

  const requesterFid = validationResult?.isValid
    ? message?.requesterFid
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
  if (requesterFid) {
    shareUrl = createShareUrl(path, requesterFid);
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

  return {
    image: signedImageUrl,
    imageOptions: { aspectRatio: isAllowance ? "1.91:1" : "1:1" },
    buttons: [
      <Button
        action="post"
        target={{
          pathname: "/",
          query: isAllowance ? { p: "/allowance" } : {},
        }}
      >
        {requesterFid
          ? "Refresh"
          : isAllowance
          ? "Check my own allowance"
          : "Check my own stats"}
      </Button>,
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
