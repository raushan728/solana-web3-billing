use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); 
#[program]
pub mod solana_billing {
    use super::*;

   
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