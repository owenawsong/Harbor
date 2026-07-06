# Harbor Design System

Harbor should feel like a calm, precise browser instrument: fast to scan, restrained, and clearly human-made. The interface should avoid decorative clutter and let the agent's work remain the center of attention.

## Principles

- Quiet confidence: use contrast, spacing, and motion with restraint.
- Dense but readable: the side panel is often narrow, but wide panels should use space intentionally.
- One visual language: repeated controls should share shape, radius, spacing, and interaction states.
- Function first: no visible text should explain obvious UI mechanics.
- Trustworthy automation: plans, tool calls, reasoning, and final answers must appear in chronological order and never expose raw provider protocol text.

## Layout

- The narrow side panel is the primary target.
- At wider widths, expand grids and content columns instead of leaving large empty margins.
- Cards use `8px` to `12px` radius only for real grouped content, dialogs, repeated items, and tools.
- Avoid cards inside cards.
- Header, body, and composer should keep stable heights and not jump during streaming.

## Color

- Theme selection is family plus mode:
  - Families: Default, Forest, Nebula, Sunset, Ocean.
  - Modes: Light, Dark, Auto.
- Accent color should guide state, not dominate the page.
- Active controls should use subtle borders, inset outlines, or surface changes before strong fills.
- Avoid one-note pages where everything is the same hue.

## Type

- Primary UI font: DM Sans.
- Display serif is reserved for the empty-state greeting and rare editorial moments.
- Never scale type directly with viewport width.
- User-selected font size must affect message text, controls, and settings predictably.

## Motion

- Prefer short transitions under 180ms.
- Use transform animation for small affordances only.
- No bounce or overscroll effects on explicit navigation controls.
- Streaming states should communicate progress without drawing attention away from content.

## Agent Output

- Every run must end with a final response.
- Plans must render through Harbor's plan UI, never as raw tags or protocol text.
- Reasoning, tool calls, plan creation, and final text must display chronologically.
- Corrections are user interruptions, not visible XML or markdown wrappers.

## Settings

- Settings must not expose dead controls.
- Any control shown in Settings must change runtime behavior immediately or after a clear save.
- Advanced provider fields should be provider-specific and hidden unless relevant.

## Copy

- Interface labels should be short and concrete.
- Tone should be useful and direct.
- Empty-state greetings may be varied and personable, but not gimmicky.
