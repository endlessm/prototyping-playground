<!-- @studio-id wznven60vj1jh2cq -->
<!-- @studio-state e8taf5a8cd0w8ypp Reading -->
<!-- @studio-state r3erg1aw19sprrms Selecting text -->
<!-- @studio-state 7crhcyrb82qwbg95 Writing a comment -->
<!-- @studio-state wn28cc1cqb6hvkmx Thread open -->
<!-- @studio-state 6s6pxkwazc4gt8ym All comments -->
<script setup lang="ts">
import { usePrototypeArtifactHref } from '#studio/prototype'
import CommentLayer from './_parts/CommentLayer.vue'
import Icon from './_parts/Icon.vue'
import type { Start, Thread } from './_parts/comments'

// A document with comments, drawn as the studio's reader draws it. Selecting
// text offers "Comment" beside it and quotes the text; in comment mode a
// click on a heading, paragraph, table row or embed comments on that block.
withDefaults(defineProps<{ start?: Start; focus?: string; quote?: string }>(), {
  start: 'browse',
  focus: undefined,
  quote: undefined,
})
const href = usePrototypeArtifactHref()

const threads: Thread[] = [
  {
    id: 'd1',
    target: 'q-link',
    label: 'Text in "What we heard"',
    quote: 'Teachers expect the class link before they invite anyone.',
    at: { x: 1, y: 0 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'Is this three of five, or all five? The summary says “most”.',
        time: '3 h ago',
      },
      {
        author: 'bernardo',
        body: 'Three of five. I’ll fix the wording.',
        time: '2 h ago',
      },
    ],
  },
  {
    id: 'd2',
    target: 'row-assistant',
    label: 'Table row "Teaching assistant"',
    at: { x: 0.985, y: 0.5 },
    status: 'open',
    messages: [
      {
        author: 'bernardo',
        body: 'We talked to only one assistant. Say it’s a single interview.',
        time: '1 h ago',
      },
    ],
  },
  {
    id: 'd3',
    target: 'h-open',
    label: 'Heading "Open questions"',
    at: { x: 0.36, y: 0.5 },
    status: 'resolved',
    resolvedBy: 'ada',
    messages: [
      {
        author: 'ada',
        body: 'Add who owns each question.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'd4',
    target: 'embed',
    label: 'Embed "Sign-up flow"',
    at: { x: 0.985, y: 0.12 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'This diagram misses the GitHub branch.',
        time: '40 min ago',
      },
    ],
  },
]
</script>

<script lang="ts">
export const states = [
  { title: 'Reading', props: { start: 'browse' } },
  { title: 'Selecting text', props: { start: 'select', focus: 'p-email' } },
  {
    title: 'Writing a comment',
    props: {
      start: 'draft',
      focus: 'p-email',
      quote:
        'Most sign up with Google through their school account.',
    },
  },
  { title: 'Thread open', props: { start: 'thread', focus: 'd1' } },
  { title: 'All comments', props: { start: 'list' } },
]
</script>

