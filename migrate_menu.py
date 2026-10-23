
from backend.database import get_connection

products = [
    {"name": "Classic Doggy", "price": 3.5, "category": "Hotdogs", "image": "images/classicdoggy.png", "description": ""},
    {"name": "Philly Doggy", "price": 4, "category": "Hotdogs", "image": "images/texasdoggy.png", "description": ""},
    {"name": "Chef Avocado Doggy", "price": 4, "category": "Hotdogs", "image": "images/chefdoggy.png", "description": ""},
    {"name": "The Crunch", "price": 3, "category": "Hotdogs", "image": "images/corndog.png", "description": ""},
    {"name": "Cocktails", "price": 4, "category": "Drinks", "image": "images/cocktails.png", "description": ""},
    {"name": "Hot Chocolate", "price": 3, "category": "Drinks", "image": "images/hotchocolate.png", "description": ""},
    {"name": "Mulled Wine", "price": 3, "category": "Drinks", "image": "images/wine.png", "description": ""},
    {"name": "test doggy", "price": 1, "category": "Hotdogs", "image": "images/test.png", "description": "test"},
    {"name": "test doggy2", "price": 3, "category": "Hotdogs", "image": "images/test2.png", "description": "dest,bnadsip"},
]

with get_connection() as connection:
    with connection.cursor() as cursor:
        for product in products:
            cursor.execute(
                """
                INSERT INTO products
                    (name, description, price, image_url, category, is_available)
                SELECT %s, %s, %s, %s, %s, %s
                WHERE NOT EXISTS (
                    SELECT 1 FROM products WHERE name = %s
                )
                RETURNING id, name
                """,
                (
                    product["name"],
                    product["description"],
                    product["price"],
                    product["image"],
                    product["category"],
                    True,
                    product["name"],
                ),
            )
            row = cursor.fetchone()
            if row:
                print(f"U shtua: {row[1]} (ID {row[0]})")
            else:
                print(f"Ekziston tashmë, nuk u dyfishua: {product['name']}")

print("Transferimi përfundoi.")
