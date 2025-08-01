<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">First Name</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">Musharof</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Last Name</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">Chowdhury</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                randomuser@pimjo.com
              </p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">+09 363 398 46</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Bio</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">Team Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isProfileInfoModal = ref(false)

const saveProfile = () => {
  // Implement save profile logic here
  console.log('Profile saved')
  isProfileInfoModal.value = false
}
</script>
