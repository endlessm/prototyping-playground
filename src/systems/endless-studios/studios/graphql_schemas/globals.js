import { gql } from 'graphql-request'

export const CHECKS = gql`
  query CHECKS {
    check {
      databaseHealthy
      databaseError
      redisHealthy
      redisError
      s3bucketHealthy
      s3bucketError
      systemHealthy
    }
  }
`

export const GetInterests = gql`
  query GetInterests($input: GetInterestsInput) {
    getInterests(input: $input) {
      id
      interest_type_id
      ln_name
      name
    }
  }
`

export const UploadBase64File = gql`
  mutation UploadBase64File($input: UploadBase64FileInput) {
    uploadBase64File(input: $input) {
      url
      s3bucket
      key
      img_tag
      file_instance_id
    }
  }
`
