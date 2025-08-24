<template>
    <AdminLayout>
        <PageBreadcrumb :pageTitle="currentPageTitle" />
        <div class="space-y-5 sm:space-y-6">
            <ComponentCard title="Feedbacks">
                <div>
                    <FilterFeedback />
                </div>
                <FeedbackBoard />
            </ComponentCard>
        </div>
    </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PageBreadcrumb from "@/components/common/PageBreadcrumb.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ComponentCard from "@/components/common/ComponentCard.vue";
import FeedbackBoard from "@/components/feedback/FeedbackBoard.vue";
const currentPageTitle = ref("Feedbacks");
import FilterFeedback from '@/components/feedback/FilterFeedback.vue'
</script>
