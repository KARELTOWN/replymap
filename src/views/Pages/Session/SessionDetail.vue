<template>
    <admin-layout>
        <PageHeader title="Détail de la session"
            description="Rejouez le parcours du visiteur et consultez les informations techniques associées.">
            <template #actions>
                <router-link to="/sessions"
                    class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    Toutes les sessions
                </router-link>
            </template>
        </PageHeader>

        <!-- What the session was, before how it played: which visitor, on which
             project, when, and for how long. These facts used to be buried in a
             metadata grid under the player. -->
        <dl class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div v-for="fact in facts" :key="fact.label"
                class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ fact.label }}</dt>
                <dd class="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90" :title="fact.value">
                    {{ fact.value }}
                </dd>
            </div>
        </dl>

        <!-- No card around the player: it carries its own frame now, and two
             borders one inside the other read as a mistake. -->
        <div class="mt-6">
            <SessionPlayer />
        </div>

        <div class="mt-6">
            <SessionFlow />
        </div>

        <div class="mt-6">
            <SessionInfo />
        </div>
    </admin-layout>
</template>

<script setup lang="ts">
// Detail page with no way back to the list: the side menu was the only way
// back to the sessions.
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import moment from 'moment'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SessionInfo from '@/components/sessions/SessionInfo.vue'
import SessionPlayer from '@/components/sessions/SessionPlayer.vue'
import SessionFlow from '@/components/sessions/SessionFlow.vue'
import { sessionStore } from '@/stores/session/sessionStore'

const { session } = storeToRefs(sessionStore())

const duration = computed(() => {
    const start = session.value?.startedAt
    const end = session.value?.endedAt
    if (!start || !end) return 'En cours'

    const seconds = moment(end).diff(moment(start), 'seconds')
    if (seconds < 60) return `${seconds} s`
    return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
})

const facts = computed(() => [
    { label: 'Session', value: session.value?.uniqueId ?? '—' },
    { label: 'Projet', value: session.value?.project_id?.libelle ?? '—' },
    {
        label: 'Début',
        value: session.value?.startedAt
            ? moment(session.value.startedAt).format('DD/MM/YYYY HH:mm:ss')
            : '—',
    },
    { label: 'Durée', value: duration.value },
])
</script>
