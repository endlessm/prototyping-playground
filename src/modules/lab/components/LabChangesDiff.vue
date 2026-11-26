<script setup lang="ts">
import { hunkHeader, type ChangeHunk } from '../utils/changes'

// A version's changes, line by line: each hunk under its `@@` line, with the
// original's line number and the version's beside each line, removed lines
// marked − and added ones +, so the marks read without colour too.
defineProps<{ hunks: ChangeHunk[]; label: string }>()
const { t } = useI18n()

const SIGN = { same: ' ', removed: '−', added: '+' } as const
const ROW = {
  same: '',
  removed: 'bg-error/10',
  added: 'bg-success/10',
} as const
</script>

<template>
  <div
    role="region"
    :aria-label="label"
    tabindex="0"
    class="overflow-x-auto rounded-2xl border border-default font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <table class="w-full border-collapse">
      <thead class="sr-only">
        <tr>
          <th scope="col">{{ t('lab.changes.originalLine') }}</th>
          <th scope="col">{{ t('lab.changes.versionLine') }}</th>
          <th scope="col">{{ t('lab.changes.change') }}</th>
          <th scope="col">{{ t('lab.changes.code') }}</th>
        </tr>
      </thead>
      <tbody v-for="(hunk, index) in hunks" :key="index" :data-lab-hunk="index">
        <tr class="bg-elevated text-muted">
          <td colspan="4" class="px-3 py-1">
            {{ hunkHeader(hunk) }}
          </td>
        </tr>
        <tr
          v-for="(line, row) in hunk.lines"
          :key="row"
          :class="ROW[line.kind]"
          :data-lab-change="line.kind"
        >
          <td
            class="w-px px-2 text-right whitespace-nowrap text-dimmed select-none"
          >
            {{ line.before ?? '' }}
          </td>
          <td
            class="w-px px-2 text-right whitespace-nowrap text-dimmed select-none"
          >
            {{ line.after ?? '' }}
          </td>
          <td
            class="w-px px-1 select-none"
            :class="{
              'text-(--ui-color-error-700)': line.kind === 'removed',
              'text-(--ui-color-success-700)': line.kind === 'added',
            }"
          >
            {{ SIGN[line.kind] }}
          </td>
          <td class="pe-3 whitespace-pre text-default">{{ line.text }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
