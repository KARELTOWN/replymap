<template>
    <div v-for="comment in comments" :key="comment.id" class="border rounded p-3">
        <p class="text-sm text-gray-800">{{ comment.text }}</p>
        <div class="text-xs text-gray-500 mt-1">
            Envoyé par {{ comment.author }} • {{ comment.date }}
        </div>
        <div v-if="comment.files.length" class="mt-2 text-xs text-blue-600">
            Fichiers associés : {{ comment.files.join(', ') }}
        </div>
    </div>

    <!-- Nouveau commentaire -->
    <div class="mt-6">
        <textarea class="w-full border rounded p-2 text-sm" rows="3" placeholder="Écrire un commentaire..."></textarea>
        <input type="file" multiple class="mt-2 text-sm" />
        <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Envoyer
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const comments = ref([
    { id: 1, text: 'Super idée !', author: 'Karel', date: '23 août 2025 à 14h32', files: ['screenshot.png'] },
    { id: 2, text: 'Bug confirmé', author: 'Dev', date: '23 août 2025 à 15h10', files: [] }
])
</script>