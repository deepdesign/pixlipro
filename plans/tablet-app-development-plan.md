# Tablet App Development Plan

**Last Updated:** November 2025  
**Status:** Planning Phase  
**Goal:** Package Pixli as native tablet apps for Google Play Store and Apple App Store using a single codebase with adaptive tablet layout.

---

## Executive Summary

This plan outlines the strategy for packaging Pixli as native tablet applications while maintaining a single codebase. The approach uses Capacitor to wrap the existing React/Vite web application, with adaptive tablet-specific layouts and optimizations.

**Key Principles:**
- Single codebase for web and native apps
- Adaptive tablet layout that enhances the existing responsive design
- **Native-first UI approach**: Use native components (action sheets, menus, pickers) wherever possible for faster development and better UX
- Native wrapper provides app store distribution and native features
- Progressive enhancement: Web version uses custom UI, native apps leverage platform-native components
- Design can be refined later - prioritize functionality and native feel over custom styling initially

---

## Technology Stack

### Core Web Stack (Existing)
- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **TypeScript** - Type safety
- **p5.js** - Canvas rendering engine
- **Tailwind CSS** - Styling
- **RetroUI** - Component library

### Native Wrapper Stack (To Add)

#### Primary: Capacitor
- **@capacitor/core** - Core Capacitor APIs
- **@capacitor/cli** - Build and sync tooling
- **@capacitor/ios** - iOS/iPadOS native wrapper
- **@capacitor/android** - Android native wrapper
- **@capacitor/app** - App lifecycle and state management
- **@capacitor/filesystem** - File system access (for saving exports)
- **@capacitor/share** - Native share sheet integration
- **@capacitor/splash-screen** - Splash screen management
- **@capacitor/status-bar** - Status bar styling

#### Native UI Components (via Capacitor Plugins)
- **@capacitor/action-sheet** - Native action sheets for menus and options
- **@capacitor/dialog** - Native alerts, confirms, and prompts
- **@capacitor/toast** - Native toast notifications
- **@capacitor/browser** - Native in-app browser (if needed)

#### Optional Enhancements
- **@capacitor/keyboard** - Keyboard handling (if needed)
- **@capacitor/preferences** - Native preferences storage
- **@capacitor/haptics** - Haptic feedback for interactions

### Build & Distribution Tools
- **Xcode** - iOS app builds and App Store submission
- **Android Studio** - Android app builds and Play Store submission
- **Fastlane** (optional) - Automated deployment workflows
- **App Store Connect** - iOS distribution
- **Google Play Console** - Android distribution

---

## Architecture Overview

### Single Codebase Structure

```
pixli/
├── src/                    # Shared web code (existing)
│   ├── App.tsx
│   ├── components/
│   ├── lib/
│   └── ...
├── capacitor.config.ts     # Capacitor configuration
├── ios/                    # iOS native project (generated)
│   ├── App/
│   ├── App.xcodeproj
│   └── Podfile
├── android/                # Android native project (generated)
│   ├── app/
│   ├── build.gradle
│   └── ...
├── public/                # Static assets
│   ├── icons/             # App icons (all sizes)
│   └── splash/            # Splash screens
└── package.json
```

### Build Flow

1. **Web Build**: `npm run build` → generates `dist/` folder
2. **Capacitor Sync**: Copies `dist/` to native projects
3. **Native Build**: Xcode/Android Studio compiles native wrapper
4. **Distribution**: App stores receive native apps containing web assets

---

## Implementation Plan

### Phase 1: Capacitor Setup & Configuration

