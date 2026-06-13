# HANDOFF CONTINUE - FitAI WeChat Mini Program

Last updated: 2026-06-12

## Current Working Goal

Continue improving the FitAI WeChat mini program from a real fitness user's perspective:

- improve daily workout experience
- improve local data consistency and dirty-data tolerance
- keep WeChat upload package size safe
- after every meaningful round, run `npm run build:mp-weixin`
- after building, overwrite `D:\dist-upload-home-ai-v1`
- report main package and `exercise-assets` package sizes

The goal is still active. Do not mark the overall product complete.

## Work Location

Project root:

```text
D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker
```

Upload-ready output folder:

```text
D:\dist-upload-home-ai-v1
```

Original handoff:

```text
HANDOFF.md
```

This continuation handoff:

```text
HANDOFF_CONTINUE.md
```

## Product Direction

The product is a Chinese WeChat mini program for personal fitness tracking.

Key product context is now documented in:

```text
PRODUCT.md
```

Important direction:

- product UI, not marketing site
- Chinese user-facing text
- practical, clean, Apple-like, not cluttered
- local-first storage for current iteration
- no large main-package media
- small, verified improvements over risky rewrites

## Recent Completed Work Since Original HANDOFF

### 1. Product context and design workflow files

Added:

```text
PRODUCT.md
docs/superpowers/specs/2026-06-11-fitai-home-ui-redesign-design.md
docs/superpowers/plans/2026-06-11-fitai-home-ui-redesign.md
```

These are context/spec files for earlier UI work. The user later said to ignore frontend UI because they redesigned it separately.

### 2. UI work that may exist in current tree

Some earlier UI-related changes may be present:

- `src/pages/index/index.vue`
- `src/uni.scss`
- `src/pages.json`

The user later said to ignore frontend UI and continue backend/internal code optimization. Do not spend more time on visual redesign unless asked.

### 3. Type-check cleanup

The project now passes:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run type-check
```

Fixed prior type-check issues in:

- `src/services/ai-plan.local.ts`
- `src/services/home-insights.local.ts`
- `src/pages/settings/settings.vue`
- `src/pages/body-data/body-data.vue`
- `src/pages/plans/plan-detail.vue`
- `src/pages/plans/plans.vue`

### 4. Training record service hardening

Updated:

```text
src/services/training.local.ts
```

Important changes:

- safer local training record reads
- non-array cache returns `[]`
- action search text uses precomputed `ACTION_SEARCH_TEXT_MAP`
- 1RM / best-set calculation uses shared helpers from `src/utils/calculator.ts`

Reason:

- faster history action search
- less repeated Exercise Library scanning
- fewer formula copies
- better dirty-cache tolerance

### 5. Training plan consistency hardening

Updated:

```text
src/services/training-plan.local.ts
```

Important changes:

- safer local plan reads
- added `syncScheduleStats(plan)`
- `updatePlan`, `markSessionCompleted`, and `unmarkSessionByRecordId` now recalculate:
  - weekly completed sessions
  - weekly total sessions
  - total completed sessions
  - total sessions
  - completion rate
  - next session

Reason:

- avoids plan progress drift when data is imported, edited, repeatedly marked, or repaired
- better real-user consistency between workout records and plan progress

### 6. Backup import safety

Updated:

```text
src/pages/settings/settings.vue
```

Important changes:

- added local `WxBackupApi` typing for backup export/import APIs
- added `validateBackupData(parsed)`
- backup import now requires:
  - object root
  - `version` string
  - `exportedAt` string
  - at least one known FitAI data key
  - array-backed data keys must be arrays when present

Reason:

- prevents a user from accidentally importing a random JSON file or damaged backup and overwriting local data

### 7. Local storage dirty-data tolerance

Updated:

```text
src/services/template.local.ts
src/services/training-template.local.ts
src/services/body-data.local.ts
src/services/diet.local.ts
src/services/reminder.local.ts
src/services/body-profile.local.ts
src/services/user.local.ts
```

Important changes:

- array-backed services validate `Array.isArray(...)`
- profile/settings services validate root object before merging defaults
- old weak service pattern `return data ? JSON.parse(data) : []` has been removed from `src/services`

Reason:

- imported backup data, old cached data, or corrupted local storage should not break core pages

### 8. Training calculation consistency

Updated:

```text
src/utils/calculator.ts
src/utils/calculator.test.ts
src/pages/training-record/training-record.vue
src/services/statistics.local.ts
src/services/training.local.ts
src/services/training.ts
```

Important changes:

- added shared `calculateBestSet(action)`
- `calculateActionVolume(action)` now respects `setsDetail` when present
- `calculateAction1RM(action)` and `updateActionCalculations(action)` now use the best detailed set
- training record page now builds actions through `updateActionCalculations(...)`
- statistics PR logic and local training normalization now share the same best-set rule

Reason:

- workout save, history, statistics, and PR records should not disagree when one exercise has multiple set weights
- real users often pyramid weight across sets, so detailed sets must be the source of truth

### 9. Backup import plan-progress repair

Updated:

```text
src/utils/backup-normalize.ts
src/utils/backup-normalize.test.ts
src/pages/settings/settings.vue
```

Important changes:

- added `normalizeBackupDataForImport(...)`
- backup import now repairs `fitness_training_plans` before writing storage
- imported plan weekly completed/total sessions are recalculated from `dailySchedules`
- imported plan progress completed/total sessions, completion rate, current week, and next session are recalculated
- if the backup also includes training records, completed plan sessions linked to missing records are unmarked and the broken `recordId` is cleared
- if the backup also includes templates, plan sessions linked to missing templates have their `templateId` cleared and their template name labeled as deleted

Reason:

- old backups, interrupted saves, or manually edited JSON should not make plan pages show impossible progress like 100% while unfinished sessions still exist
- restoring data on a new phone should produce consistent plan/home/history state
- imported plans should not show a session as completed when tapping it cannot open the underlying training record
- imported plans should not keep broken template links that look selectable but cannot resolve to a real template

### 10. Template-to-workout transfer hardening

Updated:

```text
src/utils/training-transfer.ts
src/utils/training-transfer.test.ts
src/pages/training-record/training-record.vue
```

Important changes:

- added `normalizeUsingTemplatePayload(...)`
- using-template temporary storage now accepts only valid action-name arrays
- action names can be restored from either strings or `{ name }` objects
- invalid template transfer data is rejected and the temporary cache is cleared

Reason:

- if `using_template` local storage is stale or corrupted, opening the training record page should not repeatedly fail
- real users may bounce between template and workout pages; temporary transfer state should be self-healing

## Latest Verified Commands

The last successful verification before this handoff:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run type-check
& 'C:\Program Files\nodejs\npm.cmd' run build:mp-weixin
```

