import { ImageResponse } from "@vercel/og";

import { options } from "../../satori-options";
import { baseUrl } from "../../constants";
import { DegenStats } from "./fetch-degen-stats";

async function toImage(image: React.ReactElement): Promise<ImageResponse> {
  return new ImageResponse(image, options);
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

interface UserData {
  displayName?: string;
  profileImage?: string;
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

function ImageLayout({ children }: React.PropsWithChildren) {
  return (
    <div tw="w-full h-full relative bg-slate-900 text-4xl text-sky-100 justify-center items-center flex flex-col">
      <div tw="flex w-full h-full p-12" style={{ gap: "3rem" }}>
        <div
          tw="flex h-full flex-col items-center w-64"
          style={{ gap: "2rem" }}
        >
          <div tw="flex flex-1 w-2 bg-violet-500" />
          <div tw="flex">
            <img src={`${baseUrl}/hat.png`} alt="hat" width="85" height="72" />
          </div>
          <div tw="flex flex-1 w-2 bg-violet-500" />
        </div>
        <div tw="flex flex-1 items-center pr-28">{children}</div>
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
    <div tw="flex text-3xl justify-between" style={{ gap: "3rem" }}>
      <div tw="flex text-slate-500">{label}</div>
      <div tw="flex text-slate-400">{value}</div>
    </div>
  );
}

function StatsImage(props: StatsImageProps) {
  const { stats, userData, addresses } = props;
  return (
    <div tw="flex text-5xl w-full">
      <div tw="flex flex-col w-full" style={{ gap: "3rem" }}>
        <div tw="flex items-center" style={{ gap: "2rem" }}>
          <div tw="flex flex-col relative">
            <img
              tw="w-28 h-28 rounded border-8 border-sky-400"
              src={userData.profileImage}
              alt="Profile"
              width="112"
              height="112"
            />
          </div>
          <div tw="flex flex-col" style={{ gap: "0.75rem" }}>
            <div tw="flex">{userData.displayName}</div>
            <div tw="flex text-3xl text-slate-400">
              {addresses.length} address
              {(addresses.length || 0) > 1 ? "es" : ""}
            </div>
          </div>
        </div>
        <div tw="flex flex-col text-4xl w-full" style={{ gap: "2rem" }}>
          <StatsItemContainer>
            <StatsItem
              label="Rank"
              value={
                stats.minRank === -1 ? (
                  <div tw="flex text-slate-400">Unranked</div>
                ) : (
                  <div tw="flex">{formatNumber(stats.minRank)}</div>
                )
              }
            />
          </StatsItemContainer>
          <StatsItemContainer>
            <StatsItem
              label="Allowance"
              value={formatNumber(stats.tipAllowance)}
            />
            <StatsSubItem
              label="- remaining"
              value={formatNumber(stats.remainingAllowance)}
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

function InitialImage({ message }: { message?: string }) {
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
      <div tw="flex absolute bg-lime-900/75 text-lime-400 px-12 py-8 rounded">
        {message || "Check your own $DEGEN stats!"}
      </div>
    </div>
  );
}

export async function generateInitialImage(): Promise<ImageResponse> {
  return toImage(
    <ImageLayout>
      <InitialImage />
    </ImageLayout>
  );
}

export async function generateErrorImage({
  error,
}: {
  error: string;
}): Promise<ImageResponse> {
  return toImage(
    <ImageLayout>
      <InitialImage message={error} />
    </ImageLayout>
  );
}

export async function generateStatsImage({
  stats,
  addresses,
  userData,
}: {
  stats: DegenStats;
  addresses: string[];
  userData: UserData;
}): Promise<ImageResponse> {
  return toImage(
    <ImageLayout>
      <StatsImage stats={stats} addresses={addresses} userData={userData} />
    </ImageLayout>
  );
}
