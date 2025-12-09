module open_uet::vouchers; 

use open_uet::uet_coin::UET_COIN;
use sui::coin::Coin;
use std::ascii::String;
use sui::event;
use sui::coin;

// use sui::dynamic_object_field as dof;
public struct VOUCHERS has drop {}

public struct VoucherMinted has copy, drop {
    object_id: ID,
    owner: address,
    name: String,
    service_id: ID,
}

public struct Voucher has key, store {
    id: UID,
    value: u64,
    service_id: ID,
}


public struct AdminCap has key {id: UID}

public struct ShopRegistry has key, store {
    id: UID,
    // service_type: String,
    balance: u64,
    shops: vector<ID>,
}


public struct ShopCap has key, store {
    id: UID,
    shop_id: ID,
}

public struct Shop has key, store {
    id: UID,
    name: String,
    description: String,
    owner: address,
    services: vector<ID>,
}

public struct Service has key, store {
    id: UID,
    name: String,
    price: u64,
    shop_id: ID,
    // payments: table::Table<address, Coin<UET_COIN>>,
    payments: Coin<UET_COIN>,
}

fun init(_: VOUCHERS, ctx: &mut TxContext) {
    // let publisher = package::claim(owt, ctx);

    transfer::transfer(AdminCap{
        id: object::new(ctx)
    }, ctx.sender());

    // Share the object to make it accessible to everyone!
    transfer::share_object(ShopRegistry {
        id: object::new(ctx),
        balance: 0,
        shops: vector::empty<ID>()
    })
}

fun buy(
    service: &mut Service,
    coin: Coin<UET_COIN>,
    ctx: &mut TxContext,
): Voucher {
    assert!(coin.value() >= service.price, 0);

    let sender = ctx.sender();

    let voucher = Voucher {
        id: object::new(ctx),
        value: coin.value(),
        service_id: service.id.to_inner()
    };

    event::emit(VoucherMinted {
        object_id: object::id(&voucher),
        owner: sender,
        name: service.name,
        service_id: service.id.to_inner(),
    });

    service.payments.join(coin);

   voucher 
}

#[allow(lint(self_transfer))]
public fun buy_voucher(
    service: &mut Service,
    coin: Coin<UET_COIN>,
    ctx: &mut TxContext,
) {
    let voucher = buy(service, coin, ctx);
    transfer::public_transfer(voucher, ctx.sender());
}

// /// Update the `description` of `nft` to `new_description`
// public fun update_description(
//     nft: &mut TestnetNFT,
//     new_description: vector<u8>,
//     _: &mut TxContext,
// ) {
//     nft.description = string::utf8(new_description)
// }

// /// Permanently delete `nft`
// public fun burn(nft: TestnetNFT, _: &mut TxContext) {
//     let TestnetNFT { id, name: _, description: _, url: _ } = nft;
//     id.delete()
// }

#[allow(lint(self_transfer))]
public fun register_shop(
    shop_registry: &mut ShopRegistry,
    name: String,
    description: String,
    ctx: &mut TxContext,
) {
    let shop: Shop = Shop {
        id: object::new(ctx),
        name: name,
        description: description,
        owner: ctx.sender(),
        services: vector::empty(),
    };
    let shop_id = shop.id.to_inner();

    // dof::add(&mut shop_registry.id, name, shop);
    vector::push_back(&mut shop_registry.shops, shop_id);

    let shopCap: ShopCap = ShopCap {
        id: object::new(ctx),
        shop_id:  shop_id,
    };
    transfer::public_transfer(shopCap, ctx.sender());

    transfer::share_object(shop);
}

public fun register_service(
    shop: &mut Shop,
    shop_cap: &ShopCap,
    name: String,
    price: u64,
    ctx: &mut TxContext,
) {
    assert!(shop_cap.shop_id == shop.id.to_inner(), 0);

    let service = Service {
        id: object::new(ctx),
        name: name,
        price: price,
        shop_id: shop.id.to_inner(),
        payments: coin::zero(ctx),
    };

    let service_id = service.id.to_inner();

    // shop.services.add(service_id, service);
    vector::push_back(&mut shop.services, service_id);

    transfer::share_object(service);
}

public fun check_voucher(
    service: &Service,
    shop_cap: &ShopCap,
    voucher: Voucher,
) {
    assert!(shop_cap.shop_id == service.shop_id, 0);
    assert!(service.id.to_inner() == voucher.service_id, 0);
    let Voucher { id, .. } = voucher;
    object::delete(id);
}

fun take_profit(
    service: &mut Service,
    amount: u64,
    ctx: &mut TxContext,
): Coin<UET_COIN> {
    service.payments.split(amount, ctx)
}

public fun take_profit_and_keep(
    service: &mut Service,
    amount: u64,
    ctx: &mut TxContext,
) {
    let splittedAmount: Coin<UET_COIN> = take_profit(service, amount, ctx);
    coin::send_funds(splittedAmount, ctx.sender());
}