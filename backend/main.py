import ssl
import certifi
from decimal import Decimal
ALLOWED_CUSTOM_INGREDIENTS = {
    "Cheese",
    "Bacon",
    "Fried Onions",
    "Red Onions",
    "Pickles",
    "Jalapeños",
    "Tomato",
    "Lettuce",
    "Ketchup",
    "Mustard",
    "Mayo",
    "BBQ Sauce",
}

BASE_DOGGY_PRICE = Decimal("3.50")
EXTRA_INGREDIENT_PRICE = Decimal("0.50")
MAX_ORDER_ITEMS = 20
MAX_QUANTITY_PER_ITEM = 20

from fastapi import Header
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.database import get_connection
from backend.security import (
    password_hash,
    create_access_token,
    require_admin,
    
)

app = FastAPI(title="Doggy Doggy API")
SUPABASE_URL = "https://emgidrggkrqekztfqrqn.supabase.co"
SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xiI4drD-EMZKsoQf8HQoPQ_KuO41-6V"


def get_customer_id(authorization: str | None) -> str | None:
    if not authorization:
        return None

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token i pavlefshëm."
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token i munguar."
        )

    request = Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {token}",
        },
        method="GET",
    )

    try:
        with urlopen(
    request,
    timeout=10,
    context=ssl.create_default_context(cafile=certifi.where())
) as response:
            user = json.loads(response.read().decode("utf-8"))
            user_id = user.get("id")

            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="Llogaria nuk u verifikua."
                )

            return user_id

    except HTTPException:
        raise
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"SUPABASE HTTP ERROR: {error.code} {body}")

        if error.code in (401, 403):
            raise HTTPException(
                status_code=401,
                detail="Sesioni ka skaduar. Kyçu përsëri."
            )

        raise HTTPException(
            status_code=502,
            detail="Nuk u verifikua dot llogaria."
        )

    except (URLError, TimeoutError, OSError) as error:
        print(f"SUPABASE CONNECTION ERROR: {error!r}")

        raise HTTPException(
            status_code=502,
            detail="Supabase nuk është i qasshëm për momentin."
        )
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ""
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    image_url: str = ""
    category: str = ""
    is_available: bool = True


@app.get("/")
def home():
    return {"message": "Doggy Doggy backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/auth/login")
def login(data: LoginRequest):
    email = data.email.strip().lower()

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT password_hash FROM admin_users WHERE email = %s",
                (email,),
            )
            row = cursor.fetchone()

    if not row or not password_hash.verify(data.password, row[0]):
        raise HTTPException(
            status_code=401,
            detail="Email ose password i pasakte",
        )

    return {
        "access_token": create_access_token(email),
        "token_type": "bearer",
    }


@app.get("/products")
def get_products():
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, description, price, image_url,
                       category, is_available
                FROM products
                ORDER BY id
            """)
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "price": float(row[3]),
            "image_url": row[4],
            "category": row[5],
            "is_available": row[6],
        }
        for row in rows
    ]


@app.post("/products", status_code=201)
def create_product(
    product: ProductCreate,
    admin_email: str = Depends(require_admin),
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO products
                    (name, description, price, image_url,
                     category, is_available)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, description, price,
                          image_url, category, is_available
            """, (
                product.name.strip(),
                product.description,
                product.price,
                product.image_url,
                product.category,
                product.is_available,
            ))
            row = cursor.fetchone()

    return {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "price": float(row[3]),
        "image_url": row[4],
        "category": row[5],
        "is_available": row[6],
    }


@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    admin_email: str = Depends(require_admin),
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE products
                SET name = %s,
                    description = %s,
                    price = %s,
                    image_url = %s,
                    category = %s,
                    is_available = %s
                WHERE id = %s
                RETURNING id, name, description, price,
                          image_url, category, is_available
            """, (
                product.name.strip(),
                product.description,
                product.price,
                product.image_url,
                product.category,
                product.is_available,
                product_id,
            ))
            row = cursor.fetchone()

            if row is None:
                raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "price": float(row[3]),
        "image_url": row[4],
        "category": row[5],
        "is_available": row[6],
    }


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    admin_email: str = Depends(require_admin),
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM products WHERE id = %s RETURNING id",
                (product_id,),
            )
            row = cursor.fetchone()

            if row is None:
                raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product deleted successfully", "id": row[0]}


@app.patch("/products/{product_id}/availability")
def toggle_product_availability(
    product_id: int,
    admin_email: str = Depends(require_admin),
):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE products
                SET is_available = NOT is_available
                WHERE id = %s
                RETURNING id, is_available
            """, (product_id,))
            row = cursor.fetchone()

            if row is None:
                raise HTTPException(status_code=404, detail="Product not found")

    return {"id": row[0], "is_available": row[1]}