#### 1.1 Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/app @capacitor/filesystem @capacitor/share
npm install @capacitor/splash-screen @capacitor/status-bar
```

#### 1.2 Initialize Capacitor

```bash
npx cap init
# App name: Pixli
# App ID: me.jamescutts.pixli
# Web dir: dist
```

#### 1.3 Configure Capacitor (`capacitor.config.ts`)

- Set webDir to `dist`
- Configure iOS and Android app IDs
- Set up splash screen and icon paths
- Configure status bar styling
- Set up file system permissions

#### 1.4 Add Native Platforms

```bash
npx cap add ios
npx cap add android
```

### Phase 2: Tablet Layout Optimizations

#### 2.1 Tablet Detection Enhancement

Extend `src/lib/deviceDetection.ts`:
- Add `isTablet()` function (already exists)
- Add `useIsTablet()` hook (already exists)
- Detect tablet-specific features (stylus, keyboard, etc.)

#### 2.2 Tablet-Specific Layout

Create tablet breakpoint in `src/index.css`:
- Breakpoint: `@media (min-width: 768px) and (max-width: 1024px)` or use `isTablet` hook
- Layout: Optimize for tablet screen sizes
- Canvas: Larger canvas area, better use of screen space
- Controls: Side-by-side layout when appropriate
- Touch targets: Maintain 44px minimum but optimize spacing

#### 2.3 Adaptive UI Components

Update `src/App.tsx`:
- Use `useIsTablet()` hook for tablet-specific rendering
- Tablet layout: Canvas-centered with controls on sides
- Optimize tab navigation for tablet interaction
- Enhance touch interactions for stylus support

### Phase 3: Native Features Integration

#### 3.1 Native UI Components Integration

**Strategy: Use native components wherever possible**

Create `src/lib/nativeUI.ts`:
- Wrapper functions to detect Capacitor environment
- Fallback to web UI when not in native environment
- Unified API for native and web components

**Replace custom UI with native components:**

1. **Settings Menu** (`src/App.tsx`):
   - Replace custom theme selector dropdowns with native action sheets
   - Use `@capacitor/action-sheet` for theme color, shape, and mode selection
   - iOS: Native action sheet with options
   - Android: Material bottom sheet

2. **Export Modal** (`src/components/ExportModal.tsx`):
   - Replace custom modal with native dialog/action sheet for quick actions
   - Use native file picker for save location selection
   - Use native share sheet for sharing
   - Keep advanced options in native bottom sheet/dialog

3. **Preset Manager** (`src/components/PresetManager.tsx`):
   - Use native action sheet for preset selection
   - Native dialog for save/delete confirmations
   - Native toast notifications for success/error messages

4. **Status Bar Actions**:
   - Replace custom buttons with native action sheets where appropriate
   - Use native haptics for button feedback

**Benefits:**
- Faster development (no custom styling needed)
- Better UX (users get familiar native patterns)
- Less code to maintain
- Platform-specific polish comes for free
- Design can be refined later if needed

#### 3.2 Export to Device Storage

Update `src/lib/exportService.ts`:
- Detect Capacitor environment
- Use `@capacitor/filesystem` to save exports to device
- Use native file picker/dialog for save location selection
- Handle permissions gracefully
- Provide fallback to web download when not in native

#### 3.3 Native Share Integration

Update `src/components/ExportModal.tsx`:
- Replace custom share button with native share sheet
- Use `@capacitor/share` to open native share sheet
- Support sharing PNG files via native share
- Show native action sheet for export options (Save, Share, etc.)

#### 3.4 App Lifecycle Management

Create `src/lib/appLifecycle.ts`:
- Handle app state (background/foreground)
- Pause/resume canvas animation appropriately
- Save state on app close
- Restore state on app open
- Use native toast notifications for state changes

### Phase 4: Native Assets & Branding

#### 4.1 App Icons

Generate app icons for all required sizes:
- **iOS**: 1024×1024 (App Store), plus all required sizes for devices
- **Android**: 512×512 (Play Store), plus adaptive icons
- Use Pixli logo with appropriate backgrounds

#### 4.2 Splash Screens

Create splash screens:
- **iOS**: Storyboard or static images for all device sizes
- **Android**: Drawable resources for different densities
- Match Pixli branding and theme colors

#### 4.3 Status Bar Styling

Configure status bar:
- Match app theme (dark/light)
- Use accent colors from theme system
- Ensure readability on all backgrounds

### Phase 5: Build & Distribution Setup

#### 5.1 iOS Configuration

- Configure `ios/App/Info.plist`:
  - App name, version, bundle identifier
  - Required permissions (file system, etc.)
  - Supported device orientations
  - iPad-specific settings

- Configure `ios/App/App.xcodeproj`:
  - Deployment targets (iOS 13+)
  - Signing certificates
  - Capabilities (if needed)

#### 5.2 Android Configuration

- Configure `android/app/build.gradle`:
  - App name, version, package name
  - Min SDK version (API 21+)
  - Target SDK version (latest)
  - Permissions in `AndroidManifest.xml`

- Configure `android/app/src/main/AndroidManifest.xml`:
  - Required permissions
  - App metadata
  - Intent filters

#### 5.3 Build Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:ios": "npm run build && npx cap sync ios",
    "build:android": "npm run build && npx cap sync android",
    "open:ios": "npx cap open ios",
    "open:android": "npx cap open android"
  }
}
```

