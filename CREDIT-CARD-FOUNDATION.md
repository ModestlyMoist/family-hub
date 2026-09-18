Credit-card foundation v282a
===========================

Each Credit Card account has a deterministic `card-payment-<accountId>` category in Credit Card Payments. Starting debt creates no cash reserve. Assign money to that category to reserve cash for existing debt.

New credit purchases carry `creditBudgetVersion: 1` and `creditAccountId` in the existing ID-merged transaction ledger. A chronological calculation applies each month's assignments, then transactions by date and creation order. A funded purchase consumes its spending bucket and reserves the same cash for the card. Activity remains the full purchase amount; Assigned remains the selected month's deliberate contribution.

If a $100 card purchase has only $40 in its bucket, $40 is reserved for payment, the bucket reaches $0, and $60 is classified as unfunded card debt. The account and transaction list show unfunded purchases. Adding more funding to that spending bucket in the purchase month recalculates coverage. Future-month funding does not cover a prior month's purchase.

A cash-to-card Transfer consumes the payment reserve and decreases both the paying account and the card's amount owed. Validation requires adequate reserve as of the payment date, cash in the source account, and adequate debt. Transfers from credit cards and card overpayments are outside this foundation and are rejected before mutation.

The cash summary uses remaining bucket money, including future assignments, instead of subtracting lifetime gross assignments from current cash. Automatic card reservations do not create a new assignment or additional cash. Payment categories use the existing mobile rows and styling.

Existing expenses retain their previous accounting treatment and acquire no automatic reserve. Existing card transfers are not silently corrected; deleting or editing them reverses their historical balance effect before applying the new rules. Historical transfers should be reviewed during later reconciliation.

Limits and review
-----------------

- Monthly assignments have no timestamps. They are treated as funding at the start of their month; historical assignment edits intentionally recalculate coverage.
- Editing/deleting a funded purchase after its payment can leave a negative payment bucket. This exposes the coverage shortfall instead of inventing cash.
- Automatically reserved and carried money retains the pre-existing limitation on moving bucket money: only this month's Assigned can be moved. A separate adjustment ledger remains future work.
- `sync-safety.js` is unchanged. Card metadata survives its transaction ID merge, and payment categories can be regenerated from accounts. Accounts and assignments still use the existing array/object merge behavior; simultaneous edits across devices can produce mismatched balances. These tests do not establish full concurrent-device accounting safety.
- No imports, new target types, month-close sweeps, Supabase changes, core changes, or CSS changes.
- No live PIN/data was used and no iPhone visual verification was performed. Review the new rows and longer account/transaction descriptions on iPhone before release.

Validation
----------

Run:

    node credit-card-budget.test.cjs
    node credit-card-ui.test.cjs
    node credit-card-sync.test.cjs

The accounting test includes the exact $3,000 cash / $500 debt / $400 groceries example, old debt, partial funding, rollover, legacy preservation, serialization, and cash transfers. The handler test exercises the actual transaction forms' add, transfer, edit, delete, and invalid-edit paths with a minimal DOM fixture. The sync test exercises the unchanged sync wrapper against a stale remote state and checks card metadata ID merge and deletion protection. Syntax checks cover every changed JavaScript module and the service worker.
