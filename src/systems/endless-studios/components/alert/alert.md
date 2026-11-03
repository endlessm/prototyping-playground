---
title: Alert
description: Calls attention to a condition on the page, with optional actions. Nuxt UI's UAlert with the Endless Studios rounded corners, the same alert the platform uses.
source: Nuxt UI 4.8 UAlert with the frontend's app.config alert settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/alert
---

## When to use

Use an alert for a condition that stays true while the person is on the page and that they may need to act on: an account that is disabled, an email that isn't verified, a profile that only some people can see. For a passing confirmation after an action, use a toast instead; for a choice that blocks the page, use a modal.

The platform's alerts are **subtle** or **soft**, coloured by meaning (warning for something to fix, info for context), with an icon that names the subject and a short title. Put the fix in `actions` with a horizontal orientation, so the button sits beside the message.

Solid alerts put white text on a strong fill, which fails contrast on the brighter colours (primary, warning, info, success). Use them only with error or neutral, and sparingly.

## Studios variants

- Alerts are rounder than Nuxt UI's default (`rounded-xl`), in step with the platform's cards.

## Accessibility

The title has to make sense alone, without the icon or colour. An alert added after the page loads isn't announced; if it reports the result of an action, a toast is the better fit.

## In Vue screens

Screens written as `.vue` files use `<UAlert>` directly, with the same props and a `#description` slot for richer text.
