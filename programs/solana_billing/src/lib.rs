use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Apna ID baad mein daalna

#[program]
pub mod solana_billing {
    use super::*;

    // Instructions hum KAL likhenge, abhi sirf structure samajhte hain
}

// --------------------------------------------------------
// 🏛️ DATA STRUCTURES (STATE)
// --------------------------------------------------------

// 1. Merchant Account
// Ye account merchant ki details store karega.
#[account]
pub struct Merchant {
    pub authority: Pubkey,      // Merchant ka wallet address (owner)
    pub usdc_mint: Pubkey,      // Kaunsa token accept karega (USDC address)
    pub vault: Pubkey,          // Merchant ka token account jaha paisa aayega
    pub plan_count: u64,        // Total kitne plans banaye hain (ID generate karne ke liye)
    pub bump: u8,               // PDA bump
}

// Space calculation (approx): 8 + 32 + 32 + 32 + 8 + 1 = 113 bytes

// 2. Plan Account
// Example: "Gold Plan - $10/month"
#[account]
pub struct Plan {
    pub merchant: Pubkey,       // Ye plan kis merchant ka hai
    pub plan_id: u64,           // Plan ka unique number
    pub amount: u64,            // Price in USDC (decimals ke saath)
    pub duration: i64,          // Billing cycle (seconds mein, e.g., 1 month = 2592000)
    pub is_active: bool,        // Agar merchant plan band karna chahe
    pub bump: u8,
}

// 3. Subscription Account
// Ye customer aur plan ka link hai.
#[account]
pub struct Subscription {
    pub customer: Pubkey,       // Customer ka wallet
    pub merchant: Pubkey,       // Merchant ka address
    pub plan: Pubkey,           // Plan ka address
    pub start_time: i64,        // Kab join kiya
    pub next_billing_time: i64, // Agla paisa kab katega (Unix timestamp)
    pub is_active: bool,        // Kya subscription chalu hai?
    pub bump: u8,
}

// 4. Invoice Account (On-Chain Receipt)
// Har payment ke baad ye create hoga proof ke liye.
#[account]
pub struct Invoice {
    pub subscription: Pubkey,   // Kis subscription ka bill hai
    pub amount: u64,            // Kitna kata
    pub timestamp: i64,         // Kab kata
    pub tx_sig: String,         // (Optional) Transaction signature store kar sakte hain agar string choti ho
    pub bump: u8,
}