### Phase 6: Testing & QA

#### 6.1 Device Testing Matrix

**iOS/iPadOS:**
- iPad (9th gen) - 10.2" - iOS 15+
- iPad Air (5th gen) - 10.9" - iPadOS 15+
- iPad Pro 11" (3rd gen) - 11" - iPadOS 15+
- iPad Pro 12.9" (5th gen) - 12.9" - iPadOS 15+

**Android:**
- Samsung Galaxy Tab S8 - 11" - Android 12+
- Google Pixel Tablet - 10.95" - Android 13+
- Amazon Fire HD 10 - 10.1" - Fire OS (Android fork)

#### 6.2 Testing Checklist

- [ ] App launches correctly on all target devices
- [ ] Canvas renders and animates smoothly
- [ ] All controls are accessible and functional
- [ ] Export functionality works (save to device)
- [ ] Share functionality works (native share sheet)
- [ ] App handles orientation changes gracefully
- [ ] Performance is acceptable (60 FPS maintained)
- [ ] Memory usage is reasonable
- [ ] App state persists across app lifecycle
- [ ] Splash screens display correctly
- [ ] App icons appear correctly
- [ ] Status bar styling matches theme

### Phase 7: App Store Submission

#### 7.1 iOS App Store

**Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect setup
- Privacy policy URL
- App description and screenshots
- App preview video (optional but recommended)

**Submission Process:**
1. Archive app in Xcode
2. Upload to App Store Connect
3. Configure app metadata
4. Submit for review

#### 7.2 Google Play Store

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Privacy policy URL
- App description and screenshots
- Content rating questionnaire

**Submission Process:**
1. Build release APK/AAB
2. Upload to Google Play Console
3. Configure app metadata
4. Submit for review

---

## Tablet-Specific Optimizations

### Layout Adaptations

**Portrait Mode:**
- Canvas takes priority (top 60-70% of screen)
- Controls stack below canvas
- Tabs remain horizontal but may need scrolling
- Status bar remains visible

**Landscape Mode:**
- Canvas centered, larger size
- Controls on left/right sides if space allows
- Split layout similar to desktop wide layout
- Better use of horizontal space

### Performance Considerations

**Render Optimization:**
- Detect tablet GPU capabilities
- Adjust default sprite density for tablets
- Optimize animation frame rate based on device
- Implement performance presets

**Memory Management:**
- Monitor memory usage
- Implement canvas cleanup on background
- Optimize export resolution for device capabilities

### Touch & Input Enhancements

**Stylus Support:**
- Detect stylus input (Apple Pencil, S Pen)
- Provide precision mode for stylus
- Optimize touch targets for finger vs stylus

**Keyboard Support:**
- Detect external keyboard
- Provide keyboard shortcuts
- Optimize layout when keyboard is visible

---

## File Structure Changes

### New Files to Create

```
plans/
└── tablet-app-development-plan.md (this file)

public/
├── icons/
│   ├── icon-1024.png
│   ├── icon-512.png
│   └── [other required sizes]
└── splash/
    ├── splash-ios/
    └── splash-android/

capacitor.config.ts (new)
```

### Files to Modify

- `package.json` - Add Capacitor dependencies and scripts
- `src/App.tsx` - Add tablet-specific layout logic, replace custom UI with native components
- `src/lib/deviceDetection.ts` - Enhance tablet detection
- `src/lib/nativeUI.ts` - **NEW**: Wrapper functions for native UI components with web fallbacks
- `src/lib/exportService.ts` - Add native file system support
- `src/components/ExportModal.tsx` - Replace with native action sheets and dialogs
- `src/components/PresetManager.tsx` - Replace custom UI with native action sheets
- `src/index.css` - Add tablet-specific styles
- `.gitignore` - Add `ios/` and `android/` directories

