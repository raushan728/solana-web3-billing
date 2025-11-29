use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); 
#[program]
pub mod solana_billing {
    use super::*;
     pub fn initialize_merchant(ctx: Context<InitializeMerchant>) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        
        merchant.authority = ctx.accounts.authority.key();
        merchant.usdc_mint = ctx.accounts.usdc_mint.key();
        merchant.plan_count = 0;
        merchant.bump = ctx.bumps.merchant;
        
        msg!("Merchant Created! Owner: {}", merchant.authority);
        Ok(())
    }
    pub fn create_plan(
        ctx: Context<CreatePlan>, 
        amount: u64,
        duration: i64
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        let plan = &mut ctx.accounts.plan;
        plan.merchant = merchant.key();
        plan.plan_id = merchant.plan_count;
        plan.amount = amount;
        plan.duration = duration;
        plan.is_active = true;
        plan.bump = ctx.bumps.plan;
        merchant.plan_count += 1;

        msg!("Plan Created! ID: {}, Price: {}", plan.plan_id, amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMerchant<'info> {
    #[account(
        init, 
        seeds = [b"merchant", authority.key().as_ref()], 
        bump, 
        payer = authority, 
        space = 8 + 32 + 32 + 32 + 8 + 1
    )]
    pub merchant: Account<'info, Merchant>,

    /// CHECK: We are taking this only to store the address (the address of the USDC mint)
    pub usdc_mint: UncheckedAccount<'info>, 

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CreatePlan<'info> {
    #[account(
        mut,
        has_one = authority, 
        seeds = [b"merchant", authority.key().as_ref()],
        bump = merchant.bump
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        init,
        // PDA Seed: "plan" + merchant_address + plan_id (bytes mein)
        seeds = [
            b"plan", 
            merchant.key().as_ref(), 
            &merchant.plan_count.to_le_bytes()
        ], 
        bump, 
        payer = authority, 
        space = 8 + 32 + 8 + 8 + 8 + 1 + 1
    )]
    pub plan: Account<'info, Plan>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
#[account]
pub struct Merchant {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault: Pubkey,
    pub plan_count: u64,
    pub bump: u8,
}
#[account]
pub struct Plan {
    pub merchant: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
    pub duration: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct Subscription {
    pub customer: Pubkey,
    pub merchant: Pubkey,
    pub plan: Pubkey,
    pub start_time: i64,
    pub next_billing_time: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct Invoice {
    pub subscription: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub tx_sig: String,
    pub bump: u8,
}