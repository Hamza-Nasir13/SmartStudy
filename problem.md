Current Issue

The frontend is incorrectly calling backend authentication routes and missing the /api prefix.

This is causing 404 errors like:

/auth/login → 404 Not Found
/auth/register → 404 Not Found

But the backend routes are correctly defined as:

/api/auth/login
/api/auth/register
🎯 Goal

Fix all frontend API routing so that:

All API requests correctly target the backend
All auth routes use /api/auth/...
No request is sent without the /api prefix
Remove any duplicated or inconsistent API base URL logic
Ensure consistency across all pages (Login, Register, Upload, Quizzes, Flashcards, etc.)
🧠 Required Refactor
1. Standardize API base URL

Create or update a single API configuration pattern:

Base URL must always be:
process.env.REACT_APP_API_URL + "/api"
fallback: http://localhost:5000/api

Do NOT duplicate /api anywhere else.

2. Fix all API calls

Find and update ALL occurrences of:

/auth/login
/auth/register
/auth/*
any direct axios calls that bypass API_URL

Convert them to:

axios.post(`${API_URL}/auth/login`, data);
axios.post(`${API_URL}/auth/register`, data);

OR (preferred cleaner approach):

Create a central axios instance:

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL + "/api"
});

And replace all calls with:

API.post("/auth/login", data);
API.post("/auth/register", data);
3. Remove inconsistent patterns

Search and eliminate:

any hardcoded backend URLs
any missing /api usage
duplicate /api/api risks
inconsistent API_URL definitions across files
4. Files to check especially:
Login.js
Register logic (if separate)
Upload.js
Quizzes.js
Flashcards.js
App.js or any API helper files
🧪 Validation Requirement

After changes:

Login request must go to:

https://<backend>/api/auth/login

Register request must go to:

https://<backend>/api/auth/register

No requests should hit:

/auth/login ❌
/auth/register ❌
✅ Output expectation
Clean refactored API structure
No duplicate /api usage
Centralized API handling (preferred)
No breaking changes to UI
Fully working authentication flow
⚠️ Important

Do not change backend code unless absolutely necessary.
Only fix frontend routing and API structure.