<template>
  <CommentLayer
    :artifact="{
      kind: 'document',
      title: 'Research brief',
      file: 'src/prototypes/bernardo/comments/Research brief.md',
      address: href('2 Document'),
    }"
    :threads="threads"
    :start="start"
    :focus="focus"
    :quote="quote"
    quotes
  >
    <div class="reader">
      <div class="columns" data-target="page" data-label="Document · Margin">
        <article class="prose">
          <h1 data-target="h-title" data-label='Title "Research brief"'>
            Research brief
          </h1>
          <p class="lead">What we learned from five teacher interviews.</p>

          <h2 id="heard" data-target="h-heard" data-label='Heading "What we heard"'>
            What we heard
          </h2>
          <p data-target="p-link" data-label='Paragraph in "What we heard"'>
            <mark
              class="quoted"
              data-target="q-link"
              data-label='Text in "What we heard"'
              >Teachers expect the class link before they invite anyone.</mark
            >
            Three of five looked for it on the first screen, and two pasted it
            into their school’s messaging app before creating a team.
          </p>
          <p data-target="p-email" data-label='Paragraph in "What we heard"'>Most sign up with Google through their school account. Email sign-up is the fallback when the school blocks third-party sign-in, and nobody mentioned GitHub.</p>
          <ul data-target="list-heard" data-label='List in "What we heard"'>
            <li>The cohort page is where they spend their time.</li>
            <li>“Needs help” is the first thing they want to act on.</li>
            <li>Empty states matter: a new cohort has nobody in it yet.</li>
          </ul>

          <h2 id="who" data-target="h-who" data-label='Heading "Who signs up"'>
            Who signs up
          </h2>
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Interviews</th>
                <th>Signs up with</th>
              </tr>
            </thead>
            <tbody>
              <tr data-target="row-teacher" data-label='Table row "Teacher"'>
                <td>Teacher</td>
                <td>4</td>
                <td>Google</td>
              </tr>
              <tr
                data-target="row-assistant"
                data-label='Table row "Teaching assistant"'
              >
                <td>Teaching assistant</td>
                <td>1</td>
                <td>Email</td>
              </tr>
            </tbody>
          </table>

          <div class="embed" data-target="embed" data-label='Embed "Sign-up flow"'>
            <div class="embed-head">
              <Icon name="file" :size="14" />
              <span>Sign-up flow</span>
              <span class="embed-open">Open</span>
            </div>
            <svg viewBox="0 0 640 150" class="embed-body" aria-hidden="true">
              <g fill="#f5f5f5" stroke="#d4d4d4">
                <rect x="20" y="55" width="120" height="40" rx="6" />
                <rect x="190" y="55" width="120" height="40" rx="6" />
                <rect x="360" y="20" width="120" height="40" rx="6" />
                <rect x="360" y="90" width="120" height="40" rx="6" />
                <rect x="520" y="55" width="100" height="40" rx="6" />
              </g>
              <g stroke="#a3a3a3" fill="none">
                <path d="M140 75h50M310 75l50-35M310 75l50 35M480 40l40 35M480 110l40-35" />
              </g>
              <g fill="#525252" font-size="12" text-anchor="middle" font-family="ui-sans-serif, system-ui">
                <text x="80" y="79">Join</text>
                <text x="250" y="79">Signs up with?</text>
                <text x="420" y="44">Google</text>
                <text x="420" y="114">Email</text>
                <text x="570" y="79">Confirm</text>
              </g>
            </svg>
          </div>

          <h2 id="open" data-target="h-open" data-label='Heading "Open questions"'>
            Open questions
          </h2>
          <ol data-target="list-open" data-label='List in "Open questions"'>
            <li>Do teaching assistants under 18 need parental consent?</li>
            <li>Should a school admin approve a new team?</li>
            <li>What does a teacher see before anyone joins the cohort?</li>
          </ol>
        </article>
        <nav class="toc" aria-label="On this page">
          <p>On this page</p>
          <a href="#heard">What we heard</a>
          <a href="#who">Who signs up</a>
          <a href="#open">Open questions</a>
        </nav>
      </div>
    </div>
  </CommentLayer>
</template>

<style scoped>
.reader {
  height: 100%;
  overflow: auto;
  background: #fff;
  color: #404040;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.columns {
  display: flex;
  justify-content: center;
  gap: 48px;
  min-height: 100%;
  padding: 40px 32px 120px;
  box-sizing: border-box;
}
.prose {
  width: 100%;
  max-width: 720px;
  font-size: 16px;
  line-height: 28px;
}
h1 {
  margin: 0;
  color: #171717;
  font-size: 30px;
  line-height: 38px;
  font-weight: 700;
}
.lead {
  margin: 8px 0 32px;
  color: #737373;
  font-size: 18px;
}
h2 {
  margin: 40px 0 12px;
  color: #171717;
  font-size: 22px;
  line-height: 30px;
  font-weight: 700;
}
p {
  margin: 0 0 16px;
}
ul,
ol {
  margin: 0 0 16px;
  padding-left: 24px;
}
li {
  margin: 4px 0;
}
.quoted {
  background: rgb(37 99 235 / 0.12);
  border-bottom: 2px solid #2563eb;
  color: inherit;
  padding: 1px 0;
}
table {
  width: 100%;
  margin: 8px 0 24px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
}
th {
  padding: 8px 14px;
  background: #fafafa;
  color: #171717;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #e5e5e5;
}
td {
  padding: 8px 14px;
}
tbody tr + tr td {
  border-top: 1px solid #e5e5e5;
}
.embed {
  margin: 8px 0 24px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}
.embed-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid #e5e5e5;
  color: #171717;
  font-size: 13px;
  font-weight: 500;
}
.embed-open {
  margin-left: auto;
  color: #737373;
  font-size: 12px;
}
.embed-body {
  display: block;
  width: 100%;
  height: 180px;
  padding: 16px;
  box-sizing: border-box;
  background: #fff;
}
.toc {
  position: sticky;
  top: 40px;
  align-self: flex-start;
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.toc p {
  margin: 0 0 4px;
  color: #171717;
  font-weight: 600;
}
.toc a {
  color: #737373;
  text-decoration: none;
}
@media (max-width: 1100px) {
  .toc {
    display: none;
  }
}
</style>
