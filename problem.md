# 🚀 Feature Implementation Prompt (Full-Stack MERN App)

You are working on a full-stack MERN application (React frontend + Node/Express backend + MongoDB).

Your task is to implement new user management features and fix existing authentication bugs.

---

# 🎯 OBJECTIVES

## 1. 🔐 Forgot Password + Reset Password System

Implement a secure password reset flow:

### Flow:
1. User clicks **"Forgot Password?"**
2. User enters email
3. Backend generates a **secure, time-limited reset token**
4. Email is sent to user with a reset link:

https://<frontend-url>/reset-password/<token>

5. User enters new password
6. Password is hashed (bcrypt) and updated in MongoDB

---

### Backend Requirements:

Create these endpoints:

#### POST `/api/auth/forgot-password`
- Accept email
- Check if user exists
- Generate reset token (crypto random or JWT)
- Store hashed token + expiry in DB
- Send email with reset link

#### POST `/api/auth/reset-password/:token`
- Validate token + expiry
- Hash new password using bcrypt
- Update user password
- Clear reset token fields

---

### Email:
Use a simple email service (nodemailer or existing provider in project).

---

# 👤 2. My Account Page (Frontend + Backend Support)

Create a **My Account page** where users can:

## Features:

### ✅ View Profile
- Username
- Email
- Account status:
- Paid
- Free

---

### ✏️ Edit Username
- Allow user to update username
- Backend endpoint:

PUT /api/user/update-profile


---

### 💳 Subscription Section
Show:
- Current plan status (Free / Paid)
- Buttons:
- Upgrade Plan
- View Plans

Plans:
- Free: limited usage
- Paid Monthly
- Paid Annual

---

### 🚪 Logout
- Clear JWT token
- Redirect to login

---

### 🗑️ Delete Account
- Confirmation modal required
- Backend endpoint:

DELETE /api/user/delete-account

- Remove user from MongoDB completely

---

# 🧠 3. Fix Registration 400 Errors

Currently, registration sometimes returns:


400 Bad Request


## Required Fixes:

### Backend validation must be improved:
- Ensure all required fields are validated properly
- Return clear error messages:
  - missing email
  - invalid email format
  - password too short
  - user already exists

---

### Frontend fixes:
- Display backend error messages properly
- Prevent empty form submission
- Add loading state during request

---

### Improve `/api/auth/register`:

Must ensure:
- Email uniqueness check
- Password hashing with bcrypt
- Proper status codes:
  - 201 → success
  - 400 → validation error
  - 409 → user already exists

---

# 🧩 DATABASE CHANGES (if required)

Update User model to include:

```js
resetPasswordToken: String,
resetPasswordExpires: Date,
isPaid: Boolean,
plan: String