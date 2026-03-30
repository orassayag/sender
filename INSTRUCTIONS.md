# Instructions

## Setup Instructions

1. Open the project in your IDE (VSCode recommended)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up MongoDB locally or configure connection string in settings

## Configuration

### Required Files Setup

Before running the application, you need to set up the following files:

1. **SendGrid Accounts** (`misc/examples/accounts.example.json`):
   - Copy the example and create your accounts file
   - Add your SendGrid API keys and account details
   - Update `ACCOUNTS_FILE_PATH` in settings to point to your file

2. **Email Templates** (`misc/data/templates/templates.json`):
   - Create template file with subjects and message bodies
   - Supports multiple templates with IDs

3. **Email Source Files**:
   - Create directory at `sources/` for production mode
   - Add TXT files with email addresses (comma-separated)
   - Use naming pattern: `email_addresses_*.txt`

4. **Monitor Email Addresses** (optional):
   - Create `misc/data/monitor/monitor.txt`
   - Add email addresses to monitor sending process

5. **Attachment Files** (optional):
   - Place CV or other attachments in `misc/data/cv/`
   - Update `CV_FILE_PATH` in settings

### Settings Configuration

Open `src/settings/settings.js` and configure:

#### Core Flags
- `IS_PRODUCTION_MODE`: Set to `true` for real email sending, `false` for testing
- `IS_SEND_EMAILS`: Actually send via SendGrid or simulate
- `IS_SAVE_EMAILS`: Save to MongoDB or simulate
- `IS_DROP_COLLECTION`: Drop collection before starting (useful for testing)
- `IS_LOG_MODE`: Display detailed logs or status line

#### Email Source
- `EMAIL_ADDRESSES_SOURCE_TYPE`: Choose `DIRECTORY`, `FILE`, or `ARRAY`
- `EMAIL_ADDRESSES_DEVELOPMENT_SOURCE_PATH`: Path for development mode
- `EMAIL_ADDRESSES_PRODUCTION_SOURCE_PATH`: Path for production mode
- `EMAIL_ADDRESSES_INCLUDE_FILE_NAME`: File name pattern to scan

#### SendGrid Configuration
- `EMAIL_SENDER_NAME`: Sender name displayed in emails
- `ACCOUNTS_FILE_PATH`: Path to SendGrid accounts JSON file
- `TEMPLATES_FILE_PATH`: Path to email templates JSON file
- `CV_FILE_PATH`: Path to attachment file (if needed)

#### Limits & Throttling
- `MAXIMUM_SEND_EMAILS`: Max emails per session
- `MILLISECONDS_SEND_EMAIL_DELAY_COUNT`: Delay between sends (default: 2000ms)
- `MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT`: Daily SendGrid limit (default: 100)
- `MILLISECONDS_SEND_TIMEOUT`: Timeout for each send operation

#### MongoDB Configuration
- `MONGO_DATABASE_CONNECTION_STRING`: MongoDB connection URL
- `MONGO_DATABASE_NAME`: Database name
- `MONGO_DATABASE_COLLECTION_NAME`: Collection for email addresses

## Running Scripts

### Send Emails (Production)
Main script to send bulk emails:
```bash
npm start
```

**Process:**
1. Displays important settings confirmation
2. Validates internet connection and settings
3. Connects to MongoDB
4. Loads accounts, templates, and email addresses
5. Sends emails with progress tracking
6. Logs results to `dist/` directory

### Test Email Sending
Test with a single email:
```bash
npm run send
```

### Check Status
View current system status:
```bash
npm run status
```

### Create Backup
Backup the project:
```bash
npm run backup
```

### Sandbox Testing
Run sandbox tests:
```bash
npm run sand
```

### Stop Process
Kill all Node.js processes (Windows):
```bash
npm run stop
```

## Understanding the Output

### Successful Run Example

