<template>
    <div class="overflow-x-auto">

        <div class="max-w-4xl mx-auto mt-6">
  <h2 class="text-2xl font-bold mb-6 text-gray-800">📊 Explications des métriques de performance</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">1️⃣ PAGE_LOAD_TIME :</span> Temps total pour que la page soit complètement prête.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">2️⃣ TTFB :</span> Temps que le serveur a mis pour répondre à votre navigateur.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">3️⃣ DNS_LOOKUP :</span> Temps pour trouver l’adresse du site sur Internet.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">4️⃣ TLS_HANDSHAKE :</span> Temps pour sécuriser la connexion (HTTPS).
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">5️⃣ DOWNLOAD_RESPONSE :</span> Temps pour recevoir toutes les données du serveur.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">6️⃣ DOM_CONTENT_LOADED :</span> Temps pour que le contenu principal de la page soit affiché et prêt.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">7️⃣ LOAD_EVENT :</span> Temps pour que tout soit complètement chargé et utilisable.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">8️⃣ TTFB_WEB_VITALS :</span> Version “perçue par l’utilisateur” du temps de réponse du serveur.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">9️⃣ LCP :</span> Temps pour afficher le contenu le plus grand à l’écran.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">🔟 CLS :</span> Mesure la stabilité visuelle d’une page pendant son chargement et son utilisation.
    </div>
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <span class="font-semibold text-gray-900">1️⃣1️⃣ FCP :</span> Temps pour voir le premier contenu à l’écran.
    </div>
  </div>
</div>


        <table class="min-w-full border border-gray-200 divide-y divide-gray-200 mt-4">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Métrique</th>
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Valeur actuelle</th>
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Bon</th>
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">À améliorer</th>
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Mauvais</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                    <td class="px-4 py-2">PAGE_LOAD_TIME</td>
                    <td class="px-4 py-2">{{ props.data.PAGE_LOAD_TIME.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 2 000 ms</td>
                    <td class="px-4 py-2">2 000 – 4 000 ms</td>
                    <td class="px-4 py-2">> 4 000 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">TTFB</td>
                    <td class="px-4 py-2">{{ props.data.TTFB.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 200 ms</td>
                    <td class="px-4 py-2">200 – 500 ms</td>
                    <td class="px-4 py-2">> 500 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">DNS_LOOKUP</td>
                    <td class="px-4 py-2">{{ props.data.DNS_LOOKUP.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 20 ms</td>
                    <td class="px-4 py-2">20 – 100 ms</td>
                    <td class="px-4 py-2">> 100 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">TLS_HANDSHAKE</td>
                    <td class="px-4 py-2">{{ props.data.TLS_HANDSHAKE.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 50 ms</td>
                    <td class="px-4 py-2">50 – 200 ms</td>
                    <td class="px-4 py-2">> 200 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">DOWNLOAD_RESPONSE</td>
                    <td class="px-4 py-2">{{ props.data.DOWNLOAD_RESPONSE.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 100 ms</td>
                    <td class="px-4 py-2">100 – 500 ms</td>
                    <td class="px-4 py-2">> 500 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">DOM_CONTENT_LOADED</td>
                    <td class="px-4 py-2">{{ props.data.DOM_CONTENT_LOADED.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 1 000 ms</td>
                    <td class="px-4 py-2">1 000 – 2 500 ms</td>
                    <td class="px-4 py-2">> 2 500 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">LOAD_EVENT</td>
                    <td class="px-4 py-2">{{ props.data.LOAD_EVENT.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 2 000 ms</td>
                    <td class="px-4 py-2">2 000 – 4 000 ms</td>
                    <td class="px-4 py-2">> 4 000 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">TTFB_WEB_VITALS</td>
                    <td class="px-4 py-2">{{ props.data.TTFB_WEB_VITALS.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 200 ms</td>
                    <td class="px-4 py-2">200 – 500 ms</td>
                    <td class="px-4 py-2">> 500 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">LCP</td>
                    <td class="px-4 py-2">{{ props.data.LCP.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 2 500 ms</td>
                    <td class="px-4 py-2">2 500 – 4 000 ms</td>
                    <td class="px-4 py-2">> 4 000 ms</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">CLS</td>
                    <td class="px-4 py-2">{{ props.data.CLS.toFixed(1) }}</td>
                    <td class="px-4 py-2">
                        < 0,1</td>
                    <td class="px-4 py-2">0,1 – 0,25</td>
                    <td class="px-4 py-2">> 0,25</td>
                </tr>
                <tr>
                    <td class="px-4 py-2">FCP</td>
                    <td class="px-4 py-2">{{ props.data.FCP.toFixed(1) }} ms</td>
                    <td class="px-4 py-2">
                        < 1 000 ms</td>
                    <td class="px-4 py-2">1 000 – 2 500 ms</td>
                    <td class="px-4 py-2">> 2 500 ms</td>
                </tr>
            </tbody>
        </table>
    </div>

</template>

<script setup>
const props = defineProps({
    data: Object
})
</script>