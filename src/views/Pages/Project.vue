<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Projets">
        <div>
          <button type="button" @click="openModal = true"
            class="flex items-center justify-center w-64 px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
            Ajouter un projet
          </button>
        </div>
        <div>
          <SearchPanel />
        </div>
        <ProjectList />
        <CreateProject :open="openModal" @close="openModal = false" />
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
import SearchPanel from '@/components/projects/SearchPanel.vue'
const openModal = ref(false)
import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
const store = projectStore()
const { errors,
  projects,
  total,
  page,
  limit,
  totalPages } = storeToRefs(store)
const { getProjects } = store

</script>
