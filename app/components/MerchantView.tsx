"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useBilling } from "../hooks/useBilling";
import { web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Coins, Briefcase, PlusCircle, Rocket } from "lucide-react";

export default function MerchantView() {
  const { getProgram, wallet, createFakeUsdc } = useBilling();
  const [usdcMint, setUsdcMint] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const initMerchant = async () => {
    if (!wallet || !usdcMint) return alert("Connect Wallet & Enter USDC Mint");
    setLoading(true);
    try {
      const program = getProgram() as any;
      if (!program) return;
      const [merchantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), wallet.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .initializeMerchant()
        .accounts({
          merchant: merchantPda,
          usdcMint: new PublicKey(usdcMint),
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      alert("Merchant Created!");
    } catch (err) {
      console.error(err);
      alert("Failed or already exists.");
    }
    setLoading(false);
  };

  const createPlan = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const program = getProgram() as any;
      if (!program) return;
      const [merchantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), wallet.publicKey.toBuffer()],
        program.programId
      );
      const merchantAccount = await program.account.merchant.fetch(merchantPda);
      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(
        BigInt(merchantAccount.planCount.toString())
      );
      const [planPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPda.toBuffer(), planIdBuffer],
        program.programId
      );
      await program.methods
        .createPlan(new BN(5000000), new BN(60))
        .accounts({
          merchant: merchantPda,
          plan: planPda,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      alert(`Plan Created! ID: ${merchantAccount.planCount.toString()}`);
    } catch (err) {
      console.error(err);
      alert("Failed.");
    }
    setLoading(false);
  };

  const createTestToken = async () => {
    setLoading(true);
    try {
      const mint = await createFakeUsdc();
      setUsdcMint(mint.toBase58());
      alert("Fake USDC Created!");
    } catch (e) {
      console.error(e);
      alert("Failed.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-purple-500/30 w-full max-w-md shadow-2xl shadow-purple-900/20"
    >
      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="text-purple-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Merchant Portal</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            Step 1: Setup Token
          </label>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createTestToken}
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
          >
            <Coins size={16} /> {loading ? "Processing..." : "Create Fake USDC"}
          </motion.button>
          <input
            type="text"
            placeholder="USDC Mint Address"
            value={usdcMint}
            onChange={(e) => setUsdcMint(e.target.value)}
            className="w-full mt-2 bg-black/40 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 p-2 rounded text-white text-sm outline-none transition-all"
          />
        </div>

        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 8px rgb(168 85 247 / 0.5)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={initMerchant}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Rocket size={20} /> Initialize Merchant
        </motion.button>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Create Basic Plan ($5 / 60s)
          </p>
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgb(34 197 94 / 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={createPlan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} /> Create Plan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
