<template>
  <ModalShell v-if="isOpen" :title="selectProject ? 'Modifier le projet' : 'Ajouter un projet'"
    :description="selectProject ? 'Nom, adresse suivie et données collectées.' : 'Un projet correspond à un site à suivre.'"
    @close="closeModal">
    <form id="project-form" class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label for="project-name" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nom du projet
        </label>
        <input id="project-name" v-model="libelle" type="text" placeholder="Ex : Site vitrine du client"
          :class="fieldClass" />
        <p v-if="errors.libelle" class="mt-1 text-xs text-error-500">{{ errors.libelle }}</p>
      </div>

      <div>
        <label for="project-link" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Adresse du site
        </label>
        <input id="project-link" v-model="link" type="url" placeholder="https://exemple.com" :class="fieldClass" />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          C'est le domaine autorisé à envoyer des données. Il ne pourra plus changer une fois la collecte commencée.
        </p>
        <p v-if="errors.link" class="mt-1 text-xs text-error-500">{{ errors.link }}</p>
      </div>

      <!-- The snippet is code: shown as such, on one selectable line, with a
           copy button that says what it did. -->
      <div v-if="tracking_code && !selectProject"
        class="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Script de suivi</p>
            <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Collez-le juste avant la fermeture de la balise &lt;/body&gt; de votre site.
            </p>
          </div>
          <button type="button" @click="copyScript(tracking_code)"
            class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {{ copyText || 'Copier' }}
          </button>
        </div>
        <pre
          class="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">{{ tracking_code }}</pre>
      </div>

      <!-- Nothing used to confirm the snippet had ever been installed. -->
      <div v-if="selectProject">
        <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Installation du script</p>
        <InstallationStatus :project-id="selectProject._id" :domain="selectProject.link" />
      </div>

      <div v-if="selectProject">
        <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Ce que BugReveal collecte</p>
        <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Chaque collecte peut être coupée sans toucher au script déjà installé.
        </p>

        <div class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          <label v-for="option in trackingOptions" :key="option.key"
            class="flex cursor-pointer items-start gap-3 p-4 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]">
            <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-brand-500" :checked="track[option.key] !== false"
              @change="track[option.key] = !track[option.key]" />
            <span class="min-w-0">
              <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ option.title }}</span>
              <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ option.description }}</span>
            </span>
          </label>
        </div>
        <p v-if="errors.track" class="mt-1 text-xs text-error-500">{{ errors.track }}</p>
      </div>

      <!-- Who may write: a decision of the project owner, until now fixed in
           the code — leaving feedback required an invitation on the project. -->
      <div v-if="selectProject">
        <p class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Qui peut envoyer un retour</p>
        <label
          class="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]">
          <input type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-brand-500" v-model="allow_guest_feedback" />
          <span class="min-w-0">
            <span class="block text-sm font-medium text-gray-800 dark:text-white/90">
              Accepter les retours sans compte BugReveal
            </span>
            <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              Le visiteur indique seulement son email dans le widget. Sans cette option, il faut
              être membre invité du projet.
            </span>
          </span>
        </label>
      </div>
    </form>

    <template #footer>
      <button type="button" @click="closeModal"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
        Fermer
      </button>
      <button type="submit" form="project-form" :disabled="disableBtn"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
        {{ selectProject ? 'Enregistrer' : 'Créer le projet' }}
      </button>
    </template>
  </ModalShell>
</template>

<script setup>
import { ref, onMounted, watchEffect, watch } from 'vue'
import ModalShell from '@/components/ui/ModalShell.vue'
import InstallationStatus from './InstallationStatus.vue'
import { projectStore } from '@/stores/project/projectStore'
import { storeToRefs } from 'pinia'

const store = projectStore()
const { errors, projectSuccess, tracking_code, selectProject } = storeToRefs(store)
const { createProject, updateProject } = store

const fieldClass =
  'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

// What each collection does, said in the user's terms rather than in the
// field names of the API — et surtout, ce qu'elle collecte vraiment : les
// erreurs JavaScript étaient annoncées ici alors qu'elles dépendaient en fait
// d'une autre case, et les lenteurs promettaient des « traitements » qui n'ont
// jamais été remontés. « Comportements » a disparu : ce qu'elle couvrait n'a de
// sens que dans une session, donc elle suit l'enregistrement.
const trackingOptions = [
  {
    key: 'active_recording',
    title: 'Enregistrement des sessions',
    description:
      'Rejouez le parcours du visiteur, écran par écran.',
  },
  {
    key: 'active_track_errors',
    title: 'Erreurs',
    description:
      'Erreurs JavaScript, promesses rejetées et requêtes en échec.',
  },
  {
    key: 'active_performance_issues',
    title: 'Lenteurs',
    description:
      'Requêtes réseaux de votre application qui dépassent trois secondes.',
  },
]

const isOpen = ref(false)
const libelle = ref('')
const link = ref('')
const track = ref({})
const allow_guest_feedback = ref(false)

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
})

const emits = defineEmits(['close'])

onMounted(() => {
  errors.value = {}
  tracking_code.value = ''
})

watch(
  () => selectProject.value,
  (newValue) => {
    if (newValue) {
      libelle.value = newValue.libelle
      link.value = newValue.link
      track.value = { ...newValue.track }
      allow_guest_feedback.value = newValue.allow_guest_feedback === true
    } else {
      resetModalFields()
    }
  },
)

watchEffect(() => {
  if (props.open && props.open !== undefined) {
    isOpen.value = props.open
  }
})

const closeModal = () => {
  isOpen.value = false
  emits('close')
  resetModalFields()
}

const resetModalFields = () => {
  libelle.value = ''
  link.value = ''
  track.value = {}
  allow_guest_feedback.value = false
}

const disableBtn = ref(false)

const handleSubmit = async () => {
  try {
    disableBtn.value = true
    if (selectProject.value == '') {
      await createProject({ libelle: libelle.value, link: link.value })
      disableBtn.value = false

      if (projectSuccess.value === true) {
        libelle.value = ''
        link.value = ''
      }
    } else {
      disableBtn.value = false
      await updateProject({
        libelle: libelle.value,
        link: link.value,
        track: track.value,
        allow_guest_feedback: allow_guest_feedback.value,
        project_id: selectProject.value._id,
      })
      if (projectSuccess.value === true) {
        closeModal()
      }
    }
  } catch (err) {
    disableBtn.value = false
  }
}

const copyText = ref('')

const copyScript = (data) => {
  navigator.clipboard.writeText(data)
  copyText.value = 'Copié !'
  setTimeout(() => {
    copyText.value = ''
  }, 1500)
}
</script>
