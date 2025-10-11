# PIN-Based Authentication System

## Overview

Your application now has a **two-tier authentication system** that prevents employees from accessing recipes from home. The system works by:

1. **Company-level login**: Business owner/admin logs into a work device (iPad/computer)
2. **Individual PIN access**: Team members use a 4-6 digit PIN to access the system on that device

This ensures employees can only access recipes on authorized work devices, giving you full control over who has access and when.

---

## How It Works

### For Business Owners/Admins

#### 1. **Initial Setup on Work Device**

1. Log in to your account normally at `/login` with your email and password
2. When prompted, click **OK** to enable PIN login for the device
3. The device is now configured for your company

#### 2. **Add Team Members**

1. Go to **Dashboard → Team Management**
2. Click **"Add Team Member"**
3. Enter their:
   - Full Name (e.g., "John Smith")
   - Email (for reference only - they won't receive login emails)
   - Role (Viewer, Editor, or Admin)
4. Click **"Add Team Member"**

#### 3. **Assign PINs**

1. Find the team member in the list
2. Click **"Generate PIN"**
3. A unique 4-6 digit PIN will be displayed
4. **Important**: Write down this PIN and give it to the team member
5. The PIN won't be shown again for security reasons

#### 4. **Manage PINs**

- **Reset PIN**: If a team member forgets their PIN, click "Reset PIN" to remove it, then generate a new one
- **Remove Member**: Click "Remove" to revoke access completely
- **Change Role**: Use the dropdown to adjust permissions

---

### For Team Members (Employees)

#### How to Access the System

1. On the work device, go to the login page
2. Click **"Enter with PIN →"** at the bottom
3. Enter your 4-digit PIN
4. Access the system with your assigned permissions

#### Important Notes

- **You can only access on authorized work devices** where the company has enabled device mode
- **You cannot access from home** or personal devices
- If you forget your PIN, ask your manager to reset it
- Your access can be revoked at any time by management

---

## Security Features

### Device-Based Access Control

- Company session is stored on the work device (30-day cookie)
- Team members can only log in on devices where the company is logged in
- Employees cannot access the system from home or personal devices

### PIN Security

- PINs are hashed (encrypted) in the database
- Each PIN is unique within a company
- PINs can be reset or removed at any time by admins
- Failed PIN attempts are logged

### Access Control

- Business owners control who has access
- Access can be revoked instantly by removing team members
- Device mode can be disabled at any time
- Each team member has specific permission levels (Viewer, Editor, Admin)

---

## API Endpoints

### Device Management

- `POST /api/device-login` - Enable device mode for a company
- `GET /api/device-login` - Check if device has company session
- `DELETE /api/device-login` - Remove company from device

### Team Member Management

- `POST /api/team/create-member` - Add team member (no email invite)
- `GET /api/team/members` - Get all team members
- `PATCH /api/team/members` - Update member role
- `DELETE /api/team/members` - Remove team member

### PIN Management

- `POST /api/team/pin` - Generate/assign PIN to team member
- `PUT /api/team/pin` - Verify PIN and authenticate
- `DELETE /api/team/pin` - Remove PIN from team member

---

## User Interface Components

### New Pages

- `/pin-login` - PIN entry page for team members
- Updated `/login` - Now offers device mode setup

### New Components

- `TeamManagerWithPins` - Manage team members and PINs
- `DeviceModeIndicator` - Shows device mode status on dashboard

---

## Database Changes

### Membership Table

Added fields:
- `pin` (String, nullable) - Plain PIN for lookup (4-6 digits)
- `pinHash` (String, nullable) - Hashed PIN for security verification

### Indexes

- Added index on `(companyId, pin)` for fast PIN lookups

---

## Workflow Examples

### Example 1: Setting Up a Bakery iPad

1. Owner logs in on the bakery iPad with email/password
2. Confirms "Enable PIN login" when prompted
3. Adds 5 employees to the team
4. Generates PINs for each employee (e.g., 1234, 5678, etc.)
5. Writes down PINs and gives to each employee
6. Employees can now log in with their PINs on the iPad

### Example 2: Employee Tries to Access from Home

1. Employee goes to the login page on their home computer
2. Clicks "Enter with PIN"
3. System shows: "No device session found" and redirects to regular login
4. Employee cannot access recipes from home ✓

### Example 3: Revoking Access

1. Employee leaves the bakery
2. Owner goes to Team Management
3. Clicks "Remove" next to the employee's name
4. Employee's PIN no longer works on any device
5. Access is instantly revoked ✓

---

## Migration Notes

### Existing Team Members

If you have existing team members who were invited via email:

1. They can still log in with their email/password normally
2. To convert them to PIN-only access:
   - Generate a PIN for them in Team Management
   - Ask them to use PIN login on work devices
   - Optionally remove their password access

### Backwards Compatibility

- The system supports both authentication methods
- Email/password login still works for owners/admins
- PIN login is optional - you can use either or both

---

## Troubleshooting

### "No device session found"

**Problem**: Team member sees this when trying to use PIN
**Solution**: Owner needs to log in on the device and enable device mode

### "Invalid PIN"

**Problem**: Team member's PIN doesn't work
**Solution**: 
1. Check if PIN is correct (4-6 digits)
2. Admin can reset the PIN and generate a new one
3. Ensure team member is still active

### Device mode not showing

**Problem**: Device mode indicator doesn't appear
**Solution**: 
1. Ensure you're logged in as Owner or Admin
2. Refresh the page
3. Check that device mode was enabled during login

---

## Best Practices

1. **Keep PINs Secure**: Don't write PINs where customers can see them
2. **Regular Audits**: Review team members monthly and remove inactive users
3. **Unique PINs**: Never share PINs between team members
4. **Reset on Departure**: Always remove access when someone leaves
5. **Device Security**: Keep work devices physically secure
6. **Multiple Devices**: You can enable device mode on multiple work devices (office computer, kitchen iPad, etc.)

---

## Support

If you need help:
1. Check the Team Management page for status
2. Review the DeviceModeIndicator on your dashboard
3. Contact support with specific error messages


