<template>
    <div class="max-w-3xl mx-auto pt-8">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">👥 Membres du projet</h2>
        <ul class="space-y-4">
            <li v-for="member in projectMembers" :key="member._id"
                class="flex items-center justify-between bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                <div class="flex items-center space-x-4">
                    <div>
                        <p class="text-lg font-medium text-gray-900">{{ member.lastname + ' ' + member.firstname }}</p>
                        <p class="hover:underline text-blue-600 text-sm"> <a :href="`mailto:${member.email}`">{{
                                member.email }}</a></p>
                    </div>
                </div>
                <button @click="quit(member._id)"
                    class="text-red-600 hover:text-red-800 font-semibold px-3 py-1 border border-red-300 rounded-md hover:bg-red-50 transition">
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

const quit = async (user) => {
    Swal.fire({
        title: "Etes vous sûr de enlever " + user.lastname + ' ' + user.firstname + " du projet ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, l'enlever !",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await quitProject({ project_id: selectProject.value._id, user_id: user })
            if (projectSuccess.value === true) {
                projectMembers.value = projectMembers.value.filter((member) => {
                    return member._id !== user
                })
            }
        }
    });
}
</script>