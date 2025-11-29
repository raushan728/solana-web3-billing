use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};

declare_id!("Fq8hS98ADTeuB249ATJjzdmH3g8rDYDU2uA3yzBZNhsw"); 
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

    pub fn subscribe(ctx: Context<Subscribe>) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        let plan = &ctx.accounts.plan;
        let clock = Clock::get()?;
        
        subscription.customer = ctx.accounts.customer.key();
        subscription.merchant = ctx.accounts.merchant.key();
        subscription.plan = plan.key();
        
        subscription.start_time = clock.unix_timestamp;
        subscription.next_billing_time = clock.unix_timestamp + plan.duration;
        
        subscription.is_active = true;
        subscription.bump = ctx.bumps.subscription;

        msg!("Subscribed! Next billing: {}", subscription.next_billing_time);
        Ok(())
    }

      pub fn make_payment(ctx: Context<MakePayment>, invoice_id: i64) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        let plan = &ctx.accounts.plan;
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        if clock.unix_timestamp < subscription.next_billing_time {
             return err!(ErrorCode::PaymentNotDue);
        }

        let transfer_instruction = Transfer {
            from: ctx.accounts.customer_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.customer.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, plan.amount)?; 

        subscription.next_billing_time += plan.duration;

        invoice.subscription = subscription.key();
        invoice.amount = plan.amount;
        invoice.timestamp = clock.unix_timestamp;
        invoice.bump = ctx.bumps.invoice;
        
        msg!("Payment Success! Invoice Created.");
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

#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(
        init,
             seeds = [
            b"subscription", 
            customer.key().as_ref(), 
            plan.key().as_ref()
        ], 
        bump,
        payer = customer, 
        space = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 1
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(
        mut, 
        has_one = merchant 
    )]
    pub plan: Account<'info, Plan>,

    /// CHECK: To match the merchant's address
    pub merchant: UncheckedAccount<'info>,

    #[account(mut)]
    pub customer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(invoice_id: i64)]
pub struct MakePayment<'info> {
    #[account(
        mut,
        has_one = plan,
        has_one = merchant,
        has_one = customer 
    )]
    pub subscription: Account<'info, Subscription>,

    #[account(has_one = merchant)]
    pub plan: Account<'info, Plan>,

    #[account(
        init,
        // Ab hum argument wala 'invoice_id' use kar rahe hain seed ke liye
        seeds = [
            b"invoice", 
            subscription.key().as_ref(), 
            &invoice_id.to_le_bytes() 
        ], 
        bump, 
        payer = customer, 
        space = 8 + 32 + 8 + 8 + 50 + 1 
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(mut)]
    pub merchant: Account<'info, Merchant>,

    #[account(mut)]
    pub customer: Signer<'info>,

    #[account(mut)] 
    pub customer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
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
#[error_code]
pub enum ErrorCode {
    #[msg("Payment is not due yet.")]
    PaymentNotDue,
}