```
===IMPORTANT SETTINGS===
DATABASE: send_production
IS_PRODUCTION_MODE: true
IS_SEND_EMAILS: true
IS_SAVE_EMAILS: true
IS_DROP_COLLECTION: false
IS_SKIP_LOGIC: false
IS_MONITOR_LOGIC: false
IS_LOG_MODE: false
IS_LOG_RESULTS: true
MONITOR_EMAILS_SEND_COUNT: 1
MAXIMUM_SENDGRID_DAILY_EMAILS_COUNT: 100
========================
OK to run? (y = yes)
y
===INITIATE THE SERVICES===
===VALIDATE GENERAL SETTINGS===
===[SETTINGS] Mode: PRODUCTION | Method: STANDARD | Database: send_production | Drop: false===
===[GENERAL] Time: 00.00:00:09 [|] | Current: 1/1 (100.00%) | Available: 99 | Status: FINISH===
===[PROCESS1] Total: 1 | Pending: 0 | Sent: ✅ 1 | Error: ❌ 0 | Exists: 0 | Database: 0===
===[PROCESS2] Save: 1 | Invalid: 0 | Duplicate: 0 | Filter: 0 | Skip: 0 | Unsave: 0===
===[PROCESS3] Monitor Sent: 0 | Security Error: 0 | Missing Field: 0===
===[PROCESS4] Sent Error In A Row: 0 | Save Error In A Row: 0===
===[ACCOUNT] Id: 1 | Sent: 1/100 (01.00%) | Accounts: 1/1===
===[SEND] Code: 202 | Status: SENT | From: sender@example.com | To: recipient@example.com===
===[RESULT] Your message is both valid, and queued to be delivered.===
```

### Status Line Metrics

**PROCESS1** - Email Processing:
- `Total`: Total emails to process
- `Sent`: Successfully sent emails ✅
- `Error`: Failed sends ❌
- `Exists`: Already in database
- `Pending`: Remaining to process

**PROCESS2** - Database Operations:
- `Save`: Successfully saved to DB
- `Invalid`: Invalid email format
- `Duplicate`: Duplicate emails filtered
- `Skip`: Skipped by logic rules

**PROCESS3** - Security & Monitoring:
- `Monitor Sent`: Monitoring emails sent
- `Security Error`: Security-related errors
- `Missing Field`: Required fields missing

**PROCESS4** - Error Tracking:
- `Sent Error In A Row`: Consecutive send failures
- `Save Error In A Row`: Consecutive save failures

## File Structure

```
sender/
├── src/
│   ├── core/
│   │   ├── enums/          # Enumerations
│   │   └── models/         # Data models
│   ├── configurations/     # Configuration files
│   ├── logics/            # Business logic
│   ├── scripts/           # Executable scripts
│   ├── services/          # Service layer
│   ├── settings/          # Settings file
│   ├── tests/             # Test files
│   └── utils/             # Utility functions
├── misc/
│   ├── data/              # Templates, CV, monitor data
│   ├── documents/         # Documentation
│   └── examples/          # Example configuration files
├── sources/               # Email address source files (not in git)
├── dist/                  # Generated logs and results (not in git)
└── package.json
```

## Error Handling

Errors include codes in format `(1000XXX)` for debugging:
- Check console output for error details
- Review logs in `dist/` directory
- Verify MongoDB connection
- Check SendGrid API key validity
- Ensure email addresses are properly formatted

## Development vs Production

### Development Mode (`IS_PRODUCTION_MODE: false`)
- Uses test data from `development_sources/`
- Can simulate sending and saving
- Safe for testing without real emails
- No internet connection required (with simulation)

### Production Mode (`IS_PRODUCTION_MODE: true`)
- Requires real SendGrid account
- Requires MongoDB connection
- Validates internet connection
- Actually sends emails
- Both `IS_SEND_EMAILS` and `IS_SAVE_EMAILS` must be true

## Best Practices

1. **Test First**: Always test in development mode before production
2. **Start Small**: Test with small batches before bulk sending
3. **Monitor Quota**: Watch SendGrid daily limits
4. **Backup Data**: Regularly backup MongoDB and source files
5. **Log Review**: Check logs after each run
6. **Rate Limiting**: Respect delay settings to avoid rate limits
7. **Validation**: Validate email addresses before adding to sources

## Troubleshooting

### Emails Not Sending
- Check `IS_SEND_EMAILS` is true
- Verify SendGrid API key is valid
- Check internet connection
- Review SendGrid account status and quota

### Database Errors
- Verify MongoDB is running
- Check connection string
- Ensure proper permissions
- Review database name and collection

### No Progress
- Check if process is waiting for confirmation
- Verify source files exist and are readable
- Check if daily quota is exceeded
- Review error logs in `dist/`

## Notes

- The application requires Node.js v12.20.0 or higher
- Ensure proper file permissions for source files and dist directory
- SendGrid free tier has daily sending limits
- MongoDB can be local or cloud-based
- All paths can be configured in settings

## Author

- **Or Assayag** - _Initial work_ - [orassayag](https://github.com/orassayag)
- Or Assayag <orassayag@gmail.com>
- GitHub: https://github.com/orassayag
- StackOverFlow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
- LinkedIn: https://linkedin.com/in/orassayag
