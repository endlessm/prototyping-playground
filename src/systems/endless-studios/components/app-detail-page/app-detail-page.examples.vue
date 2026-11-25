<!--
  AppDetailPage as the profile page fills it: a cover, the person's card in the sidebar, tabs, then the tab's
  content. Every part is a slot, so each example shows which slots change the layout.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import cover from '~/assets/images/profile-cover.svg';
import UserProfileCard from '~/components/Profile/UserProfileCard.vue';
import AppDetailPage from './app-detail-page.vue';

// Maya Flores (demo), the happy-path youth with consent, from the demo cast.
const maya = {
  id: 302, username: 'SunnyOtter512', email: 'sunnyotter512@example.org', first_name: 'Maya', last_name: 'Flores',
  full_name: 'Maya', public: true, age_category: 'digital_youth', has_parental_consent: true,
  created_at: '2026-03-02T15:00:00.000Z', joinedProjectsCount: 1, certificatesCount: 0, roles: [],
  metadata: { image_url: null, interests: [{ id: 1, name: 'Pixel art' }, { id: 2, name: 'Level design' }] },
};

const tabs = [
  { label: 'Overview', active: true },
  { label: 'Skills' },
  { label: 'Certificates' },
  { label: 'Games' },
];
</script>

<template>
  <Example name="Default">
    <AppDetailPage>
      <template #cover>
        <img :src="cover" alt="" class="w-full h-52 object-cover rounded-3xl" />
      </template>
      <template #sidebar>
        <UserProfileCard :user="maya" :can-edit="false" />
      </template>
      <template #navigation>
        <UNavigationMenu color="neutral" variant="pill" :items="tabs" />
      </template>
      <UCard>
        <p class="text-muted">Pixel artist in training. Building a platformer about a lost otter.</p>
      </UCard>
    </AppDetailPage>
  </Example>

  <Example name="WithBanner">
    <AppDetailPage>
      <template #banner>
        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-eye-off"
          :title="$t('profile_visibility.private_profile_message')"
          :actions="[{ label: $t('profile_visibility.make_public'), color: 'info' }]"
        />
      </template>
      <template #cover>
        <img :src="cover" alt="" class="w-full h-52 object-cover rounded-3xl" />
      </template>
      <template #sidebar>
        <UserProfileCard :user="{ ...maya, public: false }" :can-edit="true" />
      </template>
      <UCard>
        <p class="text-muted">Pixel artist in training. Building a platformer about a lost otter.</p>
      </UCard>
    </AppDetailPage>
  </Example>

  <Example name="PrivateProfile">
    <AppDetailPage>
      <template #sidebar>
        <UserProfileCard :user="{ ...maya, public: false }" :can-edit="false" minimal />
      </template>
      <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <UIcon name="i-lucide-eye-off" size="3rem" class="text-highlighted" />
        <p class="text-2xl font-bold text-muted">{{ $t('profile_visibility.private_profile_message') }}</p>
      </div>
    </AppDetailPage>
  </Example>

  <Example name="ContentOnly">
    <AppDetailPage>
      <template #navigation>
        <UNavigationMenu color="neutral" variant="pill" :items="tabs" />
      </template>
      <UCard>
        <p class="text-muted">Without a cover or sidebar, the content takes the container's full width.</p>
      </UCard>
    </AppDetailPage>
  </Example>
</template>
