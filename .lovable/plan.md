

## Use first name only in email-step greeting

In `src/pages/Signup.tsx`, the email-step prompt currently inserts the full name (`{name}` → "Linda Pallini"). Change it to use the first name only.

### Change

In the `promptText` derivation, replace the `{name}` substitution with `firstName.trim()` (falling back to "there" if empty).

```ts
const promptText = SIGNUP_PROMPTS[step].replace("{name}", firstName.trim() || "there");
```

That's the only edit. Result: "Nice to meet you, Linda. What email should I use for your account?"