from decimal import Decimal
from pydantic import BaseModel, Field
from typing import List



class OrderItemInput(BaseModel):
    product_id: int | None = None
    quantity: int
    is_custom: bool = False
    custom_ingredients: list[str] = []




class CreateOrderInput(BaseModel):
    customer_name: str = Field(min_length=2, max_length=150)
    phone: str = Field(min_length=5, max_length=30)
    address: str = ""
    city: str = ""
    notes: str = ""
    order_type: str = "delivery"
    payment_method: str = "cash"
    items: List[OrderItemInput]


@app.post("/orders")
def create_order(
    order: CreateOrderInput,
    authorization: str | None = Header(default=None),
):
    customer_id = get_customer_id(authorization)
    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Shporta është bosh."
        )

    if len(order.items) > 20:
        raise HTTPException(
            status_code=400,
            detail="Shporta mund të ketë maksimumi 20 produkte."
        )

    customer_name = order.customer_name.strip()
    phone = order.phone.strip()
    address = order.address.strip()
    city = order.city.strip()
    notes = order.notes.strip()
    order_type = order.order_type.strip().lower()
    payment_method = order.payment_method.strip().lower()

    if not 2 <= len(customer_name) <= 100:
        raise HTTPException(
            status_code=400,
            detail="Emri duhet të ketë 2 deri në 100 karaktere."
        )

    phone_digits = "".join(
        character for character in phone if character.isdigit()
    )

    if len(phone_digits) < 9 or len(phone) > 25:
        raise HTTPException(
            status_code=400,
            detail="Numri i telefonit duhet t'i ketë së paku 9 shifra."
        )

    if order_type not in {"delivery", "pickup"}:
        raise HTTPException(
            status_code=400,
            detail="Lloji i porosisë duhet të jetë delivery ose pickup."
        )

    if payment_method not in {"cash", "card"}:
        raise HTTPException(
            status_code=400,
            detail="Metoda e pagesës duhet të jetë cash ose card."
        )

    if order_type == "delivery":
        if not 5 <= len(address) <= 300:
            raise HTTPException(
                status_code=400,
                detail="Adresa duhet të ketë 5 deri në 300 karaktere."
            )

        if not city:
            raise HTTPException(
                status_code=400,
                detail="Qyteti është i detyrueshëm për delivery."
            )
    else:
        address = ""
        city = ""

    allowed_ingredients = {
        "cheese": "Cheese",
        "bacon": "Bacon",
        "fried onions": "Fried Onions",
        "red onions": "Red Onions",
        "pickles": "Pickles",
        "jalapeños": "Jalapeños",
        "tomato": "Tomato",
        "lettuce": "Lettuce",
        "ketchup": "Ketchup",
        "mustard": "Mustard",
        "mayo": "Mayo",
        "bbq sauce": "BBQ Sauce",
    }

    with get_connection() as connection:
        with connection.cursor() as cursor:
            product_ids = list({
                item.product_id
                for item in order.items
                if item.product_id is not None and not item.is_custom
            })

            products = {}

            if product_ids:
                cursor.execute(
                    """
                    SELECT id, name, price, is_available
                    FROM products
                    WHERE id = ANY(%s)
                    """,
                    (product_ids,)
                )

                products = {
                    row[0]: row for row in cursor.fetchall()
                }

            total = Decimal("0.00")
            validated_items = []

            for item in order.items:
                if (
                    not isinstance(item.quantity, int)
                    or isinstance(item.quantity, bool)
                    or not 1 <= item.quantity <= 20
                ):
                    raise HTTPException(
                        status_code=400,
                        detail="Sasia duhet të jetë numër i plotë nga 1 deri në 20."
                    )

                if item.is_custom:
                    if item.product_id is not None:
                        raise HTTPException(
                            status_code=400,
                            detail="Produkti i personalizuar nuk duhet të ketë product ID."
                        )

                    raw_ingredients = item.custom_ingredients

                    if len(raw_ingredients) > len(allowed_ingredients):
                        raise HTTPException(
                            status_code=400,
                            detail="Janë zgjedhur shumë përbërës."
                        )

                    ingredients = []

                    for ingredient in raw_ingredients:
                        if not isinstance(ingredient, str):
                            raise HTTPException(
                                status_code=400,
                                detail="Përbërës i pavlefshëm."
                            )

                        key = ingredient.strip().casefold()

                        if key not in allowed_ingredients:
                            raise HTTPException(
                                status_code=400,
                                detail="Një ose më shumë përbërës nuk lejohen."
                            )

                        ingredients.append(allowed_ingredients[key])

                    normalized = [
                        value.casefold() for value in ingredients
                    ]

                    if len(normalized) != len(set(normalized)):
                        raise HTTPException(
                            status_code=400,
                            detail="Nuk mund ta zgjedhësh të njëjtin përbërës dy herë."
                        )

                    price = Decimal("3.50") + (
                        Decimal("0.50") * len(ingredients)
                    )

                    name = "Create Your Own Doggy"
                    name += " — " + (
                        ", ".join(ingredients)
                        if ingredients
                        else "No extra ingredients"
                    )

                    validated_items.append(
                        (None, name, item.quantity, price)
                    )

                    total += price * item.quantity
                    continue

                if item.product_id is None:
                    raise HTTPException(
                        status_code=400,
                        detail="Product ID is required."
                    )

                product = products.get(item.product_id)

                if not product or not product[3]:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Produkti me ID {item.product_id} "
                            "nuk është i disponueshëm."
                        )
                    )

                product_id, name, db_price, _ = product
                price = Decimal(str(db_price))

                validated_items.append(
                    (product_id, name, item.quantity, price)
                )

                total += price * item.quantity

            delivery_fee = (
                Decimal("1.00")
                if order_type == "delivery"
                else Decimal("0.00")
            )

            total += delivery_fee

            cursor.execute(
                """
              INSERT INTO orders
    (customer_id, customer_name, phone, address, city, notes,
     order_type, payment_method, delivery_fee, total)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
RETURNING id, customer_name, phone, address, city, notes,
          order_type, payment_method, delivery_fee,
          total, status, created_at
                """,
                (
                    
    customer_id,
    customer_name,
    phone,
    address,
    city,
    notes,
    order_type,
    payment_method,
    delivery_fee,
    total,
)
        
            )

            created_order = cursor.fetchone()

            for product_id, name, quantity, price in validated_items:
                cursor.execute(
                    """
                    INSERT INTO order_items
                        (order_id, product_id, product_name,
                         quantity, unit_price)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        created_order[0],
                        product_id,
                        name,
                        quantity,
                        price
                    )
                )

    return {
        "id": created_order[0],
        "customer_name": created_order[1],
        "phone": created_order[2],
        "address": created_order[3],
        "city": created_order[4],
        "notes": created_order[5],
        "order_type": created_order[6],
        "payment_method": created_order[7],
        "delivery_fee": float(created_order[8]),
        "total": float(created_order[9]),
        "status": created_order[10],
        "created_at": created_order[11].isoformat(),
        "message": "Porosia u ruajt me sukses."
    }

@app.get("/customer/orders")
def get_customer_orders(
    authorization: str | None = Header(default=None),
):
    customer_id = get_customer_id(authorization)

    if not customer_id:
        raise HTTPException(
            status_code=401,
            detail="Duhet të kyçesh për t'i parë porositë."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, total, status, created_at
                FROM orders
                WHERE customer_id = %s
                ORDER BY created_at DESC
                """,
                (customer_id,),
            )
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "total": float(row[1] or 0),
            "status": row[2],
            "created_at": row[3].isoformat() if row[3] else None,
        }
        for row in rows
    ]

