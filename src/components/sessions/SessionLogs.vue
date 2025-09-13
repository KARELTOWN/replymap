<template>

    <Button variant="danger" @click="open = !open">{{ open === true ? "Fermer" : 'Ouvrir' }} la console</Button>
    <div class="max-h-[600px] h-[400px] custom-scrollbar max-h-[458px] overflow-y-auto p-2 border border-gray-300 rounded-2xl dark:border-gray-800" v-if="open === true">
        <div v-for="(log, index) in loggers" :key="index" :class="['log-entry', log.level]"
            class="mb-3 pb-2 border-b border-gray-500 ">
            <div class="log-header">
                <span class="log-level">{{ log.level.toUpperCase() }}</span>
            </div>
            <div class="log-payload">PAYLOAD : {{ formatPayload(log.payload) }}</div>
            <div class="log-trace">TRACE : {{ formatPayload(log.trace) }}</div>
            <!-- <Button @click="goToEvent(log.timestamp)">Voir</Button> -->
        </div>
    </div>

</template>

<script setup>

import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import Button from "../ui/Button.vue";
const store = sessionStore()
const { loggers, player, session } = storeToRefs(store)
const open = ref(false)
const formatPayload = (payload) => {
    try {
        return JSON.stringify(payload, null, 2);
    } catch {
        return payload;
    }
};

const formatSessionDate = computed(() => {
    if (session.value) {
        return new Date(session.value.startedAt).getTime();
    }
    return null
})


const goToEvent = (timestamp) => {
    if (player.value) {
        if (formatSessionDate.value) {
            const relativeTime = timestamp - formatSessionDate.value
            // 2. Vérifier bornes pour éviter d'aller hors replay
            if (relativeTime < 0) { relativeTime = 0 };
            player.value.goto(relativeTime)
        }
    }
}


</script>