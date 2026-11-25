import type { ContributionType } from '../components/Profile/types'
import type { UserChangeUsernamePermission } from './permissions'

export enum Language {
  EN = 'en',
  ES = 'es',
}

export enum AuthMethod {
  PASSWORD = 'password',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github',
}

export enum InterestType {
  LEARNING_FIELDS = 'learningfields',
  GAME_TYPES = 'gametypes',
}

export type AgeCategory = 'digital_youth' | 'adult'

export interface User {
  id: number
  /** Present on profile queries that return UserResult (User | LimitedUser). */
  __typename?: 'User' | 'LimitedUser'
  email: string
  first_name: string
  username: string
  last_name: string
  verified: boolean
  disabled: boolean
  permissions: {
    change_username: UserChangeUsernamePermission
  }
  /**
   * The user's explicit visibility choice: true is public, false is
   * private, null is private because no choice has been made.
   */
  public: boolean | null
  age_category: AgeCategory | null
  is_restricted_partner_account: boolean
  created_at: string
  roles: Role[]
  github_user: GithubUser
  auth_methods: AuthMethod[]
  metadata: UserMetadata
  skill_progress: SkillProgress
  memberOfProjects: Project[]
  leaderForProjects: Project[]
  contributions: ContributionsData
  joinedProjectsCount: number
  certificatesCount: number
  institutions: Institution[]
}

export interface Institution {
  name: string
}

export interface GithubUser {
  login: string
}

export interface SkillProgress {
  total_xp: number
  domains: SkillProgressDomain[]
}

export interface SkillProgressDomain {
  domain: string
  total_xp: number
  subdomains: SkillProgressSubdomain[]
}

export interface SkillProgressSubdomain {
  subdomain: string
  total_xp: number
}

export interface Project {
  id: number
  slug: string
  name: string
  short_description: string
  tag: string
  image_url: string | null
  thumbnail_image_url: string | null
  participants_count: number
  created_at: string
}

export interface UserMetadata {
  image_url: string | null
  about_me: string
  description: string
  task_slots: number
  discord_username: string
  viewed_info_modal: boolean
  show_on_boarding_banner: boolean
  cover_image_url: string | null
  onboarding_task_complete: boolean
  show_onboarding_posts: boolean
  preferred_lang_id: Language
  birthday: string | null
  interests: Interest[]
}

export interface Interest {
  id: number
  name: string
  ln_name: Record<string, string>
  interest_type_id: InterestType
}

export interface Skill {
  id: number
  name: string
  level: number
}

export enum UserRole {
  ADMIN = 1,
  MEMBER = 2,
  LEADER = 3,
  MENTOR = 5,
  PROGRAM_ADMIN = 14,
  CONTENT_EDITOR = 19,
  INSTITUTION_ADMIN = 20,
  PROGRAM_MANAGER = 23,
}

/** Cohort role IDs */
export enum CohortRole {
  COHORT_MEMBER = 21,
  COHORT_ADMIN = 22,
}

export interface Role {
  id: number
  name: string
}

/**
 * A cohort the user belongs to, with the role they hold there. The session
 * carries the ids and roles alone; a page that needs the cohort's name or its
 * program asks for those itself.
 */
export interface UserCohort {
  id: number
  cohort_role_id: CohortRole
}

export interface ContributionCreator {
  id: number
  username: string
}

export interface PullRequestData {
  id: number
  body: string
  base: {
    repo: {
      name: string
      owner: {
        avatar_url: string
      }
    }
  }
}

export interface Contributor {
  id: number
  user: {
    username: string
    metadata: {
      avatar_url: string
    }
  }
  github_user: {
    login: string
    html_url: string
    avatar_url: string
  }
}

export interface PullRequest {
  id: number
  merged: string
  data: PullRequestData
  title: string
  closed_at: string
  contributors: Contributor[]
  pull_request_url: string
  pull_request_number: number
  project: {
    slug: string
    name: string
    thumbnail_image_url: string
  }
}

export interface Recognition {
  count: number
  contribution_type: ContributionType
}

export interface Contribution {
  id: number
  notes: string
  merged: boolean
  created_at: string
  contribution_type: string
  created_by: ContributionCreator | null
  pull_request: PullRequest
}

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface ContributionsData {
  data: Contribution[]
  pageInfo: PageInfo
  totalCount: number
}
