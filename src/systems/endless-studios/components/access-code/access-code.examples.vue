<!--
  The home page's access-code card. Signed in, its button emits `open` and the home page opens the enrollment-code
  modal; signed out, it asks to log in. `user` here only lets one page show both.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import AccessCode from './access-code.vue';
</script>

<template>
  <Example name="Default">
    <div class="w-60">
      <AccessCode
        title="Access Code"
        description="If you are part of a program or a game, you can access it here."
        button-text="I have a code"
      />
    </div>
  </Example>

  <Example name="SignedOut">
    <div class="w-60">
      <AccessCode
        :title="$t('access_code')"
        :description="$t('access_code_if_you_are_part_of_a_program')"
        :button-text="$t('i_have_a_code')"
        :user="null"
      />
    </div>
  </Example>
</template>
