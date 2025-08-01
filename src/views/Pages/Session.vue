<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Sessions">
        <div>
            <SearchPanel />
        </div>
        <SessionList />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from "vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ComponentCard from "@/components/common/ComponentCard.vue";
import SessionList from "@/components/sessions/SessionList.vue";
const currentPageTitle = ref("Sessions");
import SearchPanel from '@/components/sessions/SearchPanel.vue'
const openModal = ref(false)
</script>