---

## Development Workflow

### Local Development

1. **Web Development** (unchanged):
   ```bash
   npm run dev
   ```
   Develop and test in browser as usual.

2. **Tablet Testing**:
   ```bash
   npm run build
   npx cap sync
   npx cap open ios    # or android
   ```
   Test in iOS Simulator or Android Emulator.

3. **Device Testing**:
   - Connect physical device
   - Build and run from Xcode/Android Studio
   - Test on real hardware

### Build Process

1. **Web Build**: `npm run build` → creates `dist/`
2. **Sync to Native**: `npx cap sync` → copies `dist/` to native projects
3. **Native Build**: Build in Xcode/Android Studio
4. **Distribution**: Archive and upload to app stores

---

## Configuration Details

### Capacitor Configuration (`capacitor.config.ts`)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.jamescutts.pixli',
  appName: 'Pixli',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#050509",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050509'
    }
  }
};

export default config;
```

### Tablet Layout Breakpoints

**CSS Media Queries:**
- Mobile: `max-width: 767px`
- Tablet: `min-width: 768px` and `max-width: 1023px`
- Desktop: `min-width: 1024px`

**JavaScript Detection:**
- Use `useIsTablet()` hook for React-based conditional rendering
- Combine with viewport width checks for precise control

---

## Native Features Integration

### Native UI Components Strategy

**Philosophy:** Use native platform UI components wherever possible instead of custom web components. This provides:
- **Faster development** - No need to build and style custom components
- **Better UX** - Users get familiar, platform-native interactions
- **Less maintenance** - Native components are maintained by the platform
- **Platform polish** - Automatic access to latest platform design updates
- **Design flexibility** - Can refine custom styling later if needed

**Components to Replace:**

1. **Action Sheets** (`@capacitor/action-sheet`):
   - Theme selector (color, shape, mode)
   - Export options (Save, Share, etc.)
   - Preset selection
   - Context menus

2. **Dialogs** (`@capacitor/dialog`):
   - Confirmations (delete preset, etc.)
   - Alerts (errors, warnings)
   - Prompts (save preset name, etc.)

3. **Toast Notifications** (`@capacitor/toast`):
   - Success messages (preset saved, export complete)
   - Error messages
   - Status updates

4. **Native Share Sheet** (`@capacitor/share`):
   - Share exported images
   - Share presets (future)
   - Share app (future)

**Implementation Pattern:**

```typescript
// src/lib/nativeUI.ts
import { ActionSheet } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';

