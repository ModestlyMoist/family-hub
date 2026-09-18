Transaction sync protection v283a
================================

The v280a merge interpreted a missing transaction as deletion if the surviving row matched the common base. An older cloud copy could therefore remove an unchanged local transaction during an assignment save and roll back the account balance. A merged-data refresh also invoked core render(), taking an isolated Money screen back to Home.

The focused fix retains ID-based merge and requires an explicit `budget.transactionDeletes[id]` record to delete a transaction. Transactions missing from an old copy survive. The existing Delete form writes that marker while reversing the account effect. Old clients that delete only by array omission cannot delete a surviving row; update all devices before deleting transactions.

Saves queue on each device. A response merges with edits made during its request instead of overwriting them. The selected account-array snapshot is adjusted by the difference between its ledger effects and the merged ledger effects, avoiding lost or doubled purchase/payment effects. Startup GETs also retain local ledger changes. Failed latest-state GETs do not proceed with a blind POST. The underlying server remains a single JSON upsert without CAS; simultaneous whole-object writes on separate devices can still race. These client protections do not claim a server transaction/version guarantee.

Money refreshes through its existing module events and stays open. Other app screens retain their existing refresh behavior. app.js is unchanged, and no server function or schema was changed. The current Edge Function and table schema were inspected before this change.

Transactions in the existing local backup are copied into a local recovery archive before that backup is replaced. Missing, non-tombstoned records appear as recoverable transactions on Money. Recovery requires review and confirmation, preserves the original ID, and only applies an account effect if the backup/current balance comparison identifies exactly that missing effect. Ambiguous balances require manual review; no invented historical transaction is silently inserted.

Checks: node credit-card-budget.test.cjs; node credit-card-ui.test.cjs; node credit-card-sync.test.cjs; node sync-regression.test.cjs; JS syntax and diff whitespace checks. Regression coverage includes the stale-copy disappearance case, reopening GET, real deletes, an assignment during an in-flight POST, independent purchases on two devices, navigation preservation, and backup archiving. No live test transactions are created by these tests.
