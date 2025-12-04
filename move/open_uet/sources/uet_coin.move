module open_uet::uet_coin;
use sui::coin_registry;
use sui::coin::TreasuryCap;
use sui::coin;

public struct UET_COIN has drop {}

fun init(witness: UET_COIN, ctx: &mut TxContext) {
    let (builder, treasury_cap) = coin_registry::new_currency_with_otw(
        witness,
        3,
        b"UETC".to_string(),
        b"UET Coin".to_string(),
        b"The official coin of the UET ecosystem".to_string(),
        b"https://upload.wikimedia.org/wikipedia/vi/b/bf/Logo_HUET.svg".to_string(),
        ctx
    );

    let metadata_cap = coin_registry::finalize(builder, ctx);

    transfer::public_transfer(treasury_cap, ctx.sender());
    transfer::public_transfer(metadata_cap, ctx.sender());
}

public fun mint_and_transfer(
    treasury_cap: &mut TreasuryCap<UET_COIN>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    coin::mint_and_transfer(treasury_cap, amount, recipient, ctx);
}

public fun burn(treasury_cap: &mut TreasuryCap<UET_COIN>, coin: coin::Coin<UET_COIN>) {
    coin::burn(treasury_cap, coin);
}

public fun balance(coin: &coin::Coin<UET_COIN>): u64 {
    coin::value(coin)
}