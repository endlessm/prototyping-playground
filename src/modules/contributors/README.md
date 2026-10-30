# Contributors & Permissions

Who works in the studio and what each person may change. The studio is always in team use, so this module is required: it can't be turned off or removed.

## Profiles

One file per person, `contributors/<key>.json`. The key is the person's selector and the name of their prototype folder, `src/prototypes/<key>/`.

| Field | |
|---|---|
| `formatVersion` | `1` |
| `studioId` | Permanent ID: 16 lowercase Crockford base32 characters. It never changes, so roles survive a renamed key. |
| `name` | Display name. |
| `email` | Primary email; `""` for none. |
| `emails` | Optional more emails the person answers to, such as a second Git identity. |
| `github` | GitHub username; `""` means explicitly none. |
| `avatar` | Optional image path inside `public/`. |
| `preferences` | One object per module that declares preferences, such as `{ "onboarding": { "welcomeDismissed": true } }`. |

Profiles never hold roles. Emails and GitHub accounts are unique across profiles, ignoring case. A key can't be the address of a studio page (a module's page or one of the app's own); `yarn studio status` reports a clash.

## Who is working

`tooling/contributors/identity.ts` resolves the local Git identity: Git email first (including extra emails), then an exact Git name for a profile with no email, then the GitHub account from the GitHub CLI (`STUDIO_GITHUB` names it instead). When the email matches nobody, a profile with the same name or GitHub account is a *candidate*: it identifies, but authorises nothing until the email is linked. `--as <key>` runs one command as that candidate, never as anyone else, and grants no extra role.

## Roles

Admins can preview and apply grants with `yarn studio configure --admins key,key --maintainers system=key,key --yes`. Repeat `--maintainers` to patch several systems; `system=` clears that system alone. Role holders are saved by permanent ID. `--recovery` explicitly uses repository access when Admin access is lost. The shared validation and optimistic revision check live in `tooling/settings/service.ts`, also used by the local Settings page. The CLI previews JSON changes and pinned prototypes before applying. Settings saves restart the running Nuxt child; the deployed site has no settings endpoint.

`studio.config.json` names Admins (`admins`) and maintainers (`systemMaintainers`, per system ID) by contributors' studio IDs.

- A contributor changes their own prototypes and profile.
- A system maintainer also edits that active system's components, theme, assets, context and skills, and can rename it.
- An Admin can do everything: every prototype and system, the configuration, modules and roles, and creating, archiving, restoring, deleting and choosing the default system.

The studio always has at least one registered Admin; the last one can't be removed. `tooling/contributors/roles.ts` holds the rules. Unregistered people can read, and every refusal says how to register or link.

## Commands

| Command | |
|---|---|
| `yarn studio whoami [--json]` | The contributor your Git identity resolves to; `--json` adds the candidates. |
| `yarn studio join [--key --name --email --github] [--yes]` | Register: a profile from Git and the GitHub CLI, default module preferences and your prototype folder. Refuses taken emails, GitHub accounts and keys. |
| `yarn studio join [--link <key>] [--yes]` | Link a new Git email to your profile: automatic when exactly one profile matches your name or GitHub account. |
| `yarn studio profile [...] [--yes]` | Show or change your name, emails (`--add-email`, `--remove-email`, `--primary-email`) and GitHub account. Keeps the studio ID and preferences. |
| `yarn studio preferences [--module <id>] --plan <file>`, then `--apply <file>` | Admins: add missing module preference sections to every profile, after reviewing the saved plan. |
| `yarn studio status`, `yarn studio context <prototype>` | Inspect the studio, or one prototype's owner, system, role and `canEdit`. |

Shared changes (`enable`, `disable`, `remove --yes`, `create-module --yes`) need an Admin; others are told to propose them in a pull request. A Git hook warns at commit time when Git's name or email doesn't match your profile.

## In the browser

In development, `/_studio/me` answers with your key, name, studio ID and role, and pages refresh it when a profile or the configuration changes (`useMe()`). The deployed site identifies nobody. Both receive `#studio/directory`: contributors' and systems' keys and studio IDs only, never profiles or preferences.

Negative identity results are retried on the next request: a transient GitHub lookup failure cannot cache an unregistered identity for the lifetime of the server.

[Use Contributors](skills/use-contributors/SKILL.md) is the agent procedure.
