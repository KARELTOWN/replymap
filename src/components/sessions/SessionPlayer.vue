<template>

    <div v-if="loading == false && errorMessage !== ''">
        <div
            class="mb-3 rounded-xl border p-4 border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15">
            <div class="flex items-start gap-3">
                <div class="-mt-0.5 text-error-500"><svg className="fill-current" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd"
                            d="M20.3499 12.0004C20.3499 16.612 16.6115 20.3504 11.9999 20.3504C7.38832 20.3504 3.6499 16.612 3.6499 12.0004C3.6499 7.38881 7.38833 3.65039 11.9999 3.65039C16.6115 3.65039 20.3499 7.38881 20.3499 12.0004ZM11.9999 22.1504C17.6056 22.1504 22.1499 17.6061 22.1499 12.0004C22.1499 6.3947 17.6056 1.85039 11.9999 1.85039C6.39421 1.85039 1.8499 6.3947 1.8499 12.0004C1.8499 17.6061 6.39421 22.1504 11.9999 22.1504ZM13.0008 16.4753C13.0008 15.923 12.5531 15.4753 12.0008 15.4753L11.9998 15.4753C11.4475 15.4753 10.9998 15.923 10.9998 16.4753C10.9998 17.0276 11.4475 17.4753 11.9998 17.4753L12.0008 17.4753C12.5531 17.4753 13.0008 17.0276 13.0008 16.4753ZM11.9998 6.62898C12.414 6.62898 12.7498 6.96476 12.7498 7.37898L12.7498 13.0555C12.7498 13.4697 12.414 13.8055 11.9998 13.8055C11.5856 13.8055 11.2498 13.4697 11.2498 13.0555L11.2498 7.37898C11.2498 6.96476 11.5856 6.62898 11.9998 6.62898Z"
                            fill="currentColor"></path>
                    </svg></div>
                <div>
                    <h4 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">Erreur
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400"> {{ errorMessage }}</p>
                </div>
            </div>
        </div>
    </div>

    <div v-if="loading == true && errorMessage == ''">
        <div
            class="mb-3 rounded-xl border p-4 border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15">
            <div class="flex items-start gap-3">
                <div class="-mt-0.5 text-blue-light-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z"
                            fill="currentColor"></path>
                    </svg></div>
                <div>
                    <h4 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">Chargement en cours
                    </h4>
                </div>
            </div>
        </div>
    </div>

    <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
        <!-- The replay sits in its own frame: it draws the customer's site,
             which has its own white background, so without a border it melted
             into the page and nothing showed where the recording started. -->
        <div
            class="min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
            <div
                class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Replay de la session
                </p>
                <p v-if="session?.uniqueId" class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ session.uniqueId }}
                </p>
            </div>
            <div class="flex justify-center overflow-x-auto p-3">
                <div id="player" />
            </div>
        </div>
        <SessionTimeline class="w-full xl:w-[340px] xl:shrink-0" :events="timeline" :current-time="currentTime"
            @seek="seekTo" />
    </div>

</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import rrwebPlayer from 'rrweb-player';
import { nextTick, onMounted, onUnmounted, reactive } from 'vue';
import { ref } from 'vue';
const session_id: any = ref('')
const project_id: any = ref('')
const route = useRoute()
const loading = ref(false)
const errorMessage = ref('')
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import ReplayWorker from '@/composables/replay-worker?worker'
import SessionTimeline from './SessionTimeline.vue'
import { api, getAppToken } from '@/composables/request';
const store = sessionStore()
const { session, player, loggers } = storeToRefs(store)
import { getReplayConsolePlugin } from '@rrweb/rrweb-plugin-console-replay';

onMounted(async () => {
    try {
        await nextTick(); // wait for the DOM to update
        session_id.value = route.query.session
        project_id.value = route.query.project

        if (!session_id.value || !project_id.value) {
            errorMessage.value = "Impossible de charger la session"
            return
        }
        await readChunksContinuously()

    }
    catch (error) {
        errorMessage.value = "Erreur lors du chargement de la session"
        console.error(error)
    }

})


