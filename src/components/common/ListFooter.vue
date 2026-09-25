<template>
    <div v-if="total > 0"
        class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ rangeLabel }}
        </p>
        <Pagination v-if="totalPages > 1" :paginator="paginator" :current_page="currentPage" :totalPages="totalPages"
            @page-change="(page: number) => $emit('page-change', page)" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Pagination from '@/components/pagination/Pagination.vue'

// Shared list footer: the three listing screens lined up the pagination and a
// bold "Total: 42" in a two-column grid, each with its own layout.
const props = defineProps<{
    paginator: unknown
    total: number
    currentPage: number
    limit: number
    totalPages: number
}>()

defineEmits<{ (e: 'page-change', page: number): void }>()

// Say what is shown, not only the total: on a paginated list, the total alone
// does not tell where you are.
const rangeLabel = computed(() => {
    const first = (props.currentPage - 1) * props.limit + 1
    const last = Math.min(props.currentPage * props.limit, props.total)
    if (props.total <= props.limit) {
        return `${props.total} résultat${props.total > 1 ? 's' : ''}`
    }
    return `${first} à ${last} sur ${props.total}`
})
</script>