export async function showThemeSelector() {
  if (Capacitor.isNativePlatform()) {
    // Use native action sheet
    const result = await ActionSheet.showActions({
      title: 'Select Theme Color',
      options: [
        { title: 'Void' },
        { title: 'Oceanic' },
        { title: 'Arcade' },
        // ... more options
      ]
    });
    return result.index;
  } else {
    // Fallback to web UI (existing custom dropdown)
    return showWebThemeSelector();
  }
}
```

### File System Access

**Use Cases:**
- Save exported images to device storage
- Allow users to choose save location via native file picker
- Access device photo library (future enhancement)

**Implementation:**
- Use `@capacitor/filesystem` plugin
- Use native file picker/dialog for location selection
- Request permissions appropriately
- Provide fallback to download for web

### Share Integration

**Use Cases:**
- Share exported images via native share sheet
- Share to social media, messaging apps, etc.
- Copy to clipboard

**Implementation:**
- Use `@capacitor/share` plugin
- Detect Capacitor environment
- Replace custom share button with native action sheet option
- Native share sheet handles all sharing options automatically

### App Lifecycle

**Handling:**
- Pause animation when app goes to background
- Resume animation when app returns to foreground
- Save app state before closing
- Restore state on launch
- Use native toast notifications for state changes

---

## Performance Optimization

### Tablet-Specific Optimizations

1. **Canvas Rendering:**
   - Detect device pixel ratio
   - Optimize canvas resolution for tablet screens
   - Adjust sprite density based on device capabilities

2. **Animation Performance:**
   - Monitor frame rate
   - Auto-adjust complexity if FPS drops
   - Provide performance mode toggle

3. **Memory Management:**
   - Clean up unused resources
   - Implement canvas pooling if needed
   - Monitor memory usage

### Build Optimizations

1. **Code Splitting:**
   - Lazy load components where possible
   - Split p5.js code if feasible
   - Optimize bundle size

2. **Asset Optimization:**
   - Compress images
   - Use appropriate formats (WebP where supported)
   - Optimize SVG files

---

## Security & Privacy

### Permissions

**Required Permissions:**
- File system access (for saving exports)
- Network access (for web version, optional for native)

**Privacy Considerations:**
- No user data collection
- No analytics (unless explicitly added)
- Exports stored locally only
- Privacy policy required for app stores

### App Store Requirements

**iOS:**
- Privacy manifest (if using certain APIs)
- App Transport Security configuration
- Required privacy descriptions

**Android:**
- Privacy policy URL
- Data safety section
- Permissions justification

---

## Distribution Strategy

### App Store Metadata

**App Name:** Pixli  
**Subtitle:** Generative Pixel Playground  
**Description:** Create vibrant generative art with pixel sprites, palettes, and motion. Export high-resolution images and share your creations.

**Keywords:**
- Generative art
- Pixel art
- Creative tools
- Animation
- Art generator

**Screenshots Required:**
- iPad: 12.9" and 11" screenshots
- Android: Tablet screenshots (various sizes)
- Show canvas, controls, export modal

### Versioning Strategy

- Follow semantic versioning
- Sync web and native app versions
- Use build numbers for native apps

---

## Maintenance & Updates

### Update Workflow

1. **Web Updates:**
   - Make changes to web codebase
   - Test in browser
   - Build and sync to native
   - Test in native wrappers
   - Submit updates to app stores

### Version Synchronization

- Keep web version and native app versions in sync
- Use `package.json` version for web
- Use native project version files for apps
- Automate version bumping if possible

---

## Timeline Estimate

### Phase 1: Setup (1-2 days)
- Install Capacitor
- Configure basic setup
- Test build process

### Phase 2: Tablet Layout (2-3 days)
- Implement tablet detection
- Create tablet-specific layouts
- Test on simulators/emulators

### Phase 3: Native Features (3-4 days)
- Replace custom UI components with native action sheets, dialogs, and toasts
- Integrate file system access with native file picker
- Add native share functionality
- Implement app lifecycle handling
- Create native UI wrapper utilities with web fallbacks

### Phase 4: Assets & Branding (1-2 days)
- Create app icons
- Design splash screens
- Configure status bar

### Phase 5: Build Setup (2-3 days)
- Configure iOS project
- Configure Android project
- Set up build scripts

### Phase 6: Testing (3-5 days)
- Test on physical devices
- Fix issues
- Performance optimization

### Phase 7: Submission (2-3 days)
- Prepare app store assets
- Submit to stores
- Address review feedback

**Total Estimate: 14-22 days** (depending on complexity and testing requirements)

**Note:** Using native UI components may actually reduce development time compared to building custom components, as we leverage platform-native patterns that users already understand.

---

## Risks & Mitigations

### Risk 1: Performance on Lower-End Tablets
**Mitigation:** Implement performance detection and auto-adjustment, provide performance presets

### Risk 2: App Store Rejection
**Mitigation:** Follow guidelines carefully, test thoroughly, have privacy policy ready

### Risk 3: Native Build Complexity
**Mitigation:** Use Capacitor (simpler than React Native), follow documentation, test incrementally

### Risk 4: Maintaining Two Platforms
**Mitigation:** Single codebase reduces maintenance burden, automate build process where possible

---

## Success Criteria

- [ ] App successfully builds for iOS and Android
- [ ] App runs smoothly on target tablet devices
- [ ] All core features work in native apps
- [ ] Export and share functionality works
- [ ] App approved and published on both stores
- [ ] Performance meets targets (60 FPS, reasonable memory)
- [ ] User experience matches or exceeds web version

---

## Next Steps

1. **Review and approve this plan**
2. **Set up development environment** (Xcode, Android Studio)
3. **Begin Phase 1: Capacitor Setup**
4. **Iterate through phases systematically**
5. **Test thoroughly before submission**

---

## Resources & Documentation

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)

---

**Document Version:** 1.0  
**Created:** November 2025  
**Status:** Planning - Awaiting Approval

