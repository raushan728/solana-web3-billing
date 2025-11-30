"use client";
import { useState } from "react";
import { useBilling } from "../hooks/useBilling";
import { web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default function CustomerView() {
  const { getProgram, wallet, mintUsdcToUser } = useBilling();
  const [merchantAddress, setMerchantAddress] = useState("");
  const [planIdInput, setPlanIdInput] = useState("0");
  const [usdcMint, setUsdcMint] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const merchantPubkey = new PublicKey(merchantAddress);
      
      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(BigInt(planIdInput));

      const [planPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPubkey.toBuffer(), planIdBuffer],
        program.programId
      );

      const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), wallet.publicKey.toBuffer(), planPda.toBuffer()],
        program.programId
      );

      await program.methods
        .subscribe()
        .accounts({
          subscription: subscriptionPda,
          plan: planPda,
          merchant: merchantPubkey,
          customer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      alert("Subscribed Successfully!");
    } catch (err) {
      console.error(err);
      alert("Subscription Failed.");
    }
    setLoading(false);
  };

  const payBill = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;
      
      const merchantPubkey = new PublicKey(merchantAddress);
      const mintPubkey = new PublicKey(usdcMint);

      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(BigInt(planIdInput));

      const [planPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPubkey.toBuffer(), planIdBuffer],
        program.programId
      );

      const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), wallet.publicKey.toBuffer(), planPda.toBuffer()],
        program.programId
      );

      const invoiceId = Math.floor(Date.now() / 1000);
      const invoiceIdBn = new BN(invoiceId);

      const [invoicePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("invoice"), subscriptionPda.toBuffer(), invoiceIdBn.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const customerToken = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey);
      const merchantToken = await getAssociatedTokenAddress(mintPubkey, merchantPubkey);

      await program.methods
        .makePayment(invoiceIdBn)
        .accounts({
            subscription: subscriptionPda,
            plan: planPda,
            invoice: invoicePda,
            merchant: merchantPubkey,
            customer: wallet.publicKey,
            customerTokenAccount: customerToken,
            merchantTokenAccount: merchantToken,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      alert("Payment Successful! 💸");
    } catch (err) {
      console.error(err);
      alert("Payment Failed (Maybe billing time not reached?)");
    }
    setLoading(false);
  };

  const getMoney = async () => {
    if(!usdcMint) return alert("Enter Mint Address first");
    setLoading(true);
    try {
        await mintUsdcToUser(new PublicKey(usdcMint), 100);
        alert("You got 100 Fake USDC!");
    } catch(e) { console.error(e); alert("Failed to mint"); }
    setLoading(false);
  }

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mt-6">
      <h2 className="text-2xl font-bold mb-4 text-pink-400">👤 Customer Dashboard</h2>

      <div className="space-y-3">
        <input 
            type="text" 
            placeholder="Merchant Wallet Address" 
            onChange={(e) => setMerchantAddress(e.target.value)}
            className="w-full bg-black border border-gray-600 p-2 rounded text-white"
        />
        <input 
            type="text" 
            placeholder="Plan ID (e.g. 0)" 
            onChange={(e) => setPlanIdInput(e.target.value)}
            className="w-full bg-black border border-gray-600 p-2 rounded text-white"
        />
        <input 
            type="text" 
            placeholder="USDC Mint Address" 
            onChange={(e) => setUsdcMint(e.target.value)}
            className="w-full bg-black border border-gray-600 p-2 rounded text-white"
        />

        <button onClick={getMoney} disabled={loading} className="w-full bg-blue-600 p-2 rounded">
            {loading ? "..." : "Get 100 Fake USDC"}
        </button>

        <div className="flex gap-2">
            <button onClick={subscribe} disabled={loading} className="flex-1 bg-pink-600 hover:bg-pink-700 p-3 rounded font-bold">
            Subscribe
            </button>
            <button onClick={payBill} disabled={loading} className="flex-1 bg-yellow-600 hover:bg-yellow-700 p-3 rounded font-bold">
            Pay Bill
            </button>
        </div>
      </div>
    </div>
  );
}