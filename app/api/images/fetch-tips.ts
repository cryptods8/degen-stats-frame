import { init, fetchQuery } from "@airstack/node";
import { getDailyAllowanceStart } from "./utils";
import { fetchFromCache, saveToCache } from "./cache";

if (!process.env.AIRSTACK_API_KEY) {
  throw new Error("AIRSTACK_API_KEY is required");
}
init(process.env.AIRSTACK_API_KEY);

export interface DailyTip {
  hash: string;
  tipperFid: number;
  recipientFid: number;
  value: number;
  timestamp: number;
}

interface AirstackCast {
  castedAtTimestamp: string;
  url: string;
  hash: string;
  text: string;
  channel: {
    channelId: string;
  } | null;
  parentFid: string;
}

const TIP_REGEX = /(\d+)\s*\$degen/i;

function mergeTips(oldTips: DailyTip[], newTips: DailyTip[]): DailyTip[] {
  const mergedTips = [...oldTips];
  for (const tip of newTips) {
    if (!oldTips.find((t) => t.hash === tip.hash)) {
      mergedTips.push(tip);
    }
  }
  return mergedTips;
}

async function fetchCastsFromTimestamp(fid: number, timestamp: Date) {
  const formattedFrom = timestamp.toISOString();
  const query = `query MyQuery {
    FarcasterCasts(
      input: {
        filter: {
          castedBy: {_eq: "fc_fid:${fid}"}
          castedAtTimestamp: {
            _gte: "${formattedFrom}"
          }
        },
        blockchain: ALL,
      }
    ) {
      Cast {
        castedAtTimestamp
        url
        hash
        text
        channel {
          channelId
        }
        parentFid
      }
    }
  }`;
  const { data } = await fetchQuery(query);
  const casts: AirstackCast[] = data.FarcasterCasts?.Cast || [];
  return casts;
}

interface TipsCacheEntry {
  from: number;
  tips: DailyTip[];
}

function logCacheOperation(
  op: string,
  key: string,
  ts: number,
  from: number,
  tipsCount: number
) {
  const formatTs = (v: number) => new Date(v).toISOString();
  console.info(
    `[CACHE ENTRY ${key}] ${op}: { ts: ${formatTs(ts)}, from: ${formatTs(
      from
    )}, count: ${tipsCount} }`
  );
}

export async function fetchAllDailyTips(fid: number): Promise<DailyTip[]> {
  const cacheKey = `daily-tips-${fid}`;
  const cacheEntry = await fetchFromCache<TipsCacheEntry>(cacheKey);
  const dailyAllowanceStart = getDailyAllowanceStart();
  let from;
  let cachedTips: DailyTip[] = [];
  if (cacheEntry && cacheEntry.value?.tips) {
    const { timestamp, value } = cacheEntry;
    logCacheOperation(
      "fetched",
      cacheKey,
      timestamp,
      value.from,
      value.tips.length
    );
    // If the cache is less than 5 minutes old, return it
    if (
      timestamp > Date.now() - 5 * 60 * 1000 &&
      value.from >= dailyAllowanceStart.getTime()
    ) {
      return value.tips;
    }
    if (value.from < dailyAllowanceStart.getTime()) {
      from = dailyAllowanceStart;
    } else {
      // 60 minutes before just in case some casts are delayed
      const fromTimestamp = timestamp - 60 * 60 * 1000;
      from = new Date(Math.max(fromTimestamp, dailyAllowanceStart.getTime()));
      cachedTips = value.tips;
    }
  } else {
    console.info("no cached tips", cacheKey);
    from = dailyAllowanceStart;
  }

  const newCasts = await fetchCastsFromTimestamp(fid, from);
  const newTips = newCasts.reduce((acc, c) => {
    const match = c.text.match(TIP_REGEX);
    if (match && match[1]) {
      acc.push({
        hash: c.hash,
        tipperFid: fid,
        recipientFid: parseInt(c.parentFid, 10),
        value: parseInt(match[1], 10),
        timestamp: new Date(c.castedAtTimestamp).getTime(),
      });
    }
    return acc;
  }, [] as DailyTip[]);

  const dailyTips = mergeTips(cachedTips, newTips);
  saveToCache(
    cacheKey,
    { from: from.getTime(), tips: dailyTips },
    60 * 60 * 24
  );
  logCacheOperation(
    "saved",
    cacheKey,
    Date.now(),
    from.getTime(),
    dailyTips.length
  );

  return dailyTips;
}
