<template>
  <div>
    <nav>
      <ul class="flex flex-wrap items-center gap-1">
        <li v-if="current_page > 1">
          <a class="flex items-center justify-center w-3 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            href="#" @click.prevent="changePage(current_page - 1)">&laquo;</a>
        </li>

        <li v-for="page in pages" :key="page" :class="[{ active: page === current_page }]">
          <a class="flex items-center justify-center w-3 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            href="#" @click.prevent="changePage(page)">
            <span v-if="page === '...'">...</span>
            <span v-else>{{ page }}</span>
          </a>
        </li>

        <li v-if="current_page < totalPages">
          <a class="flex items-center justify-center w-3 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            href="#" @click.prevent="changePage(current_page + 1)">&raquo;</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  props: {
    paginator: {
      type: Object,
      required: true
    },
    current_page: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },

  },
  computed: {
    pages() {
      let pages = [];
      const currentPage = this.current_page;
      const lastPage = this.totalPages;
      if (lastPage <= 7) {
        if (lastPage >= 1) {
          for (let i = 1; i <= lastPage; i++) {
            pages.push(i);
          }
        }
      } else {
        if (lastPage && currentPage) {
          // Always show first two pages
          if (lastPage == 1) {
            pages.push(1);
          }
          if (lastPage > 1) {
            pages.push(1);
            pages.push(2);
          }

          // Calculate the start and end pages for the middle range
          let startPage = Math.max(currentPage - 2, 3);
          let endPage = Math.min(currentPage + 2, lastPage - 2);
          // Add ellipsis if needed
          if (startPage > 3) {
            pages.push('...');
          }

          // Add pages around the current page
          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }

          // Add ellipsis if needed
          if (endPage < lastPage - 2) {
            pages.push('...');
          }

          // Always show last two pages
          pages.push(lastPage - 1);
          pages.push(lastPage);
        }

      }
      return pages;
    }
  },
  methods: {
    changePage(page) {
      if (page === '...') return;
      this.$emit('page-change', page);
    }
  }
};
</script>

<style scoped>
.page-item.disabled .page-link {
  pointer-events: none;
}

.active a {
  background-color: lightgray;
  pointer-events: none;
}
</style>
