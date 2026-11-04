<!-- @studio-id m6fsmtjn97wj16ke -->
<!-- @studio-state ccdtx31vwk4swfvr Browsing -->
<!-- @studio-state r9ehmw7kz9fqvvej Commenting -->
<!-- @studio-state b29agabmvh71b6ap Writing a comment -->
<!-- @studio-state 8p5nzeby6s9waywk Thread open -->
<!-- @studio-state jt53enx09ptgek0t All comments -->
<script setup lang="ts">
import { usePrototypeArtifactHref } from '#studio/prototype'
import CommentLayer from './_parts/CommentLayer.vue'
import type { Start, Thread } from './_parts/comments'
import { useEndlessFonts } from './_parts/useLook'

// A view with comments: an Endless Studios screen as it shows in its preview
// document, with the comment tool over it. In comment mode a click on any
// element pins a comment to it; the agent gets the element's name and path.
withDefaults(defineProps<{ start?: Start; focus?: string }>(), {
  start: 'browse',
  focus: undefined,
})
useEndlessFonts()
const href = usePrototypeArtifactHref()

const threads: Thread[] = [
  {
    id: 't1',
    target: 'invite',
    label: 'Button "Invite students"',
    at: { x: 0.97, y: 0.06 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'Should this open the class link right away? In the interviews, teachers looked for the link before anything else.',
        time: '2 h ago',
      },
      {
        author: 'bernardo',
        body: 'Agreed. Let’s try opening the link dialog first.',
        time: '1 h ago',
      },
    ],
  },
  {
    id: 't2',
    target: 'stat-help',
    label: 'Card "Need help"',
    at: { x: 0.97, y: 0.08 },
    status: 'open',
    messages: [
      {
        author: 'bernardo',
        body: 'Make this card clickable: it should filter the table to the two students who need help.',
        time: '50 min ago',
      },
      {
        author: 'agent',
        body: 'Done in 1 View.vue: the card now filters the table to Leo and Tomás. Resolve this when you’ve checked it.',
        time: '12 min ago',
      },
    ],
  },
  {
    id: 't3',
    target: 'progress-maya',
    label: 'Progress bar · Row "Maya Chen"',
    at: { x: 1, y: 0.5 },
    status: 'resolved',
    resolvedBy: 'bernardo',
    messages: [
      {
        author: 'ada',
        body: 'This green is too close to the success colour of the status chip. Use the brand orange.',
        time: 'Yesterday',
      },
      { author: 'bernardo', body: 'Fixed.', time: 'Yesterday' },
    ],
  },
  {
    id: 't4',
    target: 'upcoming',
    label: 'Card "Upcoming sessions"',
    at: { x: 0.5, y: 0.5 },
    status: 'open',
    detached: true,
    messages: [
      {
        author: 'bernardo',
        body: 'Move upcoming sessions above the table.',
        time: '3 days ago',
      },
    ],
  },
  {
    id: 't5',
    target: 'artifact',
    label: 'The whole view',
    at: { x: 0, y: 0 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'Reads well overall. Can we also see the empty state, before anyone joins?',
        time: '2 h ago',
      },
    ],
  },
]

const students = [
  { key: 'maya', name: 'Maya Chen', progress: 80, lessons: 12, seen: 'Today', help: false },
  { key: 'leo', name: 'Leo Martins', progress: 35, lessons: 5, seen: '6 days ago', help: true },
  { key: 'aisha', name: 'Aisha Bello', progress: 62, lessons: 9, seen: 'Yesterday', help: false },
  { key: 'tomas', name: 'Tomás Rivera', progress: 15, lessons: 2, seen: '9 days ago', help: true },
  { key: 'noor', name: 'Noor Haddad', progress: 90, lessons: 14, seen: 'Today', help: false },
  { key: 'sam', name: 'Sam Oduya', progress: 50, lessons: 7, seen: '2 days ago', help: false },
]
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
</script>

<script lang="ts">
export const states = [
  { title: 'Browsing', props: { start: 'browse' } },
  { title: 'Commenting', props: { start: 'comment', focus: 'row-leo' } },
  { title: 'Writing a comment', props: { start: 'draft', focus: 'row-leo' } },
  { title: 'Thread open', props: { start: 'thread', focus: 't2' } },
  { title: 'All comments', props: { start: 'list' } },
]
</script>