@app.get("/admin/orders")
def get_admin_orders(admin=Depends(require_admin)):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, customer_name, phone, address, total, status,
                       created_at, order_type, payment_method, delivery_fee,
                       payment_status
                FROM orders ORDER BY created_at DESC
            """)
            orders = cursor.fetchall()
            result = []
            for order in orders:
                cursor.execute("""
                    SELECT product_name, quantity, unit_price
                    FROM order_items WHERE order_id = %s
                """, (order[0],))
                items = cursor.fetchall()
                total = float(order[4] or 0)
                fee = float(order[9] or 0)
                result.append({
                    "id": order[0], "customer_name": order[1],
                    "phone": order[2], "address": order[3],
                    "total": total, "subtotal": round(total-fee, 2),
                    "status": order[5], "created_at": order[6].isoformat(),
                    "order_type": order[7], "payment_method": order[8],
                    "delivery_fee": fee, "payment_status": order[10],
                    "items": [{"name": i[0], "quantity": i[1], "price": float(i[2])} for i in items]
                })
    return result


class UpdateOrderStatusInput(BaseModel):
    status: str


@app.patch("/admin/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: UpdateOrderStatusInput,
    admin=Depends(require_admin)
):
    allowed_statuses = {
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "completed",
        "cancelled"
    }

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE orders
                SET status = %s
                WHERE id = %s
                RETURNING id, status
                """,
                (data.status, order_id)
            )
            order = cursor.fetchone()

            if not order:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found."
                )

    return {
        "id": order[0],
        "status": order[1],
        "message": "Order status updated successfully."
    }

