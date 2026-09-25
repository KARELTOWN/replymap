<template>
    <!-- After creating a project one copies a snippet and nothing ever says it
         arrived. This block answers two questions: what has this project
         received, and is the script really on the page. -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="flex items-start justify-between gap-3 p-4">
            <div class="min-w-0">
                <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="dot"></span>
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ headline }}</p>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ detail }}</p>
            </div>

            <button type="button" @click="runTest" :disabled="testing"
                class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                {{ testing ? 'Test en cours…' : 'Tester' }}
            </button>
        </div>

        <!-- Why nothing arrives, when something is known about it. -->
        <ul v-if="reasons.length" class="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <li v-for="(reason, index) in reasons" :key="index"
                class="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span class="text-warning-500">•</span>
                <span>{{ reason }}</span>
            </li>
        </ul>

        <!-- Where the script actually runs. Un projet déclare un domaine, mais
             le snippet se copie à la main : il finit sur une préproduction, un
             second domaine, parfois un site qui n'était pas prévu.
             Ce bloc est posé sur un fond propre et ses sites sont des lignes
             encadrées : noyé dans la liste des diagnostics, on ne voyait plus
             que c'était un inventaire, ni qu'on pouvait agir dessus. -->
        <section v-if="hosts.length"
            class="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <header class="mb-3 flex items-center justify-between gap-2">
                <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Sites qui envoient des données
                </h4>
                <span
                    class="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500 shadow-theme-xs dark:bg-gray-800 dark:text-gray-400">
                    {{ hosts.length }}
                </span>
            </header>

            <ul class="space-y-2">
                <li v-for="entry in hosts" :key="entry.host"
                    class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                    <div class="flex min-w-0 items-center gap-2">
                        <svg class="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
                            <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"
                                stroke="currentColor" stroke-width="1.6" />
                        </svg>
                        <span class="truncate text-sm font-medium"
                            :class="entry.blocked
                                ? 'text-gray-400 line-through dark:text-gray-500'
                                : 'text-gray-800 dark:text-white/90'"
                            :title="entry.host">{{ entry.host }}</span>
                        <span v-if="entry.blocked"
                            class="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                            désactivé
                        </span>
                        <span v-else-if="entry.accepted === false"
                            class="shrink-0 rounded-full bg-error-50 px-1.5 py-0.5 text-[11px] font-medium text-error-500 dark:bg-error-500/15">
                            refusé
                        </span>
                        <span v-else-if="isDeclared(entry.host)"
                            class="shrink-0 rounded-full bg-success-50 px-1.5 py-0.5 text-[11px] font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                            domaine déclaré
                        </span>
                    </div>

                    <div class="ml-6 flex shrink-0 items-center gap-3 sm:ml-0">
                        <span class="text-[11px] text-gray-500 dark:text-gray-400">
                            vu le {{ when(entry.last_seen_at) }}
                        </span>
                        <!-- Coupe le script sur ce site : il ne démarre plus du
                             tout, widget de feedback compris. -->
                        <button type="button" role="switch" :aria-checked="!entry.blocked"
                            :aria-label="`Collecte sur ${entry.host}`" :title="entry.blocked
                                ? `Réactiver la collecte sur ${entry.host}`
                                : `Désactiver la collecte sur ${entry.host}`"
                            :disabled="hostUpdating === entry.host" @click="toggleHost(entry)"
                            class="relative h-5 w-9 shrink-0 rounded-full transition disabled:opacity-50"
                            :class="entry.blocked ? 'bg-gray-300 dark:bg-gray-700' : 'bg-brand-500'">
                            <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                                :class="entry.blocked ? 'left-0.5' : 'left-4.5'"></span>
                        </button>
                    </div>
                </li>
            </ul>

            <p class="mt-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                Désactiver un site y arrête le script entièrement — enregistrement, évènements et
                widget de feedback — sans toucher aux autres sites.
            </p>
        </section>

        <div v-if="testResult"
            class="border-t border-gray-100 px-4 py-3 text-xs dark:border-gray-800"
            :class="testResult.tone === 'success'
                ? 'text-success-600 dark:text-success-500'
                : testResult.tone === 'warning'
                    ? 'text-warning-600 dark:text-warning-500'
                    : 'text-error-500'">
            {{ testResult.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import moment from 'moment'
import { projectStore } from '@/stores/project/projectStore'

const props = defineProps<{ projectId: string; domain?: string }>()

const store = projectStore()
const { installation, installationLoading, installationTest, installationTesting, hostUpdating } =
    storeToRefs(store)
const { getInstallation, testInstallation, setHostBlocked } = store

const testing = computed(() => installationTesting.value)

onMounted(() => getInstallation(props.projectId))
watch(() => props.projectId, (id) => id && getInstallation(id))

const runTest = () => testInstallation(props.projectId)

const when = (date: string) => moment(date).format('DD/MM/YYYY [à] HH:mm')

const dot = computed(() => {
    if (installationLoading.value || !installation.value) return 'bg-gray-300'
    return {
        receiving: 'bg-success-500',
        idle: 'bg-warning-500',
        waiting: 'bg-gray-400',
    }[installation.value.state as string] ?? 'bg-gray-300'
})

const headline = computed(() => {
    if (installationLoading.value) return 'Vérification de l’installation…'
    if (!installation.value) return 'État de l’installation indisponible'
    return {
        receiving: 'Script détecté, données reçues',
        idle: 'Plus aucune donnée reçue',
        waiting: 'En attente des premières données',
    }[installation.value.state as string] ?? 'État inconnu'
})

const detail = computed(() => {
    const state = installation.value
    if (!state || installationLoading.value) return ' '
    if (state.state === 'waiting') {
        return 'Collez le script avant la balise </body> de votre site, puis visitez une page.'
    }
    const counts = `${state.counts.sessions} session(s), ${state.counts.events} évènement(s)`
    return `Dernière donnée le ${when(state.last_seen_at)} · ${counts}`
})

// One sentence per known cause, in the words of the person who installed the
// script — not the error code the API answers with.
const reasonText = (reason: any): string => {
    switch (reason.code) {
        case 'PROJECT_DISABLED':
            return 'Le projet est inactif : toutes les données envoyées sont refusées.'
        case 'COLLECTION_OFF':
            // Le widget de feedback, lui, tourne quoi qu'il arrive : dire que
            // le script n'envoie plus rien serait faux.
            return 'Toutes les collectes sont coupées : seuls les retours envoyés depuis le widget remontent encore.'
        case 'NO_DOMAIN':
            return 'Aucune adresse de site n’est enregistrée sur ce projet.'
        case 'TRACKING_ORIGIN_REJECTED':
            return `Des données ont été refusées le ${when(reason.at)} : elles venaient de ${reason.host ?? 'un autre domaine'}, alors que le projet déclare ${props.domain ?? 'une autre adresse'}.`
        case 'TRACKING_DISABLED':
            return `Des données ont été refusées le ${when(reason.at)} : le projet était inactif.`
        case 'TRACKING_QUOTA_EXCEEDED':
            return `Des données ont été refusées le ${when(reason.at)} : le plafond d’envois a été atteint.`
        default:
            return `Des données ont été refusées le ${when(reason.at)}.`
    }
}

const reasons = computed(() => (installation.value?.reasons ?? []).map(reasonText))

const hosts = computed(() => installation.value?.hosts ?? [])

// The domain registered on the project, compared host to host: the project
// stores an address, the inventory stores hosts.
const declaredHost = computed(() => {
    const link = installation.value?.domain
    if (!link) return null
    try {
        return new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`).host.toLowerCase()
    } catch {
        return null
    }
})

const isDeclared = (host: string) => declaredHost.value === String(host).toLowerCase()

const toggleHost = (entry: any) =>
    setHostBlocked(props.projectId, entry.host, !entry.blocked)

// The check looks at the HTML the server receives. A script injected later by
// a tag manager will not be there, and saying "not installed" would be wrong.
const testResult = computed(() => {
    const result = installationTest.value
    if (!result) return null

    if (!result.reachable) {
        const message = {
            NO_DOMAIN: 'Renseignez l’adresse du site avant de lancer le test.',
            ADDRESS_REFUSED: 'Cette adresse ne peut pas être vérifiée depuis le serveur (adresse locale ou privée).',
            UNREACHABLE: 'Le site n’a pas répondu. Vérifiez qu’il est en ligne et accessible publiquement.',
        }[result.reason as string] ?? 'Le site n’a pas pu être vérifié.'
        return { tone: 'error', message }
    }

    if (result.script_found && result.project_matched) {
        return { tone: 'success', message: `Script trouvé sur ${result.url}, et rattaché à ce projet.` }
    }
    if (result.script_found) {
        return {
            tone: 'warning',
            message: 'Un script BugReveal est présent, mais il porte l’identifiant d’un autre projet.',
        }
    }
    return {
        tone: 'warning',
        message:
            'Script absent du HTML renvoyé par la page. Si vous l’injectez via un gestionnaire de balises, c’est normal : fiez-vous aux données reçues ci-dessus.',
    }
})
</script>
