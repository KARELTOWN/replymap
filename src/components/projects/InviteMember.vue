<template>
  <ModalShell v-if="props.open === true" title="Membres du projet"
    :description="selectProject?.libelle ? `Qui peut déposer un retour sur ${selectProject.libelle}.` : 'Qui peut déposer un retour sur ce projet.'"
    @close="closeModal">
    <form class="flex flex-col gap-2 sm:flex-row sm:items-start" @submit.prevent="handleSubmit">
      <div class="min-w-0 flex-1">
        <label for="invite-email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Inviter par email
        </label>
        <input id="invite-email" v-model="email" type="email" placeholder="prenom.nom@exemple.com"
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          La personne doit déjà avoir un compte BugReveal vérifié.
        </p>
        <p v-if="errors.email" class="mt-1 text-xs text-error-500">{{ errors.email }}</p>
      </div>

      <button type="submit" :disabled="disableBtn || !email"
        class="h-11 shrink-0 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7">
        Inviter
      </button>
    </form>

    <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
      <ManageMember />
    </div>

    <template #footer>
      <button type="button" @click="closeModal"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
        Fermer
      </button>
    </template>
  </ModalShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModalShell from '@/components/ui/ModalShell.vue'
import ManageMember from './ManageMember.vue'
import Swal from 'sweetalert2'
import { projectStore } from '@/stores/project/projectStore'
import { storeToRefs } from 'pinia'

const store = projectStore()
const { errors, selectProject, projectSuccess } = storeToRefs(store)
const { inviteUser } = store

const email = ref('')

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
})

const emits = defineEmits(['close'])

onMounted(() => {
  errors.value = {}
})

const closeModal = () => {
  emits('close')
  resetModalFields()
}

const resetModalFields = () => {
  email.value = ''
}

const disableBtn = ref(false)

// Adding someone gives them access to every recording and every feedback of
// the project: it is confirmed, like removing them.
const handleSubmit = async () => {
  const confirmed = await Swal.fire({
    title: 'Inviter cette personne ?',
    html: `<b>${email.value}</b> pourra voir les sessions enregistrées et déposer des retours sur ce projet.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#465FFF',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Inviter',
    cancelButtonText: 'Annuler',
  })
  if (!confirmed.isConfirmed) return

  try {
    disableBtn.value = true

    await inviteUser({
      email: email.value,
      project_id: selectProject.value._id,
    })
    if (projectSuccess.value === true) {
      closeModal()
    } else {
      disableBtn.value = false
    }
  } catch (err) {
    disableBtn.value = false
  }
}
</script>
