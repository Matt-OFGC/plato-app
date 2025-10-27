# Payroll Integration Guide

## Overview

The staff scheduling and payroll system supports integration with external payroll software including Sage, Xero, QuickBooks, and BrightPay. This allows you to export calculated payroll data directly to your existing payroll provider.

## Features

- **Automated Payroll Calculation**: Calculate gross pay, tax, NI, and net pay using UK rates
- **External Integration**: Export payroll data to Sage, Xero, QuickBooks, BrightPay
- **Sync Tracking**: Track all sync attempts with detailed logs
- **OAuth Support**: Secure authentication with OAuth providers
- **Error Handling**: Automatic retry and error logging
- **Data Security**: Encrypted storage of API credentials

## Supported Providers

### Sage (UK)
- Popular UK accounting/payroll software
- Supports export of payroll runs
- Requires API key authentication
- Documentation: https://developer.sage.com/

### Xero
- Cloud-based accounting with payroll
- Full API for employee and payroll data
- OAuth 2.0 authentication
- Documentation: https://developer.xero.com/documentation/api/payroll

### QuickBooks (Intuit)
- Popular accounting software
- Payroll API available
- OAuth 2.0 authentication
- Documentation: https://developer.intuit.com/app/developer/qbo/docs/

### BrightPay
- UK-focused payroll software
- Automatic RTI submissions to HMRC
- May require CSV export or API integration

## Database Schema

### PayrollIntegration
Stores integration configuration and credentials:
- `provider`: System name (sage, xero, quickbooks, brightpay)
- `apiKey`, `apiSecret`: Authentication credentials
- `accessToken`, `refreshToken`: OAuth tokens
- `config`: Provider-specific JSON configuration
- `autoSync`: Enable automatic synchronization
- `isActive`: Active status

### PayrollSyncLog
Tracks all sync operations:
- `status`: pending, success, failed, partial
- `direction`: export, import, bidirectional
- `recordsExported`, `recordsImported`: Sync counts
- `errorMessage`, `errorDetails`: Error information

### PayrollRun Updates
Added fields for external integration:
- `externalId`: ID in external system
- `syncedToExternal`: Sync status flag

## API Endpoints

### Integration Management
- `GET /api/staff/payroll/integrations` - List all integrations
- `POST /api/staff/payroll/integrations` - Create new integration
- `PATCH /api/staff/payroll/integrations` - Update integration
- `DELETE /api/staff/payroll/integrations` - Remove integration

### Payroll Synchronization
- `POST /api/staff/payroll/sync` - Sync payroll run to external system
  - Parameters: `integrationId`, `payrollRunId`, `direction`

## How It Works

1. **Setup Integration**: Connect to your payroll provider via OAuth or API key
2. **Calculate Payroll**: Generate payroll run from approved timesheets
3. **Review & Approve**: Review calculated payroll with tax/NI breakdown
4. **Export**: Click "Export to [Provider]" button to sync data
5. **Track Sync**: View sync logs to verify successful export

## Example Usage

### Setting up a Xero Integration

1. Go to Staff > Settings > Integrations
2. Click "Add Integration" > Select "Xero"
3. Click "Connect to Xero" (redirects to Xero OAuth)
4. Authorize access
5. Integration is configured and ready

### Exporting Payroll to Sage

1. Generate payroll run for approved timesheets
2. Review payroll calculations
3. Click "Export to Sage" button
4. System syncs employee data, hours, and pay amounts
5. Check sync log for confirmation

## Data Mapping

### Employee Data
- Name, email → Employee details in external system
- Pay rates → Hourly/salary rates

### Payroll Data
- Gross pay → Base pay
- Tax deductions → Income tax
- NI deductions → National Insurance
- Pension → Pension contributions
- Net pay → Final payment amount

### Hours & Timesheets
- Clock in/out times → Attendance records
- Break times → Break deductions
- Total hours → Hours worked

## Security Considerations

- **Encryption**: All API credentials are encrypted at rest
- **OAuth**: Secure token-based authentication
- **Access Control**: Only OWNER/ADMIN can manage integrations
- **Audit Trail**: All sync operations are logged
- **Data Minimization**: Only required payroll data is exported

## Future Enhancements

- Import employee data from external systems
- Two-way sync (bidirectional)
- Automated weekly/monthly payroll export
- Pay slip generation within the app
- RTI (Real Time Information) submissions to HMRC
- CSV export for manual import
- Integration with HMRC for tax calculations

## Implementation Notes

The integration system is provider-agnostic and easily extensible. To add a new provider:

1. Add provider to `PayrollIntegration` model
2. Implement sync function in `api/staff/payroll/sync/route.ts`
3. Add UI for provider setup in Staff settings
4. Test with provider's sandbox/test environment

## UK Tax Compliance

The system calculates:
- Income Tax (20% basic rate, 40% higher rate)
- National Insurance (Class 1 contributions)
- Pension contributions (auto-enrolment compliant)
- Using 2024-2025 UK tax rates and thresholds

All calculations should be verified with your accountant before use in production.
