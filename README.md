# Invoice & Payment Capture System

A simple B2B invoice management system built with React.js, Node.js (Express), and Supabase (PostgreSQL).
The URL for supabase is being shared on the email, Please check them and created the .env file in both frontend and backend folder and paste the content from email

## Features

- ✅ Create invoices with line items
- ✅ Apply percentage discounts and GST
- ✅ Issue draft invoices
- ✅ Record full or partial payments
- ✅ Void invoices (before payment)
- ✅ View payment history
- ✅ Idempotency for duplicate payment prevention
- ✅ Concurrency control with optimistic locking
- ✅ Mobile responsive design

## Tech Stack

- **Frontend**: React.js, React Router, Axios, SCSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── supabase.js      # Supabase client
│   │   │   └── migrations/      # SQL schema
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   └── index.js             # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── api.js               # API calls
│   │   ├── App.jsx              # Main app
│   │   └── App.scss             # Styles
│   └── package.json
├── docs/
│   └── BUSINESS_RULES.md        # Business rules
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js v16+ installed
- Supabase account (free tier works)

### Step 1: Clone and Install

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Backend** - Create `backend/.env`:

```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Frontend** - Create `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:3001/api
```

### Step 3: Setup Database

1. Go to your Supabase project → SQL Editor
2. Copy contents of `backend/src/db/migrations/001_schema.sql`
3. Run the SQL query

### Step 4: Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Server starts at http://localhost:3001

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

App opens at http://localhost:3000

## API Endpoints

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| GET    | /api/invoices              | List all invoices      |
| GET    | /api/invoices/stats        | Get invoice statistics |
| GET    | /api/invoices/:id          | Get invoice details    |
| POST   | /api/invoices              | Create invoice         |
| POST   | /api/invoices/:id/issue    | Issue draft invoice    |
| POST   | /api/invoices/:id/void     | Void invoice           |
| GET    | /api/invoices/:id/payments | Get invoice payments   |
| POST   | /api/invoices/:id/payments | Record payment         |
| GET    | /api/customers             | List customers         |
| POST   | /api/customers             | Create customer        |
| GET    | /api/payments              | List all payments      |

## Invoice States

| Status         | Description                        |
| -------------- | ---------------------------------- |
| DRAFT          | New invoice, can be edited         |
| ISSUED         | Sent to customer, accepts payments |
| PARTIALLY_PAID | Has some payments                  |
| PAID           | Fully paid                         |
| VOIDED         | Cancelled                          |

## Discount & Tax

- **Discount**: Percentage discount on subtotal (0-100%)
- **Tax (GST)**: Applied after discount, default 18%

## Payment Methods

- Cash
- UPI
- Bank Transfer
- Cheque
- Card
