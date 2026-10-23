
from getpass import getpass

from backend.database import get_connection
from backend.security import password_hash

email = input("Admin email: ").strip().lower()
password = getpass("New admin password: ")
confirm = getpass("Confirm new password: ")

if len(password) < 12:
    raise SystemExit("Password must be at least 12 characters.")

if password != confirm:
    raise SystemExit("Passwords do not match.")

hashed_password = password_hash.hash(password)

with get_connection() as connection:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE admin_users
            SET password_hash = %s
            WHERE LOWER(email) = %s
            RETURNING email
            """,
            (hashed_password, email),
        )
        row = cursor.fetchone()

        if row is None:
            raise SystemExit("Admin email not found. No password was changed.")

print(f"Password reset successfully for: {row[0]}")
