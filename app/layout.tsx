import type { Metadata } from "next";
import "./globals.css";
import { StorageProviderWrapper } from "@/lib/storage";
import { Nav } from "@/components/Nav";
import { SyncBar } from "@/components/SyncBar";

export const metadata: Metadata = {
  title: "Meal Prep",
  description: "Plan, prep, and improve your weekly meals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <StorageProviderWrapper>
          <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-1 max-w-[1400px] w-full mx-auto px-8 py-10">{children}</main>
            <SyncBar />
          </div>
        </StorageProviderWrapper>
      </body>
    </html>
  );
}
