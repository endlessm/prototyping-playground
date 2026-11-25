import { gql } from 'graphql-request'
import axios from 'axios'

const CREATE_FILE_UPLOAD_LINK = gql`
  mutation CREATE_FILE_UPLOAD_LINK($input: CreateFileUploadLinkInput) {
    createFileUploadLink(input: $input) {
      secure_upload_url
      additional_s3_security_fields
      file_id
      file_instance_id
    }
  }
`

const MARK_FILE_INSTANCE_UPLOADED = gql`
  mutation MARK_FILE_INSTANCE_UPLOADED($input: FileInstanceIdInput) {
    markFileInstanceUploaded(input: $input)
  }
`

/**
 * Marks a file instance as uploaded
 * @param {string} fileInstanceId - The file instance ID to mark as uploaded
 * @param {Object} graphqlRequest - The GraphQL request instance
 */
export async function markFileInstanceUploaded(fileInstanceId, graphqlRequest) {
  await graphqlRequest.mutate(MARK_FILE_INSTANCE_UPLOADED, {
    input: {
      file_instance_id: fileInstanceId,
    },
  })
}

/**
 * Uploads a file to S3 via GraphQL upload link
 * @param {Object} file - The file object to upload
 * @param {Object} graphqlRequest - The GraphQL request instance
 * @param {Function} onProgress - Optional progress callback function
 * @param {Object} cancelToken - Optional axios cancel token
 * @returns {Promise<string>} - Returns the file instance ID
 */
export async function uploadFileToS3(
  file,
  graphqlRequest,
  onProgress = null,
  cancelToken = null,
) {
  const fileUploadFormData = new FormData()

  // Get upload link from GraphQL
  const fileUploadLink = await graphqlRequest.mutate(CREATE_FILE_UPLOAD_LINK, {
    input: {
      name: file.name,
      mime_type: file.type,
      size: file.size,
    },
  })

  const {
    secure_upload_url: secureUploadURL,
    additional_s3_security_fields: additionalFieldsStr,
    file_instance_id: fileInstanceId,
  } = fileUploadLink.data.createFileUploadLink

  // Prepare form data with S3 security fields
  const fields = JSON.parse(additionalFieldsStr)
  for (const field in fields) {
    fileUploadFormData.append(field, fields[field])
  }
  fileUploadFormData.append('file', file)

  // Configure axios request
  const config = {}
  if (onProgress) {
    config.onUploadProgress = onProgress
  }
  if (cancelToken) {
    config.cancelToken = cancelToken
  }

  // Upload to S3
  const fileUploadResponse = await axios.post(
    secureUploadURL,
    fileUploadFormData,
    config,
  )

  // Mark file as uploaded if successful
  if (fileUploadResponse.status === 204) {
    await markFileInstanceUploaded(fileInstanceId, graphqlRequest)
    return fileInstanceId
  }
}
