<template>
  <!-- The visitor's path, played rather than listed: one page view per row
         in a table does not tell you that Home is a crossroads, nor that
         Countries is a dead end. -->
  <section
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
  >
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Parcours du visiteur</h4>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Pages traversées et formulaires envoyés, dans l'ordre.
        </p>
      </div>

      <div v-if="steps.length" class="flex items-center gap-2">
        <button type="button" @click="toggle" :class="controlClass">
          {{ playing ? 'Pause' : finished ? 'Rejouer' : 'Lire' }}
        </button>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ Math.min(stepIndex + 1, steps.length) }} / {{ steps.length }}
        </span>
      </div>
    </header>

    <div
      v-if="loading"
      class="h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]"
    ></div>

    <p
      v-else-if="!steps.length"
      class="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
    >
      Aucune page n'a été enregistrée pour cette session.
    </p>

    <template v-else>
      <div class="overflow-x-auto">
        <svg
          :viewBox="`0 0 ${board.width} ${board.height}`"
          class="w-full min-w-[520px]"
          :style="{ height: `${board.height * 0.62}px` }"
          role="img"
          aria-label="Graphe du parcours du visiteur"
        >
          <!-- Edges first: they run underneath the pages. -->
          <g>
            <path
              v-for="edge in laidOutEdges"
              :key="edge.key"
              :d="edge.d"
              fill="none"
              :stroke="edge.travelled ? 'var(--flow-live)' : 'var(--flow-line)'"
              :stroke-width="edge.travelled ? 3.5 : 2.5"
              stroke-linecap="round"
            />
            <path
              v-for="edge in laidOutEdges"
              :key="`head-${edge.key}`"
              :d="edge.head"
              :fill="edge.travelled ? 'var(--flow-live)' : 'var(--flow-line)'"
            />
          </g>

          <!-- Then the pages. -->
          <g v-for="node in laidOutNodes" :key="node.id">
            <rect
              :x="node.x - NODE_W / 2"
              :y="node.y - NODE_H / 2"
              :width="NODE_W"
              :height="NODE_H"
              rx="14"
              :fill="nodeFill(node)"
              :stroke="nodeStroke(node)"
              stroke-width="2.5"
            />
            <text
              :x="node.x"
              :y="node.y - 8"
              text-anchor="middle"
              class="fill-gray-400 text-[11px] font-semibold uppercase tracking-widest"
            >
              {{ node.kicker }}
            </text>
            <text
              :x="node.x"
              :y="node.y + 14"
              text-anchor="middle"
              :class="
                node.id === activeNode
                  ? 'fill-gray-900 dark:fill-white text-[15px] font-semibold'
                  : 'fill-gray-500 dark:fill-gray-300 text-[15px] font-semibold'
              "
            >
              {{ node.short }}
            </text>

            <!-- A page seen again carries its counter, like a crossroads. -->
            <g v-if="node.visits > 1">
              <circle
                :cx="node.x + NODE_W / 2 - 6"
                :cy="node.y - NODE_H / 2 + 6"
                r="14"
                fill="var(--flow-live)"
              />
              <text
                :x="node.x + NODE_W / 2 - 6"
                :y="node.y - NODE_H / 2 + 11"
                text-anchor="middle"
                class="fill-white text-[12px] font-bold"
              >
                ×{{ node.visits }}
              </text>
            </g>

            <!-- A form sent from this page. -->
            <g v-if="node.forms > 0">
              <circle
                :cx="node.x - NODE_W / 2 + 6"
                :cy="node.y + NODE_H / 2 - 6"
                r="13"
                fill="var(--flow-form)"
              />
              <path
                :d="`M${node.x - NODE_W / 2 + 1} ${node.y + NODE_H / 2 - 6} l10 -5 -3.5 5 3.5 5 z`"
                fill="#fff"
              />
            </g>
          </g>

          <!-- The visitor. -->
          <circle
            v-if="cursor"
            :cx="cursor.x"
            :cy="cursor.y"
            r="18"
            fill="var(--flow-live)"
            :opacity="0.25"
          />
          <circle
            v-if="cursor"
            :cx="cursor.x"
            :cy="cursor.y"
            r="8"
            fill="var(--flow-live)"
            stroke="#fff"
            stroke-width="3"
          />
        </svg>
      </div>

      <!-- What happens at the current step, spelled out. -->
      <div class="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ caption.kicker }}
        </p>
        <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ caption.title }}
        </p>
        <p v-if="caption.detail" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ caption.detail }}
        </p>
      </div>

      <ol
        class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
      >
        <li v-for="(step, index) in steps" :key="index" class="flex items-center gap-2">
          <button
            type="button"
            @click="jumpTo(index)"
            :class="
              index === stepIndex
                ? 'font-semibold text-brand-500'
                : index < stepIndex
                  ? 'text-gray-600 dark:text-gray-300'
                  : ''
            "
            class="hover:underline"
          >
            {{ step.kind === 'form' ? '⏎ ' : '' }}{{ nodeLabel(step.node) }}
          </button>
          <span v-if="index < steps.length - 1" aria-hidden="true">→</span>
        </li>
      </ol>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { sessionStore } from '@/stores/session/sessionStore'
import { NODE_H, NODE_W, boardSize, layOutEdges, layOutNodes } from './sessionFlowLayout'

// A step is a move followed by a pause, so there is time to read where the
// visitor has just landed.
const MOVE_MS = 1000
const PAUSE_MS = 600
const FORM_MS = 900

const controlClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]'

const route = useRoute()
const store = sessionStore()
const { flow, flowLoading } = storeToRefs(store)
const { getFlow } = store

const loading = computed(() => flowLoading.value)
const steps = computed<any[]>(() => flow.value?.steps ?? [])

