import { ImageResponse } from "@vercel/og";

import { options } from "../../satori-options";
import { baseUrl as fallbackBaseUrl } from "../../constants";
import { DegenAllowanceStats, DegenStats } from "./fetch-degen-stats";
import { addDays, getDailyAllowanceStart } from "./utils";

async function toImage(
  image: React.ReactElement,
  ratio?: "1:1" | "1.91:1"
): Promise<ImageResponse> {
  return new ImageResponse(image, {
    ...options,
    height: ratio === "1.91:1" ? 628 : 1200,
  });
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

const MINUTE_MILLIS = 60 * 1000;
const HOUR_MILLIS = 60 * MINUTE_MILLIS;
const DAY_MILLIS = 24 * HOUR_MILLIS;

function getExpirationInMillis(): number {
  const now = new Date();
  const expiry = addDays(getDailyAllowanceStart(), 1);
  return expiry.getTime() - now.getTime();
}

function formatExpiration(expirationInMillis: number): string {
  const hours = Math.floor(expirationInMillis / HOUR_MILLIS);
  const minutes = Math.floor(
    (expirationInMillis % HOUR_MILLIS) / MINUTE_MILLIS
  );
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
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

interface StatsImageProps<T extends DegenAllowanceStats> {
  stats: T;
  userData: UserData;
  addresses: string[];
}

const FAKE_DATA: DegenStats = {
  tipAllowance: 4269,
  remainingAllowance: 1420,
  points: 1234,
  pointsLiquidityMining: 200,
  minRank: -1,
};

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 554.2 554.199"
      width="100%"
      height="100%"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M538.5,386.199L356.5,70.8c-16.4-28.4-46.7-45.9-79.501-45.9c-32.8,0-63.1,17.5-79.5,45.9L12.3,391.6
		c-16.4,28.4-16.4,63.4,0,91.8C28.7,511.8,59,529.3,91.8,529.3H462.2c0.101,0,0.2,0,0.2,0c50.7,0,91.8-41.101,91.8-91.8
		C554.2,418.5,548.4,400.8,538.5,386.199z M316.3,416.899c0,21.7-16.7,38.3-39.2,38.3s-39.2-16.6-39.2-38.3V416
		c0-21.601,16.7-38.301,39.2-38.301S316.3,394.3,316.3,416V416.899z M317.2,158.7L297.8,328.1c-1.3,12.2-9.4,19.8-20.7,19.8
		s-19.4-7.7-20.7-19.8L237,158.6c-1.3-13.1,5.801-23,18-23H299.1C311.3,135.7,318.5,145.6,317.2,158.7z"
        fill="currentColor"
      />
    </svg>
  );
}

function BaseImageLayout({ children }: React.PropsWithChildren) {
  return (
    <div tw="w-full h-full relative bg-slate-900 text-4xl text-sky-100 justify-center items-center flex flex-col">
      {children}
    </div>
  );
}

function HatPanel({
  baseUrl = fallbackBaseUrl,
  vertical = false,
  compact = false,
}: {
  baseUrl?: string;
  vertical?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      tw={`flex items-center ${
        vertical ? "flex-col h-full pl-20 py-12" : "w-full pt-24 pb-12"
      }`}
      style={{ gap: "3rem" }}
    >
      <div tw={`flex bg-violet-500 ${vertical ? "flex-1 w-2" : "w-26 h-2"}`} />
      <div tw="flex">
        <img
          src={`${baseUrl}/hat.png`}
          alt="hat"
          width={compact ? "85" : "130"}
          height={compact ? "72" : "110"}
        />
      </div>
      <div tw={`flex flex-1 bg-violet-500 ${vertical ? "w-2" : "h-2"}`} />
    </div>
  );
}

function ImageLayout({
  children,
  baseUrl = fallbackBaseUrl,
  compact = false,
}: React.PropsWithChildren & BaseImageProps & { compact?: boolean }) {
  return (
    <BaseImageLayout>
      <div
        tw={`flex w-full h-full ${
          compact ? "flex-row items-center justify-center" : "flex-col"
        }`}
      >
        <HatPanel baseUrl={baseUrl} compact={compact} vertical={compact} />
        <div
          tw={`flex items-center ${compact ? "flex-1 pl-16 pr-20" : "px-24"}`}
        >
          {children}
        </div>
        {!compact && (
          <div
            tw="flex w-full items-center pt-24 text-violet-500"
            style={{ gap: "3rem" }}
          >
            <div tw="flex w-26 h-2 bg-violet-500" />
            <div tw="flex">DEGEN STATS</div>
            <div tw="flex flex-1 h-2 bg-violet-500" />
          </div>
        )}
      </div>
    </BaseImageLayout>
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
  const percentage = maxValue === 0 ? 0 : (value / maxValue) * 100;
  return (
    <div tw="flex items-center justify-end w-full h-18 bg-slate-700 rounded-full relative text-5xl">
      <div
        tw={`flex h-full bg-lime-600 rounded-full ${
          value > 0 ? "min-w-18" : ""
        }`}
        style={{ width: `${percentage}%` }}
      />
      <div tw="flex absolute right-0 top-0 bottom-0 items-center px-8 justify-between w-full">
        <div tw="text-white">- remaining</div>
        {value >= 0 ? (
          <div tw="text-white">{formatNumber(value)}</div>
        ) : (
          <div
            tw={`flex items-center ${
              Math.abs(value) > maxValue / 2 ? "text-red-500" : "text-amber-500"
            }`}
            style={{ gap: "1rem" }}
          >
            <div tw="flex w-12 h-12">
              <WarningIcon />
            </div>
            <div>{formatNumber(value)}</div>
          </div>
        )}
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
    <div tw="flex items-center justify-end w-12 h-12 bg-slate-700 rounded-full relative text-lime-600">
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

function StatsHeader(props: {
  userData: UserData;
  addresses: string[];
  stats: DegenAllowanceStats;
}) {
  const { userData, addresses, stats } = props;
  return (
    <div tw="flex items-center w-full px-8" style={{ gap: "4rem" }}>
      <div tw="flex w-44 h-44 rounded border-8 border-sky-400 bg-white">
        {userData.profileImage ? (
          <img
            tw="w-full h-full"
            src={userData.profileImage}
            alt="Profile"
            width="112"
            height="112"
          />
        ) : (
          <div tw="flex w-full h-full items-center justify-center text-8xl bg-violet-500 text-violet-800">
            ?
          </div>
        )}
      </div>
      <div tw="flex flex-1 flex-col" style={{ gap: "1rem" }}>
        <div
          tw="flex w-full overflow-hidden"
          style={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            lineHeight: "1.25",
          }}
        >
          {userData.username ? `@${userData.username}` : userData.displayName}
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
                <div tw="flex text-lime-500">{formatNumber(stats.minRank)}</div>
              )}
            </div>
          </div>
          {/* <div tw="flex p-4">
                <div tw="flex bg-slate-500 w-2 h-2 rounded-full" />
              </div> */}
          <div tw="flex items-center text-slate-500" style={{ gap: "2rem" }}>
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
  );
}

