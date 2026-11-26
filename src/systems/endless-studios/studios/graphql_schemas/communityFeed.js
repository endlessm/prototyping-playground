import { gql } from 'graphql-request'

export const RELATED_OBJECT_FRAGMENT = gql`
  fragment RelatedObjectFragment on RelatedObject {
    id
    association_id
    name
    resource_name
  }
`

export const FILE_FRAGMENT = gql`
  fragment FileFragment on File {
    file_instance_id
    name
    mime_type
    file_url
  }
`

export const USER_FEED_FRAGMENT = gql`
  fragment UserFeedFragment on User {
    id
    username
    metadata {
      image_url
    }
    roles {
      id
    }
  }
`

export const PUBLIC_USER_FEED_FRAGMENT = gql`
  fragment PublicUserFeedFragment on PublicUser {
    id
    username
    metadata {
      image_url
    }
    roles {
      id
    }
  }
`

export const PUBLIC_COMMENT_FRAGMENT = gql`
  fragment PublicCommentFragment on PublicObjectFeedComment {
    id
    user_id
    description
    image_url
    created_at
  }
`

export const COMMENT_FRAGMENT = gql`
  fragment CommentFragment on ObjectFeedComment {
    id
    user_id
    description
    image_url
    created_at
  }
`

export const LIKE_FRAGMENT = gql`
  fragment LikeFragment on ObjectFeedLike {
    id
    user_id
    like_type
  }
`

export const OBJECT_FEED_FRAGMENT = gql`
  fragment ObjectFeedFragment on ObjectFeed {
    id
    object_id
    object_feed_type_id
    description
    image_url
    tags
    created_at
    is_pinned
    related_object {
      ...RelatedObjectFragment
    }
    files {
      ...FileFragment
    }
    links
    comments {
      ...CommentFragment
      user {
        ...UserFeedFragment
      }
    }
    likes {
      ...LikeFragment
    }
    user {
      ...UserFeedFragment
    }
  }
  ${RELATED_OBJECT_FRAGMENT}
  ${FILE_FRAGMENT}
  ${COMMENT_FRAGMENT}
  ${LIKE_FRAGMENT}
  ${USER_FEED_FRAGMENT}
`

export const ADMIN_OBJECT_FEED_FRAGMENT = gql`
  fragment AdminObjectFeedFragment on ObjectFeed {
    flagged_by_user {
      username
    }
  }
`

export const OBJECT_FEED_CHANNEL_FRAGMENT = gql`
  fragment ObjectFeedChannelFragment on ObjectFeedChannel {
    description
    id
    name
    specified_for_object_id
  }
`

export const CREATE_OBJECT_FEED = gql`
  mutation CREATE_OBJECT_FEED($input: CreateObjectFeedInput!) {
    createObjectFeed(input: $input) {
      ...ObjectFeedFragment
    }
  }
  ${OBJECT_FEED_FRAGMENT}
`

export const UPDATE_OBJECT_FEED = gql`
  mutation UPDATE_OBJECT_FEED($input: UpdateObjectFeedInput!) {
    updateObjectFeed(input: $input) {
      ...ObjectFeedFragment
    }
  }
  ${OBJECT_FEED_FRAGMENT}
`

export const DELETE_OBJECT_FEED = gql`
  mutation DELETE_OBJECT_FEED($input: ObjectFeedIdInput!) {
    deleteObjectFeed(input: $input)
  }
`

export const CREATE_OBJECT_FEED_LIKE = gql`
  mutation CREATE_OBJECT_FEED_LIKE($input: CreateObjectFeedLikeInput!) {
    createObjectFeedLike(input: $input) {
      id
      object_feed_id
      user_id
      like_type
    }
  }
`

export const DELETE_OBJECT_FEED_LIKE = gql`
  mutation DELETE_OBJECT_FEED_LIKE($input: ObjectFeedLikeIdInput!) {
    deleteObjectFeedLike(input: $input)
  }
`

export const CREATE_OBJECT_FEED_COMMENT = gql`
  mutation CREATE_OBJECT_FEED_COMMENT($input: CreateObjectFeedCommentInput!) {
    createObjectFeedComment(input: $input) {
      id
      object_feed_id
      user_id
      description
      image_url
      user {
        id
        username
        metadata {
          image_url
        }
        roles {
          id
        }
      }
    }
  }
`

export const DELETE_OBJECT_FEED_COMMENT = gql`
  mutation DELETE_OBJECT_FEED_COMMENT($input: ObjectFeedCommentIdInput!) {
    deleteObjectFeedComment(input: $input)
  }
`

export const FLAG_POST = gql`
  mutation FLAG_POST($input: UpdateObjectFeedInput!) {
    flagObjectFeed(input: $input) {
      id
      object_id
    }
  }
`

export const UNFLAG_POST = gql`
  mutation UNFLAG_POST($input: UpdateObjectFeedInput!) {
    unflagObjectFeed(input: $input) {
      id
      object_id
    }
  }
`

export const PIN_POST = gql`
  mutation PIN_POST($input: UpdateObjectFeedInput!) {
    updateObjectFeed(input: $input) {
      id
      object_id
      is_pinned
    }
  }
`

export const getObjectFeedById = gql`
  query GetObjectFeedById($input: GetObjectFeedByIdInput) {
    getObjectFeedById(input: $input) {
      ...ObjectFeedFragment
    }
  }
  ${OBJECT_FEED_FRAGMENT}
`

export const getObjectFeedByIdByAdmin = gql`
  query GetObjectFeedByIdByAdmin($input: GetObjectFeedByIdInput) {
    getObjectFeedById(input: $input) {
      ...ObjectFeedFragment
      flagged_by_user {
        username
      }
    }
  }
  ${OBJECT_FEED_FRAGMENT}
`

export const GET_CHANNELS = gql`
  query GetObjectFeedChannels($input: GetObjectFeedChannelsInput!) {
    getObjectFeedChannels(input: $input) {
      description
      id
      name
      specified_for_object_id
    }
  }
`

export const CREATE_CHANNEL = gql`
  mutation CreateObjectFeedChannel($input: CreateObjectFeedChannelInput!) {
    createObjectFeedChannel(input: $input) {
      description
      name
      id
      specified_for_object_id
    }
  }
`

export const UPDATE_CHANNEL = gql`
  mutation UpdateObjectFeedChannel($input: UpdateObjectFeedChannelInput!) {
    updateObjectFeedChannel(input: $input) {
      id
      name
      description
    }
  }
`

export const DELETE_CHANNEL = gql`
  mutation DeleteObjectFeedChannel($input: ObjectFeedChannelIdInput!) {
    deleteObjectFeedChannel(input: $input)
  }
`
