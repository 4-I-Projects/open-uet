module open_uet::reward_system;

use sui::tx_context::TxContext;
use sui::transfer;
use sui::object::{Self, UID};
use sui::coin::TreasuryCap;

// Nhập loại Coin từ module đã tạo trước đó
use open_uet::uet_coin::UET_COIN;

// -------------------------------------------------------------------------
// 1. OBJECT QUẢN TRỊ (ADMIN CAPABILITY)
// -------------------------------------------------------------------------

/// Object này là Quyền quản lý Hệ thống Thưởng.
/// Nó BẮT BUỘC phải giữ TreasuryCap<UET_COIN> để có thể đúc (mint) coin.
/// Chỉ người sở hữu (Admin) mới có thể sử dụng object này.
public struct RewardSystemCap has key, store {
    id: UID,
    treasury_cap: TreasuryCap<UET_COIN>
}

// -------------------------------------------------------------------------
// 2. KHỞI TẠO HỆ THỐNG THƯỞNG
// -------------------------------------------------------------------------

/// Hàm này được gọi một lần duy nhất sau khi Coin Module được publish.
/// Nó lấy TreasuryCap từ Coin Module và lưu trữ nó trong một Object quản trị.
public entry fun create_reward_system(
    treasury_cap: TreasuryCap<UET_COIN>, // TreasuryCap từ Coin Module
    ctx: &mut TxContext
) {
    let admin_cap = RewardSystemCap {
        id: object::new(ctx),
        treasury_cap,
    };
    // Chuyển Object quản trị này đến địa chỉ của Admin (người triển khai)
    transfer::public_transfer(admin_cap, ctx.sender());
}

// -------------------------------------------------------------------------
// 3. CƠ CHẾ QUY ĐỔI (PHÊ DUYỆT VÀ THƯỞNG COIN)
// -------------------------------------------------------------------------

/// Đây là hàm mà Admin sẽ gọi sau khi đã "duyệt" chứng chỉ Off-chain.
/// Việc gọi hàm này chính là hành động "Admin gửi coin cho tài khoản đó" on-chain.
public entry fun reward_student(
    admin_cap: &mut RewardSystemCap, // Admin phải gửi kèm Object quản trị này để chứng minh quyền hạn
    student_address: address,        // Địa chỉ Sui của sinh viên nhận thưởng
    reward_amount: u64,              // Số lượng UET_COIN sẽ được đúc và chuyển
    ctx: &mut TxContext,
) {
    // Đúc coin mới và chuyển trực tiếp đến địa chỉ của sinh viên
    admin_cap.treasury_cap.mint_and_transfer(reward_amount, student_address, ctx);
}