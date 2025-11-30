/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { IDL } from "../utils/constants";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
} from "@solana/spl-token";

export const useBilling = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const getProgram = () => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });
    return new Program(IDL as Idl, provider as any);
  };

  const createFakeUsdc = async () => {
    if (!wallet) throw new Error("Wallet not connected");
    const mint = await createMint(
      connection,
      wallet as any,
      wallet.publicKey,
      null,
      6
    );
    return mint;
  };

  const mintUsdcToUser = async (mint: PublicKey, amount: number) => {
     if (!wallet) throw new Error("Wallet not connected");
     const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet as any,
        mint,
        wallet.publicKey
     );
     await mintTo(
        connection,
        wallet as any,
        mint,
        userTokenAccount.address,
        wallet.publicKey,
        amount * 1000000
     );
  };

  return {
    wallet,
    connection,
    getProgram,
    createFakeUsdc,
    mintUsdcToUser
  };
};