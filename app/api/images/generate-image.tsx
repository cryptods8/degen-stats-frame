import { ImageResponse } from "@vercel/og";

import { options } from "../../satori-options";
import { baseUrl as fallbackBaseUrl } from "../../constants";
import { DegenStats } from "./fetch-degen-stats";
import { getDailyAllowanceStart } from "./utils";

async function toImage(image: React.ReactElement): Promise<ImageResponse> {
  return new ImageResponse(image, options);
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

const MINUTE_MILLIS = 60 * 1000;
const HOUR_MILLIS = 60 * MINUTE_MILLIS;
const DAY_MILLIS = 24 * HOUR_MILLIS;

function getExpirationInMillis(): number {
  const now = new Date();
  const expiry = new Date(getDailyAllowanceStart().getTime() + DAY_MILLIS);
  return expiry.getTime() - now.getTime();
}

function formatExpiration(expirationInMillis: number): string {
  const hours = Math.floor(expirationInMillis / HOUR_MILLIS);
  const minutes = Math.floor(
    (expirationInMillis % HOUR_MILLIS) / MINUTE_MILLIS
  );
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

interface UserData {
  username?: string;
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
      <div tw="flex flex-col w-full h-full">
        <div tw="flex w-full items-center pt-24 pb-12" style={{ gap: "3rem" }}>
          <div tw="flex w-26 h-2 bg-violet-500" />
          <div tw="flex">
            <img
              src={`${baseUrl}/hat.png`}
              alt="hat"
              width="130"
              height="110"
            />
          </div>
          <div tw="flex flex-1 h-2 bg-violet-500" />
        </div>
        <div tw="flex items-center px-24">{children}</div>
        <div
          tw="flex w-full items-center pt-24 text-violet-500"
          style={{ gap: "3rem" }}
        >
          <div tw="flex w-26 h-2 bg-violet-500" />
          <div tw="flex">DEGEN STATS</div>
          <div tw="flex flex-1 h-2 bg-violet-500" />
        </div>
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
    <div tw="flex flex-col w-full" style={{ gap: "1.5rem" }}>
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
    <div tw="flex justify-between px-8" style={{ gap: "3rem" }}>
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
    <div tw="flex text-5xl justify-between px-8" style={{ gap: "3rem" }}>
      <div tw="flex text-slate-500">{label}</div>
      <div tw="flex text-slate-400">{value}</div>
    </div>
  );
}

function ProgressBar({ value, maxValue }: { value: number; maxValue: number }) {
  const percentage = (value / maxValue) * 100;
  return (
    <div tw="flex items-center justify-end w-full h-18 bg-slate-700 rounded-full relative text-5xl">
      <div
        tw="flex h-full bg-lime-600 rounded-full"
        style={{ width: `${percentage}%` }}
      />
      <div tw="flex absolute right-0 top-0 bottom-0 items-center px-8 justify-between w-full">
        <div tw="text-white">- remaining</div>
        <div tw="text-white">{formatNumber(value)}</div>
      </div>
    </div>
  );
}

function ProgressCircle({
  value,
  maxValue,
}: {
  value: number;
  maxValue: number;
}) {
  const ratio = value / maxValue;
  const circleRadius = 100;
  const progressRadius = 50;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressLength = (1 - ratio) * progressCircumference;
  return (
    <div tw="flex items-center justify-end w-10 h-10 bg-slate-700 rounded-full relative text-lime-600">
      <svg
        width={"3rem"}
        height={"3rem"}
        viewBox="0 0 200 200"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          r={progressRadius}
          cx="100"
          cy="100"
          stroke="currentColor"
          strokeWidth={(circleRadius - progressRadius) * 2}
          // strokeLinecap="round"
          strokeDashoffset={`${progressLength}px`}
          fill="transparent"
          strokeDasharray={`${progressLength}px ${
            progressCircumference - progressLength
          }px`}
        ></circle>
      </svg>
    </div>
  );
}

function StatsImage(props: StatsImageProps) {
  const { stats, userData, addresses } = props;
  const expirationInMillis = getExpirationInMillis();
  return (
    <div tw="flex text-7xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "5.5rem" }}>
        <div tw="flex items-center w-full px-8" style={{ gap: "4rem" }}>
          <div tw="flex flex-col">
            <img
              tw="w-44 h-44 rounded border-8 border-sky-400 bg-white"
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
              {userData.username
                ? `@${userData.username}`
                : userData.displayName}
            </div>
            <div
              tw="flex items-center justify-between text-5xl"
              style={{ gap: "2rem" }}
            >
              <div tw="flex" style={{ gap: "2rem" }}>
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
              </div>
              {/* <div tw="flex p-4">
                <div tw="flex bg-slate-500 w-2 h-2 rounded-full" />
              </div> */}
              <div
                tw="flex items-center text-slate-500"
                style={{ gap: "2rem" }}
              >
                <div tw="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="2.5rem"
                    height="2.5rem"
                  >
                    <path
                      d="M461.2 128H80c-8.84 0-16-7.16-16-16s7.16-16 16-16h384c8.84 0 16-7.16 16-16 0-26.51-21.49-48-48-48H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h397.2c28.02 0 50.8-21.53 50.8-48V176c0-26.47-22.78-48-50.8-48zM416 336c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div tw="flex">{addresses.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div tw="flex flex-col text-6xl w-full" style={{ gap: "4rem" }}>
          <StatsItemContainer>
            <StatsItem
              label="Allowance"
              value={formatNumber(stats.tipAllowance)}
            />
            <ProgressBar
              value={stats.remainingAllowance}
              maxValue={stats.tipAllowance}
            />
            {/* <StatsSubItem
              label="- remaining"
              value={formatNumber(stats.remainingAllowance)}
            /> */}
            <StatsSubItem
              label="- expires in"
              value={
                <div tw="flex items-center" style={{ gap: "2rem" }}>
                  <ProgressCircle
                    value={DAY_MILLIS - expirationInMillis}
                    maxValue={DAY_MILLIS}
                  />
                  <div tw="flex">{formatExpiration(expirationInMillis)}</div>
                </div>
              }
            />
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
            username: "madhatter",
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
