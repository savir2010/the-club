"""Tool definitions, input validation and execution for the concierge."""
import json
from typing import Any, Callable

from pydantic import BaseModel, Field, ValidationError

import config
import shop

SLOTS: dict[str, list[str]] = config.load("settings.json")["delivery_slots"]
ADDRESS_IDS = [a["id"] for a in config.load("member.json")["addresses"]]
CATEGORIES = ["Flower", "Pre-rolls", "Vapes", "Edibles", "Concentrates", "Topicals"]
Emit = Callable[[dict], None]

_TOOLS = [
    {
        "name": "search_catalog",
        "description": "Search the club's catalog. Returns matching products with brand, strain type, format, potency, listed effects, retail and member price, stock and any bundle offer. House brands come first. Call this before recommending anything; recommend only products it returns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free text, e.g. 'gummies', 'live rosin', 'Jukebox'"},
                "category": {"type": "string", "enum": CATEGORIES},
                "effects": {"type": "array", "items": {"type": "string"}, "description": "Listed effects, e.g. relaxed, social, uplifted, calm, sleepy, focused"},
                "strain_type": {"type": "string", "enum": ["Indica", "Sativa", "Hybrid", "CBD"]},
                "brand": {"type": "string", "description": "e.g. 'Copperstate'"},
                "format": {"type": "string", "description": "e.g. '3.5 g', 'cartridge'"},
                "max_price": {"type": "number", "description": "Maximum member price in dollars"},
                "in_stock_only": {"type": "boolean"},
            },
        },
    },
    {
        "name": "get_product",
        "description": "Get one product by id, with all catalog fields.",
        "input_schema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
    },
    {
        "name": "show_products",
        "description": "Show product cards in the chat. Use whenever you recommend or point to products: one to three cards, each with a one-line reason in plain words. Cards already show name, brand, potency, format and prices.",
        "input_schema": {
            "type": "object",
            "properties": {
                "picks": {
                    "type": "array", "minItems": 1, "maxItems": 3,
                    "items": {
                        "type": "object",
                        "properties": {"id": {"type": "string"}, "reason": {"type": "string", "description": "One short sentence: why this fits"}},
                        "required": ["id", "reason"],
                    },
                }
            },
            "required": ["picks"],
        },
    },
    {
        "name": "add_to_cart",
        "description": "Add products to the member's cart. Call as soon as the member asks to add or buy something; no need to confirm. The page animates each item into the cart. Returns the updated cart with totals.",
        "input_schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array", "minItems": 1,
                    "items": {
                        "type": "object",
                        "properties": {"id": {"type": "string"}, "qty": {"type": "integer", "minimum": 1, "maximum": 10}},
                        "required": ["id", "qty"],
                    },
                }
            },
            "required": ["items"],
        },
    },
    {
        "name": "remove_from_cart",
        "description": "Remove a product from the cart entirely.",
        "input_schema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
    },
    {
        "name": "update_quantity",
        "description": "Set the quantity of a product already in the cart.",
        "input_schema": {
            "type": "object",
            "properties": {"id": {"type": "string"}, "qty": {"type": "integer", "minimum": 1, "maximum": 10}},
            "required": ["id", "qty"],
        },
    },
    {
        "name": "view_cart",
        "description": "Return the cart with every price and total computed by the shop. Use these numbers; never do the math yourself.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_member_profile",
        "description": "Return the member's name, plan, likes, dislikes, past orders (with product ids), the_usual (their most recent order, ready to add) and this week's picks you chose for them.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_bundles",
        "description": "Return the Box offer (any 3 items in one order, an extra percentage off; mix and match) and how many more items the current cart needs.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "go_to_checkout",
        "description": "Only members can have you place an order (place_order); for a guest you can only take them to checkout, where they join first. Take the member to checkout: the page opens the cart and clicks Proceed to checkout, then you fill in checkout in front of them with your own cursor. Call when they say to buy now, check out, place the order, pay now or 'buy it'. Add the items first. Pass the delivery day, window and address when they name them ('8pm' means the window starting at 8:00 PM; 'home' or 'my house' means the home address). Set place_order true only when they clearly ask to pay or place the order now; then you press Place order for them. Fails if the cart is empty, over a purchase limit, or the window doesn't exist.",
        "input_schema": {
            "type": "object",
            "properties": {
                "delivery_day": {"type": "string", "enum": list(SLOTS)},
                "delivery_window": {"type": "string", "enum": sorted({s for v in SLOTS.values() for s in v})},
                "address": {"type": "string", "enum": ADDRESS_IDS},
                "place_order": {"type": "boolean"},
            },
        },
    },
    {
        "name": "suggest_replies",
        "description": "Set the quick-reply chips above the member's input box. Call at the end of every reply with two to four short things the member might say next, in their own voice.",
        "input_schema": {
            "type": "object",
            "properties": {"replies": {"type": "array", "minItems": 2, "maxItems": 4, "items": {"type": "string", "maxLength": 40}}},
            "required": ["replies"],
        },
    },
]

