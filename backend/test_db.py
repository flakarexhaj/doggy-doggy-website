
from backend.database import get_connection


try:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()

    if result == (1,):
        print("SUKSES: Supabase database is connected!")

except Exception as error:
    print("Lidhja deshtoi.")
    print("Kontrollo konfigurimin e databazes.")
    print("Gabimi:", type(error).__name__, str(error))
