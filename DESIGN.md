# Design

## Product

FitAI is a Chinese WeChat mini program for personal fitness tracking and AI-assisted training planning. It helps users record workouts, reuse templates, follow plans, browse exercises, review history, track body data, manage diet records, set reminders, and see progress.

The design should serve daily mobile use. Users may open the app in a gym, at home, or right after training, so the interface must be readable, fast to scan, and reassuring.

## Design Direction

Fresh premium health tool.

The interface should feel closer to polished Apple-style health software than a dark gym dashboard. It should be calm, clean, high-end, and practical. The UI should feel light and breathable, but not low contrast. It should look modern without looking like a marketing landing page.

Avoid:

- Dark green or heavy fitness-console styling.
- Black header blocks as the main visual language.
- Purple AI gradients.
- Decorative glassmorphism.
- Low-contrast gray body text.
- Busy gamified fitness visuals.
- Large media assets or image-heavy layouts.

## Visual Personality

- Clean
- Focused
- Encouraging
- Premium
- Practical

The product should make users feel: "I know what to train next, I can record quickly, and my data is organized."

## Color System

Use a restrained, bright, high-contrast palette.

### Core Palette

- App background: `#F7FAFC`
- Soft background layer: `#F4F8FB`
- Main surface: `#FFFFFF`
- Surface border: `#DFE8EF`
- Primary text: `#18212F`
- Body text: `#344154`
- Secondary text: `#68778C`
- Muted text minimum contrast target: use no lighter than `#768398` on white
- Primary accent: `#4F8CFF`
- Primary accent gradient: `#4F8CFF` to `#5FB7FF`
- Soft primary background: `#E8F1FF`
- Success / completed state: `#53D7B6`
- Soft success background: `#E9FBF6`
- Warning background: `#FFF6E6`
- Warning text: `#805421`
- Danger / delete: `#F36D8D`

### Color Usage

- Blue is for primary actions, active tabs, selected controls, and key progress.
- Mint is for completed, healthy, recovered, or positive states.
- Amber is for warnings or attention states.
- Rose is only for delete/destructive actions.
- Do not use multiple saturated accents on the same screen.
- Do not use color alone to communicate state; pair it with labels, icons, or text.

## Typography

Use a native mobile sans-serif stack:

`-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`

### Typography Rules

- Chinese text must be clear and high contrast.
- Avoid thin, pale gray labels.
- Page titles should be bold and readable, not oversized.
- Body text should be at least visually equivalent to 13-14px on a 375px mobile screen.
- Labels and metadata can be smaller, but must remain readable.
- Use font weight and spacing for hierarchy, not decorative type.
- Keep letter spacing at `0`.

### Suggested Scale

- Page title: 26-28px, 800-900 weight
- Section title: 16-18px, 800-900 weight
- Body: 13-15px, 500-700 weight
- Metadata: 11-12px, 600-700 weight
- Primary button: 15-16px, 800-900 weight

## Layout

Mobile-first, 375px phone frame.

### Page Structure

- Use a light page background with subtle cool tint.
- Use cards only when they group a real task or information block.
- Cards should be rounded, but professional.
- Avoid nested cards where possible.
- Important action should appear near the relevant content.
- Repeated pages should share the same visual vocabulary.

### Spacing

- Page padding: 12-16px.
- Card padding: 14-18px.
- Section spacing: 12-16px.
- Compact lists should still have clear separation.
- Touch targets should be comfortable for one-handed mobile use.

## Component System

### Cards

Cards use:

- White surface
- Light border
- Subtle shadow
- 18-24px radius
- Clear title
- Metadata in readable muted text

Avoid heavy shadows and colored side stripes.

### Primary Button

Use clear blue:

- Background: `#4F8CFF` or blue gradient to `#5FB7FF`
- Text: white
- Pill radius
- Strong label
- Use only for the main action in a section or page

### Secondary Button

Use:

- Background: `#EEF4F8`
- Text: `#344154`
- No strong shadow

### Tabs / Segmented Controls

Use:

- Outer background: `#E7EEF4`
- Active tab: white
- Active text: `#4F8CFF`
- Rounded pill container
- Light shadow only on active state

### Chips / Tags

Use:

- Default background: `#EEF4F8`
- Default text: `#344154`
- Active background: `#E8F1FF`
- Active text: `#4F8CFF`
- Completed/success tag: `#E9FBF6` with `#16856C`

### Inputs

Use:

- White background
- Border: `#DFE8EF`
- Text: `#344154`
- Placeholder must remain readable
- Rounded 14-18px

### Empty States

Empty states should explain what happens next, not just say "empty".

Example tone:

- "还没有训练记录，完成一次训练后这里会显示你的重量、次数和 PR。"
- "先创建一个训练计划，之后首页会自动显示今天该练什么。"

### Modals / Bottom Sheets

Use:

- Soft page overlay: `rgba(24, 33, 47, 0.38)`
- White or near-white surface
- Large top radius
- Clear title
- Primary and cancel actions with consistent button styles

## Screen Requirements

### 1. Home Dashboard

Purpose: help the user know what to do next.

Must include:

- Today / date context
- Today's planned workout or fallback prompt
- Primary action: start today's workout / start recording / view plan
- Training stats: streak, monthly sessions, total hours
- AI suggestions
- Weekly status
- PR records
- Quick navigation

Design notes:

- The top area should be light, premium, and action-oriented.
- Avoid dark hero blocks.
- Metrics must be readable and compact.

### 2. Workout Record

Purpose: record a workout quickly and safely.

Must include:

- Date, body part, duration, location
- Total volume summary
- Exercise cards with sets
- Add/edit/delete actions
- Bottom save action
- Unsaved and saving states

Design notes:

- Inputs must be very legible.
- Exercise set pills should be compact and readable.
- Save button should be visually clear but not harsh.

### 3. Training Plans

Purpose: manage training plans and execute next session.

Must include:

- Plans/calendar tabs
- Create plan and AI plan entry
- Active plan cards
- Progress bar
- Next session
- Execute workout action
- Plan menu actions

Design notes:

- Avoid purple gradient plan cards.
- Avoid colored left-border cards.
- Use soft progress bars and clear status tags.

### 4. Exercise Library

Purpose: find an exercise and understand how to use it.

Must include:

- Local / ExerciseDB tabs
- Search
- Body part and equipment filters
- Exercise list
- GIF thumbnail area when available
- Selected exercise detail
- Movement tips and common mistakes
- Add to training / add to template

Design notes:

- The list should feel lightweight and scannable.
- Thumbnails should not dominate the page.
- Details should be useful without relying entirely on GIFs.

### 5. Supporting Modules

The following modules must use the same visual system:

- History
- Templates
- Body data
- Diet
- Reminders
- Settings
- Profile
- Charts
- AI plan
- Plan detail
- Create/edit plan

They should share the same:

- Background
- Card style
- Button style
- Text hierarchy
- Tabs
- Chips
- Empty states
- Modal style
- Warning/success states

## Accessibility

- Prioritize text clarity over subtle aesthetics.
- Body text must have strong contrast.
- Do not use pale gray for important labels.
- Touch targets should be comfortable.
- Color must not be the only state indicator.
- Motion should be subtle, state-driven, and safe for reduced motion.

## Output Preference For Stitch

Generate a mobile UI design system and screen mockups for a WeChat mini program. Use Chinese UI text. Show at least 4 core screens: home, workout record, training plans, exercise library. Also show how the same visual system extends to supporting modules.

The final design should feel fresh, premium, readable, and practical.
