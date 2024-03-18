import { NextRequest } from "next/server";

import {
  generateInitialImage,
  generateErrorImage,
  generateStatsImage,
} from "./generate-image";
import { baseUrl } from "../../constants";
import { verifySignedUrl } from "../../signer";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { fetchDegenStats } from "./fetch-degen-stats";

function getRequestUrl(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  return `${baseUrl}${url.pathname}${search ? `?${search}` : ""}`;
}

function verifyUrl(req: NextRequest) {
  const url = getRequestUrl(req);
  const verifiedUrl = verifySignedUrl(url);
  return new URL(verifiedUrl);
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const url = verifyUrl(req);
    const params = url.searchParams;
    const fidStr = params.get("fid");
    if (!fidStr) {
      return generateInitialImage();
    }

    const fid = parseInt(fidStr, 10);
    const addresses = (await getAddressesForFid({ fid })).reduce((acc, a) => {
      if (a.type === "verified") {
        acc.push(a.address);
      }
      return acc;
    }, [] as string[]);
    const userData = (await getUserDataForFid({ fid })) || {};
    const stats = await fetchDegenStats(addresses);

    return generateStatsImage({ stats, addresses, userData });
  } catch (e) {
    console.error(e);
    return generateErrorImage({
      error: "Error occured: " + (e as any).message,
    });
  } finally {
    console.log(`Time for GET /api/images: ${Date.now() - start}ms`);
  }
}