class UpdatePaymentStatusInput(BaseModel):
    payment_status: str


@app.patch("/admin/orders/{order_id}/payment-status")
def update_payment_status(order_id: int, data: UpdatePaymentStatusInput, admin=Depends(require_admin)):
    allowed = {"unpaid", "paid", "refunded", "failed"}
    if data.payment_status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid payment status.")
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE orders SET payment_status = %s WHERE id = %s RETURNING id, payment_status", (data.payment_status, order_id))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Order not found.")
    return {"id": row[0], "payment_status": row[1]}


@app.get("/admin/stats")
def get_admin_stats(admin=Depends(require_admin)):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) AS today_orders,
                    COUNT(*) FILTER (
                        WHERE status = 'pending'
                    ) AS pending_orders,
                    COUNT(*) FILTER (
                        WHERE status = 'out_for_delivery'
                    ) AS out_for_delivery_orders,
                    COUNT(*) FILTER (
                        WHERE status = 'completed'
                    ) AS completed_orders,
                    COALESCE(
                        SUM(total) FILTER (
                            WHERE status != 'cancelled'
                        ), 0
                    ) AS today_revenue
                FROM orders
                WHERE
                    (created_at AT TIME ZONE 'Europe/Belgrade')::date =
                    (NOW() AT TIME ZONE 'Europe/Belgrade')::date
            """)

            today = cursor.fetchone()

            cursor.execute("""
                SELECT COUNT(*)
                FROM products
                WHERE is_available = TRUE
            """)

            active_products = cursor.fetchone()[0]

    return {
        "today_orders": today[0],
        "pending_orders": today[1],
        "out_for_delivery_orders": today[2],
        "completed_orders": today[3],
        "today_revenue": float(today[4]),
        "active_products": active_products
    }
@app.get("/admin/analytics/daily")
def get_daily_analytics(days: int = 30, admin=Depends(require_admin)):
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=400,
            detail="Days must be between 1 and 365."
        )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    (created_at AT TIME ZONE 'Europe/Belgrade')::date
                        AS order_date,
                    COUNT(*) AS total_orders,
                    COALESCE(
                        SUM(total) FILTER (
                            WHERE status != 'cancelled'
                        ), 0
                    ) AS revenue
                FROM orders
                WHERE
                    (created_at AT TIME ZONE 'Europe/Belgrade')::date >=
                    (NOW() AT TIME ZONE 'Europe/Belgrade')::date - (%s - 1)
                    AND
                    (created_at AT TIME ZONE 'Europe/Belgrade')::date <=
                    (NOW() AT TIME ZONE 'Europe/Belgrade')::date
                GROUP BY order_date
                ORDER BY order_date ASC
            """, (days,))

            rows = cursor.fetchall()

    return [
        {
            "date": row[0].isoformat(),
            "orders": row[1],
            "revenue": float(row[2])
        }
        for row in rows
    ]

