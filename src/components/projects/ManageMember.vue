<template>
    <div>
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Membres
            <span v-if="projectMembers.length"
                class="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                {{ projectMembers.length }}
            </span>
        </p>

        <p v-if="projectMembers.length === 0"
            class="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Personne d'autre que vous pour le moment.
        </p>

        <ul v-else class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            <li v-for="member in projectMembers" :key="member._id"
                class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="flex min-w-0 items-center gap-3">
                    <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold uppercase text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                        {{ initials(member) }}
                    </span>
                    <span class="min-w-0">
                        <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                            {{ fullName(member) }}
                        </span>
                        <a :href="`mailto:${member.email}`"
                            class="block truncate text-xs text-gray-500 hover:underline dark:text-gray-400">
                            {{ member.email }}
                        </a>
                    </span>
                </div>

                <button type="button" @click="quit(member._id)"
                    class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10">
                    Retirer
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { projectStore } from '@/stores/project/projectStore';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';
import { onMounted } from 'vue';

const { projectMembers, selectProject, projectSuccess } = storeToRefs(projectStore())
const { getProjectMember, quitProject } = projectStore()

onMounted(() => {
    getProjectMember(selectProject.value._id)
})

const fullName = (member) =>
    `${member.firstname ?? ''} ${member.lastname ?? ''}`.trim() || member.email

const initials = (member) =>
    `${member.firstname?.[0] ?? ''}${member.lastname?.[0] ?? ''}` || member.email?.[0] || '?'

const quit = async (user) => {
    const member = projectMembers.value.find((entry) => entry._id === user)
    Swal.fire({
        title: `Retirer ${member ? fullName(member) : 'ce membre'} du projet ?`,
        text: "Cette personne ne pourra plus déposer de retour sur ce projet.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#465FFF",
        cancelButtonColor: "#d33",
        confirmButtonText: "Retirer",
        cancelButtonText: "Annuler",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await quitProject({ project_id: selectProject.value._id, user_id: user })
            if (projectSuccess.value === true) {
                projectMembers.value = projectMembers.value.filter((member) => member._id !== user)
            }
        }
    });
}
</script>
