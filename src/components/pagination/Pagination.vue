<template>
  <nav aria-label="Pagination">
    <ul class="flex flex-wrap items-center gap-1">
      <li>
        <button type="button" :disabled="current_page <= 1" :class="navClass" aria-label="Page précédente"
          @click="changePage(current_page - 1)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </li>

      <li v-for="(page, index) in pages" :key="`${page}-${index}`">
        <span v-if="page === '...'" class="px-2 text-sm text-gray-400 dark:text-gray-600">…</span>
        <button v-else type="button" :class="page === current_page ? activeClass : pageClass"
          :aria-current="page === current_page ? 'page' : undefined" @click="changePage(page)">
          {{ page }}
        </button>
      </li>

      <li>
        <button type="button" :disabled="current_page >= totalPages" :class="navClass" aria-label="Page suivante"
          @click="changePage(current_page + 1)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script>
// Every page was rendered as a solid blue button, the current one included,
// marked only by a light grey injected in CSS. The pagination looked like a wall
// of buttons without showing where you were. Only the active page is now
// highlighted, the others stay discreet, and the arrows are disabled at both
// ends instead of disappearing.
const BASE =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition'

export default {
  props: {
    paginator: { type: [Object, Array], required: false, default: null },
    current_page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  data() {
    return {
      pageClass: `${BASE} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]`,
      activeClass: `${BASE} bg-brand-500 text-white`,
      navClass: `${BASE} text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-white/[0.06]`,
    }
  },
  computed: {
    pages() {
      const pages = []
      const currentPage = this.current_page
      const lastPage = this.totalPages
      if (!lastPage) return pages

      if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) pages.push(i)
        return pages
      }

      pages.push(1)
      pages.push(2)

      const startPage = Math.max(currentPage - 2, 3)
      const endPage = Math.min(currentPage + 2, lastPage - 2)

      if (startPage > 3) pages.push('...')
      for (let i = startPage; i <= endPage; i++) pages.push(i)
      if (endPage < lastPage - 2) pages.push('...')

      pages.push(lastPage - 1)
      pages.push(lastPage)
      return pages
    },
  },
  methods: {
    changePage(page) {
      if (page === '...') return
      if (page < 1 || page > this.totalPages || page === this.current_page) return
      this.$emit('page-change', page)
    },
  },
}
</script>
