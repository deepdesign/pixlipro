# Settings Page: Side Navigation Layout Plan

## Overview

Move header navigation items into the Settings page and implement a scalable side navigation layout using Tailwind CSS and Catalyst UI components. This will create a unified settings experience with better organization and scalability.

---

## Current State

### Header Navigation Items (to be moved):
- Canvas (stays in header - main workspace)
- Animation → Move to Settings
- Sprites → Move to Settings
- Palettes → Move to Settings
- Presets → Move to Settings
- Sequences → Move to Settings

### Settings Page Current Tabs:
- Display → Move to side nav
- Remote Control → Move to side nav
- Integrations → Move to side nav
- Performance → Move to side nav

---

## Target Structure

### Side Navigation Categories:

**Content Management:**
- Animation
- Sprites
- Palettes
- Presets
- Sequences

**Configuration:**
- Display
- Remote Control
- Integrations
- Performance

---

## Phase 1: Create Settings Page with Side Navigation Layout

### 1.1 Create Settings Sidebar Navigation Component

**File:** `src/components/Settings/SettingsSidebar.tsx`

**Features:**
- Uses Catalyst `Sidebar`, `SidebarHeader`, `SidebarBody`, `SidebarSection`, `SidebarItem` components
- Navigation groups with `SidebarHeading` for "Content Management" and "Configuration"
- Active state highlighting using `current` prop
- Icons for each navigation item
- Responsive design (collapsible on mobile)

**Navigation Structure:**
```typescript
const navigationItems = {
  content: [
    { id: 'animation', label: 'Animation', icon: PlayCircle },
    { id: 'sprites', label: 'Sprites', icon: Shapes },
    { id: 'palettes', label: 'Palettes', icon: Palette },
    { id: 'presets', label: 'Presets', icon: Bookmark },
    { id: 'sequences', label: 'Sequences', icon: List },
  ],
  configuration: [
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'remote-control', label: 'Remote Control', icon: Smartphone },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'performance', label: 'Performance', icon: Zap },
  ],
};
```

### 1.2 Create Settings Layout Component

**File:** `src/components/Settings/SettingsLayout.tsx`

**Features:**
- Uses Catalyst `SidebarLayout` component
- Two-column layout: Sidebar (left) + Content (right)
- Responsive: Sidebar collapses to overlay on mobile
- Maintains consistent spacing and styling

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│  Settings Header (Breadcrumb)          │
├───────────┬─────────────────────────────┤
│           │                             │
│ Sidebar   │  Content Area               │
│ (256px)   │  (Flex)                     │
│           │                             │
│ - Content │  - Page Content             │
│   Mgmt    │  - Settings Forms           │
│           │  - Tables/Lists             │
│ - Config  │                             │
│           │                             │
└───────────┴─────────────────────────────┘
```

### 1.3 Refactor SettingsPage to Use Side Navigation

**File:** `src/pages/SettingsPage.tsx`

**Changes:**
- Replace tab-based navigation with side navigation
- Remove `TabGroup`, `TabList`, `Tab`, `TabPanels`, `TabPanel` components
- Integrate `SettingsLayout` and `SettingsSidebar`
- Update state management for active navigation item
- Maintain all existing tab content as separate pages/sections

**New Structure:**
```typescript
const [activeSection, setActiveSection] = useState<string>('display');

