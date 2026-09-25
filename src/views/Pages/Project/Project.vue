<template>
  <AdminLayout>
    <PageHeader title="Projets"
      description="Les sites que vous suivez. Chaque projet porte son script de suivi et ses membres.">
      <template #actions>
        <button type="button" @click="open()"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          Ajouter un projet
        </button>
      </template>
    </PageHeader>

    <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <SearchPanel />

      <div class="mt-5">
        <CardSkeleton v-if="loading" :count="3" />
        <EmptyState v-else-if="projects.length === 0" title="Aucun projet pour le moment"
          description="Créez un projet pour obtenir votre script de suivi et commencer à recueillir des retours.">
          <template #action>
            <button type="button" @click="open()"
              class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600">
              Ajouter un projet
            </button>
          </template>
        </EmptyState>
        <ProjectList v-else />
      </div>

      <ListFooter :paginator="projects" :total="total" :current-page="page" :limit="limit" :total-pages="totalPages"
        @page-change="fetchNext" />
    </div>

    <CreateProject :open="openModal" @close="close" />
    <InviteMember :open="openModalInvitation" @close="closeInviteModal" />
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/components/layout/AdminLayout.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import CardSkeleton from "@/components/common/CardSkeleton.vue";
import ListFooter from "@/components/common/ListFooter.vue";
import ProjectList from "@/components/projects/ProjectList.vue";
import CreateProject from '@/components/projects/CreateProject.vue'
import InviteMember from "@/components/projects/InviteMember.vue";
import SearchPanel from '@/components/projects/SearchPanel.vue'
import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

const store = projectStore()
const {
  errors,
  projects,
  total,
  page,
  limit,
  totalPages,
  loading,
  selectProject,
  openModal,
  openModalInvitation,
} = storeToRefs(store)
const { getProjects } = store

// The page owns the loading, like Sessions and Events: the list component
// only displays, so it can be hidden while the skeleton shows.
onMounted(() => getProjects())

const fetchNext = async (nextpage: number) => {
  page.value = nextpage
  await getProjects()
}

const open = () => {
  errors.value = {}
  selectProject.value = ''
  openModal.value = true
}

const close = () => {
  selectProject.value = ''
  openModal.value = false
}

const closeInviteModal = () => {
  selectProject.value = ''
  openModalInvitation.value = false
}
</script>
