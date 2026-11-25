import { gql } from 'graphql-request'

/** Pending k-ID Verified Parental Consent challenge for the current user. */
export const PARENTAL_CONSENT_CHALLENGE_FRAGMENT = gql`
  fragment ParentalConsentChallengeFields on ParentalConsentChallenge {
    challengeId
    oneTimePassword
    type
    url
    otpExpiresAt
  }
`

export const REQUEST_PARENTAL_CONSENT = gql`
  mutation REQUEST_PARENTAL_CONSENT {
    requestParentalConsent {
      ...ParentalConsentChallengeFields
    }
  }
  ${PARENTAL_CONSENT_CHALLENGE_FRAGMENT}
`

export const SEND_PARENTAL_CONSENT_EMAIL = gql`
  mutation SEND_PARENTAL_CONSENT_EMAIL($email: String!) {
    sendParentalConsentEmail(email: $email)
  }
`

/** Poll while the k-ID challenge modal is open to detect completion. */
export const PARENTAL_CONSENT_STATUS = gql`
  query PARENTAL_CONSENT_STATUS {
    me {
      has_parental_consent
    }
    myParentalConsentChallenge {
      challengeId
    }
  }
`
