// import { headers } from "next/headers";
import { signUrl } from "./signer";
import { baseUrl } from "./constants";

export function currentURL(pathname: string): URL {
  // const headersList = headers();
  // const host = headersList.get("x-forwarded-host") || headersList.get("host");
  // const protocol = headersList.get("x-forwarded-proto") || "http";

  return new URL(pathname, baseUrl);
}

export function createShareUrl(basePath: string, fid: number): string {
  const params = new URLSearchParams();
  params.set("fid", fid.toString());
  const fullUrl = `${baseUrl}${basePath}?${params.toString()}`;
  const signedUrl = signUrl(fullUrl);

  const shareRedirectParams = new URLSearchParams();
  shareRedirectParams.append("text", "$DEGEN stats by @ds8");
  shareRedirectParams.set("embeds[]", signedUrl);
  return `https://warpcast.com/~/compose?${shareRedirectParams.toString()}`;
}
