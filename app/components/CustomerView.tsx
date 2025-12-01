"use client";
import { useState } from "react";
import { useBilling } from "../hooks/useBilling";
import { web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { motion } from "framer-motion";
import { User, CreditCard, DollarSign, CheckCircle } from "lucide-react";

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
      const program = getProgram() as any;
      if (!program) return;
      const authorityPubkey = new PublicKey(merchantAddress);

      const [merchantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), authorityPubkey.toBuffer()],
        program.programId
      );

      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(BigInt(planIdInput));

      const [planPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPda.toBuffer(), planIdBuffer],
        program.programId
      );
      const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          wallet.publicKey.toBuffer(),
          planPda.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .subscribe()
        .accounts({
          subscription: subscriptionPda,
          plan: planPda,
          merchant: merchantPda,
          customer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      alert("Subscribed Successfully! 🎉");
    } catch (err: any) {
      console.error(err);
      alert("Subscription Failed: " + err.message);
    }
    setLoading(false);
  };

  const payBill = async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const program = getProgram() as any;
      if (!program) return;
      const authorityPubkey = new PublicKey(merchantAddress);
      const mintPubkey = new PublicKey(usdcMint);

      const [merchantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), authorityPubkey.toBuffer()],
        program.programId
      );

      const planIdBuffer = Buffer.alloc(8);
      planIdBuffer.writeBigUInt64LE(BigInt(planIdInput));

      const [planPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPda.toBuffer(), planIdBuffer],
        program.programId
      );

      const [subscriptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("subscription"),
          wallet.publicKey.toBuffer(),
          planPda.toBuffer(),
        ],
        program.programId
      );

      const invoiceIdBn = new BN(Math.floor(Date.now() / 1000));
      const [invoicePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invoice"),
          subscriptionPda.toBuffer(),
          invoiceIdBn.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const customerToken = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );
      const merchantToken = await getAssociatedTokenAddress(
        mintPubkey,
        authorityPubkey
      ); // Vault owner Authority hai

      await program.methods
        .makePayment(invoiceIdBn)
        .accounts({
          subscription: subscriptionPda,
          plan: planPda,
          invoice: invoicePda,
          merchant: merchantPda,
          customer: wallet.publicKey,
          customerTokenAccount: customerToken,
          merchantTokenAccount: merchantToken,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      alert("Payment Successful! 💸");
    } catch (err: any) {
      console.error(err);
      alert("Payment Failed: " + err.message);
    }
    setLoading(false);
  };

  const getMoney = async () => {
    if (!usdcMint) return;
    setLoading(true);
    try {
      await mintUsdcToUser(new PublicKey(usdcMint), 100);
      alert("Got 100 USDC!");
    } catch (e: any) {
      console.error(e);
      alert("Failed: " + e.message);
    }
    setLoading(false);
  };

  const inputClass =
    "w-full bg-black/40 border border-gray-600 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 p-3 rounded-lg text-white text-sm outline-none transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-8 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-pink-500/30 w-full max-w-md shadow-2xl shadow-pink-900/20 mt-6 md:mt-0"
    >
      <div className="flex items-center gap-3 mb-6">
        <User className="text-pink-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Customer Portal</h2>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Merchant Wallet Address"
          onChange={(e) => setMerchantAddress(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Plan ID (e.g. 0)"
            onChange={(e) => setPlanIdInput(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            type="text"
            placeholder="USDC Mint"
            onChange={(e) => setUsdcMint(e.target.value)}
            className={`${inputClass} flex-[2]`}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={getMoney}
          disabled={loading}
          className="w-full bg-blue-600/20 border border-blue-500/50 text-blue-300 p-2 rounded-lg text-sm hover:bg-blue-600/40 transition-all flex justify-center items-center gap-2"
        >
          <DollarSign size={16} /> Get 100 Fake USDC
        </motion.button>

        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={subscribe}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-pink-900/50 flex justify-center items-center gap-2"
          >
            <CheckCircle size={18} /> Subscribe
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={payBill}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-yellow-900/50 flex justify-center items-center gap-2"
          >
            <CreditCard size={18} /> Pay Bill
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
