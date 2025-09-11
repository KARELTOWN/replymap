<template>
    <label class="block text-sm font-medium text-gray-700">{{ props.label }}</label>
    <select v-if="!props.valueConcat || props.valueConcat === undefined" v-model="fieldValue"
        placeholder="Priorités de feedbacks" @change="sendValue" :selected="props.defaultValue"
        class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
        <option value="" selected v-if="props.defaultOptionText">{{ props.defaultOptionText }}</option>
        <option v-for="(e, index) in props.data" :key="index" :value="e[props.optionValueAttr]"
            class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {{ e[props.optionTextAttr] }}
        </option>
    </select>
    <select v-if="props.valueConcat && props.valueConcat !== undefined" v-model="fieldValue"
        placeholder="Priorités de feedbacks" @change="sendValue" :selected="props.defaultValue"
        class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
        <option value="" selected v-if="props.defaultOptionText">{{ props.defaultOptionText }}</option>
        <option v-for="(e, index) in props.data" :key="index" :value="e[props.optionValueAttr]"
            class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {{ e[props.optionTextAttr] + ' ' + e[props.secondOptionTextAttr] }}
        </option>
    </select>
</template>
<script setup>
import { onMounted, ref, watch, watchEffect } from 'vue';

const props = defineProps({
    data: Array,
    defaultOptionText: String,
    label: String,
    optionTextAttr: String,
    secondOptionTextAttr: String,
    optionValueAttr: String,
    defaultValue: String,
    valueConcat: Boolean
})
const emit = defineEmits(["change"])
const fieldValue = ref('')

watchEffect(() => {
    if (props.defaultValue && props.defaultValue !== undefined) {
        fieldValue.value = props.defaultValue
    }
})

const sendValue = () => {
    emit("change", fieldValue.value)
}
</script>