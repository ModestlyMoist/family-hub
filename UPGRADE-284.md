# Family Hub 284 — verified upgrade checkpoint

Core `app.js` remains byte-for-byte unchanged at SHA256 `F55109F5C22F19DDEC36E467DA78CC822265C5C3DEC1901BD16AEDBDDAFBD737`.

## Rollback

Before edits: branch `rollback/pre-upgrade-v283a-20260918`, commit `580c7a76b344c19b6d91881dfe5c82b397789e24`. Full source ZIP, verified Git bundle, cloud row, and the previously deployed Edge Function are saved privately under the task's `outputs/rollback-v283a`. Never commit those family-data files. Code rollback needs fresh cache version references; do not rewind live family data merely to undo presentation changes. The upgraded endpoint requires the upgraded sync client, so restore its saved function too when reverting to the old client. Preserve newer family data and local pending changes before any data rollback.

## Budget implementation

- Collapsible groups with Assigned / Activity / Available totals, funding and overspending warnings, and payment shortfalls. Local search, filters, expand/collapse and device preferences.
- Unified account-aware transaction entry and top-level transfer/card payment, income, full ledger, import, archive and month-end actions.
- Arbitrary months, current-month return, local month preference and date mismatch reminders.
- Owed versus reserved card cash and direct payment. Card activity distinguishes reservation changes from expense activity.
- Available explanation; funding progress continues to use monthly Assigned only.
- Explicit bucket move ledger supports carried and payment-reserve cash. Coverage and month-end sweeps are reviewed; card reserves and future assignments are preserved.
- Stable category IDs; rename preserves legacy expense references. Group changes, ordering, archive/restore and date-based goal references.
- Funding previews before mutations. Full searchable ledger including read-only earlier expenses; account, category, dates, type and cleared markers.
- Income and explicit signed reconciliation/manual balance adjustments. Account reconciliation freshness.
- Local CSV/JSON import validation, duplicate preview, per-row account/category choices, starting-balance confirmation, trial-copy validation, and opt-in merchant rules. Imports never use a remote parser.
- Explicit bill/debt links separate required amounts from planned funding. Loan payments split full cash spending from principal reduction; credit debt links use the card account. Linked payment entries remain preserved in the ledger.
- Visible saving/saved/pending/failure/conflict states, retry, queued saves and same-field conflict review. Revision-conditional server updates prevent competing writes. Independent ID-based ledger additions merge and reconcile account effects.
- Ten local snapshots, private cloud history with 100 retained snapshots, backup export, compared restore and pre-restore export. Transaction deletion remains explicit and reviewable.

## Site implementation

- Section links and browser Back/Forward, selected navigation indicators, six mobile navigation items on one row, compact encouragement with per-device preferences.
- Home Today reference collapsed; weekly dashboard and Today working view retained. Attention reminders can be snoozed for a day.
- Task reference and completion lists collapse. Daily skips have explicit undo and preserve task records; existing completion undo and reassignment remain.
- Calendar foundation and recurring exceptions preserved. Reviewed portable calendar exchange; near-term sports range, season option, transport and overlap/custody context.
- Meals use the seven displayed dates consistently. Tracked recipe/date ingredient contributions prevent repeated adds and combine compatible quantities/units.
- Shopping categories and order preview collapse, quantities/units remain visible, completed orders are preserved, and an optional grocery transaction opens for review.
- Wellness summaries collapse; daily controls remain. Medication routine links are references and never infer or log doses.
- Activity search covers person, dates and type with section links. Settings reflects sync freshness and includes a routines/help guide and notification limitations.
- Offline asset references synchronized. Non-HTML navigations cannot replace cached index HTML.

## Verification

Baseline passed before edits. Checkpoints pass: all JS syntax checks; HTML/service-worker asset parity; original card engine, UI handler and sync suites; stale-copy/deletion/concurrency regressions; new import, carryover move, income and adjustment tests; mocked Edge Function auth and revision tests; conflicting assignment tests.

Browser fixtures have no live sync. Verified: group collapse retains payment warnings; October carries September balances without funding progress; moving carried cash preserves Assigned and RTA; income; duplicate import preview; committed imported card purchase reserves funded cash; browser Back and direct Money route; mobile overflow/nav positions; seven-day meal count; repeated ingredient import yields no new ingredients; shopping review/history preserves quantities; task skip/undo controls; linked payment principal and page preservation; near-term sports view.

## Deliberate boundaries

No automatic changes to existing balances, transactions, bill amounts or minimums. No old card purchases are retroactively migrated. Imported rows require review and a starting-balance check. Earlier expenses lack account effects and remain read-only in the unified ledger. Linked principal entries are corrected through explicit adjustments and debt records rather than silently rewriting payment history.

External OAuth calendar providers and bank feeds are not connected: no external account authorization was supplied. Calendar exchange adds reviewed one-time JSON events and exports one-time ICS entries, with local times in descriptions; recurring series are deliberately omitted. Browser notifications still require permission and an active app; background push is not connected. The existing standalone PWA supports a desktop window through browser installation; this release does not install an OS package.