function StatsImage(props: StatsImageProps<DegenStats>) {
  const { stats } = props;
  const expirationInMillis = getExpirationInMillis();
  return (
    <div tw="flex text-7xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "5.5rem" }}>
        <StatsHeader {...props} />
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

function AllowanceStatsImage(props: StatsImageProps<DegenAllowanceStats>) {
  const { stats } = props;
  const expirationInMillis = getExpirationInMillis();
  return (
    <div tw="flex text-7xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "4rem" }}>
        <StatsHeader {...props} />
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
        </div>
      </div>
    </div>
  );
}

function InitialImageLayout({
  statsImage,
  message,
}: {
  statsImage: React.ReactNode;
  message?: string;
}) {
  return (
    <div tw="flex w-full h-full relative justify-center items-center">
      <div
        tw="flex w-full h-full justify-center items-center"
        style={{ opacity: message ? 0.5 : 1 }}
      >
        {statsImage}
      </div>
      {message && (
        <div tw="flex absolute p-12 items-center justify-center w-full h-full">
          <div
            tw="flex flex-wrap px-12 py-8 bg-lime-900 shadow-xl text-lime-400 rounded text-5xl text-center"
            style={{ lineHeight: "1.5" }}
          >
            {message}
          </div>
        </div>
      )}
    </div>
  );
}

function AllowanceInitialImage({
  message,
  baseUrl = fallbackBaseUrl,
}: { message?: string } & BaseImageProps) {
  return (
    <InitialImageLayout
      statsImage={
        <AllowanceStatsImage
          stats={FAKE_DATA}
          addresses={["0x12345", "0x45678"]}
          userData={{
            username: "madhatter",
            displayName: "mad hatter 🎩",
            profileImage: `${baseUrl}/mad_hatter.jpg`,
          }}
        />
      }
      message={message}
    />
  );
}

function InitialImage({
  message,
  baseUrl = fallbackBaseUrl,
}: { message?: string } & BaseImageProps) {
  return (
    <InitialImageLayout
      statsImage={
        <StatsImage
          stats={FAKE_DATA}
          addresses={["0x12345", "0x45678"]}
          userData={{
            username: "madhatter",
            displayName: "mad hatter 🎩",
            profileImage: `${baseUrl}/mad_hatter.jpg`,
          }}
        />
      }
      message={message}
    />
  );
}

interface ImageOptions {
  baseUrl?: string;
}

async function toAllowanceImage(image: React.ReactElement) {
  return toImage(image, "1.91:1");
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

export async function generateAllowanceInitialImage(
  options: ImageOptions
): Promise<ImageResponse> {
  return toAllowanceImage(
    <ImageLayout baseUrl={options.baseUrl} compact>
      <AllowanceInitialImage baseUrl={options.baseUrl} />
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

export async function generateAllowanceErrorImage(
  {
    error,
  }: {
    error: string;
  },
  options: ImageOptions
): Promise<ImageResponse> {
  return toAllowanceImage(
    <ImageLayout baseUrl={options.baseUrl} compact>
      <AllowanceInitialImage message={error} baseUrl={options.baseUrl} />
    </ImageLayout>
  );
}

export async function generateStatsImage(
  props: StatsImageProps<DegenStats>,
  options: ImageOptions
): Promise<ImageResponse> {
  return toImage(
    <ImageLayout baseUrl={options.baseUrl}>
      <StatsImage {...props} />
    </ImageLayout>
  );
}

export async function generateAllowanceStatsImage(
  props: StatsImageProps<DegenAllowanceStats>,
  options: ImageOptions
): Promise<ImageResponse> {
  return toAllowanceImage(
    <ImageLayout baseUrl={options.baseUrl} compact>
      <AllowanceStatsImage {...props} />
    </ImageLayout>
  );
}
