module open_uet::reward_system;

use sui::coin::TreasuryCap;
use sui::tx_context;

// Nhập loại Coin từ module đã tạo trước đó
use open_uet::uet_coin::UET_COIN;
use sui::coin::split;
use sui::coin;
use sui::coin::Coin;

/// Object này là Quyền quản lý Hệ thống Thưởng.
/// Nó BẮT BUỘC phải giữ TreasuryCap<UET_COIN>.
/// Chỉ người sở hữu (Admin) mới có thể sử dụng object này.
public struct RewardSystemCap has key, store {
    id: UID,
    treasury_cap: TreasuryCap<UET_COIN>
}

/// Struct đại diện cho một Yêu cầu nộp chứng chỉ
public struct SubmissionRequest has key, store {
    id: UID,
    submitter: address,          // Địa chỉ của người nộp
    cid_link: vector<u8>,        // Content ID (CID) từ IPFS (liên kết đến hình ảnh)
    certificate_code: vector<u8>,// Mã chứng chỉ
    student_id: vector<u8>,      // Mã sinh viên
    submitted_at: u64,           // Timestamp (Ngày giờ nộp)
    is_approved: bool,           // Trạng thái: false = Chờ duyệt, true = Đã duyệt
}

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

/// Đây là hàm mà Admin sẽ gọi sau khi đã "duyệt" chứng chỉ Off-chain.
/// Việc gọi hàm này chính là hành động "Admin gửi coin cho tài khoản đó" on-chain.
public entry fun reward_student(
    admin_cap: &mut RewardSystemCap, // Admin phải gửi kèm Object quản trị này để chứng minh quyền hạn
    student_address: address,        // Địa chỉ Sui của sinh viên nhận thưởng
    reward_amount: u64,
    coin: &mut Coin<UET_COIN>,       // Số lượng UET_COIN sẽ được đúc và chuyển
    ctx: &mut TxContext,
) {

    let reward_coin = coin::split(coin, reward_amount, ctx);
    transfer::public_transfer(reward_coin, student_address);
}

/// Entry fun để tạo Yêu cầu Nộp mới
public entry fun submit_request(
    cid: vector<u8>,
    code: vector<u8>,
    student_id: vector<u8>,
    ctx: &mut TxContext
) {
    let request = SubmissionRequest {
        id: object::new(ctx),
        submitter: ctx.sender(),
        cid_link: cid,
        certificate_code: code,
        student_id: student_id,
        submitted_at: tx_context::epoch_timestamp_ms(ctx), // Lấy thời gian hiện tại của mạng Sui
        is_approved: false
    };

    // Chia sẻ Object này để Admin có thể tìm thấy và tương tác
    transfer::public_share_object(request);
}