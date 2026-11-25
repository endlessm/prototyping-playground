import { gql } from 'graphql-request'

export const GET_COHORTS_BY_PROGRAM_ID = gql`
  query GetCohortsByProgramId($input: GetCohortsByProgramIdInput!) {
    getCohortsByProgramId(input: $input) {
      id
      name
      cohort_status
      institution_id
      institution_name
      start_date
      end_date
      role_id
      timezone
      member_count: participants_count(input: { cohort_role_id: 21 })
      cohort_admins: participants(input: { cohort_role_id: 22 }) {
        id
        username
        first_name
        last_name
      }
    }
  }
`

export const GET_COHORT_PROGRAM = gql`
  query GetCohortProgram($input: ProgramIdInput!) {
    getProgramById(input: $input) {
      name
      role_id
      institution_id
      institution_name
    }
  }
`

export const GET_COHORT_BY_ID = gql`
  query GetCohortById($input: CohortIdInput!) {
    getCohortById(input: $input) {
      id
      name
      cohort_status
      institution_id
      start_date
      end_date
      role_id
      timezone
      member_count: participants_count(input: { cohort_role_id: 21 })
      cohort_admins: participants(input: { cohort_role_id: 22 }) {
        id
      }
      program {
        id
        name
        role_id
        institution_id
        institution_name
      }
    }
  }
`

export const GET_COHORT_NAMES_BY_PROGRAM_ID = gql`
  query GetCohortNamesByProgramId($input: GetCohortsByProgramIdInput!) {
    getCohortsByProgramId(input: $input) {
      id
      name
    }
  }
`

export const GET_COHORT_USERS = gql`
  query GetCohortUsers(
    $input: CohortIdInput!
    $participants: CohortParticipantsInput
  ) {
    getCohortById(input: $input) {
      participants(input: $participants) {
        id
        cohort_role_id
        signup_code
        joined_at
        username
        email
        first_name
        middle_name
        last_name
        has_certificate
        metadata {
          image_url
        }
      }
    }
  }
`

export const REMOVE_COHORT_USER = gql`
  mutation RemoveCohortUser($input: RemoveCohortUserInput!) {
    removeCohortUser(input: $input)
  }
`

export const CREATE_COHORT = gql`
  mutation CreateCohort($input: CreateCohortInput!) {
    createCohort(input: $input) {
      id
    }
  }
`

export const UPDATE_COHORT = gql`
  mutation UpdateCohort($input: UpdateCohortInput!) {
    updateCohort(input: $input) {
      id
    }
  }
`

export const DELETE_COHORT = gql`
  mutation DeleteCohort($input: CohortIdInput!) {
    deleteCohort(input: $input)
  }
`
