<template>
  <AdminLayout>
    <PageHeader title="Sessions"
      description="Les parcours enregistrés sur vos projets. Ouvrez-en un pour le rejouer pas à pas." />

    <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <SearchPanel />

      <div class="mt-5">
        <TableSkeleton v-if="loading" :columns="5" />
        <EmptyState v-else-if="sessions.length === 0" title="Aucune session enregistrée"
          description="Les sessions apparaissent dès que le script de suivi est posé sur votre site et qu'un visiteur le parcourt." />
        <SessionList v-else />
      </div>

      <ListFooter :paginator="sessions" :total="total" :current-page="page" :limit="limit" :total-pages="totalPages"
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
import SessionList from "@/components/sessions/SessionList.vue";
import SearchPanel from '@/components/sessions/SearchPanel.vue'
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const store = sessionStore()
const { sessions, total, page, limit, totalPages, loading } = storeToRefs(store)
const { getSessions } = store

onMounted(() => getSessions())

const fetchNext = async (nextpage: number) => {
  page.value = nextpage
  await getSessions()
}
</script>
