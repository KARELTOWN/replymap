<template>
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-7 2xl:gap-x-32">
        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.user_agent === true">Navigateur</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ props?.metadata?.user_agent }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.user_agent === true">Hauteur écran</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ props?.metadata?.height
            }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.user_agent === true">Largeur écran</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ props?.metadata?.width
            }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.localization === true">Pays</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{
                props?.metadata?.localization?.country }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.localization === true">Timezone</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{
                props?.metadata?.localization?.timezone }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.localization === true">Région</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ props?.metadata?.localization?.region
            }}</p>
        </div>

        <div>
            <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400" v-if="props.localization === true">Ville</p>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ props?.metadata?.localization?.city
            }}</p>
        </div>

        

    </div>
</template>

<script setup>
const props = defineProps({
    metadata: Object,
    user_agent: Boolean,
    localization: Boolean
})
</script>