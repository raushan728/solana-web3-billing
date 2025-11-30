"use client";

import dynamic from "next/dynamic";
import AppWalletProvider from "../components/AppWalletProvider";
import MerchantView from "../components/MerchantView";
import CustomerView from "../components/CustomerView";
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <AppWalletProvider>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <header className="flex justify-between items-center mb-10 max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Solana Billing 💳
          </h1>
          <WalletMultiButton style={{ backgroundColor: '#512da8' }} />
        </header>

        <main className="flex flex-col md:flex-row gap-8 justify-center items-start max-w-6xl mx-auto">
          {/* Left Side: Merchant */}
          <MerchantView />

          {/* Right Side: Customer */}
          <CustomerView />
        </main>
      </div>
    </AppWalletProvider>
  );
}