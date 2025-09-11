<template>
  <router-link to="/" class="lg:hidden">
    <img class="dark:hidden" width="120" src="/images/logo/logo.png" alt="Logo" />
    <img class="hidden dark:block" width="120" src="/images/logo/auth-logo.png" alt="Logo" />
  </router-link>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
