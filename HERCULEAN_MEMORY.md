# Herculean Project Memory — Decision Log

## Apr 22, 2026 — Session 2 (Context Continuation)
- **User role**: Navigator (yes/no, suggestions)
- **Claude role**: Driver (code implementation)
- **Change made**: Moved "Improve my prompt" checkbox from line 849-855 to line 849 (between textarea and counter)
  - Removed from flex div with Go button
  - Placed directly after textarea with margin-top:12px
  - Go button moved into search-meta div with counter
- **Git commit**: `a0ef6b4` - "Move improve prompt checkbox between textarea and counter"
- **Pushed to**: master branch at https://github.com/testafortehub/herculean.git
- **Deployment**: Railway auto-deploy on push

## Mode Tabs (Confirmed Present)
- Basic Search, Code Review, Scholarly Research, Competitive Analysis
- Located lines 836-838 in index.html
- Should display on public version

## Fixes Applied (Apr 22, 2026 - Session 2):
1. **Checkbox layout** — Moved outside search-bar div so it appears below textarea, centered with max-width 700px
2. **Mode tab switching** — Fixed toggle logic in switchMode() to explicitly add/remove active class (was toggling incorrectly)
3. **Commit**: `be7e62a` - "Fix checkbox layout and mode tab switching"

## Apr 22, 2026 — Session 3 (Synthesis Box Visibility)
- **Changes made**: 
  1. Changed synthesis card from `display: none` to `display: block` (always visible)
  2. Removed `.visible` class CSS rule (no longer needed)
  3. Removed `loading` class from synthesis-body initial state
  4. Synthesis header "Herculean Synthesis" ⚡ visible by default
  5. When Go pressed, showLoadingCards() adds `loading` class showing animated dots
  6. When results arrive, renderResults() removes `loading` class, shows content
- **Git commit**: `9048e0f` - "Display synthesis card by default, fix loading state behavior"
- **Status**: All 4 modes (search, code, research, competitive) properly wired to daily limit counter
