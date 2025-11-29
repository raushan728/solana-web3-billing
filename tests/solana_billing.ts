import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaBilling } from "../target/types/solana_billing";
import { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
} from "@solana/spl-token";
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("solana_billing", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaBilling as Program<SolanaBilling>;

  let merchantUsdcMint: anchor.web3.PublicKey;
  let merchantPda: anchor.web3.PublicKey;
  let planPda: anchor.web3.PublicKey;
  let subscriptionPda: anchor.web3.PublicKey;
  let invoicePda: anchor.web3.PublicKey;

  const customer = anchor.web3.Keypair.generate();

  it("Is Initialized (Merchant Created)!", async () => {
    merchantUsdcMint = await createMint(
        provider.connection,
        provider.wallet.payer,
        provider.wallet.publicKey,
        null,
        6
    );
    console.log("Mint Address:", merchantUsdcMint.toBase58());
    await wait(2000);

   
    [merchantPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("merchant"), provider.wallet.publicKey.toBuffer()],
        program.programId
    );

   
    try {
        await program.methods
        .initializeMerchant()
        .accounts({
            merchant: merchantPda,
            usdcMint: merchantUsdcMint,
            authority: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
        console.log("Merchant Created!");
    } catch (e) {
        console.log("Merchant already exists (skipped)");
    }
    await wait(2000); 
  });

  it("Create a FAST Plan (5 Seconds duration)", async () => {
    const merchantAccount = await program.account.merchant.fetch(merchantPda);
    const nextPlanId = merchantAccount.planCount;
    
    const planIdBuffer = Buffer.alloc(8);
    planIdBuffer.writeBigUInt64LE(BigInt(nextPlanId.toString()));

    [planPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("plan"), merchantPda.toBuffer(), planIdBuffer],
        program.programId
    );

    const amount = new anchor.BN(5_000_000); 
    const duration = new anchor.BN(5);

    await program.methods
      .createPlan(amount, duration)
      .accounts({
        merchant: merchantPda,
        plan: planPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`Plan Created! ID: ${nextPlanId.toString()}`);
    await wait(2000);
  });

  it("Customer Subscribes & Pays", async () => {
    console.log("Airdropping SOL to Customer...");
    const airdropSig = await provider.connection.requestAirdrop(customer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSig
    });
    console.log("Customer funded!");
    await wait(2000);

   
    [subscriptionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("subscription"), customer.publicKey.toBuffer(), planPda.toBuffer()],
        program.programId
    );

   
    await program.methods
        .subscribe()
        .accounts({
            subscription: subscriptionPda,
            plan: planPda,
            merchant: merchantPda, 
            customer: customer.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([customer]) 
        .rpc();

    console.log("Customer Subscribed!");
    await wait(2000); // 2 second wait

    const customerTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        merchantUsdcMint,
        customer.publicKey
    );
    await wait(1000);

    const merchantTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        merchantUsdcMint,
        provider.wallet.publicKey 
    );
    await wait(1000);

    await mintTo(
        provider.connection,
        provider.wallet.payer,
        merchantUsdcMint,
        customerTokenAccount.address,
        provider.wallet.publicKey,
        100_000_000 
    );
    console.log("Customer got 100 USDC!");

    console.log("Waiting 6 seconds for bill to be due...");
    await wait(6000);

    const invoiceId = Math.floor(Date.now() / 1000);
    const invoiceIdBn = new anchor.BN(invoiceId);

    [invoicePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("invoice"), subscriptionPda.toBuffer(), invoiceIdBn.toArrayLike(Buffer, "le", 8)],
        program.programId
    );

    await program.methods
        .makePayment(invoiceIdBn)
        .accounts({
            subscription: subscriptionPda,
            plan: planPda,
            invoice: invoicePda,
            merchant: merchantPda,
            customer: customer.publicKey,
            customerTokenAccount: customerTokenAccount.address,
            merchantTokenAccount: merchantTokenAccount.address,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([customer])
        .rpc();

    console.log("Payment Successful! Invoice Generated.");
  });
});