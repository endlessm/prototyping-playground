export const UserProfileImagesPermission = {
  ALLOWED: 'allowed',
  PARENTAL_CONSENT_REQUIRED: 'parental_consent_required',
} as const
export type UserProfileImagesPermission =
  (typeof UserProfileImagesPermission)[keyof typeof UserProfileImagesPermission]

export const UserChangeUsernamePermission = {
  ALLOWED: 'allowed',
  PARENTAL_CONSENT_REQUIRED: 'parental_consent_required',
} as const
export type UserChangeUsernamePermission =
  (typeof UserChangeUsernamePermission)[keyof typeof UserChangeUsernamePermission]

export const UserPublishProfilePermission = {
  ALLOWED: 'allowed',
  PARENTAL_CONSENT_REQUIRED: 'parental_consent_required',
} as const
export type UserPublishProfilePermission =
  (typeof UserPublishProfilePermission)[keyof typeof UserPublishProfilePermission]

export const ProjectJoinPermission = {
  ALLOWED: 'allowed',
  APPLICATION_REQUIRED: 'application_required',
  NOT_ALLOWED: 'not_allowed',
  RESTRICTED_PARTNER: 'restricted_partner',
} as const
export type ProjectJoinPermission =
  (typeof ProjectJoinPermission)[keyof typeof ProjectJoinPermission]

export const ProjectPostPermission = {
  ALLOWED: 'allowed',
  NOT_MEMBER: 'not_member',
  RESTRICTED_PARTNER: 'restricted_partner',
} as const
export type ProjectPostPermission =
  (typeof ProjectPostPermission)[keyof typeof ProjectPostPermission]

export const ProjectSubmitTaskPermission = {
  ALLOWED: 'allowed',
  NOT_MEMBER: 'not_member',
} as const
export type ProjectSubmitTaskPermission =
  (typeof ProjectSubmitTaskPermission)[keyof typeof ProjectSubmitTaskPermission]

export const ProjectDiscordPermission = {
  ALLOWED: 'allowed',
  NOT_AUTHENTICATED: 'not_authenticated',
  PARENTAL_CONSENT_REQUIRED: 'parental_consent_required',
} as const
export type ProjectDiscordPermission =
  (typeof ProjectDiscordPermission)[keyof typeof ProjectDiscordPermission]

export const TaskSubmitPermission = {
  ALLOWED: 'allowed',
  NOT_MEMBER: 'not_member',
  PARENTAL_CONSENT_REQUIRED: 'parental_consent_required',
} as const
export type TaskSubmitPermission =
  (typeof TaskSubmitPermission)[keyof typeof TaskSubmitPermission]

export const ProgramJoinPermission = {
  ALLOWED: 'allowed',
  CODE_REQUIRED: 'code_required',
  RESTRICTED_PARTNER: 'restricted_partner',
  UNAVAILABLE: 'unavailable',
} as const
export type ProgramJoinPermission =
  (typeof ProgramJoinPermission)[keyof typeof ProgramJoinPermission]

export const ProgramPostPermission = {
  ALLOWED: 'allowed',
  NOT_MEMBER: 'not_member',
  RESTRICTED_PARTNER: 'restricted_partner',
} as const
export type ProgramPostPermission =
  (typeof ProgramPostPermission)[keyof typeof ProgramPostPermission]

export const ProgramSubmitTaskPermission = {
  ALLOWED: 'allowed',
  NOT_MEMBER: 'not_member',
} as const
export type ProgramSubmitTaskPermission =
  (typeof ProgramSubmitTaskPermission)[keyof typeof ProgramSubmitTaskPermission]

export const ProgramCreateProjectPermission = {
  ALLOWED: 'allowed',
  NOT_ALLOWED: 'not_allowed',
  RESTRICTED_PARTNER: 'restricted_partner',
} as const
export type ProgramCreateProjectPermission =
  (typeof ProgramCreateProjectPermission)[keyof typeof ProgramCreateProjectPermission]