# Stream tool inputs as they are generated; we validate them below because the API then doesn't.
TOOLS = [{**t, "eager_input_streaming": True} for t in _TOOLS]


class _Pick(BaseModel):
    id: str = Field(min_length=1)
    reason: str = Field(min_length=1)


class _Item(BaseModel):
    id: str = Field(min_length=1)
    qty: int = Field(ge=1, le=10)


class _Search(BaseModel):
    query: str | None = None
    category: str | None = None
    effects: list[str] | None = None
    strain_type: str | None = None
    brand: str | None = None
    format: str | None = None
    max_price: float | None = None
    in_stock_only: bool | None = None


class _Id(BaseModel):
    id: str = Field(min_length=1)


class _Show(BaseModel):
    picks: list[_Pick] = Field(min_length=1)


class _Add(BaseModel):
    items: list[_Item] = Field(min_length=1)


class _Checkout(BaseModel):
    delivery_day: str | None = None
    delivery_window: str | None = None
    address: str | None = None
    place_order: bool = False


class _Replies(BaseModel):
    replies: list[str] = Field(min_length=1)


class _Empty(BaseModel):
    pass


SCHEMAS: dict[str, type[BaseModel]] = {
    "search_catalog": _Search,
    "get_product": _Id,
    "show_products": _Show,
    "add_to_cart": _Add,
    "remove_from_cart": _Id,
    "update_quantity": _Item,
    "view_cart": _Empty,
    "get_member_profile": _Empty,
    "get_bundles": _Empty,
    "go_to_checkout": _Checkout,
    "suggest_replies": _Replies,
}


class Outcome(BaseModel):
    content: str
    is_error: bool = False


def _json(v: Any) -> Outcome:
    return Outcome(content=json.dumps(v))


def _missing(pid: str) -> Outcome:
    return Outcome(content=f"No product with id {pid}. Use search_catalog to find real ids.", is_error=True)


