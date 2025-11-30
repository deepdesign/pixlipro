# Plans Directory

This directory contains all project plans and implementation guides. Plans are **permanent documentation files** that should be version-controlled and preserved.

## Plan File Convention

### Naming
- Use descriptive names with hyphens: `feature-name-plan.md`
- Use lowercase with hyphens (kebab-case)
- End with `-plan.md` for clarity

**Examples:**
- ✅ `custom-animation-designer.md`
- ✅ `settings-page-sidenav-plan.md`
- ✅ `nightclub-projection-features.md`
- ❌ `PLAN.md` (too generic)
- ❌ `planplan.md` (unclear naming)

### Location
- **All plans must be saved in this `plans/` directory**
- Never save plans in the root directory or as temporary files
- Plans should be committed to git for version control

### Format
- Markdown (`.md`) files
- Include a clear title and overview
- Structure with headers and sections
- Include implementation phases when applicable

### Purpose
Plans serve as:
- **Documentation** of feature requirements and design decisions
- **Implementation guides** with step-by-step instructions
- **Historical record** of project evolution
- **Reference** for future development

## Why Plans Can't Be Temporary

❌ **Cursor's internal plan system** creates temporary files (`cursor-plan://` URIs) that:
- Can be overwritten or lost
- Are not version-controlled
- Cannot be referenced by name

✅ **Permanent plan files** in this directory:
- Are version-controlled in git
- Can be referenced, linked, and shared
- Persist across sessions
- Serve as documentation

## Current Plans

- `custom-animation-designer.md` - Custom animation creation and management system
- `settings-page-sidenav-plan.md` - Settings page side navigation implementation
- `nightclub-projection-features.md` - Nightclub projection features and requirements
- `typography-documentation-prompt.md` - Typography documentation guidelines

## Creating a New Plan

When creating a new plan:

1. Create the file in this `plans/` directory
2. Use descriptive kebab-case naming ending with `-plan.md`
3. Include:
   - Clear title and overview
   - Current state analysis
   - Implementation phases
   - File structure and changes needed
   - Success criteria
4. Commit to git as soon as created

**Never** rely on Cursor's temporary plan system - always create a permanent file here.

