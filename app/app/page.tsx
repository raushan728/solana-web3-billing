"use client";

import dynamic from "next/dynamic";
import AppWalletProvider from "../components/AppWalletProvider";
import MerchantView from "../components/MerchantView";
import CustomerView from "../components/CustomerView";
import { motion } from "framer-motion";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <AppWalletProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white font-sans">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
        </div>
        <header className="relative z-50 flex flex-col md:flex-row justify-between items-center p-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 md:mb-0"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg animate-pulse"></div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Solana{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Billing
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <WalletMultiButton
              style={{
                backgroundColor: "rgba(124, 58, 237, 0.8)",
                backdropFilter: "blur(10px)",
              }}
            />
          </motion.div>
        </header>
        <main className="relative z-10 flex flex-col lg:flex-row gap-8 justify-center items-start max-w-6xl mx-auto mt-10 p-4 pb-20">
          <MerchantView />
          <CustomerView />
        </main>
        <footer className="relative z-10 text-center text-gray-500 pb-8 text-sm">
          Built with ❤️ on Solana Devnet
        </footer>
      </div>
    </AppWalletProvider>
  );
}
