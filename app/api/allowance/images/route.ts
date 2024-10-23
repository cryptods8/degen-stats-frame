import { NextRequest, NextResponse } from "next/server";

import {
  generateAllowanceInitialImage,
  generateAllowanceStatsImage,
} from "../../images/generate-image";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { fetchDegenAllowanceStats } from "../../images/fetch-degen-stats";
import { verifyUrl } from "../../images/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const start = Date.now();
  const imageOptions = {};
  try {
    const url = verifyUrl(req);
    const params = url.searchParams;
    const fidStr = params.get("fid");
    if (!fidStr) {
      return generateAllowanceInitialImage(imageOptions);
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
      fetchDegenAllowanceStats(fid, addresses),
    ]);

    return generateAllowanceStatsImage(
      { stats, addresses, userData: userData ?? {} },
      { ...imageOptions, cached: true }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal error occured" },
      { status: 500 }
    );
  } finally {
    console.log(`Time for GET /api/images: ${Date.now() - start}ms`);
  }
}
