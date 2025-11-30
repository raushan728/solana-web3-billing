"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useBilling } from "../hooks/useBilling";
import { web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

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
      
      alert("Merchant Created Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error: Merchant shayad pehle se bana hai.");
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
      const nextPlanId = merchantAccount.planCount;

      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(BigInt(nextPlanId.toString()));

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

      alert(`Plan Created! Plan ID: ${nextPlanId.toString()}`);
    } catch (err) {
      console.error(err);
      alert("Plan creation failed.");
    }
    setLoading(false);
  };

  const createTestToken = async () => {
    setLoading(true);
    try {
        const mint = await createFakeUsdc();
        setUsdcMint(mint.toBase58());
        alert("Fake USDC Created! Mint Address Saved.");
    } catch(e) {
        console.error(e);
        alert("Transaction failed (Maybe no SOL?)");
    }
    setLoading(false);
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">👨‍💼 Merchant Dashboard</h2>
      
      <div className="space-y-4">
        <div>
            <label className="text-xs text-gray-400">Step 1: Get Token</label>
            <button 
                onClick={createTestToken}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm mb-2"
            >
                {loading ? "Processing..." : "Create Fake USDC (For Test)"}
            </button>
            <input 
                type="text" 
                placeholder="USDC Mint Address" 
                value={usdcMint}
                onChange={(e) => setUsdcMint(e.target.value)}
                className="w-full bg-black border border-gray-600 p-2 rounded text-white"
            />
        </div>

        <button 
          onClick={initMerchant}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-bold"
        >
          Initialize Merchant
        </button>

        <div className="border-t border-gray-600 pt-4">
            <p className="text-sm text-gray-300 mb-2">Create a $5 Plan (60 sec)</p>
            <button 
            onClick={createPlan}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
            >
            Create Plan
            </button>
        </div>
      </div>
    </div>
  );
}