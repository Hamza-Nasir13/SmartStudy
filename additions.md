# AI Smart Study App – Feature Requirements

I want to implement a freemium system, improved user management, and a pricing page for my application. Below are the exact features and behaviors that need to be added.

---

## Pricing / Plans Page

Create a new frontend route at:

/pricing

This page should display the available plans clearly.

There should be two types of plans:

1. Free Plan
- Price: Rs 0
- Includes:
  - 3 uploads (lifetime)
  - 50 flashcards (lifetime)

2. Premium Plan

Two pricing options:

- Rs 400/month (billed annually)
- Rs 600/month (billed monthly)

Premium plan includes:
- Unlimited uploads
- Unlimited flashcards

On the pricing page, include a section for manual payment instructions with placeholders:

Payment Method:
Account Title: [ADD_YOUR_ACCOUNT_TITLE_HERE]
Account Number: [ADD_YOUR_ACCOUNT_NUMBER_HERE]

After payment, the user will need to send proof of payment to get upgraded.

Buttons:
- Free plan should show "Current Plan"
- Premium plan should show "Upgrade Now"

---

## Usage Limits System

I want to limit non-paying users based on usage.

Limits:
- Maximum 3 uploads
- Maximum 50 flashcards generated

These limits should be lifetime-based:
- If a user deletes textbooks or flashcards, their usage should NOT decrease
- Usage is only incremented, never reduced

---

## Database Changes (User Model)

Add the following fields to the user:

plan: "free" or "premium" (default should be "free")

usage:
- uploads_used (number, default 0)
- flashcards_generated (number, default 0)

---

## Backend Enforcement (VERY IMPORTANT)

All limits must be enforced in the backend.

For uploads:
- If user is on free plan AND uploads_used >= 3 → block the request

For flashcards:
- If user is on free plan AND flashcards_generated + newFlashcards > 50 → block the request

After successful actions:
- Increment uploads_used after each upload
- Increment flashcards_generated after flashcards are generated

Premium users should bypass all limits.

---

## Frontend Usage Indicators

I want the frontend to clearly show users their current usage.

On the uploads page:
- Show: "Uploads Used: X / 3"

On the flashcards page:
- Show: "Flashcards Used: X / 50"

Additional behavior:
- Show a warning when the user is close to the limit (around 80%)
- When limit is reached:
  - Display a message
  - Show an "Upgrade" button

---

## User Management Improvements

I want a more realistic user system similar to real websites.

### Email Validation
- Validate email format during signup
- Reject invalid email addresses

### Welcome Email
- Send an email when a new user signs up

Subject:
Welcome to AI Smart Study App 🎓

Body:
Hi [User Name],

Thank you for signing up!

We're excited to help you study smarter and save time.

Get started by uploading your first textbook and generating your study material instantly.

Best,
AI Smart Study Team

Use a simple email service (like Nodemailer or similar).

---

## Admin Control (Manual Plan Management)

I want to be able to manually control whether a user is premium or free directly from MongoDB.

This means:
- I can change a user's plan from "free" to "premium"
- Or from "premium" to "free"

The backend should rely ONLY on the "plan" field to determine access.

Example:
- If plan = "premium" → unlimited access
- If plan = "free" → apply limits

This allows me to manually upgrade users after they send proof of payment.

---

## Key Principles

- All usage limits must be enforced in the backend, not frontend
- Frontend is only for displaying usage and guiding the user
- Usage is lifetime-based and does not decrease
- System should be simple, scalable, and easy to extend later

---

## Goal

The goal is to create a working freemium model that:
- Limits free users in a meaningful way
- Encourages upgrades
- Allows manual payment handling
- Mimics real-world SaaS behavior