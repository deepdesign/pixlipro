# Typography & Styling Documentation Prompt

Use this prompt to document all typography and styling patterns from the original pixli project (`C:\Users\JCutts\Projects\web\pixli`) into a comprehensive markdown file.

## Prompt

Please analyze the following files from `C:\Users\JCutts\Projects\web\pixli\src` and create a comprehensive markdown documentation file that captures all typography, spacing, and styling patterns:

### Files to Analyze:

1. **`src/index.css`** - Extract all typography-related CSS:
   - Font sizes (all `font-size` declarations)
   - Letter spacing (all `letter-spacing` declarations)
   - Text transforms (all `text-transform` declarations)
   - Font weights
   - Line heights
   - Color variables (`--text-primary`, `--text-muted`, `--text-subtle`)
   - All class-based typography styles (`.field-label`, `.field-value`, `.control-select-*`, etc.)

2. **Component Files** - Check for inline typography styles:
   - `src/components/retroui/Select.tsx`
   - `src/components/ControlPanel/shared/ControlSelect.tsx`
   - `src/components/retroui/Label.tsx`
   - `src/components/Button.tsx`
   - Any other components with typography patterns

### What to Document:

#### 1. Typography Scale
- Document all font sizes used (in rem/px)
- Document all letter-spacing values
- Document text-transform usage
- Document font-weight usage

#### 2. Typography Classes
For each typography class, document:
- Class name
- Font size
- Letter spacing
- Text transform
- Color
- Font weight (if applicable)
- Usage context

Key classes to document:
- `.field-label`
- `.field-value`
- `.control-select-category-label`
- `.control-select-item-label`
- `.control-dropdown-item`
- `.control-dropdown-trigger`
- Any other typography classes

#### 3. CSS Variables
Document all typography-related CSS variables:
- `--text-primary`
- `--text-muted`
- `--text-subtle`
- Their values in different themes (dark/light and all color themes)

#### 4. Component-Specific Typography
For each component, document:
- Default text size
- Letter spacing
- Text transform
- Color usage
- Responsive behavior (if any)

#### 5. Spacing Patterns
Document:
- Padding patterns for typography elements
- Margin patterns
- Gap values between typography elements

### Output Format:

Create a markdown file with the following structure:

```markdown
# Pixli Typography & Styling Reference

## Typography Scale

### Font Sizes
- `0.58rem` - Field labels
- `0.6rem` - Category labels
- `0.62rem` - Field values
- `0.65rem` - Dropdown items
- ... (list all)

### Letter Spacing
- `0.24em` - Field labels
- `0.2em` - Category labels
- `0.22em` - Field values
- `0.16em` - Dropdown items
- ... (list all)

## Typography Classes

### `.field-label`
- Font size: `0.58rem`
- Letter spacing: `0.24em`
- Text transform: `uppercase`
- Color: `var(--text-subtle)`
- Usage: Labels for form fields

### `.field-value`
- Font size: `0.62rem`
- Letter spacing: `0.22em`
- Text transform: `uppercase`
- Color: `var(--accent-primary)`
- Usage: Display values for form fields

### `.control-select-category-label`
- Font size: `0.6rem`
- Letter spacing: `0.2em`
- Text transform: `uppercase`
- Color: `var(--text-subtle)`
- Font weight: `600`
- Padding: `padding-inline: theme("spacing.2"); padding-block: theme("spacing.2"); padding-top: theme("spacing.3");`
- Usage: Category labels in select dropdowns

### `.control-dropdown-item`
- Font size: `0.65rem`
- Letter spacing: `0.16em`
- Text transform: `uppercase`
- Padding: `padding-inline: theme("spacing.2"); padding-block: theme("spacing.2");`
- Usage: Individual items in select dropdowns

### `.control-select-item-label`
- Font size: `0.65rem`
- Letter spacing: `0.16em`
- Text transform: `uppercase`
- Usage: Labels within dropdown items (with color previews)

## CSS Variables

### Text Colors
- `--text-primary`: Primary text color (varies by theme)
- `--text-muted`: Muted/secondary text color (varies by theme)
- `--text-subtle`: Subtle text color for labels (varies by theme)

### Theme-Specific Values
[Document values for each theme]

## Component Typography

### Select Component
[Document typography used in Select components]

### Button Component
[Document typography used in Button components]

## Responsive Typography
[Document any responsive typography patterns]

## Mobile Typography
[Document mobile-specific typography adjustments]
```

### Instructions:

1. Read through `src/index.css` systematically
2. Extract all typography-related CSS rules
3. Document font sizes, letter spacing, text transforms, and colors
4. Organize by component/class
5. Include CSS variable values for all themes
6. Note any responsive or mobile-specific adjustments
7. Create a well-structured markdown file that can be easily referenced

### Output File:

Save the documentation as: `docs/typography-reference.md`

This documentation will serve as a reference for maintaining consistent typography across the project.

