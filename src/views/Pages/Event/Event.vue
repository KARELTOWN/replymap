<template>
    <AdminLayout>
        <PageHeader title="Événements"
            description="Erreurs, requêtes lentes et comportements anormaux détectés sur vos projets." />

        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <SearchPanel />

            <div class="mt-5">
                <TableSkeleton v-if="loading" :columns="5" />
                <EmptyState v-else-if="events.length === 0" title="Aucun événement détecté"
                    description="Bonne nouvelle : rien d'anormal n'a été remonté sur vos projets pour ces critères." />
                <EventList v-else />
            </div>

            <ListFooter :paginator="events" :total="total" :current-page="page" :limit="limit" :total-pages="totalPages"
                @page-change="fetchNext" />
        </div>
    </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import TableSkeleton from "@/components/common/TableSkeleton.vue";
import ListFooter from "@/components/common/ListFooter.vue";
import EventList from "@/components/events/EventList.vue";
import SearchPanel from '@/components/events/SearchPanel.vue'
import { eventStore } from "@/stores/event/eventStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const store = eventStore()
const { events, total, page, limit, totalPages, loading } = storeToRefs(store)
const { getEvents } = store

onMounted(() => getEvents())

const fetchNext = async (nextpage: number) => {
    page.value = nextpage
    await getEvents()
}
</script>
