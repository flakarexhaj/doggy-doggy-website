
# Doggy Doggy

A restaurant ordering website built with HTML, CSS, vanilla JavaScript, FastAPI, PostgreSQL, and Supabase.

## Features

- Responsive restaurant menu
- Shopping cart and custom hot dog options
- Customer registration and login through Supabase Auth
- Order placement and customer order history
- Admin login and protected administration panel
- Product and order management
- Backend validation for prices, quantities, and order details

## Project structure

- `index.html`, `style.css`, `script.js` — storefront
- `login.html`, `login.js` — customer login
- `account.html`, `account.js` — customer account
- `admin.html`, `admin.css`, `admin.js` — admin panel
- `backend/main.py` — FastAPI endpoints
- `backend/database.py` — database connection
- `backend/security.py` — admin authentication
- `backend/requirements.txt` — Python dependencies

## Configuration

Create a local `.env` file containing the required environment variables:

- `DATABASE_URL`
- `JWT_SECRET_KEY`

Never commit `.env` or expose database credentials, JWT secrets, or Supabase secret/service-role keys.

## Run locally

Install the dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Start the backend from the project root:

```bash
uvicorn backend.main:app --reload
```

## Deployment

The frontend and backend require hosting and production configuration. Configure the production API URL, CORS origins, environment variables, and database permissions before accepting real customer orders.

## Security

Admin endpoints must require authentication. Customer order history must be restricted to the authenticated customer. Never rely on frontend validation alone.
