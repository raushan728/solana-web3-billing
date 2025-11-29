import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaBilling } from "../target/types/solana_billing";
import { createMint } from "@solana/spl-token";

describe("solana_billing", () => {
  // Provider set karo (Devnet connection)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaBilling as Program<SolanaBilling>;
  
  // Variables jo hum use karenge
  let merchantUsdcMint: anchor.web3.PublicKey;
  let merchantPda: anchor.web3.PublicKey;
  let planPda: anchor.web3.PublicKey;

  it("Is Initialized (Merchant Created)!", async () => {
    // 1. Fake USDC Mint karo (Test ke liye)
    merchantUsdcMint = await createMint(
        provider.connection,
        provider.wallet.payer, // Payer
        provider.wallet.publicKey, // Mint Authority
        null, 
        6 // Decimals
    );
    console.log("Fake USDC Mint Address:", merchantUsdcMint.toBase58());

    // 2. Merchant PDA calculate karo
    [merchantPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), provider.wallet.publicKey.toBuffer()],
        program.programId
    );

    // 3. Instruction Call karo
    const tx = await program.methods
      .initializeMerchant()
      .accounts({
        merchant: merchantPda,
        usdcMint: merchantUsdcMint,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
      
    console.log("Merchant Created! Tx:", tx);
  });

  it("Create a Plan!", async () => {
    const planIdBuffer = Buffer.alloc(8);
    planIdBuffer.writeBigUInt64LE(BigInt(0)); 

    [planPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPda.toBuffer(), planIdBuffer],
        program.programId
    );

    
    const amount = new anchor.BN(10_000_000);
    const duration = new anchor.BN(2592000);

    const tx = await program.methods
      .createPlan(amount, duration)
      .accounts({
        merchant: merchantPda,
        plan: planPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Plan Created! Tx:", tx);
  });
});