@app.get("/admin/analytics/overview")
def get_admin_analytics_overview(days: int = 30, admin=Depends(require_admin)):
    """Aggregate real order and order-item data for the admin charts."""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365.")
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, total, COALESCE(delivery_fee, 0), status,
                       LOWER(COALESCE(payment_method, 'cash')),
                       LOWER(COALESCE(order_type, 'delivery')),
                       created_at, LOWER(COALESCE(payment_status, 'unpaid'))
                FROM orders
                WHERE (created_at AT TIME ZONE 'Europe/Belgrade')::date >=
                      (NOW() AT TIME ZONE 'Europe/Belgrade')::date - (%s - 1)
                  AND (created_at AT TIME ZONE 'Europe/Belgrade')::date <=
                      (NOW() AT TIME ZONE 'Europe/Belgrade')::date
                ORDER BY created_at ASC
            """, (days,))
            orders = cursor.fetchall()
            cursor.execute("""
                SELECT oi.product_name, SUM(oi.quantity) AS units,
                       SUM(oi.quantity * oi.unit_price) AS item_revenue,
                       COUNT(DISTINCT oi.order_id) AS order_lines
                FROM order_items oi JOIN orders o ON o.id = oi.order_id
                WHERE o.status <> 'cancelled'
                  AND (o.created_at AT TIME ZONE 'Europe/Belgrade')::date >=
                      (NOW() AT TIME ZONE 'Europe/Belgrade')::date - (%s - 1)
                  AND (o.created_at AT TIME ZONE 'Europe/Belgrade')::date <=
                      (NOW() AT TIME ZONE 'Europe/Belgrade')::date
                GROUP BY oi.product_name ORDER BY units DESC, item_revenue DESC LIMIT 8
            """, (days,))
            products = cursor.fetchall()
    from collections import defaultdict
    from datetime import date, timedelta
    revenue_by_date = defaultdict(float); orders_by_date = defaultdict(int)
    pay_counts = defaultdict(int); type_counts = defaultdict(int); status_counts = defaultdict(int)
    hour_counts = defaultdict(int)
    cash_revenue = card_revenue = delivery_fees = net_revenue = 0.0
    valid_orders = 0
    for row in orders:
        oid, total_raw, fee_raw, status, method, order_type, created_at, payment_status = row
        total = float(total_raw or 0); fee = float(fee_raw or 0)
        local_dt = created_at
        if local_dt.tzinfo is not None:
            from zoneinfo import ZoneInfo
            local_dt = local_dt.astimezone(ZoneInfo("Europe/Belgrade"))
        day = local_dt.date().isoformat()
        status_counts[status] += 1
        pay_counts[method] += 1; type_counts[order_type] += 1
        hour_counts[local_dt.hour] += 1
        if status != 'cancelled':
            net_revenue += total; delivery_fees += fee; valid_orders += 1
            revenue_by_date[day] += total; orders_by_date[day] += 1
            if method == 'cash': cash_revenue += total
            elif method == 'card': card_revenue += total
    from zoneinfo import ZoneInfo
    today_local = __import__("datetime").datetime.now(ZoneInfo("Europe/Belgrade")).date()
    # Generate every date in the requested window so zero-sale days appear in the chart.
    start_day = today_local - timedelta(days=days-1)
    trend=[]
    for offset in range(days):
        d=(start_day+timedelta(days=offset)).isoformat()
        trend.append({"date":d,"orders":orders_by_date[d],"revenue":round(revenue_by_date[d],2)})
    return {
        "summary": {"cash_revenue": round(cash_revenue,2), "card_revenue": round(card_revenue,2),
                    "delivery_fees": round(delivery_fees,2), "net_revenue": round(net_revenue,2),
                    "average_order_value": round(net_revenue/valid_orders,2) if valid_orders else 0,
                    "valid_orders": valid_orders},
        "revenue_trend": trend,
        "payment_methods": [{"label": k.title(), "count": v} for k,v in sorted(pay_counts.items())],
        "order_types": [{"label": "Delivery" if k=='delivery' else "Pickup" if k=='pickup' else k.title(), "count": v} for k,v in sorted(type_counts.items())],
        "order_statuses": [{"label": k.replace('_',' ').title(), "count": v} for k,v in sorted(status_counts.items())],
        "peak_hours": [{"label": f"{h:02d}:00", "count": hour_counts[h]} for h in range(24)],
        "top_products": [{"name": r[0], "quantity": int(r[1] or 0), "revenue": round(float(r[2] or 0),2), "orders": int(r[3] or 0)} for r in products]
    }
