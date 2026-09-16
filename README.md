# Auth Flow Server

A secure RESTful API for authentication, authorization, session management, and user administration, built with Node.js, Express, and MongoDB.

Auth Flow Server is the backend of the Auth Flow application. It provides a complete authentication system with JWT-based authentication, HTTP-only cookies, refresh tokens, database-backed sessions, email verification, password recovery, OAuth authentication, user management, caching, file uploads, and multiple security layers.

## Features

### Authentication & Authorization

- User registration and login
- Logout
- JWT-based authentication
- Short-lived access tokens
- Long-lived refresh tokens
- HTTP-only authentication cookies
- Protected routes
- Role-based authorization
- User activation status validation
- Email verification validation
- Password change tracking

### Session Management

- Database-backed user sessions
- Hashed refresh tokens
- Session expiration
- Access token refresh
- Session revocation
- Logout from individual sessions
- Session cleanup after account changes
- User-Agent tracking
- IP address tracking

### Email Verification

- Email verification after registration
- Verification token generation
- Verification token expiration
- Resend verification email
- Resend cooldown
- Verification request rate limits

### Password Management

- Change password
- Forgot password
- Password reset
- Reset token expiration
- Reset password verification session
- Password reset rate limiting
- Admin force password change
- Password change timestamp tracking

### OAuth Authentication

- Google OAuth
- GitHub OAuth
- OAuth account linking
- Existing account validation
- Verified OAuth accounts

### User Management

- Get current authenticated user
- Update profile
- Update user information
- Delete account
- Profile avatar management
- Upload avatar
- Delete avatar

### Admin User Management

Administrators can manage users through dedicated protected endpoints.

- Get users
- Get a single user
- Create users
- Update users
- Delete users
- Activate / deactivate users
- Change user roles
- Change user passwords
- Search users
- Filter users by role
- Pagination
- User status management

## API Features

### Filtering

User listing endpoints support filtering by:

- Role
- Search keyword

### Pagination

User management endpoints support pagination using:

- page
- limit

Example:

`text
GET /api/v1/admin/users?page=1&limit=10
