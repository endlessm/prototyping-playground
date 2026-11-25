---
title: Post modal
description: The Create Post form in a community feed. People pick a post type, write the post with the rich text editor, add an image and tags, and upload it.
source: The app's own components/CommunityFeed/PostModal.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on the app's ModalTemplate, its RichTextEditor (Nuxt UI's UEditor with tiptap) and ProgramDropdown.
---

## When to use

Open it when someone chooses to post in a feed: the home feed, a program's or cohort's feed, or a game's. Use it to edit a post too, by passing the post.

Don't use it for comments or replies, which are written inline under a post, or for anything other than a feed post. For a new form, build it with Nuxt UI's `UModal` and `UForm`; this modal predates them and keeps its own styles.

## In Vue screens

Import the copied file and show it while the person is posting. It emits `done` with the post's data and closes itself; `close` and a click outside close it too.

```vue
<PostModal v-if="posting" :feed-object-id="cohort.id" @done="addPost" />
```

## What changes

- **Post type**: Progress updates, Questions, Tip and Random for everyone; leaders and admins also see Announcement.
- **Mentions**: with `feed-object-id`, typing @ in the description suggests people in that feed.
- **Program menu**: with `has-program-selector`, a menu beside Upload Post chooses where the post goes, Home Page first, then the programs the person started and the games they're in. The home feed uses it.
- **Upload Post** stays off until a type and a description are filled in, and a destination when the menu shows.
- **Editing**: given `post`, the modal opens filled in and the image field reads Change image.

## Accessibility

The modal is the app's older ModalTemplate: it doesn't trap focus, its close button is an image without a label, its labels aren't tied to their fields, and the tags placeholder is in English in every language. Keep that in mind before copying its pattern into new work.
