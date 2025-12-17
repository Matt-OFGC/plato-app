# Login Decoding Issue Debugging Guide

## Problem
iPad simulator login fails with "failed to decode response" when calling `AuthService.shared.login()`.

## Changes Made

### 1. Enhanced APIClient.swift Error Logging
Added comprehensive decoding error logging that now shows:
- **All response headers** (including Content-Type, Content-Encoding, Transfer-Encoding, Content-Length)
- **Response JSON structure** (keys and value types)
- **Specific decoding error types**:
  - `DecodingError.keyNotFound` - Missing required keys
  - `DecodingError.typeMismatch` - Wrong data type
  - `DecodingError.valueNotFound` - Null value for non-optional field
  - `DecodingError.dataCorrupted` - Invalid JSON structure
- **Full response body** for all decoding failures
- **Coding path** showing exactly which field failed

### 2. Updated LoginResponse Structure
Made `LoginResponse` more flexible to handle different backend response formats:
```swift
public struct LoginResponse: Decodable {
    public let success: Bool
    public let requiresMfa: Bool?
    public let mfaType: String?
    public let message: String?
    
    // NEW: Additional fields backend might return
    public let user: User?
    public let company: Company?
    
    // Custom decoder handles missing 'success' field
}
```

The custom decoder now:
- Handles missing `success` field (infers from `user` presence)
- Accepts optional `user` and `company` objects
- Maintains backward compatibility with original format

### 3. Enhanced LoginView Error Logging
Added detailed logging in `handleLogin()` to show:
- Login initiation
- Response structure details
- Specific error information

## Expected Backend Response Formats

### Format 1: Simple Success Response
```json
{
  "success": true,
  "message": "Login successful"
}
```

### Format 2: Success with User Data
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false,
    "isActive": true
  },
  "company": {
    "id": 1,
    "name": "Company Name"
  }
}
```

### Format 3: MFA Required
```json
{
  "success": true,
  "requiresMfa": true,
  "mfaType": "totp",
  "message": "MFA verification required"
}
```

### Format 4: Error Response
```json
{
  "error": "Invalid credentials"
}
```

## How to Debug

### Step 1: Run the App and Attempt Login
1. Open iPad simulator
2. Attempt to login with valid credentials
3. Check Xcode console output

### Step 2: Look for These Debug Sections

#### A. Request Information
```
📤 Making request to: http://127.0.0.1:3000/api/login
📤 Request headers: [...]
```

#### B. Response Headers
```
=== API Response Debug ===
URL: http://127.0.0.1:3000/api/login
Method: POST
Response status: 200
Response headers:
  Content-Type: application/json
  Transfer-Encoding: chunked
  ...
========================
```

#### C. Response Structure
```
Response JSON structure: Dictionary
Response keys: success, user, company
Response values preview:
  success: Bool = true
  user: Dictionary = {...}
  company: Dictionary = {...}
```

#### D. Decoding Error (if occurs)
```
❌ Decoding error: Missing key 'success'
   Expected type: LoginResponse
   Context path: 
   Debug description: No value associated with key success
   Full response data: {"user": {...}, "company": {...}}
```

### Step 3: Compare Backend Response to LoginResponse

Check if the backend returns:
- ✅ `success` field (Bool) - **Now optional, inferred from user presence**
- ✅ `requiresMfa` field (Bool?) - Optional
- ✅ `mfaType` field (String?) - Optional
- ✅ `message` field (String?) - Optional
- ✅ `user` field (User?) - **NEW: Now supported**
- ✅ `company` field (Company?) - **NEW: Now supported**

### Step 4: Common Issues and Solutions

#### Issue: Backend returns `{user: {...}, company: {...}}` without `success` field
**Solution**: ✅ Fixed! Custom decoder now infers success from user presence.

#### Issue: Backend returns different field names (e.g., `requires_mfa` instead of `requiresMfa`)
**Solution**: Add `CodingKeys` with custom mappings:
```swift
enum CodingKeys: String, CodingKey {
    case success
    case requiresMfa = "requires_mfa"  // Map snake_case to camelCase
    case mfaType = "mfa_type"
    case message
}
```

#### Issue: Backend returns status code 200 but error JSON
**Solution**: Check for `error` field in response and handle it properly.

#### Issue: Backend returns empty response or HTML instead of JSON
**Solution**: Check Content-Type header in debug output. Should be `application/json`.

## Testing Checklist

- [ ] Console shows request being made to correct URL
- [ ] Response status is 200
- [ ] Content-Type is `application/json`
- [ ] Response JSON structure is logged
- [ ] Response keys match expected fields
- [ ] Specific decoding error (if any) is shown with field name
- [ ] Full response body is printed

## Next Steps

After running with enhanced logging:

1. **Copy the full console output** from login attempt
2. **Find the "Response JSON structure" section** - this shows what keys the backend actually returns
3. **Find the "Full response data" section** - this shows the exact JSON
4. **Compare with LoginResponse struct** - check if all required fields are present
5. **Update LoginResponse** if backend returns different structure

## Backend API Verification

To verify what the backend actually returns, you can also test with curl:

```bash
curl -X POST http://127.0.0.1:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","rememberMe":true}' \
  -v
```

This will show the raw HTTP response and JSON structure.

## Summary of Fixes

1. ✅ **Enhanced error logging** - Will show exactly which field is missing or wrong type
2. ✅ **Flexible LoginResponse** - Can handle responses with or without `success` field
3. ✅ **Support for user/company in response** - Backend can now return full user data
4. ✅ **Better error messages** - LoginView shows detailed error information
5. ✅ **All response headers logged** - Can identify encoding/content-type issues

The enhanced logging should now reveal exactly what the backend is returning and why it's failing to decode.
