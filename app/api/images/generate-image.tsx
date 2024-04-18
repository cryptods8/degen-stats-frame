import { ImageResponse } from "@vercel/og";

import { options } from "../../satori-options";
import { baseUrl as fallbackBaseUrl } from "../../constants";
import { DegenStats } from "./fetch-degen-stats";

async function toImage(image: React.ReactElement): Promise<ImageResponse> {
  return new ImageResponse(image, options);
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

const MINUTE_MILLIS = 60 * 1000;
const HOUR_MILLIS = 60 * MINUTE_MILLIS;
const DAY_MILLIS = 24 * HOUR_MILLIS;

function formatExpiration(): string {
  const now = new Date();
  let expiry = new Date();
  expiry.setUTCHours(7, 35, 0, 0);
  if (expiry.getTime() < now.getTime()) {
    expiry = new Date(expiry.getTime() + DAY_MILLIS);
  }
  const diff = expiry.getTime() - now.getTime();
  console.log("EXPIRY", expiry.toUTCString());
  console.log("NOW", now.toUTCString());
  const hours = Math.floor(diff / HOUR_MILLIS);
  const minutes = Math.floor((diff % HOUR_MILLIS) / MINUTE_MILLIS);
  if (hours > 0) {
    return `🕒 ${hours}h ${minutes}m`;
  }
  return `🕒 ${minutes}m`;
}

interface UserData {
  displayName?: string;
  profileImage?: string;
}

interface BaseImageProps {
  baseUrl?: string;
}

interface StatsImageProps {
  stats: DegenStats;
  userData: UserData;
  addresses: string[];
}

const FAKE_DATA: DegenStats = {
  tipAllowance: 42069,
  remainingAllowance: 1337,
  points: 123456,
  pointsLiquidityMining: 42000000,
  minRank: -1,
};

function ImageLayout({
  children,
  baseUrl = fallbackBaseUrl,
}: React.PropsWithChildren & BaseImageProps) {
  return (
    <div tw="w-full h-full relative bg-slate-900 text-4xl text-sky-100 justify-center items-center flex flex-col">
      <div tw="flex w-full h-full py-12">
        <div
          tw="flex h-full flex-col items-center w-78"
          style={{ gap: "2rem" }}
        >
          <div tw="flex flex-1 w-2 bg-violet-500" />
          <div tw="flex">
            <img src={`${baseUrl}/hat.png`} alt="hat" width="85" height="72" />
          </div>
          <div tw="flex flex-1 w-2 bg-violet-500" />
        </div>
        <div tw="flex flex-1 items-center pr-38">{children}</div>
      </div>
    </div>
  );
}

function StatsItemContainer({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <div tw="flex flex-col w-full" style={{ gap: "0.75rem" }}>
      {children}
    </div>
  );
}

function StatsItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div tw="flex justify-between" style={{ gap: "3rem" }}>
      <div tw="flex text-sky-400">{label}</div>
      <div tw="flex">{value}</div>
    </div>
  );
}

function StatsSubItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div tw="flex text-4xl justify-between" style={{ gap: "3rem" }}>
      <div tw="flex text-slate-500">{label}</div>
      <div tw="flex text-slate-400">{value}</div>
    </div>
  );
}

function StatsImage(props: StatsImageProps) {
  const { stats, userData, addresses } = props;
  return (
    <div tw="flex text-6xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "3rem" }}>
        <div tw="flex items-center w-full" style={{ gap: "3rem" }}>
          <div tw="flex flex-col">
            <img
              tw="w-36 h-36 rounded border-8 border-sky-400 bg-white"
              src={userData.profileImage}
              alt="Profile"
              width="112"
              height="112"
            />
          </div>
          <div tw="flex flex-1 flex-col" style={{ gap: "1rem" }}>
            <div
              tw="flex w-full overflow-hidden"
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {userData.displayName}
            </div>
            <div tw="flex items-center text-4xl" style={{ gap: "1.5rem" }}>
              <div tw="flex text-slate-500">Rank</div>
              <div tw="flex">
                {stats.minRank === -1 ? (
                  <div tw="flex text-slate-600">N/A</div>
                ) : (
                  <div tw="flex text-lime-400">
                    {formatNumber(stats.minRank)}
                  </div>
                )}
              </div>
              <div tw="flex p-4">
                <div tw="flex bg-slate-500 w-2 h-2 rounded-full" />
              </div>
              <div tw="flex text-4xl text-slate-500">
                {addresses.length} wallet
                {(addresses.length || 0) > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
        <div tw="flex flex-col text-5xl w-full" style={{ gap: "2rem" }}>
          <StatsItemContainer>
            <StatsItem
              label="Allowance"
              value={formatNumber(stats.tipAllowance)}
            />
            <StatsSubItem
              label="- remaining"
              value={formatNumber(stats.remainingAllowance)}
            />
            <StatsSubItem label="- expires in" value={formatExpiration()} />
          </StatsItemContainer>
          <StatsItemContainer>
            <StatsItem
              label="Points"
              value={formatNumber(stats.points + stats.pointsLiquidityMining)}
            />
            <StatsSubItem label="- tips" value={formatNumber(stats.points)} />
            <StatsSubItem
              label="- liquidity mining"
              value={formatNumber(stats.pointsLiquidityMining)}
            />
          </StatsItemContainer>
        </div>
      </div>
    </div>
  );
}

function InitialImage({
  message,
  baseUrl = fallbackBaseUrl,
}: { message?: string } & BaseImageProps) {
  return (
    <div tw="flex w-full h-full relative justify-center items-center">
      <div
        tw="flex w-full h-full justify-center items-center"
        style={{ opacity: 0.5 }}
      >
        <StatsImage
          stats={FAKE_DATA}
          addresses={["0x12345", "0x45678"]}
          userData={{
            displayName: "mad hatter 🎩",
            profileImage: `${baseUrl}/mad_hatter.jpg`,
          }}
        />
      </div>
      <div tw="flex absolute p-12 items-center justify-center w-full h-full">
        <div
          tw="flex flex-wrap px-12 py-8 bg-lime-900/75 text-lime-400 rounded text-5xl text-center"
          style={{ lineHeight: "1.5" }}
        >
          {message || "Check your own $DEGEN stats!"}
        </div>
      </div>
    </div>
  );
}

interface ImageOptions {
  baseUrl?: string;
}

export async function generateInitialImage(
  options: ImageOptions
): Promise<ImageResponse> {
  return toImage(
    <ImageLayout baseUrl={options.baseUrl}>
      <InitialImage baseUrl={options.baseUrl} />
    </ImageLayout>
  );
}

export async function generateErrorImage(
  {
    error,
  }: {
    error: string;
  },
  options: ImageOptions
): Promise<ImageResponse> {
  return toImage(
    <ImageLayout baseUrl={options.baseUrl}>
      <InitialImage message={error} baseUrl={options.baseUrl} />
    </ImageLayout>
  );
}

export async function generateStatsImage(
  {
    stats,
    addresses,
    userData,
  }: {
    stats: DegenStats;
    addresses: string[];
    userData: UserData;
  },
  options: ImageOptions
): Promise<ImageResponse> {
  return toImage(
    <ImageLayout baseUrl={options.baseUrl}>
      <StatsImage stats={stats} addresses={addresses} userData={userData} />
    </ImageLayout>
  );
}
