import { NextRequest } from "next/server";

import {
  generateAllowanceInitialImage,
  generateAllowanceErrorImage,
  generateAllowanceStatsImage,
} from "../../images/generate-image";
import { getAddressesForFid, getUserDataForFid } from "frames.js";
import { fetchDegenAllowanceStats } from "../../images/fetch-degen-stats";
import { toUrl, verifyUrl } from "../../images/utils";

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
      return generateAllowanceInitialImage(imageOptions);
    }

    const fid = parseInt(fidStr, 10);
    const addresses = (await getAddressesForFid({ fid })).reduce((acc, a) => {
      if (a.type === "verified") {
        acc.push(a.address);
      }
      return acc;
    }, [] as string[]);
    const userData = (await getUserDataForFid({ fid })) || {};
    const stats = await fetchDegenAllowanceStats(fid, addresses);

    return generateAllowanceStatsImage({ stats, addresses, userData }, imageOptions);
  } catch (e) {
    console.error(e);
    return generateAllowanceErrorImage(
      {
        error: "Error occured: " + (e as any).message,
      },
      {}
    );
  } finally {
    console.log(`Time for GET /api/images: ${Date.now() - start}ms`);
  }
}