<template>
  <CommentLayer
    :artifact="{
      kind: 'view',
      title: '1 View',
      file: 'src/prototypes/bernardo/comments/1 View.vue',
      address: href('1 View'),
    }"
    :threads="threads"
    :start="start"
    :focus="focus"
  >
    <div class="screen">
      <header class="topbar">
        <span class="brand"><span class="mark" />Endless Studios</span>
        <nav class="nav">
          <a href="#" data-target="nav-home" data-label='Link "Home"'>Home</a>
          <a
            href="#"
            class="current"
            data-target="nav-cohorts"
            data-label='Link "Cohorts"'
            >Cohorts</a
          >
          <a href="#" data-target="nav-library" data-label='Link "Library"'
            >Library</a
          >
        </nav>
        <span class="me" data-target="me" data-label="Avatar · Signed-in teacher"
          >RG</span
        >
      </header>

      <main class="main" data-target="page" data-label="Page · Empty area">
        <p class="crumbs">Cohorts / Spring cohort</p>
        <div class="heading">
          <div>
            <h1 data-target="title" data-label='Heading "Spring cohort"'>
              Spring cohort
            </h1>
            <p class="sub">Grade 7 · 12 students · Started March 4</p>
          </div>
          <div class="actions">
            <button
              type="button"
              class="btn secondary"
              data-target="share"
              data-label='Button "Share class link"'
            >
              Share class link
            </button>
            <button
              type="button"
              class="btn primary"
              data-target="invite"
              data-label='Button "Invite students"'
            >
              Invite students
            </button>
          </div>
        </div>

        <section class="stats">
          <article
            class="stat"
            data-target="stat-active"
            data-label='Card "Active this week"'
          >
            <p class="stat-label">Active this week</p>
            <p class="stat-value">9 <span>of 12</span></p>
          </article>
          <article
            class="stat"
            data-target="stat-lessons"
            data-label='Card "Lessons completed"'
          >
            <p class="stat-label">Lessons completed</p>
            <p class="stat-value">47</p>
          </article>
          <article
            class="stat warn"
            data-target="stat-help"
            data-label='Card "Need help"'
          >
            <p class="stat-label">Need help</p>
            <p class="stat-value">2</p>
          </article>
        </section>

        <section class="card" data-target="students" data-label='Table "Students"'>
          <header class="card-head">
            <h2>Students</h2>
            <input
              class="search"
              placeholder="Search students"
              aria-label="Search students"
              data-target="search"
              data-label='Field "Search students"'
            />
          </header>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Progress</th>
                <th>Lessons</th>
                <th>Last active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in students"
                :key="student.key"
                :data-target="`row-${student.key}`"
                :data-label="`Row &quot;${student.name}&quot;`"
              >
                <td>
                  <span class="who"
                    ><span class="face">{{ initials(student.name) }}</span
                    >{{ student.name }}</span
                  >
                </td>
                <td>
                  <span
                    class="bar"
                    :data-target="`progress-${student.key}`"
                    :data-label="`Progress bar · Row &quot;${student.name}&quot;`"
                    ><span :style="{ width: `${student.progress}%` }"
                  /></span>
                </td>
                <td>{{ student.lessons }}</td>
                <td>{{ student.seen }}</td>
                <td>
                  <span class="status" :class="{ help: student.help }">{{
                    student.help ? 'Needs help' : 'On track'
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  </CommentLayer>
</template>

<style scoped>
.screen {
  height: 100%;
  overflow: auto;
  background: #f8fafc;
  color: #1d293d;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  line-height: 20px;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 32px;
  height: 64px;
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid #dcdce9;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: Figtree, Inter, sans-serif;
  font-weight: 800;
  font-size: 17px;
  color: #020618;
}
.mark {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #ff6900;
}
.nav {
  display: flex;
  gap: 4px;
}
.nav a {
  padding: 6px 14px;
  border-radius: 100px;
  color: #45556c;
  font-weight: 600;
  text-decoration: none;
}
.nav a.current {
  background: #fff7ed;
  color: #7e2a0c;
}
.me {
  margin-left: auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 100px;
  background: #e7e5fc;
  color: #322b78;
  font-size: 12px;
  font-weight: 700;
}
.main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 32px 64px;
}
.crumbs {
  margin: 0 0 8px;
  color: #62748e;
  font-size: 12px;
}
.heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
h1 {
  margin: 0;
  font-family: Figtree, Inter, sans-serif;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
  color: #020618;
}
.sub {
  margin: 4px 0 0;
  color: #45556c;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  height: 40px;
  padding: 0 18px;
  border-radius: 100px;
  font: 600 14px/20px Inter, sans-serif;
  cursor: pointer;
}
.btn.secondary {
  border: 1px solid #dcdce9;
  background: #fff;
  color: #322b78;
}
.btn.primary {
  border: 1px solid #ffd2ad;
  background: #fff7ed;
  color: #7e2a0c;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat {
  padding: 20px 24px;
  border: 1px solid #dcdce9;
  border-radius: 24px;
  background: #fff;
}
.stat.warn {
  background: #fffbeb;
  border-color: #fde4b8;
}
.stat-label {
  margin: 0;
  color: #45556c;
  font-weight: 600;
}
.stat-value {
  margin: 6px 0 0;
  font-family: Figtree, Inter, sans-serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  color: #020618;
}
.stat-value span {
  font-size: 14px;
  color: #62748e;
  font-weight: 600;
}
.card {
  border: 1px solid #dcdce9;
  border-radius: 24px;
  background: #fff;
  overflow: hidden;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
}
h2 {
  margin: 0;
  font-family: Figtree, Inter, sans-serif;
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  color: #020618;
}
.search {
  width: 220px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #dcdce9;
  border-radius: 100px;
  font: inherit;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  padding: 10px 24px;
  border-top: 1px solid #e2e8f0;
  color: #62748e;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}
td {
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #020618;
}
.face {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 100px;
  background: #f1f5f9;
  color: #45556c;
  font-size: 11px;
}
.bar {
  display: block;
  width: 140px;
  height: 8px;
  border-radius: 100px;
  background: #f1f5f9;
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  border-radius: 100px;
  background: #ff6900;
}
.status {
  padding: 2px 10px;
  border-radius: 100px;
  background: #f0f7ea;
  color: #3b5e1f;
  font-size: 12px;
  font-weight: 600;
}
.status.help {
  background: #fffbeb;
  color: #8a4500;
}
</style>
