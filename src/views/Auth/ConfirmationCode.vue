<template>
    <FullScreenLayout>
        <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
            <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
                <div class="flex flex-col flex-1 w-full lg:w-1/2">
                    <div class="w-full max-w-md pt-10 mx-auto">
                    </div>
                    <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                        <div>
                            <div class="mb-5 sm:mb-8">
                                <h1
                                    class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                    Confirmer le code
                                </h1>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    Entrez le code reçu par mail
                                </p>
                            </div>
                            <div>
                                <form @submit.prevent="handleSubmit">
                                    <div class="space-y-5">
                                        <!-- Email -->
                                        <div class="relative flex lg:flex-row space-x-4">
                                            <input v-for="(digit, index) in otp" ref="inputs" :key="index" type="text"
                                                maxlength="1"
                                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                                :value="digit" @input="handleInput(index, $event.target.value)"
                                                @keydown="handleKeyDown($event)" @focus="handleFocus($event.target)"
                                                @paste="handlePaste($event)" />
                                        </div>
                                        <p v-if="errors.code" style="color: red">{{ errors.code }}</p>

                                        <div>
                                            <button type="submit"
                                                class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                                Vérifier
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                <div class="mt-5">
                                    <p
                                        class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                        Vous n'avez pas de compte ?
                                        <router-link to="/signup"
                                            class="text-brand-500 hover:text-brand-600 dark:text-brand-400">Créer un
                                            compte</router-link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
                    <div class="flex items-center justify-center z-1">
                        <common-grid-shape />
                        <div class="flex flex-col items-center max-w-xs">
                            <router-link to="/" class="block mb-4">
                                <img width="231" height="48" src="/images/logo/auth-logo.png" alt="Logo" />
                            </router-link>
                            <p class="text-center text-gray-400 dark:text-white/60">
                                                <strong>Découvrez les bugs dans vos applications pour en améliorer la qualité</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </FullScreenLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, useTemplateRef } from 'vue'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { useRoute, useRouter } from 'vue-router'
import authValidator from '@/validator/auth'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { fetchPost } from '@/composables/request'
import { successNotify } from '@/utils/notification'
const { validateOTP } = authValidator()
const shemaOTP = validateOTP()
const email = ref('')

const otp = ref(Array(5).fill(''))
const codeInputs = useTemplateRef('inputs')

const route = useRoute()

const form = reactive({
    user_id: '',
    code: ''
})

const router = useRouter()

onMounted(() => {
    if (route.query.type == 'register') {
        const user_id = sessionStorage.getItem('replay_map_user')
        if (user_id) {
            form.user_id = user_id
        }
    }
})


const handleKeyDown = (e) => {
    if (
        !/^[0-9]{1}$/.test(e.key) &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        e.key !== 'Tab' &&
        !e.metaKey
    ) {
        e.preventDefault()
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        const index = otp.value.indexOf('')
        if (index > 0) {
            otp.value.splice(index - 1, 1, '')
            codeInputs.value[`${index - 1}`].focus()
        }
    }
}

const handleInput = (index, value) => {
    otp.value.splice(index, 1, value)
    if (value && index < otp.value.length - 1) {
        codeInputs.value[`${index + 1}`].focus()
    }
}

const handleFocus = (target) => {
    target.select()
}

const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    if (!new RegExp(`^[0-9]{${otp.value.length}}$`).test(text)) {
        return
    }
    otp.value = text.split('')
}

const errors = ref({})


const handleSubmit = async () => {
    try {
        const data = await shemaOTP.validate({
            code: otp.value
        }, { abortEarly: false })
        form.code = data.code.join('')
        const result = await fetchPost('auth/confirm-register', form)
        const response = await handleAppError(result)
        if (response.status === true) {
            if (response.errors) {
                errors.value = response.errors
            }
            return
        }
        else {
            successNotify('Compte validé')
            sessionStorage.removeItem('replay_map_user')
            router.push({ path: "/" })
        }
    }
    catch (err) {
        const result = handleCatchError(err)
        if (result) {
            errors.value = result
        }
    }

}

</script>
