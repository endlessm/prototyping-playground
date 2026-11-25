import { gql } from 'graphql-request'

/** All fields for User */
export const USER_DATA_FRAGMENT = gql`
  fragment UserDataFragment on User {
    id
    email
    first_name
    last_name
    username
    permissions {
      change_username
    }
    verified
    disabled
    public
    is_restricted_partner_account
    location
    auth_methods
    age_category
    roles {
      id
      name
    }
    metadata {
      description
      task_slots
      about_me
      interests {
        id
        name
        ln_name
        interest_type_id
      }
      discord_username
      viewed_info_modal
      show_on_boarding_banner
      image_url
      cover_image_url
      onboarding_task_complete
      preferred_lang_id
      birthday
    }
    institutions {
      name
    }
  }
`

/** Basic fields for User as shown in listings */
export const USER_BASIC_DATA_FRAGMENT = gql`
  fragment UserBasicDataFragment on User {
    id
    first_name
    last_name
    username
    roles {
      id
      name
    }
    metadata {
      image_url
    }
  }
`

export const GET_USER_DATA = gql`
  query GET_USER_DATA {
    me {
      github_user {
        login
      }
      ...UserDataFragment
    }
  }
  ${USER_DATA_FRAGMENT}
`

export const GET_USER_STATE_DATA = gql`
  query GET_USER_STATE_DATA {
    me {
      adminForPrograms {
        program {
          id
        }
      }
    }
  }
`
export const UPDATE_USER = gql`
  mutation UPDATE_USER($input: UpdateUserInput) {
    updateUser(input: $input) {
      ...UserDataFragment
    }
  }
  ${USER_DATA_FRAGMENT}
`

export const DELETE_USER = gql`
  mutation DeleteUser($input: UserIdInput) {
    deleteUser(input: $input)
  }
`

export const SIGN_USER_IN_TEAM_WITH_CODE = gql`
  mutation SIGN_USER_IN_TEAM_WITH_CODE(
    $input: ApplySignupCodeForCurrentUserInput!
  ) {
    applySignupCodeForCurrentUser(input: $input) {
      program {
        id
        name
        short_description
        image_url
      }
      program_role_id
      project {
        id
        name
        short_description
        image_url
        slug
      }
      project_role_id
      cohort {
        id
        name
        program {
          id
          name
          short_description
          image_url
        }
      }
      cohort_role_id
      institution_id
      institution_role_id
      already_claimed
    }
  }
`
export const GET_USER_ID_BY_USER_NAME = gql`
  query GET_USER_ID_BY_USER_NAME($userName: String!) {
    getUserIdByUsername(input: { username: $userName })
  }
`
export const GET_PROFILE_FOR_USER = gql`
  query GET_PROFILE_FOR_USER($input: UserIdInput) {
    getProfileForUser(input: $input) {
      __typename
      ... on UserProfile {
        id
        username
        about_me
        isMentor
        image_url
        description
        memberOfProjects(input: { statuses: [published] }) {
          id
          name
          short_description
          tag
          tag_color
          home_page_banner
          process_type_id
          slug
          image_url
          thumbnail_image_url
          status_id
          members {
            id
          }
        }
        interests {
          id
          name
        }
        started_programs {
          individual {
            user_program_id
            program {
              id
              name
              program_kind_id
              description
              image_url
              tasks {
                id
              }
            }
          }
          team {
            user_program_id
            program {
              id
              name
              program_kind_id
              description
              image_url
            }
          }
        }
      }
      ... on LimitedUserProfile {
        id
        username
        image_url
      }
    }
  }
`

export const CREATE_BATCH_USERS = gql`
  mutation CREATE_BATCH_USERS($input: CreateUsersFromCSVFileInput!) {
    createUsersFromCSVFile(input: $input) {
      success
      users {
        id
        username
        email
        first_name
        last_name
        verified
        disabled
        metadata {
          about_me
          image_url
          birthday
          discord_username
          cover_image_url
          show_in_mentor_list
        }
      }
      message
      errors {
        field
        message
      }
    }
  }
`