// Render content based on activeSection
const renderContent = () => {
  switch (activeSection) {
    case 'animation': return <AnimationPage />;
    case 'sprites': return <SpritesPage />;
    case 'palettes': return <PalettesPage />;
    case 'presets': return <PresetsPage />;
    case 'sequences': return <SequencesPage />;
    case 'display': return <DisplayTab />;
    case 'remote-control': return <RemoteControlTab />;
    case 'integrations': return <IntegrationsTab />;
    case 'performance': return <PerformanceTab />;
    default: return <DisplayTab />;
  }
};
```

---

## Phase 2: Update Header to Remove Navigation Items

### 2.1 Simplify Header Component

**File:** `src/components/Header/Header.tsx`

**Changes:**
- Remove all navigation buttons except "Canvas"
- Keep sidebar toggle button
- Keep logo
- Remove navigation items: Animation, Sprites, Palettes, Presets, Sequences
- Add "Settings" button/link that navigates to settings page

**New Header Structure:**
```
[Menu] [Logo]                    [Canvas] [Settings]
```

### 2.2 Update App.tsx Navigation Logic

**File:** `src/App.tsx`

**Changes:**
- Update `handleNavigate` to route to settings page with section parameter
- When navigating to settings sections, ensure settings page is shown
- Update URL structure: `/settings?section=animation` or `/settings/animation`
- Remove navigation handling for individual pages from header

---

## Phase 3: Create Settings Page Sections

### 3.1 Convert Tab Content to Section Components

**Files to Create/Modify:**

**File:** `src/components/Settings/sections/DisplaySection.tsx`
- Move content from `DisplayTab.tsx`
- Wrap in settings section container
- Add section heading

**File:** `src/components/Settings/sections/RemoteControlSection.tsx`
- Move content from `RemoteControlTab.tsx`
- Wrap in settings section container
- Add section heading

**File:** `src/components/Settings/sections/IntegrationsSection.tsx`
- Move content from `IntegrationsTab.tsx`
- Wrap in settings section container
- Add section heading

**File:** `src/components/Settings/sections/PerformanceSection.tsx`
- Move content from `PerformanceTab.tsx`
- Wrap in settings section container
- Add section heading

### 3.2 Integrate Existing Pages as Settings Sections

**Modify Existing Pages:**
- `src/pages/AnimationPage.tsx` - Ensure it works as settings section
- `src/pages/SpritesPage.tsx` - Ensure it works as settings section
- `src/pages/PalettesPage.tsx` - Ensure it works as settings section
- `src/pages/PresetsPage.tsx` - Ensure it works as settings section
- `src/pages/SequencesPage.tsx` - Ensure it works as settings section

**Changes:**
- Remove standalone page headers (they'll be in settings layout)
- Ensure pages can be rendered within settings container
- Maintain all existing functionality

---

## Phase 4: URL Routing and Navigation

### 4.1 Update URL Structure

**New URL Patterns:**
- `/settings` - Default (Display section)
- `/settings/animation` - Animation section
- `/settings/sprites` - Sprites section
- `/settings/palettes` - Palettes section
- `/settings/presets` - Presets section
- `/settings/sequences` - Sequences section
- `/settings/display` - Display section
- `/settings/remote-control` - Remote Control section
- `/settings/integrations` - Integrations section
- `/settings/performance` - Performance section

### 4.2 Update Navigation Handlers

**File:** `src/App.tsx`

**Changes:**
- Parse URL to determine settings section
- Update `handleNavigate` to support settings sections
- Sync active sidebar item with URL
- Handle browser back/forward navigation

---

## Phase 5: Responsive Design & Mobile Support

### 5.1 Mobile Sidebar Implementation

**Features:**
- Sidebar becomes overlay on mobile (< 1024px)
- Hamburger menu to open/close sidebar
- Backdrop overlay when sidebar is open
- Close sidebar when section is selected (mobile only)

### 5.2 Responsive Content Layout

**Breakpoints:**
- Desktop (≥ 1024px): Sidebar (256px) + Content (flex)
- Tablet (768px - 1023px): Collapsible sidebar
- Mobile (< 768px): Full-width content, sidebar overlay

---

## Phase 6: UI/UX Polish

### 6.1 Visual Consistency

**Styling:**
- Use consistent Tailwind spacing and colors
- Match existing design system
- Ensure dark mode support
- Smooth transitions and animations

### 6.2 Breadcrumb Navigation

**File:** `src/components/Settings/SettingsBreadcrumb.tsx`

**Features:**
- Show: Canvas → Settings → [Current Section]
- Clickable breadcrumb items
- Clear visual hierarchy

### 6.3 Section Headers

**Features:**
- Consistent section title styling
- Optional descriptions
- Action buttons (if needed)

---

## Implementation Details

### Key Files to Create

1. **Components:**
   - `src/components/Settings/SettingsSidebar.tsx` - Side navigation
   - `src/components/Settings/SettingsLayout.tsx` - Layout wrapper
   - `src/components/Settings/SettingsBreadcrumb.tsx` - Breadcrumb
   - `src/components/Settings/sections/DisplaySection.tsx` - Display section
   - `src/components/Settings/sections/RemoteControlSection.tsx` - Remote Control section
   - `src/components/Settings/sections/IntegrationsSection.tsx` - Integrations section
   - `src/components/Settings/sections/PerformanceSection.tsx` - Performance section

### Key Files to Modify

1. **Pages:**
   - `src/pages/SettingsPage.tsx` - Complete refactor
   - `src/pages/AnimationPage.tsx` - Remove header, ensure settings compatibility
   - `src/pages/SpritesPage.tsx` - Remove header, ensure settings compatibility
   - `src/pages/PalettesPage.tsx` - Remove header, ensure settings compatibility
   - `src/pages/PresetsPage.tsx` - Remove header, ensure settings compatibility
   - `src/pages/SequencesPage.tsx` - Remove header, ensure settings compatibility

2. **Components:**
   - `src/components/Header/Header.tsx` - Remove navigation items, add Settings button
   - `src/components/Settings/DisplayTab.tsx` - Keep as is, or move to sections folder
   - `src/components/Settings/RemoteControlTab.tsx` - Keep as is, or move to sections folder
   - `src/components/Settings/IntegrationsTab.tsx` - Keep as is, or move to sections folder
   - `src/components/Settings/PerformanceTab.tsx` - Keep as is, or move to sections folder

3. **Main App:**
   - `src/App.tsx` - Update navigation logic and routing

### Technical Considerations

1. **Catalyst Components:**
   - Use `SidebarLayout` for main structure
   - Use `Sidebar`, `SidebarBody`, `SidebarSection`, `SidebarItem` for navigation
   - Use `SidebarHeading` for section labels
   - Ensure proper `current` prop handling for active state

2. **State Management:**
   - URL-based navigation (single source of truth)
   - Sync sidebar active state with URL
   - Handle browser navigation (back/forward)

3. **Performance:**
   - Lazy load section content if needed
   - Keep navigation responsive
   - Optimize sidebar rendering

4. **Accessibility:**
   - Proper ARIA labels
   - Keyboard navigation support
   - Focus management

5. **Responsive:**
   - Mobile-first approach
   - Test on various screen sizes
   - Ensure sidebar doesn't block content

---

## Success Criteria

1. All navigation items moved from header to settings sidebar
2. Settings page uses side navigation layout
3. All sections accessible via sidebar navigation
4. URL routing works correctly for all sections
5. Responsive design works on mobile/tablet/desktop
6. Header only shows Canvas and Settings buttons
7. Smooth transitions and animations
8. Dark mode support maintained
9. All existing functionality preserved
10. Follows Tailwind CSS and Catalyst UI design patterns

---

## Migration Steps

1. Create SettingsLayout and SettingsSidebar components
2. Refactor SettingsPage to use side navigation
3. Move tab content to section components
4. Update Header to remove navigation items
5. Update App.tsx navigation logic
6. Update URL routing
7. Test all navigation paths
8. Test responsive design
9. Polish UI/UX
10. Remove old tab components (optional cleanup)

