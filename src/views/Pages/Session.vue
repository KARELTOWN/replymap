<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Sessions">
        <div>
          <SearchPanel />
        </div>
        <SessionList />
        <div class="grid grid-cols-2">
          <div>
            <Pagination :paginator="sessions" :current_page="page" :totalPages="totalPages" @page-change="fetchNext" />
          </div>
          <div>
            <strong>Total : </strong> {{ total }}
          </div>

        </div>
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
import Pagination from "@/components/pagination/Pagination.vue";
const openModal = ref(false)

import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
const store = sessionStore()
const {
  sessions,
  total,
  page,
  totalPages } = storeToRefs(store)
const { getSessions } = store

const fetchNext = async (nextpage) => {
  page.value = nextpage
  await getSessions()
}
</script>
