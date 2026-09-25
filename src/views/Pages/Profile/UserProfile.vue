<template>
  <admin-layout>
    <PageHeader title="Mon profil" description="Vos informations de compte et votre mot de passe." />

    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Two tabs rather than a stack of cards: identity on one side, the
           password on the other. The page used to show the demo content of the
           original template — a name and an address that belonged to nobody. -->
      <div class="flex gap-1 border-b border-gray-200 px-4 dark:border-gray-800 sm:px-6">
        <button type="button" @click="tab = 'informations'" :class="tabClass('informations')">
          Informations
        </button>
        <button type="button" @click="tab = 'password'" :class="tabClass('password')">
          Mot de passe
        </button>
      </div>

      <div class="p-5 sm:p-6">
        <div v-if="loading" class="space-y-3">
          <div class="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
          <div class="h-11 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60"></div>
          <div class="h-11 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60"></div>
        </div>

        <form v-else-if="tab === 'informations'" class="max-w-xl space-y-5" @submit.prevent="saveProfile">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="profile-firstname" :class="labelClass">Prénom</label>
              <input id="profile-firstname" v-model="form.firstname" type="text" :class="fieldClass" />
              <p v-if="errors.firstname" class="mt-1 text-xs text-error-500">{{ errors.firstname }}</p>
            </div>
            <div>
              <label for="profile-lastname" :class="labelClass">Nom</label>
              <input id="profile-lastname" v-model="form.lastname" type="text" :class="fieldClass" />
              <p v-if="errors.lastname" class="mt-1 text-xs text-error-500">{{ errors.lastname }}</p>
            </div>
          </div>

          <div>
            <label for="profile-email" :class="labelClass">Email</label>
            <input id="profile-email" :value="profile?.email" type="email" readonly disabled
              :class="[fieldClass, 'cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-gray-800']" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              L'email identifie votre compte : il porte vos invitations et reçoit les liens de
              réinitialisation. Écrivez-nous pour le changer.
            </p>
          </div>

          <button type="submit" :disabled="saving"
            class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            Enregistrer
          </button>
        </form>

        <form v-else class="max-w-xl space-y-5" @submit.prevent="savePassword">
          <div>
            <label for="current-password" :class="labelClass">Mot de passe actuel</label>
            <input id="current-password" v-model="passwordForm.current_password" type="password"
              autocomplete="current-password" :class="fieldClass" />
            <p v-if="errors.current_password" class="mt-1 text-xs text-error-500">
              {{ errors.current_password }}
            </p>
          </div>

          <div>
            <label for="new-password" :class="labelClass">Nouveau mot de passe</label>
            <input id="new-password" v-model="passwordForm.password" type="password"
              autocomplete="new-password" :class="fieldClass" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.
            </p>
            <p v-if="errors.password" class="mt-1 text-xs text-error-500">{{ errors.password }}</p>
          </div>

          <div>
            <label for="confirm-password" :class="labelClass">Confirmation</label>
            <input id="confirm-password" v-model="passwordForm.confirm_password" type="password"
              autocomplete="new-password" :class="fieldClass" />
            <p v-if="errors.confirm_password" class="mt-1 text-xs text-error-500">
              {{ errors.confirm_password }}
            </p>
          </div>

          <p class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
            Vos autres appareils seront déconnectés. Cet onglet restera connecté.
          </p>

          <button type="submit" :disabled="saving"
            class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { userStore } from '@/stores/user/userStore'

const store = userStore()
const { profile, errors, loading, saving } = storeToRefs(store)
const { getProfile, updateProfile, changePassword } = store

const tab = ref<'informations' | 'password'>('informations')

const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'
const fieldClass =
  'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const form = reactive({ firstname: '', lastname: '' })
const passwordForm = reactive({ current_password: '', password: '', confirm_password: '' })

onMounted(() => getProfile())

watch(profile, (value) => {
  form.firstname = value?.firstname ?? ''
  form.lastname = value?.lastname ?? ''
})

const tabClass = (value: string) =>
  tab.value === value
    ? 'border-b-2 border-brand-500 px-3 py-3 text-sm font-semibold text-brand-600 dark:text-brand-400'
    : 'border-b-2 border-transparent px-3 py-3 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'

const saveProfile = () => updateProfile({ ...form })

const savePassword = async () => {
  const done = await changePassword({ ...passwordForm })
  if (done) {
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.confirm_password = ''
  }
}
</script>