// The replay is drawn at a fixed width; below 850px it overflowed the page on
// a phone or a tablet. It now takes the width of its container, and follows it
// when the window is resized.
const PLAYER_MAX_WIDTH = 850
const PLAYER_MIN_WIDTH = 320

const playerWidth = (element: HTMLElement) => {
    const available = element.parentElement?.clientWidth ?? element.clientWidth
    return Math.max(PLAYER_MIN_WIDTH, Math.min(PLAYER_MAX_WIDTH, available || PLAYER_MAX_WIDTH))
}

const resizePlayer = () => {
    const playerElement = document.getElementById('player')
    if (!playerElement || !player.value) return
    player.value.$set({ width: playerWidth(playerElement) })
    player.value.triggerResize()
}

// Errors and steps of the path, placed on the timeline of the recording. rrweb marks
// them as custom events (type 5); their offset is measured from the first event
// of the session.
const timeline: any = ref([])
const currentTime = ref(0)
const firstTimestamp = ref(0)

const collectTimeline = (events: any[]) => {
    if (!events?.length) return
    if (!firstTimestamp.value) firstTimestamp.value = events[0].timestamp

    for (const event of events) {
        if (event.type !== 5) continue
        timeline.value.push({
            tag: event.data?.tag,
            payload: event.data?.payload ?? {},
            offset: Math.max(0, event.timestamp - firstTimestamp.value),
        })
    }
    timeline.value.sort((left: any, right: any) => left.offset - right.offset)
}

const seekTo = (offset: number) => {
    if (!player.value) return
    // A second before the event, so what caused it is visible too.
    player.value.goto(Math.max(0, offset - 1000))
}

const initializePlayer = (events: any) => {
    const playerElement = document.getElementById("player");
    if (playerElement) {
        player.value = new rrwebPlayer({
            target: playerElement, // customizable root element
            props: {
                events: events,
                autoPlay: false,
                width: playerWidth(playerElement),
                showController: true,
                UNSAFE_domOverlay: true,
                // plugins: [
                //     getReplayConsolePlugin({
                //         level: ['info', 'log', 'warn', 'error'],
                //     }),
                // ]
            },

        });
        window.addEventListener('resize', resizePlayer)

        // The panel follows the playhead: an event is shown when the replay
        // reaches it, instead of every error being dumped on screen at once.
        player.value.addEventListener('ui-update-current-time', (event: any) => {
            currentTime.value = event?.payload ?? 0
        })
    }
}



const readChunksContinuously = async () => {
    try {
        loading.value = true
        const worker = new ReplayWorker()
        worker.onmessage = (e) => {
            const { type, events, session_data } = e.data
            if (type === 'batch') {
                if (!session.value?.metadata) {
                    session.value = session_data
                }
                collectTimeline(events)
                if (!player.value) {
                    initializePlayer(events)
                }
                else {
                    for (const event of events) {
                        player.value.addEvent(event)
                    }
                }
            } else if (type === 'done') {
                if (player.value) {
                    loading.value = false
                    // player.value.play()
                }
            }
            else if (type === 'error') {
                loading.value = false
                errorMessage.value =
                    e.data?.code === 'NOT_FOUND'
                        ? "Cette session n'existe plus. Les sessions qui n'ont rien enregistré sont supprimées automatiquement quelques minutes après leur ouverture."
                        : 'Erreur de chargement de la session'
            }
        }
        worker.postMessage({
            param: { session_id: session_id.value, project_id: project_id.value },
            token: getAppToken(),
            api: api
        })
    }
    catch (error) {
        loading.value = false
        console.error("Error in fetching session chunk:", error);
    }

}

onUnmounted(() => {
    window.removeEventListener('resize', resizePlayer)
    timeline.value = []
    currentTime.value = 0
    firstTimestamp.value = 0
    session_id.value = ''
    project_id.value = ''
    player.value = null
    loggers.value = []
});

</script>
<style scoped>
.pointer-event-none {
    pointer-events: none;
}
</style>