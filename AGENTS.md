# 🚨 STRICT PROJECT RULES (MANDATORY)

1. **NO HARDCODED MOCK DATA**: Always fetch live dynamic data from MongoDB via API routes. Never hardcode dummy student names, mock arrays, or fake bios.
2. **NO HEAVY TEXTS**: Avoid walls of text, paragraph dumps, and long descriptions. Keep UI copy minimal, technical, and crisp (1-line micro-labels).
3. **ICONS & VISUAL SYMBOLS**: `lucide-react` icons are permitted for clean, functional UI cues and controls. Use them tastefully and sparingly—never clutter the interface with excessive icons. Unicode emojis remain strictly prohibited everywhere in UI text, code, and alerts.

## Scoped exception: `quiz/`

For the standalone quiz app, `docs/superpowers/specs/2026-09-26-quiz-firebase-prd.md` is the current approved source of truth and supersedes rule 1's MongoDB runtime direction. Quiz runtime data lives in Firestore; MongoDB is read only for event/team/admin sync. The emulator-only demo seed is permitted by the PRD and must retain its `demo-hult-quiz` guard. These exceptions apply only inside `quiz/`; the main website continues to use MongoDB.
