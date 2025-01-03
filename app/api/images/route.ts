import { NextRequest } from "next/server";

import {
  generateInitialImage,
  generateErrorImage,
  generateStatsImage,
} from "./generate-image";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { fetchDegenStats } from "./fetch-degen-stats";
import { toUrl, verifyUrl } from "./utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const start = Date.now();
  console.log("Request URL:", toUrl(req).toString());
  const imageOptions = {
    baseUrl: "https://degen-stats.vercel.app",
  };
  try {
    const url = verifyUrl(req);
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
    const [userData, stats] = await Promise.all([
      getUserDataForFid({ fid }).catch(() => null),
      fetchDegenStats(fid, addresses),
    ]);
    // const stats: DegenStats = {
    //   minRank: 24,
    //   points: 100015,
    //   pointsLiquidityMining: 125120,
    //   remainingAllowance: -1500,
    //   tipAllowance: 20500,
    // };
    // const userData = {
    //   username: "ds8",
    //   profileImage: `${baseUrl}/mad_hatter.jpg`,
    // };

    return generateStatsImage(
      { stats, addresses, userData: userData ?? {} },
      { ...imageOptions, cached: true }
    );
  } catch (e) {
    console.error(e);
    return generateErrorImage(
      {
        error: "Error occured: " + (e as any).message,
      },
      imageOptions
    );
  } finally {
    console.log(`Time for GET /api/images: ${Date.now() - start}ms`);
  }
}
