<template>
  <!-- The sidebar takes the flow from `lg`, the same width at which the
       content is pushed by its margin. Switching only at `xl` left a 290px
       gap between 1024px and 1280px: the page scrolled sideways. -->
  <div class="min-h-screen lg:flex">
    <app-sidebar />
    <Backdrop />
    <div
      class="min-w-0 flex-1 transition-all duration-300 ease-in-out"
      :class="[isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />
      <div class="mx-auto max-w-(--breakpoint-2xl) overflow-x-hidden p-4 md:p-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useSidebar } from '@/composables/useSidebar'
import Backdrop from './Backdrop.vue'
const { isExpanded, isHovered } = useSidebar()
</script>
