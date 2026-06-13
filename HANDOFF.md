# HANDOFF - FitAI WeChat Mini Program

Last updated: 2026-06-11

## Project Overview

### Project name
FitAI / AI fitness assistant WeChat mini program.

### Project purpose
Build a practical personal fitness mini program for Chinese users. The app should make daily training easier to record, reuse, review, and improve over time.

### Business goal
Turn the original demo into a usable lightweight fitness product:

- record workouts quickly on mobile
- reuse common exercises, templates, and previous weights/reps
- plan training dates instead of only fixed one-day-on-one-day-off cycles
- review training history, body data, diet, and progress
- keep the WeChat upload package small enough for release

### Current project stage
Active iterative improvement. The app is already buildable and has many core flows implemented. The current approach is to keep making small, verified UX/data improvements and rebuild after each round.

### Definition of success
The project is not "done" yet. A good continuation should preserve these standards:

- no regression in existing workout/template/plan/history flows
- every completed code round must run `npm run build:mp-weixin`
- after building, overwrite `D:\dist-upload-home-ai-v1`
- keep the WeChat main package well under 2 MB
- prefer small, user-facing improvements over large risky rewrites
- avoid adding large media resources to the main package

## Client / User Context

### Who the client is
The user is building their own fitness record mini program and is not deeply comfortable with npm, builds, package limits, or WeChat developer tooling.

### Target audience
Chinese fitness users, especially:

- gym users
- home training users
- beginners who need exercise names and visual references
- people who repeatedly train common templates such as chest/back/legs
- users who may input wrong records and need to edit later

### Important preferences

- Chinese UI and Chinese user-facing text.
- The design direction should feel closer to Apple style: clean, direct, polished, not cluttered.
- Keep practical workout flows smooth. The user values real mobile experience over decorative features.
- Continue without asking for confirmation for every small decision.
- Conserve package size and quota; make focused improvements.
- Do not create unnecessary new directories.

### Important constraints

- WeChat main package limit matters. A previous upload failed when main package exceeded 2 MB.
- Exercise GIF/media must not bloat the main package.
- ExerciseDB free API can rate-limit or be slow; the app must degrade gracefully.
- The user's ExerciseDB legal domain setup has been difficult before. Domain-related errors may still happen on real device.
- The codebase displays Chinese correctly in files, but PowerShell may show mojibake when reading UTF-8. Do not assume the source is corrupted just because terminal output looks garbled.

## Current Status

### Finished tasks

- Moved active work to D drive workspace:
  `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker`
- Repeatedly built and copied output to:
  `D:\dist-upload-home-ai-v1`
- Integrated local exercise library and ExerciseDB free source.
- Added Chinese name translation and search aliases for common exercises.
- Reduced package risk by keeping GIF/media limited and in `exercise-assets` subpackage.
- Removed MuscleWiki copy-link style flow.
- Added templates, plans, history, body data, diet, reminders, settings, profile, charts, and AI-plan pages.
- Added many mobile UX protections:
  - save loading states
  - delete loading states
  - duplicate submit prevention
  - unsaved training-record hint
  - unsaved training-record back protection
  - action modal close confirmation
  - template modal close confirmation
- Added history "再练一次" flow:
  - History detail stores `repeat_workout_record`
  - Training record opens as a new workout for today using previous actions/weights/reps
- Improved home hero logic:
  - today planned workout
  - today completed workout
  - upcoming next planned workout
  - no-plan fallback

### Approved decisions

- Use local-first storage for current iteration, not backend-first.
- Use ExerciseDB free endpoint but never depend on it as the only available exercise source.
- Use local snapshots and curated local exercise data to improve Chinese search and reliability.
- Keep Apple-like clean UI, but accept the current mixed implementation while improving gradually.
- Build and copy after every meaningful round.
- Keep the goal active; do not mark fully complete until the whole product scope is actually proven.

### Completed deliverables

- Buildable WeChat mini program output.
- Upload-ready folder:
  `D:\dist-upload-home-ai-v1`
- Core source folder:
  `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker`
- This handoff file:
  `HANDOFF.md`

### Existing assets

