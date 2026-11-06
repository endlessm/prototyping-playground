---
title: Voice and Tone
description: How Endless Studios copy speaks, is cased and names things in English and Spanish, for a view that needs a string the app's locale files lack. What the app does today, with counts, the rules for new copy, and before-and-after examples from real screens.
---

Sources: the app's locale files as copied to `i18n/locales/` (`11517cb`, 25 September 2026: 1,488 English and 1,426 Spanish strings) and on the app's `dev` branch (`eaa7d5f`, 5 November 2026; counts marked dev), whose components show each string's role; the app's frontend contributing guide (`eaa7d5f`); the playground's Endless Studios design-system export (`fdcbfe2`, 27 July 2026), each rule checked against the locale files.

## Before writing a string

1. Search `i18n/locales/en.json` for the words; most keys are the English text in snake case (`no_tasks_yet`). When a key exists, use `$t('key')` as it stands, unless the copy is what the prototype changes.
2. Name the reader. Learner copy follows the persona's messaging in [Personas](personas.md); names for things are in [Platform model](platform-model.md), "Words".
3. When the view has an `es` state, write the Spanish too and choose by `useI18n().locale.value`.

## Voice

Today: 187 strings say "you" or "your". First person (14) appears only in the person's own answers and choices ("I have a code", "Yes, I'm sure"); "we" and "our" (20) are Endless speaking, in help, invitations and two load errors. No string has an emoji. 62 of 69 button labels open with a verb (dev). Of 22 strings with "!", 7 celebrate or welcome, 8 invite, 2 confirm an action, 4 sit on empty states and errors ("Something went wrong!") and 1 lists the character.

For new copy:

- Speak to the person as "you", in short, concrete sentences. Open a button with its verb and object: "Create your game".
- Keep "!" for a milestone the person reached or a welcome. Errors and empty states say what happened and what to do next, ending in a full stop ([Design principles](design-principles.md), 4).
- A confirmation asks about the action in its title, states the consequence in its body and repeats the verb on the button, as the program page's leave dialog does ("Leave {name}?", what is lost, "This cannot be undone."). 27 strings still ask "Are you sure…?".

## Casing

Today, English mixes Title Case and sentence case, sometimes within one flow: the program page's menu says "Leave Cohort" and its confirm button "Leave cohort". Strings of two to five words run 419 Title Case to 288 sentence case; on dev, buttons 45 to 28, headings 31 to 13, field labels 22 to 9. The older flat keys lean Title Case (346 to 199, dev), the newer grouped ones (`cohort`, `quiz`, `dashboard_ui`, `scoring`, `events`) sentence case (103 to 54), and strings added or changed since 21 September 2026 split 61 to 65. The app has no written English rule.

Spanish has one: "in Spanish only the first word of a label or a sentence is capitalized" (app commit of 9 October 2026, 214 strings fixed). The copy here predates it, so 232 Spanish strings of two to five words are still Title Case (38 on dev).

For new copy: on an existing screen, match the neighbouring strings of the same kind. On a new screen or section, and always in Spanish, use sentence case, capitalizing only the first word and proper names (Endless Studios, Threadbare, Endstar, Godot, Discord, GitHub).

## Words

- **Game, not project.** The `project` key reads "Game". 111 strings say "game"; 22 still say "project", 13 of them on dev screens ("Project Repository"). Keep "project" for its general sense and skill names ([Skills and recognition](skills-and-recognition.md)).
- **Cohort** appears in 43 strings, 6 of them on the learner's Quizzes page. Keep it out of new learner-facing copy; [Programs](programs.md) has the research and the words to use instead.

## Spanish

Today:

- Tú: 87 strings use a tú imperative and 106 tu, tus, te or ti; 5 use usted ("Seleccione su idioma preferido.").
- Short actions take the infinitive (about 240: "Crear cohorte", "Editar perfil"); 34 open with a tú imperative, mostly invitations ("Únete ahora").
- 9 of 19 Spanish exclamations lack the opening ¡ ("Felicidades! Tienes una nueva página!"), and 3 of 56 questions the ¿.
- 16 strings address the person with "/a" ("¿Estás seguro/a?"), 25 in the masculine only ("¡Bienvenido de nuevo!").
- Words: juego; estudiante (21, aprendiz 1); código de inscripción (15, código de acceso 6); publicación (13, post 4).
- An `es` state shows English for the 66 keys `es.json` lacks, and the playtest card, modal and feedback form are still in English.

For new Spanish: tú throughout, with the infinitive for action labels and the tú imperative in sentences ("Inténtalo de nuevo en un momento."). Sentence case. Open with ¡ and ¿. Write around gender ("Te damos la bienvenida", "¿Quieres eliminar esta publicación?"), or use "/a" when you can't. Spanish runs about a fifth longer than English (21% on translated keys, dev), so leave room.

## Before and after

Each row rewrites a real string by the rules above.

| Screen | Today | Rewritten | Rule |
|---|---|---|---|
| Games, empty | "No Projects yet" | "No games yet" | Game; casing |
| My games, empty | "No  games created yet!" | "You haven't made a game yet." and a "Create your game" button | No "!"; next step |
| Profile, password error | "Something went wrong!" and the server's message | "We couldn't change your password. Try again in a moment." | What happened, what to do |
| Feed, deleting a comment | "Are you sure you want to delete this comment?" | "Delete this comment?" and a "Delete comment" button | Name the action |
| Quizzes, learner | "Take quizzes released to your cohort." | "Take the quizzes open to your group." | No "cohort" |
| Language preference, `es` | "Seleccione su idioma preferido." | "Elige tu idioma." | Tú |
