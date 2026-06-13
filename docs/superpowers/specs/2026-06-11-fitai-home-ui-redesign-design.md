# FitAI Home UI Redesign Design

## Design Read

This is a product UI redesign for a Chinese WeChat fitness mini program. The redesign should feel clean, focused, and Apple-like, but it must serve fast workout recording rather than look like a marketing page.

## Chosen Direction

Use the recommended hybrid direction:

- Base direction: A, restrained upgrade.
- Borrow from direction B: stronger "next workout" framing and a more helpful next-step feel.
- Avoid direction C as the main direction because it removes too much actionable training context from the home screen.

## Goals

- Make the home page feel like a mature daily-use fitness tool.
- Preserve all existing home page data logic, navigation routes, and storage flows.
- Create a visual baseline other pages can gradually follow.
- Keep package size safe by using CSS only, no new image, font, or UI library dependency.

## Non-Goals

- Do not redesign every page in this round.
- Do not change backend, storage, plan, template, or history behavior.
- Do not add large media assets or new runtime dependencies.
- Do not replace Chinese copy wholesale unless it improves clarity.

## Visual System

Use the existing newer palette as the foundation and make it more deliberate:

- Ink: `#101820` for navigation, primary text, and strongest surfaces.
- Accent: `#22c55e` for primary action, completed status, and selected training states.
- Background: cooler near-white app background, around `#f3f6f5`.
- Surface: white cards with subtle borders or very soft shadows.
- Muted text: darker than the current light gray where readability matters.

Reduce multi-color gradient usage on the home screen. The current quick action grid uses many separate gradients, which makes the product feel less cohesive. Replace it with restrained monochrome tiles and one accent treatment for the most important action.

## Home Page Structure

Keep the same major sections, but improve hierarchy:

1. Hero: today's date, training state, short subtitle, and one clear primary action.
2. Metrics: continuous days, month count, total hours, visually quieter and closer to the hero.
3. AI advice: presented as calm guidance, not a warning/card-color system.
4. Week status: clean seven-day rhythm with completed and today states.
5. PR records: horizontal cards, improved contrast and spacing.
6. Quick actions: grouped as app tools with less visual noise.

## Interaction And States

- Disabled buttons should keep readable text and look intentionally unavailable.
- Loading states should remain inline and calm.
- Empty states should tell the user what will appear after recording, with one next action where useful.
- Touch targets should remain large enough for WeChat mobile use.

## Implementation Scope

Modify:

- `src/uni.scss`: update global design variables to match the new baseline.
- `src/pages.json`: align navigation bar background with the new system.
- `src/pages/index/index.vue`: update home layout and styles, with minimal template changes.

Keep:

- Existing `loadStatistics`, `loadTodayPlan`, `primaryAction`, and `goQuick` behavior.
- Existing page routes.
- Existing storage keys and service calls.

## Verification

After implementation:

- Run the WeChat build command: `npm run build:mp-weixin`.
- Copy `dist/build/mp-weixin` to `D:\dist-upload-home-ai-v1`.
- Report main package and `exercise-assets` package sizes.
- Inspect the generated home page output enough to catch obvious text overflow and style regressions.

## Risks

- Some pages still use old purple gradient styles. This round will not fully remove that debt, but the updated global variables and home page can guide later pages.
- Because this is a uni-app WeChat mini program, browser-perfect CSS features should be avoided. Use simple layout, color, spacing, border, and shadow changes.
- Terminal output may show mojibake for Chinese text. Source files should be read and written as UTF-8.
