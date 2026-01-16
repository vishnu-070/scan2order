# Developer Summary & Bug Analysis

## Project Overview
This project is a **Restaurant Management System** built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It uses **Supabase** for the backend (PostgreSQL database, Authentication, Realtime subscriptions).

### Key Features
*   **Public Menu:** Customers can view menus via a public slug (e.g., `/menu/:slug`).
*   **Restaurant Dashboard:** Owners can manage orders, menus, tables, and view financial settings (`/dashboard/*`).
*   **Master Admin:** Platform administrators can manage all restaurants (`/admin/*`).
*   **Wallet/Money System:** Restaurants have a balance. They can "recharge" (add money) and fees are deducted per order.

### Architecture
*   **Frontend:** Single Page Application (SPA) hosted on Vite.
*   **State Management:** React Hooks (`useState`, `useEffect`) + Custom hooks for data fetching (`useAdminData`, `useRestaurantBalance`).
*   **Database:** Supabase (PostgreSQL).
*   **Security:** Row Level Security (RLS) policies are extensively used to secure data access.

---

## Bug Analysis

### 1. Money Deduction Not Happening Properly
**Issue:** When an order is placed, the platform fee (5 units) is supposed to be deducted, but this is failing.
**Root Cause:**
*   A trigger `deduct_platform_fee_on_order` attempts to insert a record into `balance_transactions` with `transaction_type = 'platform_fee'`.
*   The `balance_transactions` table has a strict `CHECK` constraint defined in `20260106095943_...sql`:
    ```sql
    CHECK (transaction_type IN ('recharge', 'admin_credit', 'order_deduction'))
    ```
*   Since `'platform_fee'` is not in the allowed list, the database rejects the insert, causing the transaction (and likely the order creation) to fail or behave unexpectedly.

**Solution:** Update the database constraint to allow `'platform_fee'`.

### 2. Money Added Two Times (Double Addition)
**Issue:** When a user recharges their wallet, the amount is sometimes added twice.
**Root Cause:**
*   This is likely a frontend race condition where the "Add Balance" button can be clicked multiple times before the component state updates to disable it, or before the request completes.
*   Although `setRecharging(true)` is called, rapid clicking might still trigger the handler twice.

**Solution:** Harden the `handleRecharge` function in `DashboardSettings.tsx` to explicitly ignore calls when a recharge is already in progress, and ensure the button UI accurately reflects the loading state.
