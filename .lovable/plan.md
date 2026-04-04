
## Challenge OS — Project Scaffold Plan

### Design System
- Primary: #534AB7, Accent: #D85A30, Success: #0F6E56, Background: #FAFAF8, Surface: #FFFFFF, Text: #2C2C2A
- Max width 480px mobile-first layout, 12px rounded cards

### Routes & Pages (all placeholder)
**Public:** `/` Landing, `/assess` Assessment, `/results` Results, `/join` Signup  
**Auth:** `/dashboard`, `/day/1`, `/day/2`, `/day/3`, `/unlocks`, `/referrals`, `/community`, `/calendar`

### Navigation
- Bottom tab bar (Dashboard, Challenge, Unlocks, Referrals) — visible only for authenticated users

### Global State
- React Context with the specified `AppState` interface
- localStorage persistence with hydration on load

### Routing Logic
- Auth guard: if `user` exists → allow auth routes
- If assessment completed but no user → redirect to `/results`
- Otherwise → redirect to `/`

### Implementation
1. Update CSS variables and Tailwind config with the new color palette
2. Create AppContext with localStorage persistence
3. Create all placeholder page components
4. Set up routing with auth guards and redirect logic
5. Build bottom navigation component
6. Create a mobile-first shell layout (max-w-480px centered)