const sessionId = computed(() => String(route.query.session ?? ''))
onMounted(() => sessionId.value && getFlow(sessionId.value))
watch(sessionId, (id) => id && getFlow(id))

// --- Layout ---------------------------------------------------------------
const laidOutNodes = computed(() => layOutNodes(flow.value?.nodes ?? []))
const board = computed(() => boardSize(laidOutNodes.value.length))

const nodeAt = (id: string) => laidOutNodes.value.find((node) => node.id === id)
const nodeLabel = (id: string) => nodeAt(id)?.short ?? id

const laidOutEdges = computed(() =>
  layOutEdges(flow.value?.edges ?? [], nodeAt, (key) => travelled.value.has(key)),
)

// --- Animation ------------------------------------------------------------
const elapsed = ref(0)
const playing = ref(false)
let frame: number | null = null
let last = 0

const durationOf = (step: any) => (step.kind === 'form' ? FORM_MS : MOVE_MS + PAUSE_MS)

const timeline = computed(() => {
  let at = 0
  return steps.value.map((step) => {
    const start = at
    at += durationOf(step)
    return { step, start, end: at }
  })
})

const total = computed(() => timeline.value[timeline.value.length - 1]?.end ?? 0)
const finished = computed(() => elapsed.value >= total.value && total.value > 0)

const position = computed(() => {
  const slots = timeline.value
  if (!slots.length) return { index: 0, progress: 1 }

  const index = slots.findIndex((slot) => elapsed.value < slot.end)
  if (index === -1) return { index: slots.length - 1, progress: 1 }

  const slot = slots[index]
  const moved = Math.min(1, (elapsed.value - slot.start) / MOVE_MS)
  return { index, progress: slot.step.kind === 'form' ? 1 : moved }
})

const stepIndex = computed(() => position.value.index)
const activeStep = computed(() => steps.value[stepIndex.value] ?? null)
const activeNode = computed(() =>
  position.value.progress >= 1 || !activeStep.value?.from ? activeStep.value?.node : null,
)

// Edges already travelled stay lit behind the visitor.
const travelled = computed(() => {
  const seen = new Set<string>()
  steps.value.forEach((step, index) => {
    if (step.kind !== 'page' || !step.from) return
    if (index < stepIndex.value || (index === stepIndex.value && position.value.progress >= 1)) {
      seen.add(`${step.from}->${step.node}`)
    }
  })
  return seen
})

const visited = computed(() => {
  const seen = new Set<string>()
  steps.value.slice(0, stepIndex.value + 1).forEach((step) => seen.add(step.node))
  return seen
})

const cursor = computed(() => {
  const step = activeStep.value
  if (!step) return null
  const to = nodeAt(step.node)
  if (!to) return null

  const from = step.kind === 'page' && step.from ? nodeAt(step.from) : null
  if (!from || position.value.progress >= 1) return { x: to.x, y: to.y }

  const eased =
    position.value.progress < 0.5
      ? 2 * position.value.progress ** 2
      : 1 - (-2 * position.value.progress + 2) ** 2 / 2
  return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased }
})

const nodeFill = (node: any) =>
  node.id === activeNode.value ? 'var(--flow-node-active)' : 'var(--flow-node)'
const nodeStroke = (node: any) => {
  if (node.id === activeNode.value) return 'var(--flow-live)'
  return visited.value.has(node.id) ? 'var(--flow-seen)' : 'var(--flow-line)'
}

const caption = computed(() => {
  const step = activeStep.value
  if (!step) return { kicker: '', title: '', detail: '' }

  if (step.kind === 'form') {
    return {
      kicker: 'Formulaire envoyé',
      title: `Depuis ${nodeLabel(step.node)}`,
      detail: [
        step.form ? `formulaire ${step.form}` : null,
        step.submit ? `bouton ${step.submit}` : null,
        step.page_url,
      ]
        .filter(Boolean)
        .join(' · '),
    }
  }
  if (!step.from) {
    return {
      kicker: 'Arrivée sur le site',
      title: `Entrée par ${nodeLabel(step.node)}`,
      detail: nodeAt(step.node)?.url ?? '',
    }
  }
  return {
    kicker: `Étape ${stepIndex.value + 1} sur ${steps.value.length}`,
    title: `${nodeLabel(step.from)} → ${nodeLabel(step.node)}`,
    detail: nodeAt(step.node)?.url ?? '',
  }
})

const tick = (now: number) => {
  if (last) elapsed.value = Math.min(total.value, elapsed.value + (now - last))
  last = now
  if (elapsed.value >= total.value) {
    playing.value = false
    frame = null
    return
  }
  frame = requestAnimationFrame(tick)
}

const start = () => {
  if (frame !== null) return
  last = 0
  playing.value = true
  frame = requestAnimationFrame(tick)
}

const stop = () => {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  playing.value = false
}

const toggle = () => {
  if (playing.value) return stop()
  if (finished.value) elapsed.value = 0
  start()
}

const jumpTo = (index: number) => {
  stop()
  elapsed.value = timeline.value[index]?.end ? timeline.value[index].end - PAUSE_MS / 2 : 0
}

// The path plays itself once when it arrives: this is an explanation, not a
// decorative loop.
watch(steps, (list) => {
  stop()
  elapsed.value = 0
  if (list.length > 1) start()
})

onBeforeUnmount(stop)
</script>

<style scoped>
section {
  --flow-line: #d1d5db;
  --flow-seen: #9ca3af;
  --flow-live: #465fff;
  --flow-form: #f59e0b;
  --flow-node: #ffffff;
  --flow-node-active: #eef2ff;
}

:global(.dark) section {
  --flow-line: #374151;
  --flow-seen: #4b5563;
  --flow-node: #111827;
  --flow-node-active: #1e2a5a;
}
</style>