def run_tool(name: str, raw: Any, cart: list[shop.Line], emit: Emit, member: bool = False, phone: bool = False) -> Outcome:
    """Runs one tool against this turn's cart. Mutates `cart`; sends UI events through `emit`.
    `member` is False for a guest: no profile, and no placing orders on their behalf.
    `phone` is True for a real text thread (sms_bridge): there is no page, so placing an order is instant."""
    schema = SCHEMAS.get(name)
    if schema is None:
        return Outcome(content=f"Unknown tool {name}", is_error=True)
    try:
        data = schema.model_validate(raw if isinstance(raw, dict) else {})
    except ValidationError as e:
        return Outcome(content=json.dumps({"INVALID_INPUT": [err["msg"] for err in e.errors()]}), is_error=True)
    a = data.model_dump()

    match name:
        case "search_catalog":
            hits = shop.search_catalog(**a)
            return _json({"count": len(hits), "products": hits})
        case "get_product":
            p = shop.BY_ID.get(a["id"])
            return _json(shop.product_view(p)) if p else _missing(a["id"])
        case "show_products":
            picks = a["picks"][:3]
            bad = next((pk for pk in picks if pk["id"] not in shop.BY_ID), None)
            if bad:
                return _missing(bad["id"])
            emit({"t": "products", "picks": picks})
            return Outcome(content=f"Showing {len(picks)} card(s) in the chat, each with an Add button.")
        case "add_to_cart":
            added, problems = [], []
            for it in a["items"]:
                p = shop.BY_ID.get(it["id"])
                if not p:
                    problems.append(f"No product with id {it['id']}.")
                    continue
                if not p["in_stock"]:
                    problems.append(f"{p['name']} is out of stock; offer the closest match instead.")
                    continue
                line = next((l for l in cart if l["id"] == it["id"]), None)
                if line:
                    line["qty"] += it["qty"]
                else:
                    cart.append({"id": it["id"], "qty": it["qty"]})
                emit({"t": "cart", "op": "add", "id": it["id"], "qty": it["qty"]})
                added.append(f"{p['name']} × {it['qty']}")
            return Outcome(content=json.dumps({"added": added, "problems": problems, "cart": shop.cart_view(cart)}),
                           is_error=not added)
        case "remove_from_cart":
            line = next((l for l in cart if l["id"] == a["id"]), None)
            if not line:
                return Outcome(content="That product is not in the cart.", is_error=True)
            cart.remove(line)
            emit({"t": "cart", "op": "remove", "id": a["id"]})
            return _json({"removed": a["id"], "cart": shop.cart_view(cart)})
        case "update_quantity":
            line = next((l for l in cart if l["id"] == a["id"]), None)
            if not line:
                return Outcome(content="That product is not in the cart; use add_to_cart.", is_error=True)
            line["qty"] = a["qty"]
            emit({"t": "cart", "op": "set", "id": a["id"], "qty": a["qty"]})
            return _json({"updated": a["id"], "qty": a["qty"], "cart": shop.cart_view(cart)})
        case "view_cart":
            return _json(shop.cart_view(cart))
        case "get_member_profile":
            if not member:
                return Outcome(content="The shopper is a guest, not signed in. There is no profile; don't use a name or past orders.", is_error=True)
            return _json(shop.member_profile())
        case "get_bundles":
            return _json({"box": shop.box_offer(cart)})
        case "go_to_checkout":
            if not cart:
                return Outcome(content="The cart is empty. Add something first.", is_error=True)
            problem = shop.limit_problem(cart)
            if problem:
                return Outcome(content=f"Checkout blocked: {problem} Ask the member what to remove.", is_error=True)
            day = a.get("delivery_day") or ("Today" if a.get("delivery_window") in SLOTS["Today"] else None)
            if not day and a.get("delivery_window"):
                day = next((d for d, ws in SLOTS.items() if a["delivery_window"] in ws), None)
            window = a.get("delivery_window")
            if window and (not day or window not in SLOTS[day]):
                options = "; ".join(f"{d}: {', '.join(ws)}" for d, ws in SLOTS.items())
                return Outcome(content=f"No {window} window {('on ' + day) if day else ''}. Windows are {options}. Ask which one they want.", is_error=True)
            wanted_pay = bool(a.get("place_order"))
            if phone:
                if not wanted_pay:
                    return Outcome(content=(
                        "Nothing placed. Over text there is no checkout page: once they confirm, call go_to_checkout "
                        "again with place_order true and the window and address."), is_error=True)
                if not window:
                    options = "; ".join(f"{d}: {', '.join(ws)}" for d, ws in SLOTS.items())
                    return Outcome(content=f"Not placed: no delivery window yet. Windows are {options}. Ask which one.", is_error=True)
            plan = {"day": day, "window": window, "address": a.get("address"), "pay": wanted_pay and member}
            emit({"t": "checkout", **plan})
            if not member:
                note = (
                    "The shopper is a guest, so you can't pay or place the order for them. They're being taken to checkout, "
                    "where they join the Club first (ID, state check, bank, plan), then choose delivery and pay themselves. "
                    "Tell them that in one short line" + (" and that you can't place it for them until they're a member." if wanted_pay else ".")
                )
            elif plan["pay"] and phone:
                note = ("The order is placed. A confirmation text with the order number, total, window, address and driver "
                        "goes out automatically right after your reply, so reply with one short, warm line and no details.")
            elif plan["pay"]:
                note = "You'll fill in checkout with your cursor and place the order."
            else:
                note = "The member is being taken to checkout to review it."
            return _json({"ok": True, "note": note, "plan": plan, "cart": shop.cart_view(cart)})
        case "suggest_replies":
            replies = [r.strip()[:40] for r in a["replies"] if r.strip()][:4]
            emit({"t": "chips", "items": replies})
            return Outcome(content="Chips updated.")
    return Outcome(content=f"Unhandled tool {name}", is_error=True)
