import { NextRequest } from "next/server";

import {
  generateInitialImage,
  generateErrorImage,
  generateStatsImage,
} from "./generate-image";
// import { baseUrl } from "../../constants";
import { verifySignedUrl } from "../../signer";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { fetchDegenStats } from "./fetch-degen-stats";

function toUrl(req: NextRequest) {
  const url = new URL(req.url);
  // if (process.env.NODE_ENV === "development") {
  //   return url;
  // }
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  url.protocol = protocol;
  url.host = host || url.host;
  if (protocol === "https") {
    url.port = "";
  }

  return url;
}

// function getRequestUrl(req: NextRequest) {
//   const url = new URL(req.url);
//   const search = url.searchParams.toString();
//   return `${baseUrl}${url.pathname}${search ? `?${search}` : ""}`;
// }

function verifyUrl(req: NextRequest) {
  const url = toUrl(req).toString();
  let verifiedUrl = url;
  try {
    verifiedUrl = verifySignedUrl(url);
    console.info("Verified URL", verifiedUrl);
  } catch (e) {
    // TODO: remove when verified it works
    console.error("Error verifying URL", url, (e as any).message);
  }
  return new URL(verifiedUrl);
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const start = Date.now();
  console.log("Request URL:", toUrl(req).toString());
  try {
    const url = verifyUrl(req);
    const imageOptions = {
      baseUrl: url.origin,
    };
    const params = url.searchParams;
    const fidStr = params.get("fid");
    if (!fidStr) {
      return generateInitialImage(imageOptions);
    }

    const fid = parseInt(fidStr, 10);
    const addresses = (await getAddressesForFid({ fid })).reduce((acc, a) => {
      if (a.type === "verified") {
        acc.push(a.address);
      }
      return acc;
    }, [] as string[]);
    const userData = (await getUserDataForFid({ fid })) || {};
    const stats = await fetchDegenStats(fid, addresses);

    return generateStatsImage({ stats, addresses, userData }, imageOptions);
  } catch (e) {
    console.error(e);
    return generateErrorImage(
      {
        error: "Error occured: " + (e as any).message,
      },
      {}
    );
  } finally {
    console.log(`Time for GET /api/images: ${Date.now() - start}ms`);
  }
}
