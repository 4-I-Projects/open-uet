module open_uet::uet_coin;

use sui::coin;
use sui::coin::Coin;
use sui::coin_registry::{Self, CoinRegistry};
use sui::coin::TreasuryCap;

const TOTAL_SUPPLY: u64 = 1000000000_000000; // Tổng cung cố định của UET_COIN

public struct UET_COIN has key {
    id: UID
}

public fun new_currency(registry: &mut CoinRegistry, ctx: &mut TxContext) {
    let (mut currency, mut treasury_cap) = coin_registry::new_currency<UET_COIN>(
        registry,
        6,
        b"UETC".to_string(),
        b"UET Coin".to_string(),
        b"The official coin of the UET ecosystem".to_string(),
        b"https://ivory-glamorous-catshark-670.mypinata.cloud/ipfs/bafkreigudqzfehptkrx35p5kx65yru6vmprwwnmqdycucr4f64iwjrpq3q".to_string(),
        ctx
    );

    let total_supply = treasury_cap.mint(TOTAL_SUPPLY, ctx);
    currency.make_supply_burn_only(treasury_cap);

    let metadata_cap = currency.finalize(ctx);
    transfer::public_transfer(metadata_cap, ctx.sender());

    transfer::public_transfer(total_supply, ctx.sender());
}

public entry fun burn(
    treasury_cap: &mut TreasuryCap<UET_COIN>,
    coin: Coin<UET_COIN>
) {
    coin::burn(treasury_cap, coin);
}

public fun balance(coin: &Coin<UET_COIN>): u64 {
    coin::value(coin)
}