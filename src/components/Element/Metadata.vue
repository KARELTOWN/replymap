<template>
    <!-- A definition list rather than a three-column grid: a user agent string
         is long, and it used to push the panel into a horizontal scroll. Long
         values wrap, short ones sit two per row. -->
    <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <div v-for="entry in entries" :key="entry.label" :class="entry.wide ? 'sm:col-span-2' : ''">
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ entry.label }}</dt>
            <dd class="mt-0.5 break-words text-sm font-medium text-gray-800 dark:text-white/90"
                :class="entry.small ? 'font-normal text-xs leading-relaxed text-gray-600 dark:text-gray-400' : ''">
                {{ entry.value }}
            </dd>
        </div>
    </dl>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    metadata: Object,
    user_agent: Boolean,
    localization: Boolean,
    url: String,
})

const dash = (value) => (value === undefined || value === null || value === '' ? '—' : value)

const entries = computed(() => {
    const data = props.metadata ?? {}
    const rows = []

    if (props.url) rows.push({ label: 'Page', value: props.url, wide: true })

    if (props.user_agent) {
        const screen =
            data.width && data.height ? `${data.width} × ${data.height}` : '—'
        const viewport =
            data.viewport_width && data.viewport_height
                ? `${data.viewport_width} × ${data.viewport_height}`
                : '—'

        rows.push(
            { label: 'Écran', value: screen },
            { label: 'Fenêtre', value: viewport },
            { label: 'Langue', value: dash(data.language) },
            { label: 'Fuseau horaire', value: dash(data.timezone) },
            { label: 'Ratio pixels', value: dash(data.device_pixel_ratio) },
            { label: 'Référent', value: dash(data.referrer) },
            { label: 'Navigateur', value: dash(data.user_agent), wide: true, small: true },
        )
    }

    if (props.localization) {
        const place = data.localization ?? {}
        rows.push(
            { label: 'Pays', value: dash(place.country) },
            { label: 'Région', value: dash(place.region) },
            { label: 'Ville', value: dash(place.city) },
            { label: 'Fuseau horaire', value: dash(place.timezone) },
        )
    }

    return rows
})
</script>
