<template>
    <!-- The whole row opens the replay: an eye button in a last column made the
         target smaller than the row it belonged to. The duration is read as a
         duration (1 min 45 s), not rounded to minutes, where every session
         shorter than a minute showed "0". -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th v-for="column in columns" :key="column.label" :class="['px-5 py-3 text-left sm:px-6', column.hide]">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">{{ column.label }}</p>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr v-for="session in sessions" :key="session._id" @click="openDetail(session)"
                        class="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :title="`Rejouer ${session.uniqueId}`">
                        <td class="px-5 py-4 sm:px-6">
                            <span
                                class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                {{ session.uniqueId }}
                            </span>
                        </td>

                        <!-- A session carries a random browser identifier until a
                             feedback comes out of it: then it takes the name of the
                             member who sent it. -->
                        <td class="px-5 py-4 sm:px-6">
                            <p v-if="session.account"
                                class="truncate text-sm font-medium text-gray-800 dark:text-white/90"
                                :title="session.account.email">
                                {{ personName(session.account) }}
                            </p>
                            <p v-else class="truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                                :title="session.user_id">
                                Anonyme · {{ String(session.user_id).slice(0, 8) }}
                            </p>
                        </td>

                        <td class="hidden px-5 py-4 sm:px-6 xl:table-cell">
                            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="session.first_visit === false
                                ? 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
                                : 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'">
                                {{ session.first_visit === false ? 'Déjà venu' : 'Première visite' }}
                            </span>
                        </td>

                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-sm text-gray-700 dark:text-gray-300">{{ day(session.startedAt) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ hour(session.startedAt) }}</p>
                        </td>

                        <td class="hidden px-5 py-4 sm:px-6 md:table-cell">
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                {{ duration(session.startedAt, session.endedAt) }}
                            </p>
                        </td>

                        <td class="hidden px-5 py-4 sm:table-cell sm:px-6">
                            <p class="truncate text-sm text-gray-700 dark:text-gray-300">
                                {{ session.project_id?.libelle }}
                            </p>
                        </td>

                        <td class="px-5 py-4 text-right sm:px-6">
                            <span class="text-xs font-medium text-brand-500">Rejouer →</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import moment from 'moment';
import { useRouter } from 'vue-router';

const store = sessionStore()
const { sessions } = storeToRefs(store)

const columns = [
    { label: 'Session', hide: '' },
    { label: 'Visiteur', hide: '' },
    { label: 'Visite', hide: 'hidden xl:table-cell' },
    { label: 'Début', hide: '' },
    { label: 'Durée', hide: 'hidden md:table-cell' },
    { label: 'Projet', hide: 'hidden sm:table-cell' },
    { label: '', hide: '' },
]

const personName = (account) =>
    `${account.firstname ?? ''} ${account.lastname ?? ''}`.trim() || account.email

const day = (date) => (date ? moment(date).format('DD/MM/YYYY') : '—')
const hour = (date) => (date ? moment(date).format('HH:mm:ss') : '')

const duration = (start, end) => {
    if (!start || !end) return 'En cours'

    const seconds = moment(end).diff(moment(start), 'seconds')
    if (seconds < 60) return `${seconds} s`
    return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
}

const router = useRouter()

const openDetail = (session) => {
    router.push({
        path: '/session/detail',
        query: { project: session.project_id?._id, session: session._id },
    })
}
</script>
