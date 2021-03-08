## Instructions

===================
FAST & BASIC START.
===================
1. Open the project in IDE (Current to 01/12/2020 I'm using VSCode).
2. Open the following file in the src/settings/settings.js file.
3. Search for the first setting - 'IS_PRODUCTION_MODE' - Make sure it is on true.
4. Next - Time to install the NPM packages. On the terminal run 'npm i'.
   It will install automatically all the required NPM packages.
5. On terminal run 'npm start'. If everything goes well, you will start to see
   the console status line appear.
6. If you see any error - Need to check what's change. Current to 01/12/2020,
   It works fine.
7. If you see the console status line but the 'Sent' or 'Total' not progressing
	- Need to check what's wrong.
8. If no errors and the progress works OK, make sure to check on
   dist/production/date of today (Example: 1_20200316_222124)/ That the TXT
   file was created successfully.
9. Successfull running application on production should look like this:

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
===[PROCESS1] Total: 1 | Pending: 0 | Sent: ✅  1 | Error: ❌  0 | Exists: 0 | Database: 0===
===[PROCESS2] Save: 1 | Invalid: 0 | Duplicate: 0 | Filter: 0 | Skip: 0 | Unsave: 0 | Identical Addresses: 0===
===[PROCESS3] Monitor Sent: 0 | Security Error: 0 | Security Exists: 0 | Missing Field: 0 | Invalid Status: 0===
===[PROCESS4] Identical Status: 0 | Unexpected Field: 0 | Sent Error In A Row: 0 | Save Error In A Row: 0===
===[ACCOUNT] Id: 1 | Username: ravidbilly1956@gmail.com | Password: **************** | Sent: 1/100 (01.00%) | Accounts: 1/1===
===[API KEY] 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===
===[TEMPLATE] Subject (Id: 16): םכנוגריאב הדובע יבגל תקדוב | Text (Id: 16): ,בוט עובשו ייה===
===[ATTACHMENT] C:\Or\Web\sender\sender\misc\data\cv\CV Billy Ravid.doc===
===[SEND] Code: 202 | Status: SENT | Step: FINALIZE | From: ravidbilly1956@gmail.com | To: orassayag@gmail.com | Id: 1 | Type: STANDARD===
===[RESULT] Your message is both valid, and queued to be delivered.===

## Author

* **Or Assayag** - *Initial work* - [orassayag](https://github.com/orassayag)
* Or Assayag <orassayag@gmail.com>
* GitHub: https://github.com/orassayag
* StackOverFlow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
* LinkedIn: https://il.linkedin.com/in/orassayag