- `src/exercise-assets/index/index.vue`: subpackage entry for exercise assets.
- ExerciseDB snapshot data:
  `src/services/exercisedb-snapshot.local.ts`
- Local exercise GIF mapping/check:
  `src/services/exercise-media.local.ts`
- No large new media should be added without checking package size.

## Technical Overview

### Framework

- uni-app
- Vue 3
- TypeScript
- WeChat mini program target

### Build command

Run from project root:

```powershell
Set-Location 'D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker'
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run build:mp-weixin
```

### Copy build output to upload folder

```powershell
$source = Resolve-Path 'D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker\dist\build\mp-weixin'
$upload = 'D:\dist-upload-home-ai-v1'
if (Test-Path $upload) { Remove-Item -LiteralPath $upload -Recurse -Force }
New-Item -ItemType Directory -Force -Path $upload | Out-Null
Copy-Item -Path (Join-Path $source.Path '*') -Destination $upload -Recurse -Force
$mainSize = (Get-ChildItem -LiteralPath $upload -Recurse -File | Where-Object { $_.FullName -notlike '*\exercise-assets\*' } | Measure-Object Length -Sum).Sum
$subPath = Join-Path $upload 'exercise-assets'
$subSize = 0
if (Test-Path $subPath) { $subSize = (Get-ChildItem -LiteralPath $subPath -Recurse -File | Measure-Object Length -Sum).Sum }
[pscustomobject]@{
  UploadDir = $upload
  MainKB = [math]::Round($mainSize / 1KB, 1)
  ExerciseAssetsKB = [math]::Round($subSize / 1KB, 1)
} | Format-List
```

### Last known package size before this handoff

- Main package: about 352.4 KB
- `exercise-assets`: about 180.4 KB

These numbers should be rechecked after every change.

## Main Pages

### `src/pages/index/index.vue`
Home page. Shows:

- today's planned workout or completed state
- next upcoming plan if today has no workout
- statistics
- AI-style insights
- week status
- PR records
- quick navigation grid

Recent logic added:

- `todayPlanInfo`
- `nextPlanInfo`
- `heroTitle`
- `heroSubtitle`
- primary button routes to today's workout, today's record, next plan detail, or blank record.

### `src/pages/training-record/training-record.vue`
Core workout entry page.

Important behavior:

- can open blank record
- can edit existing `recordId`
- can start from plan `planId`, `week`, `templateId`, `date`
- can consume selected exercise from `selected_exercise`
- can consume template from `using_template`
- can consume history repeat from `repeat_workout_record`
- uses previous action profiles to fill last weights/reps
- save links completed plan sessions
- editing a linked record unmarks old plan session first
- warns if edited date differs from linked plan date
- has unsaved-change state and back protection

Important local storage transfer keys:

- `selected_exercise`
- `using_template`
- `repeat_workout_record`

### `src/pages/exercises/exercises.vue`
Exercise library page.

Important behavior:

- local and ExerciseDB source tabs
- local search with Chinese aliases
- ExerciseDB online loading with rate-limit handling
- can send selected exercise to training record
- can send selected exercise to template editor

### `src/pages/templates/templates.vue`
Training templates.

Important behavior:

- create/edit/delete templates
- choose actions from local library or ExerciseDB
- use template to start training through `using_template`
- delete template detaches it from plans
- save cleans duplicate/blank actions
- modal warns before discarding unsaved changes

### `src/pages/plans/*`
Plan list/create/detail/edit.

Important behavior:

- user can select training days/templates instead of rigid training/rest cycle
- plan detail can open scheduled workout
- completed sessions can reopen the record
- template deletion detaches schedule safely

### `src/pages/history-query/history-query.vue`
Workout history.

Important behavior:

- date/body part/action search
- action search uses translated/alias matching through `training.local.ts`
- detail modal supports edit/delete
- delete unmarks linked plan session
- "再练一次" opens today's new workout with same actions/weights/reps

### `src/pages/body-data/body-data.vue`
Body data.

Implemented:

- record/edit/delete body metrics
- history "view all" flow
- includes chest and hip fields
- loading/saving/delete states

