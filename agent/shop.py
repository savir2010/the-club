"""Catalog, cart, bundle and limit logic. Every number the agent repeats comes from here."""
import re
from typing import TypedDict

from config import load

CATALOG: list[dict] = load("catalog.json")
BUNDLES: list[dict] = load("bundles.json")
MEMBER: dict = load("member.json")
LIMITS: dict = load("limits.json")
BY_ID = {p["id"]: p for p in CATALOG}


class Line(TypedDict):
    id: str
    qty: int


def money(n: float) -> float:
    return round(n + 1e-9, 2)


def bundle_for(p: dict) -> dict | None:
    return next(
        (b for b in BUNDLES if b["brand"] == p["brand"] and b["category"] == p["category"] and b["format"] == p["format"]),
        None,
    )


def unit_price(p: dict, qty: int) -> float:
    """Bundle price once the minimum is met, else member price (same rule as the site)."""
    b = bundle_for(p)
    return b["price_each"] if b and qty >= b["min_qty"] else p["member_price"]


def product_view(p: dict) -> dict:
    b = bundle_for(p)
    keep = ("id", "brand", "house_brand", "name", "category", "strain_type", "format", "potency",
            "effects", "flavor", "retail_price", "member_price", "in_stock", "description")
    view = {k: p[k] for k in keep}
    view["bundle"] = {"min_qty": b["min_qty"], "price_each": b["price_each"]} if b else None
    return view


def search_catalog(query=None, category=None, effects=None, strain_type=None, brand=None,
                   format=None, max_price=None, in_stock_only=None) -> list[dict]:
    needle = (query or "").strip().lower()
    wanted = [e.lower() for e in (effects or [])]

    def match(p: dict) -> bool:
        haystack = " ".join([p["name"], p["brand"], p["category"], p["strain_type"], p["format"],
                             p["description"], *p["flavor"], *p["effects"]]).lower()
        return all((
            not category or p["category"].lower() == category.lower(),
            not strain_type or p["strain_type"].lower() == strain_type.lower(),
            not brand or p["brand"].lower() == brand.lower(),
            not format or format.lower() in p["format"].lower(),
            max_price is None or p["member_price"] <= max_price,
            not in_stock_only or p["in_stock"],
            not wanted or any(e in p["effects"] for e in wanted),
            not needle or all(word in haystack for word in needle.split()),
        ))

    hits = [p for p in CATALOG if match(p)]
    hits.sort(key=lambda p: (not p["house_brand"], -p.get("rating", 0)))  # house brands first
    return [product_view(p) for p in hits]


def cart_view(cart: list[Line]) -> dict:
    items = []
    for line in cart:
        p = BY_ID.get(line["id"])
        if not p:
            continue
        each = unit_price(p, line["qty"])
        b = bundle_for(p)
        items.append({
            "id": p["id"], "name": p["name"], "brand": p["brand"], "format": p["format"], "qty": line["qty"],
            "retail_each": p["retail_price"], "member_each": p["member_price"], "price_each_charged": each,
            "bundle_applied": bool(b and line["qty"] >= b["min_qty"]), "line_total": money(each * line["qty"]),
        })
    retail = money(sum(i["retail_each"] * i["qty"] for i in items))
    subtotal = money(sum(i["line_total"] for i in items))
    return {
        "items": items,
        "item_count": sum(i["qty"] for i in items),
        "retail_value": retail,
        "member_savings": money(retail - subtotal),
        "delivery": "Free",
        "subtotal": subtotal,
        "note": "Tax and driver tip are added at checkout.",
    }


def bundles_for(cart: list[Line]) -> list[dict]:
    out = []
    for b in BUNDLES:
        eligible = [p for p in CATALOG if bundle_for(p) is b]
        in_cart = [l for l in cart if any(p["id"] == l["id"] for p in eligible)]
        out.append({
            **b,
            "eligible_products": [{"id": p["id"], "name": p["name"], "member_price": p["member_price"]} for p in eligible],
            "already_in_cart": sum(l["qty"] for l in in_cart),
            "applied": any(l["qty"] >= b["min_qty"] for l in in_cart),
        })
    return out


def _grams(p: dict, qty: int) -> float:
    pack = re.search(r"(\d+)\s*×\s*([\d.]+)\s*g", p["format"])
    if pack:
        return int(pack[1]) * float(pack[2]) * qty
    single = re.search(r"([\d.]+)\s*g\b", p["format"])
    return float(single[1]) * qty if single else 0.0


def limit_problem(cart: list[Line]) -> str | None:
    flower = concentrate = 0.0
    for line in cart:
        p = BY_ID.get(line["id"])
        if not p:
            continue
        if p["category"] in ("Flower", "Pre-rolls"):
            flower += _grams(p, line["qty"])
        if p["category"] in ("Concentrates", "Vapes"):
            concentrate += _grams(p, line["qty"])
    if flower > LIMITS["flower_grams"]:
        return f"This order has {money(flower)} g of flower; the per-order limit is {LIMITS['flower_grams']} g."
    if concentrate > LIMITS["concentrate_grams"]:
        return f"This order has {money(concentrate)} g of concentrate and vape oil; the per-order limit is {LIMITS['concentrate_grams']} g."
    return None


def member_profile() -> dict:
    m = MEMBER
    return {"first_name": m["first"], "last_name": m["last"], "member_since": m["since"], "plan": m["plan"],
            "likes": m["likes"], "dislikes": m["dislikes"], "past_orders": m["pastOrders"]}
