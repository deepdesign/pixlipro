# Component Styles Documentation

This document defines consistent styling patterns for reusable UI components across the Pixli application. All components use Tailwind CSS with light/dark mode support.

## Icon Buttons

Icon buttons are square buttons that contain only an icon. They come in two variants:

### `icon-button` - With Background (Default State)

Icon buttons that have a subtle background color in their default state.

**Usage:**
```tsx
<Button
  type="button"
  size="icon"
  variant="background"
  className="icon-button"
>
  <Icon className="h-5 w-5" data-slot="icon" />
</Button>
```

**Styling:**
- **Size**: `h-10 w-10` (40px × 40px)
- **Default state**: 
  - Light mode: `bg-gray-50 text-zinc-500`
  - Dark mode: `dark:bg-slate-800/50 dark:text-gray-300`
- **Hover state**:
  - Light mode: `hover:bg-gray-100`
  - Dark mode: `dark:hover:bg-slate-700`
- **Active/Selected state**:
  - `bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]`
  - Hover: `hover:bg-[var(--accent-primary)]/90`
- **Border**: `border-0` (no border)
- **Padding**: `p-0`
- **Border radius**: `rounded-md`
- **Shrink**: `shrink-0` (don't shrink)

**Example locations:**
- Sprite selection buttons (default state)
- Lock/unlock button (default state)

### `icon-button` - No Background (Default State)

Icon buttons that have no background in their default state, showing background only on hover or when selected.

**Usage:**
```tsx
<Button
  type="button"
  size="icon"
  variant="naked"
  className="icon-button"
>
  <Icon className="h-5 w-5" data-slot="icon" />
</Button>
```

**Styling:**
- **Size**: `h-10 w-10` (40px × 40px)
- **Default state**: 
  - Light mode: `text-zinc-500` (no background)
  - Dark mode: `dark:text-gray-300` (no background)
- **Hover state**:
  - Light mode: `hover:bg-gray-50`
  - Dark mode: `dark:hover:bg-slate-800/50`
- **Active/Selected state**:
  - `bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]`
- **Border**: `border-0` (no border)
- **Padding**: `p-0`
- **Border radius**: `rounded-md` or `rounded-lg`
- **Shrink**: `shrink-0` (don't shrink)

**Example locations:**
- Left navigation column buttons (default state)
- Status bar buttons (default state)

## Complete Icon Button Class Definitions

### For Sprite Selection Buttons (icon-button-bg variant)

```tsx
className={
  isSelected
    ? "!border-0 !bg-[var(--accent-primary)] !text-[var(--accent-primary-contrast)] hover:!bg-[var(--accent-primary)]/90 hover:!text-[var(--accent-primary-contrast)] data-hover:!bg-[var(--accent-primary)]/90 data-hover:!text-[var(--accent-primary-contrast)]"
    : "border-0 bg-gray-50 text-zinc-500 hover:!bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:!bg-gray-700 data-hover:!bg-gray-100 dark:data-hover:!bg-gray-700 data-hover:!text-zinc-500 dark:data-hover:!text-gray-300"
}
```

### For Navigation Column Buttons (icon-button variant)

```tsx
className={`w-[44px] h-[44px] rounded-lg flex items-center justify-center transition-colors ${
  activePanel === item.value
    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)]"
    : "text-zinc-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
}`}
```

### For Status Bar Buttons (icon-button variant)

```tsx
// Uses Button component with size="icon" and variant="outline"
// Default styling: no background, shows background on hover
// Size: h-10 w-10 (40px × 40px)
```

## Standard Button Sizes

### Icon Buttons
- **Small**: `h-8 w-8` (32px × 32px)
- **Default**: `h-10 w-10` (40px × 40px) - **Standard size**
- **Large**: `h-12 w-12` (48px × 48px)

## Color Tokens

### Background Colors
- **Subtle background (light)**: `bg-gray-50`
- **Subtle background (dark)**: `dark:bg-gray-800/50`
- **Hover background (light)**: `bg-gray-100`
- **Hover background (dark)**: `dark:bg-gray-700`
- **Primary theme**: `bg-[var(--accent-primary)]`
- **Primary theme hover**: `bg-[var(--accent-primary)]/90`

### Text Colors
- **Default (light)**: `text-zinc-500`
- **Default (dark)**: `dark:text-gray-300`
- **Primary contrast**: `text-[var(--accent-primary-contrast)]`

## CSS Variables

The following CSS variables are used for theme-aware colors:

- `--accent-primary`: Primary theme color (e.g., green #58f5c2)
- `--accent-primary-contrast`: Contrasting text color for primary background
- `--accent-primary-shadow`: Shadow color for primary theme

## Implementation Notes

1. **Catalyst Button Compatibility**: When using Catalyst's Button component, use `data-hover:` variants in addition to `hover:` to ensure hover states work correctly.

2. **Important Flags**: Use `!important` flags (`!bg-*`, `!text-*`) when overriding Catalyst's default button styles.

3. **Border Removal**: Always use `border-0` to remove borders from icon buttons.

4. **Shadow Removal**: For selected/active states, ensure shadows are removed: `before:shadow-none after:shadow-none shadow-none`.

5. **Transform Removal**: For buttons that shouldn't shift on selection, use `!transform-none`.

## Example: Creating a New Icon Button

### With Background (icon-button-bg)
```tsx
import { Button } from "@/components/Button";
import { Icon } from "lucide-react";

<Button
  type="button"
  size="icon"
  variant="outline"
  className={
    isSelected
      ? "!border-0 !bg-[var(--accent-primary)] !text-[var(--accent-primary-contrast)] hover:!bg-[var(--accent-primary)]/90 data-hover:!bg-[var(--accent-primary)]/90"
      : "border-0 bg-gray-50 text-zinc-500 hover:!bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:!bg-gray-700 data-hover:!bg-gray-100 dark:data-hover:!bg-gray-700"
  }
>
  <Icon className="h-5 w-5" data-slot="icon" />
</Button>
```

### Without Background (icon-button)
```tsx
import { Button } from "@/components/Button";
import { Icon } from "lucide-react";

<Button
  type="button"
  size="icon"
  variant="outline"
  className={
    isSelected
      ? "!border-0 !bg-[var(--accent-primary)] !text-[var(--accent-primary-contrast)]"
      : "border-0 text-zinc-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 data-hover:bg-gray-50 dark:data-hover:bg-gray-800/50"
  }
>
  <Icon className="h-5 w-5" data-slot="icon" />
</Button>
```

## Component IDs and Class Names

### Consistent Naming Convention

- **Component classes**: Use kebab-case (e.g., `icon-button`, `icon-button-bg`)
- **State modifiers**: Use BEM-like syntax (e.g., `icon-button--selected`, `icon-button--disabled`)
- **Component IDs**: Use kebab-case with component prefix (e.g., `sprite-button-circle`, `nav-button-settings`)

### Standard Class Names

- `icon-button`: Icon button without default background
- `icon-button-bg`: Icon button with default background
- `icon-button--selected`: Selected/active state
- `icon-button--disabled`: Disabled state

## Future Enhancements

Consider creating utility classes or a component variant system using `class-variance-authority` (cva) to make these patterns even more reusable:

```tsx
import { cva } from "class-variance-authority";

const iconButtonVariants = cva(
  "h-10 w-10 p-0 flex items-center justify-center rounded-md shrink-0 border-0 transition-colors",
  {
    variants: {
      variant: {
        default: "text-zinc-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50",
        withBg: "bg-gray-50 text-zinc-500 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700",
        selected: "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

