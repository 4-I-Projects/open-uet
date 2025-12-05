module open_uet::reward_system;

use sui::coin::TreasuryCap;
use open_uet::uet_coin::UET_COIN;
use sui::coin;
use sui::coin::Coin;
use std::string::String;

const ERROR_ALREADY_APPROVED: u64 = 0;
const ERROR_ZERO_REWARD: u64 = 1;

/// Object này là Quyền quản lý Hệ thống Thưởng.
/// Nó BẮT BUỘC phải giữ TreasuryCap<UET_COIN>.
/// Chỉ người sở hữu (Admin) mới có thể sử dụng object này.
public struct RewardSystemCap has key, store {
    id: UID
}

/// Struct đại diện cho một Yêu cầu nộp chứng chỉ
public struct SubmissionRequest has key, store {
    id: UID,
    submitter: address, // Địa chỉ ví của người nộp
    cid_link: String, // Content ID (CID) từ IPFS (liên kết đến hình ảnh)
    certificate_code: String, // Mã chứng chỉ
    student_id: String, // Mã sinh viên
    submitted_at: u64, // Timestamp (Ngày giờ nộp)
    is_approved: bool, // Trạng thái: false = Chờ duyệt, true = Đã duyệt
}

/// Hàm này được gọi một lần duy nhất sau khi Coin Module được publish.
/// Nó lấy TreasuryCap từ Coin Module và lưu trữ nó trong một Object quản trị.
public entry fun create_reward_system(
    ctx: &mut TxContext
) {
    let admin_cap = RewardSystemCap {
        id: object::new(ctx)
    };

    // Chuyển Object quản trị này đến địa chỉ của Admin (người triển khai)
    transfer::public_transfer(admin_cap, ctx.sender());
}

/// Entry fun để tạo Yêu cầu Nộp mới
public entry fun submit_request(
    cid_link: String,
    code: String,
    student_id: String,
    ctx: &mut TxContext
) {
    let request = SubmissionRequest {
        id: object::new(ctx),
        submitter: ctx.sender(),
        cid_link: cid_link,
        certificate_code: code,
        student_id: student_id,
        submitted_at: tx_context::epoch_timestamp_ms(ctx), // Lấy thời gian hiện tại của mạng Sui
        is_approved: false
    };

    // Chia sẻ Object này để Admin có thể tìm thấy và tương tác
    transfer::public_share_object(request);
}

/// Entry fun để Admin phê duyệt yêu cầu và thưởng coin.
    /// 🚀 Hàm Entry Fun: Admin duyệt Yêu cầu và Thưởng Coin
    ///
    /// @param admin_cap: Object chứng minh quyền hạn của Admin (phải được sở hữu bởi Admin)
    /// @param request: Object Yêu cầu cần được cập nhật (phải là Shared Object)
    /// @param source_coin: Coin<UET_COIN> mà Admin đưa vào để chia và thưởng (CHUYỂN THEO GIÁ TRỊ)
    /// @param reward_amount: Số lượng UET_COIN muốn thưởng
public entry fun approve_and_reward(
    admin_cap: &RewardSystemCap,      // Quyền Admin (chỉ dùng để xác thực)
    request: &mut SubmissionRequest, // Yêu cầu sẽ bị thay đổi trạng thái
    source_coin: &mut Coin<UET_COIN>,     // Pool coin của Admin để chia
    reward_amount: u64,
    ctx: &mut TxContext,
) {
    // 1. Kiểm tra trạng thái: Đảm bảo yêu cầu chưa được duyệt và số coin thưởng > 0
    assert!(!request.is_approved, ERROR_ALREADY_APPROVED);
    assert!(reward_amount > 0, ERROR_ZERO_REWARD);
    
    // 2. Cập nhật trạng thái Yêu cầu
    request.is_approved = true;

    // 3. Chia coin (Thực hiện logic thưởng của bạn)
    // coin::split() tạo ra 2 object: 
    // - `reward_coin`: Coin mới với số lượng `reward_amount`.
    // - `remaining_coin`: Object source_coin ban đầu với số lượng còn lại.
    let reward_coin = coin::split(source_coin, reward_amount, ctx);

    // 4. Chuyển coin thưởng cho sinh viên
    transfer::public_transfer(reward_coin, request.submitter);
}