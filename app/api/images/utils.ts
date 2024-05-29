import { NextRequest } from "next/server";
import { verifySignedUrl } from "../../signer";

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDailyAllowanceStart(): Date {
  const now = new Date();
  let allowanceStart = new Date(now);
  allowanceStart.setUTCHours(0, 0, 0, 0);
  if (allowanceStart.getTime() > now.getTime()) {
    allowanceStart = addDays(allowanceStart, -1);
  }
  return allowanceStart;
}

export function toUrl(req: NextRequest) {
  const url = new URL(req.url);
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  url.protocol = protocol;
  url.host = host || url.host;
  if (protocol === "https") {
    url.port = "";
  }

  return url;
}

export function verifyUrl(req: NextRequest) {
  const url = toUrl(req).toString();
  let verifiedUrl = url;
  try {
    verifiedUrl = verifySignedUrl(url);
    console.info("Verified URL", verifiedUrl);
  } catch (e) {
    // TODO: remove when verified it works
    console.warn("Error verifying URL", url, (e as any).message);
  }
  return new URL(verifiedUrl);
}
