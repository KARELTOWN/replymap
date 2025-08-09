<template>
    <AdminLayout>
        <PageBreadcrumb :pageTitle="currentPageTitle" />
        <div class="space-y-5 sm:space-y-6">
            <ComponentCard title="Evénements">
                <div>
                    <SearchPanel />
                </div>
                <EventList />
                <div class="grid grid-cols-2">
                    <div>
                        <Pagination :paginator="events" :current_page="page" :totalPages="totalPages"
                            @page-change="fetchNext" />
                    </div>
                    <div>
                        <strong>Total : </strong> {{ total }}
                    </div>

                </div>
            </ComponentCard>
        </div>
    </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ComponentCard from "@/components/common/ComponentCard.vue";
import EventList from "@/components/events/EventList.vue";
const currentPageTitle = ref("Evénements");
import SearchPanel from '@/components/events/SearchPanel.vue'
import Pagination from "@/components/pagination/Pagination.vue";

import { eventStore } from "@/stores/event/eventStore";
import { storeToRefs } from "pinia";
const store = eventStore()
const { errors,
    events,
    total,
    page,
    limit,
    totalPages } = storeToRefs(store)
const { getEvents } = store

const fetchNext = async (nextpage) => {
    page.value = nextpage
    await getEvents()
}
</script>