### `src/pages/diet/diet.vue`
Diet record page.

Implemented:

- quick food chips
- save/load by date
- shows whether the date has saved record
- saving/loading states

### `src/pages/reminders/reminders.vue`
Missed training reminder center.

Subscription template ID:

```text
6TkLklsfN0aqs8AkyVbZtSQ0jGVNT1pHI6reULAp5TE
```

Implemented:

- missed plan checks
- record/go-plan entry
- subscribe request button
- local reminder settings

### `src/pages/settings/settings.vue`
Settings and data management.

Storage keys included for export/clear:

- `fitness_training_records`
- `fitness_training_templates`
- `fitness_training_plans`
- `fitness_body_data_records`
- `fitness_body_profile`
- `fitness_diet_records`
- `fitness_local_reminder_settings`
- `fitness_missed_plan_reminder_last_shown`
- `fitness_user_profile`

## Services And Data

### Local storage services

- `src/services/training.local.ts`
- `src/services/template.local.ts`
- `src/services/training-plan.local.ts`
- `src/services/body-data.local.ts`
- `src/services/body-profile.local.ts`
- `src/services/diet.local.ts`
- `src/services/reminder.local.ts`
- `src/services/user.local.ts`

### Exercise services

- `src/services/exercise-library.local.ts`
- `src/services/exercisedb.local.ts`
- `src/services/exercisedb-snapshot.local.ts`
- `src/services/exercise-media.local.ts`
- `src/utils/exercise-name-translate.ts`

ExerciseDB base URL:

```text
https://oss.exercisedb.dev/api/v1
```

WeChat legal domain likely needed:

```text
https://oss.exercisedb.dev
```

Do not put protocol-prefixed URLs into "preconnect domain" fields that reject them; WeChat domain configuration is picky.

## Known Issues / Risks

### Package size
Main package must stay below 2 MB. Current main package is small, but adding GIFs/images can break upload quickly.

### ExerciseDB reliability
The free API may return 429 or timeout. The app currently uses cache/snapshot/local data, but online ExerciseDB should still be treated as optional.

### Chinese translation quality
ExerciseDB names are translated by a local utility and curated aliases. Some long-tail English exercise names may still look awkward or remain English.

### UI consistency
The app is closer to a clean practical UI now, but pages still have mixed styling histories. Continue aligning toward a refined Apple-like mobile feel.

### Backend/AI not fully real
The original PRD mentioned Spring Boot, MySQL, Redis, JWT, and OpenAI API. Current implementation is mostly local-first demo logic. Do not claim backend cloud sync or real AI API is complete unless it is actually implemented.

### Git
Git may not be available in the environment path. Do not rely on `git diff` unless verified.

## Development Rules For The Next AI

1. Work in:
   `D:\CodexFitnessWorkspace\work\workspace-src\workspace\fitness-tracker`
2. Use `rg` for searching.
3. Use `apply_patch` for manual edits.
4. Avoid creating new directories unless genuinely necessary.
5. Avoid large assets.
6. After every meaningful code/doc round:
   - run `npm run build:mp-weixin`
   - copy output to `D:\dist-upload-home-ai-v1`
   - report main/subpackage size
7. Keep user communication in Chinese and non-technical where possible.
8. Prefer small verified improvements over broad rewrites.
9. Do not mark the active goal complete unless every requirement is truly verified.

## Suggested Next Work

Good next improvements:

- Add more polished empty states and "next action" buttons in plan/template/body/diet pages.
- Improve ExerciseDB Chinese translation mappings for common gym machine names.
- Improve exercise detail page so users can understand movement without relying on every GIF.
- Add a compact "last performance" summary to history/detail and plan start pages.
- Add stronger data export/import explanation for non-technical users.
- Make charts more useful: show body-weight trend, training frequency, total volume by body part, and PR progression.
- Review all pages for mojibake risk in generated output only; source files should remain UTF-8.

## Recent Workflow Pattern

The project has been improved in small rounds:

- inspect relevant page/service
- patch one real user pain point
- build
- copy upload folder
- report concise Chinese summary and package sizes

Continue this pattern unless the user asks for a larger redesign.

