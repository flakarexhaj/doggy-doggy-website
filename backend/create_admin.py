
from decimal import Decimal

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field

from backend.database import get_connection
from backend.security import (
    password_hash,
    create_access_token,
    require_admin,
)

app = FastAPI(title="Doggy Doggy API")
bearer = HTTPBearer()


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
                """
                SELECT password_hash
                FROM admin_users
                WHERE email = %s
                """,
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
