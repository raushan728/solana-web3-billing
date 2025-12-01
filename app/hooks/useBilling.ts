/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { IDL } from "../utils/constants";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAccount,
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

    const mintKeypair = Keypair.generate();
    const lamports = await connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        6,
        wallet.publicKey,
        wallet.publicKey
      )
    );

    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.partialSign(mintKeypair);

    const signature = await wallet.signTransaction(transaction);
    const rawTransaction = signature.serialize();

    await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    return mintKeypair.publicKey;
  };
  const mintUsdcToUser = async (mint: PublicKey, amount: number) => {
    if (!wallet) throw new Error("Wallet not connected");

    const userTokenAccountAddress = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    );

    const transaction = new Transaction();
    try {
      await getAccount(connection, userTokenAccountAddress);
    } catch (e) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userTokenAccountAddress,
          wallet.publicKey,
          mint
        )
      );
    }
    transaction.add(
      createMintToInstruction(
        mint,
        userTokenAccountAddress,
        wallet.publicKey,
        amount * 1000000
      )
    );
    transaction.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signature = await wallet.signTransaction(transaction);
    const rawTransaction = signature.serialize();

    await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  };

  return {
    wallet,
    connection,
    getProgram,
    createFakeUsdc,
    mintUsdcToUser,
  };
};
