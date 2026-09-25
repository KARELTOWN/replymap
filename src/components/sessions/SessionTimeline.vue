<template>
  <!-- Errors and steps of the path, placed on the timeline of the replay.
       They used to be thrown on screen all at once, in floating boxes that
       disappeared after two seconds: nothing said when each one happened, and
       a burst of them hid the recording. Here each one appears when the replay
       reaches it, stays readable, and takes the player back to its moment when
       clicked. -->
  <div class="flex items-stretch gap-0">
    <!-- A tab on the edge, and the panel slides out from it: the list is only
         needed while looking for something, and it took a third of the width
         at all times. -->
    <button type="button" @click="toggle" :aria-expanded="open"
      class="flex w-9 shrink-0 flex-col items-center justify-center gap-2 rounded-l-2xl border border-r-0 border-gray-200 bg-white py-3 text-gray-600 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]">
      <svg class="h-4 w-4 transition-transform" :class="open ? '' : 'rotate-180'" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
      <span class="text-[11px] font-semibold [writing-mode:vertical-rl]">Ce qui s'est passé</span>
      <span v-if="events.length"
        class="rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{{ events.length }}</span>
    </button>

    <aside
      class="flex max-h-[520px] min-h-[220px] flex-col overflow-hidden rounded-r-2xl border border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-white/[0.03]"
      :class="open ? 'w-full opacity-100 xl:w-[320px]' : 'w-0 border-0 opacity-0'">
    <header class="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
      <h3 class="whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white/90">Ce qui s'est passé</h3>
      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
        {{ events.length }}
      </span>
    </header>

    <p v-if="events.length === 0" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Aucune erreur ni clic répété pendant cette session.
    </p>

    <ol v-else ref="list" class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
      <li v-for="(event, index) in events" :key="index" :ref="(el) => setItemRef(el, index)">
        <button type="button" @click="$emit('seek', event.offset)"
          class="w-full rounded-xl border px-3 py-2.5 text-left transition"
          :class="itemClass(index, event)">
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 shrink-0 rounded-full" :class="dotClass(event.tag)"></span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-white/90">
              {{ titleOf(event.tag) }}
            </span>
            <span class="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
              {{ formatOffset(event.offset) }}
            </span>
          </div>

          <dl v-if="isRevealed(index)" class="mt-1.5 space-y-0.5">
            <div v-for="line in detailsOf(event)" :key="line.label" class="flex gap-1.5 text-xs">
              <dt class="shrink-0 text-gray-500 dark:text-gray-400">{{ line.label }}</dt>
              <dd class="min-w-0 break-words text-gray-700 dark:text-gray-300">{{ line.value }}</dd>
            </div>
          </dl>
          <p v-else class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            À {{ formatOffset(event.offset) }} de lecture
          </p>
        </button>
      </li>
    </ol>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface TimelineEvent {
  tag: string
  offset: number
  payload: Record<string, unknown>
}

const props = defineProps<{
  events: TimelineEvent[]
  currentTime: number
}>()

defineEmits<{ (e: 'seek', offset: number): void }>()

// An event stays "current" for a few seconds after it happened, long enough to
// be read without freezing the panel on it.
const HIGHLIGHT_MS = 4000

const STORAGE_KEY = 'bugreveal_session_timeline_open'

const open = ref(localStorage.getItem(STORAGE_KEY) !== 'closed')

const toggle = () => {
  open.value = !open.value
  localStorage.setItem(STORAGE_KEY, open.value ? 'open' : 'closed')
}

const list = ref<HTMLElement | null>(null)
const items = ref<HTMLElement[]>([])

const setItemRef = (el: unknown, index: number) => {
  if (el) items.value[index] = el as HTMLElement
}

const isRevealed = (index: number) => props.currentTime >= props.events[index].offset

const activeIndex = computed(() => {
  let found = -1
  props.events.forEach((event, index) => {
    if (props.currentTime >= event.offset && props.currentTime - event.offset <= HIGHLIGHT_MS) {
      found = index
    }
  })
  return found
})

// The panel follows the replay instead of asking the reader to look for the
// line that just lit up.
watch(activeIndex, async (index) => {
  if (index < 0) return
  if (!open.value) return
  await nextTick()
  items.value[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

const TITLES: Record<string, string> = {
  'network-error': 'Requête en échec',
  'runtime_errors': 'Erreur JavaScript',
  'unhandled-promise-rejection': 'Promesse rejetée',
  'page-view': 'Page vue',
  'form-submit': 'Formulaire envoyé',
  'form-error': 'Formulaire refusé',
}

const titleOf = (tag: string) => TITLES[tag] ?? 'Événement'

const dotClass = (tag: string) =>
  ({
    'network-error': 'bg-error-500',
    runtime_errors: 'bg-orange-400',
    'unhandled-promise-rejection': 'bg-blue-light-500',
    'page-view': 'bg-gray-400',
    'form-submit': 'bg-blue-light-500',
    'form-error': 'bg-orange-400',
  })[tag] ?? 'bg-gray-400'

const itemClass = (index: number, event: TimelineEvent) => {
  if (index === activeIndex.value) {
    return 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-500/40 dark:bg-brand-500/10'
  }
  if (props.currentTime >= event.offset) {
    return 'border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800 dark:bg-transparent'
  }
  return 'border-dashed border-gray-200 bg-gray-50/60 opacity-60 hover:opacity-100 dark:border-gray-800 dark:bg-white/[0.02]'
}

const detailsOf = (event: TimelineEvent) => {
  const payload = (event.payload ?? {}) as Record<string, string | number>
  const line = (label: string, value: unknown) =>
    value === undefined || value === null || value === '' ? null : { label, value: String(value) }

  const lines = {
    'network-error': [line('URL', payload.page_url), line('Méthode', payload.method), line('Statut', payload.status)],
    runtime_errors: [line('Message', payload.message), line('Fichier', payload.filename), line('Ligne', payload.line)],
    'unhandled-promise-rejection': [line('Message', payload.message), line('URL', payload.page_url)],
    'page-view': [line('Page', payload.title || payload.page_url), line('Venant de', payload.from)],
    'form-submit': [
      line('Formulaire', payload.form_id || payload.label || payload.form),
      line('Bouton', payload.submit_id || payload.submit_label || payload.submit),
      line('Page', payload.page_url),
    ],
    'form-error': [
      line('Formulaire', payload.label || payload.form),
      line('Champs refusés', payload.count),
    ],
  }[event.tag] ?? [line('Détail', JSON.stringify(payload).slice(0, 120))]

  return lines.filter(Boolean) as { label: string; value: string }[]
}

const formatOffset = (offset: number) => {
  const totalSeconds = Math.max(0, Math.floor(offset / 1000))
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
</script>
