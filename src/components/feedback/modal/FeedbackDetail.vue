<template>
    <Badge color="primary">{{ feedbackSelect_data?.status?.libelle }}</Badge>
    <div>
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <p class="text-gray-700 text-sm leading-relaxed">
            {{ feedbackSelect_data?.description }}
        </p>
    </div>
    <div>
        <SimpleSelect :data="feedbackTypes" label="Type" optionTextAttr="libelle" optionValueAttr="_id"
            @change="getTypeValue" :defaultValue="feedbackSelect_data?.type?._id" />
    </div>
    <div>
        <SimpleSelect :data="feedbackPriority" label="Priorité" optionTextAttr="libelle" optionValueAttr="_id"
            @change="getPriorityValue" :defaultValue="feedbackSelect_data?.priority?._id" />
    </div>
    <div>
        <SimpleSelect :data="feedbackStatus" label="Status" optionTextAttr="libelle" optionValueAttr="_id"
            @change="getStatusValue" :defaultValue="feedbackSelect_data?.status?._id" />
    </div>
    <div>
        <SimpleSelect :data="projectMembers" label="Membre" optionTextAttr="lastname" secondOptionTextAttr="firstname"
            :valueConcat="true" optionValueAttr="_id" @change="getAssignToValue"
            :defaultValue="feedbackSelect_data?.assignTo?._id" />
    </div>

    <!-- Accordion Metadata -->
    <div class="mt-6">
        <label class="block text-sm font-medium text-gray-700">Metadonnées</label>
        <Metadata :metadata="feedbackSelect_data?.metadata" :user_agent="true" :localization="false" />
    </div>
</template>


<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import SimpleSelect from '@/components/Element/Form/SimpleSelect.vue';
import { storeToRefs } from 'pinia';
import Badge from '@/components/ui/Badge.vue';
import Metadata from '@/components/Element/Metadata.vue'
const storeFeedback = feedbackStore()

const { feedbackSelect_data, feedbackTypes, feedbackPriority, feedbackDetailForm, feedbackStatus, feedbackSelect } = storeToRefs(storeFeedback)
const { updateFeedback } = storeFeedback

import { projectStore } from '@/stores/project/projectStore';
const { projectMembers } = storeToRefs(projectStore())

const getTypeValue = (value) => {
    feedbackDetailForm.value.type = value
    let data = { type: value }
    modifyFeedback(data)
}

const getPriorityValue = (value) => {
    feedbackDetailForm.value.priority = value
    let data = { priority: value }
    modifyFeedback(data)
}

const getStatusValue = (value) => {
    feedbackDetailForm.value.status = value
    let data = { status: value }
    modifyFeedback(data)
}

const getAssignToValue = (value) => {
    feedbackDetailForm.value.assignTo = value
    let data = { assignTo: value }
    modifyFeedback(data)
}


const modifyFeedback = (data) => {
    updateFeedback(feedbackSelect.value, data)
}


</script>
