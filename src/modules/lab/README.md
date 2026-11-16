# Lab

A bench for one system component at a time: the system's components in a list on the left and, for the open one, its title, description and tabs. It reads the Systems module's build data (`systems/catalog`, `systems/components`) and reuses its pieces; it owns no data, writes no files and works the same locally and on the deployed site. It has a rail button (flask icon, after Systems), and no Home block, palette entries or skills.

## Addresses

Addresses use the system's permanent ID, as Systems does:

- `/lab` opens the default system's first component, or the first active system with components; it replaces itself in the history. Without any component it says "No components yet" with **View systems**.
- `/lab/<system id>` opens that system's first component the same way, or says it has none yet.
- `/lab/<system id>/<slug>` is the component's **Overview**; `/variants` and `/playground` follow it.

The Lab offers active systems that have components (`labSystems`, the default first, then by name). An unknown or archived system, an unknown component, or an address under a component naming no tab shows "Page not found", with the component list kept. Tab titles read "<tab> — <component> — Lab — <studio name>", and "Page not found — Lab — <studio name>" when nothing is there.

## The frame

- `pages/system.vue` is the frame: `components/LabComponentList.vue` in the section panel (`AppSectionNav`), kept on screen while the bench changes. The list has a **System** picker when more than one active system has components, **Search components** (title and address; Escape clears it; "No matching components.") and the system's components in the Systems navigation's order, the open one highlighted. Moving to another component keeps the open tab.
- `pages/component.vue` is the bench: the component's title and description, then `components/LabTabBar.vue`, a set of links ("Component tabs", the current one `aria-current`), and the open tab beside them. It gives the tabs their component through `composables/useLabComponent.ts` (`provideLabComponent` / `useLabComponent`: the system, the component, its page data from `useComponentPages`, and `reload`).
- `utils/lab.ts` holds the addresses (`labAddress`), the tabs in order (`LAB_TABS`: id, i18n label, path), the tab an address shows (`tabAt`), the systems offered, where `/lab` lands and the list's search. The tab bar, the list and the titles all read `LAB_TABS`, so a new tab is one entry there and one child page in `module.ts`.

## Tabs

- **Overview** (`pages/overview.vue`): **Open in Systems**, then the component's guide (`ComponentGuide`), Source (`ComponentSource`) and Props (`ComponentProps`), as its Systems page shows them, without the examples. Files that couldn't load are listed with **Try again** (`ComponentLoadErrors`). The Systems component page links back with **Open in Lab** while this module is on and the system is active.
- **Variants** (`pages/variants.vue`): a placeholder for now.
- **Playground** (`pages/playground.vue`): the component file on the stage (`components/LabPlaygroundStage.vue`, its system's preview document; new props arrive by message, so it updates in place without reloading), beside **Props** (`components/LabPlaygroundControls.vue`, one `LabPlaygroundControl.vue` per prop), stacked on narrow screens. `utils/playground.ts` maps each prop's metadata to a control: a union of string literals is a select (optional ones without a default offer **Default**, leaving it unset), `boolean` a switch, `string` a text field, `number` a number field, anything else a "Set in code" row with its type. A control starts at the prop's default when it is a literal. Each is labelled with the prop's name, its description in a tooltip, required ones marked. Changed values live in the address, one query parameter each (`?color=neutral&loading=true`), replaced rather than pushed; reading it back drops unknown props and values that don't fit, and **Reset** clears them. A component without a component file names the file to add; props that can't be read say so with **Try again**; a required prop with no value blocks the stage, naming it (asking for a value, or saying only code can set it).

Interface text is under `lab` in `i18n/locales/en.json`.
