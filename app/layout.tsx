import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // without a title, warpcast won't validate your frame
  title: "Degen Stats by ds8",
  description: "Show my degen stats",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-w-full min-h-dvh flex flex-col items-center justify-center bg-slate-900 text-sky-100 font-degen p-8 text-center">
        {children}
        <div className="w-full">
          $DEGEN stats by{" "}
          <a
            href="https://warpcast.com/ds8"
            className="text-sky-400 hover:underline hover:text-sky-500"
          >
            ds8
          </a>
        </div>
      </body>
    </html>
  );
}
