<template>
    <admin-layout>
        <PageBreadcrumb :pageTitle="currentPageTitle" />

        <div
            class="grid grid-row-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div class="my-5 w-auto">
                <SessionPlayer />
            </div>
            <SessionInfo />
        </div>
    </admin-layout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { ref } from 'vue'
import SessionInfo from '@/components/sessions/SessionInfo.vue'
import SessionPlayer from '@/components/sessions/SessionPlayer.vue'
const currentPageTitle = ref('Détail Session')
</script>
