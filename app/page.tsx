import { Metadata } from "next";
import { NextServerPageProps } from "frames.js/next/types";
import { fetchMetadata } from "frames.js/next";

import { currentURL } from "./utils";
import { basePath } from "./frames/frames";

export async function generateMetadata({
  searchParams,
}: NextServerPageProps): Promise<Metadata> {
  const queryParams = new URLSearchParams();
  if (searchParams?.fid) {
    queryParams.set("fid", searchParams.fid as string);
  }
  if (searchParams?.signed) {
    queryParams.set("signed", searchParams.signed as string);
  }

  const paramsString = queryParams.toString();
  const framesUrl = currentURL(
    `${basePath}${paramsString ? `?${paramsString}` : ""}`
  );
  const other = await fetchMetadata(framesUrl);
  return {
    title: "Degen Stats by ds8",
    description: "Show my degen stats",
    other,
  };
}

export default async function Home() {
  return <div />;
}
