<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Projets">
        <div>
          <button type="button" @click="open()"
            class="flex items-center justify-center w-64 px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
            Ajouter un projet
          </button>
        </div>
        <div>
          <SearchPanel />
        </div>
        <ProjectList />
        <div class="grid grid-cols-2">
          <div>
            <Pagination :paginator="projects" :current_page="page" :totalPages="totalPages" @page-change="fetchNext" />
          </div>
          <div>
            <strong>Total : </strong> {{ total }}
          </div>

        </div>
        <CreateProject :open="openModal" @close="close" />
        <InviteMember :open="openModalInvitation" @close="closeInviteModal" />

      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from "vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ComponentCard from "@/components/common/ComponentCard.vue";
import ProjectList from "@/components/projects/ProjectList.vue";
const currentPageTitle = ref("Projets");
import CreateProject from '@/components/projects/CreateProject.vue'
import InviteMember from "@/components/projects/InviteMember.vue";
import SearchPanel from '@/components/projects/SearchPanel.vue'
import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
import Pagination from "@/components/pagination/Pagination.vue";
const store = projectStore()
const { errors,
  projects,
  total,
  page,
  limit,
  totalPages, selectProject, openModal, openModalInvitation } = storeToRefs(store)
const { getProjects } = store

const fetchNext = async (nextpage) => {
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