Build result:

- `npm run type-check`: passed
- `npm run build:mp-weixin`: passed
- Sass legacy JS API warnings still appear; they are non-blocking

Latest copied upload folder:

```text
D:\dist-upload-home-ai-v1
```

Latest package sizes after the last full code round:

- Main package: about 374.6 KB
- `exercise-assets`: about 180.4 KB

Recheck sizes after every next change.

## Current Build / Copy Commands

Run from project root:

```powershell
Set-Location 'D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker'
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run type-check
& 'C:\Program Files\nodejs\npm.cmd' run build:mp-weixin
```

Copy output and measure size:

```powershell
$source = 'D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\dist\build\mp-weixin'
$upload = 'D:\dist-upload-home-ai-v1'
New-Item -ItemType Directory -Force -Path $upload | Out-Null
robocopy $source $upload /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
$code = $LASTEXITCODE
$mainSize = (Get-ChildItem -LiteralPath $upload -Recurse -File | Where-Object { $_.FullName -notlike '*\exercise-assets\*' } | Measure-Object Length -Sum).Sum
$subPath = Join-Path $upload 'exercise-assets'
$subSize = 0
if (Test-Path $subPath) { $subSize = (Get-ChildItem -LiteralPath $subPath -Recurse -File | Measure-Object Length -Sum).Sum }
[pscustomobject]@{
  RobocopyExitCode = $code
  UploadDir = $upload
  MainKB = [math]::Round($mainSize / 1KB, 1)
  ExerciseAssetsKB = [math]::Round($subSize / 1KB, 1)
} | Format-List
if ($code -le 7) { exit 0 } else { exit $code }
```

Note:

- `robocopy` exit code `1` is acceptable; it means files copied.

## Known Constraints / Notes

- `git` may not be available in PATH in this environment.
- Do not rely on `git diff` unless verified first.
- PowerShell may display Chinese mojibake if encoding is not UTF-8; source files are UTF-8.
- Avoid adding image/GIF/media assets to the main package.
- ExerciseDB online source remains optional and may rate-limit.
- WeChat legal domain issues may still exist for `https://oss.exercisedb.dev`.

## Good Next Work

Recommended next internal-code/data consistency improvements:

1. Add consistency repair helpers for imported backup data:
   - normalize plan progress after import
   - ensure deleted templates do not leave broken plan sessions
   - ensure record-linked plan sessions still point to existing records

2. Improve settings import flow further:
   - show how many records/templates/plans will be imported before overwrite
   - optionally create an automatic pre-import backup

3. Improve ExerciseDB resilience:
   - verify cache invalidation and fallback snapshot behavior
   - make online errors less noisy

4. Improve statistics consistency:
   - centralize best-set / PR calculation logic so home, history, and statistics use the same rules

5. Keep running:
   - `npm run type-check`
   - `npm run build:mp-weixin`
   - copy to `D:\dist-upload-home-ai-v1`
   - report package sizes

## Do Not Do Unless Asked

- Do not continue frontend visual redesign; user said they redesigned UI already.
- Do not add a backend/cloud sync claim unless it is actually implemented.
- Do not add large media assets.
- Do not do broad rewrites.
- Do not mark the overall goal complete; keep iterating.
