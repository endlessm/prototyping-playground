export enum CoverSelection {
  Default = 'default',
  Current = 'current',
  Uploaded = 'uploaded',
}

export enum SkillDomain {
  GAME_DESIGN = 'game_design',
  ART = 'art',
  GO_TO_MARKET = 'go_to_market',
  ENGINEERING = 'engineering',
  MANAGEMENT_AND_PRODUCTION = 'management_and_production',
}

export enum SkillSubdomain {
  CORE_GAMEPLAY_AND_MECHANICS = 'core_gameplay_and_mechanics',
  GAME_FEEL_AND_UX = 'game_feel_and_ux',
  NARRATIVE_AND_STORYTELLING = 'narrative_and_storytelling',
  PROGRESSION_AND_MOTIVATION = 'progression_and_motivation',
  ANIMATION_AND_EFFECTS = 'animation_and_effects',
  AESTHETICS_AND_VISUAL_DESIGN = 'aesthetics_and_visual_design',
  MUSIC_AND_SOUND = 'music_and_sound',
  MARKETING = 'marketing',
  PUBLISHING_AND_DISTRIBUTION = 'publishing_and_distribution',
  GAMEPLAY_AND_SYSTEMS_PROGRAMMING = 'gameplay_and_systems_programming',
  OPTIMIZATION_AND_PERFORMANCE = 'optimization_and_performance',
  QUALITY_ASSURANCE_AND_PLAYTESTING = 'quality_assurance_and_playtesting',
  PROJECT_AND_WORKFLOW_MANAGEMENT = 'project_and_workflow_management',
}

export enum SkillType {
  PROBLEM_SOLVING = 'problem_solving',
  CREATIVITY_AND_DESIGN_THINKING = 'creativity_and_design_thinking',
  TECHNICAL_LITERACY = 'technical_literacy',
}

export enum ContributionType {
  GAME_DESIGN = 'game_design',
  ART_AND_SOUND = 'art_and_sound',
  GO_TO_MARKET = 'go_to_market',
  ENGINEERING = 'engineering',
  MANAGEMENT_AND_PRODUCTION = 'management_and_production',
}

export type CoverResult = {
  type: CoverSelection
  file: File | null
}

export interface CoverItem {
  value: CoverSelection
  image: string
}

export interface CertificateUser {
  first_name: string | null
  last_name: string | null
  username: string
}

export interface Certificate {
  id: number
  created_at: string
  program: {
    name: string
    image_url?: string
    certificate_template: string | null
  }
  created_by: CertificateUser
  student: CertificateUser
}
