<template>
  <svg class="tiptap-toolbar-icon" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <template v-if="name === 'undo'">
      <path d="M9.2 7.2H15a5.8 5.8 0 0 1 0 11.6h-3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="m9.2 3.8-5.1 3.4 5.1 3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="M14.8 7.2H9a5.8 5.8 0 0 0 0 11.6h3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="m14.8 3.8 5.1 3.4-5.1 3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'heading'">
      <path d="M5 5v14M12 5v14M5 12h7M18.5 13.5v5M16.5 18.5h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'bold'">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6 4h6a4 4 0 0 1 2.8 6.86A4.5 4.5 0 0 1 13 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 2v5h4a2.5 2.5 0 1 0 0-5H8Zm0 7v5h5a2.5 2.5 0 0 0 0-5H8Z" />
    </template>
    <template v-else-if="name === 'italic'">
      <path d="M10 4h6l-.6 2h-1.7l-3.6 12H12l-.6 2H5l.6-2h1.7l3.6-12H9.4L10 4Z" />
    </template>
    <template v-else-if="name === 'list'">
      <path d="M9 6h11M9 12h11M9 18h11M4.5 5.5h.01M4.5 11.5h.01M4.5 17.5h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'ordered-list'">
      <path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M4.2 4.5h1.1v3M4.2 7.5h2M4.1 10.7c.2-.4.6-.7 1.2-.7.7 0 1.1.4 1.1.9 0 .8-.8 1.1-2.2 2.1v.5h2.3M4.1 16.2c.2-.3.6-.5 1.1-.5.7 0 1.2.4 1.2 1 0 .5-.3.8-.8 1 .6.1.9.5.9 1 0 .7-.6 1.1-1.4 1.1-.6 0-1-.2-1.3-.6" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'todo-list'">
      <rect x="3.5" y="4" width="3.6" height="3.6" rx=".7" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="m4.5 5.7 1 1 1.9-2M10.5 5.8H20M3.5 12h3.6v3.6H3.5zM10.5 13.8H20M3.5 19.9h3.6v-3.6H3.5zM10.5 19.7H20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'blockquote'">
      <path d="M6.5 6.5H4.8A2.8 2.8 0 0 0 2 9.3v1.4a2.8 2.8 0 0 0 2.8 2.8h1.7v-4H4.6M17.5 6.5h-1.7A2.8 2.8 0 0 0 13 9.3v1.4a2.8 2.8 0 0 0 2.8 2.8h1.7v-4h-1.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M5 17.5h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'code'">
      <path d="m8.5 7-4 5 4 5M15.5 7l4 5-4 5M13.5 4.5l-3 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'code-block'">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5.5l-2 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'strike'">
      <path d="M5 9.2c.5-2.7 2.5-4.2 5.2-4.2 2.6 0 4.6 1.1 5.2 3.2M7 14.8c.6 2.1 2.5 3.2 5.1 3.2 2.7 0 4.6-1.5 5-4.2M3.5 12h17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'underline'">
      <path d="M6.5 5v5.7a5.5 5.5 0 0 0 11 0V5M4 20h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'highlighter'">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M14.707 4.707a1 1 0 0 0-1.414-1.414l-4.6 4.6-.007.007A2.99 2.99 0 0 0 7.828 10c0 .23.027.458.078.68l-5.614 5.613A1 1 0 0 0 2 17v3a1 1 0 0 0 1 1h9a1 1 0 0 0 .707-.293l2.614-2.613c.221.052.449.078.679.078.786 0 1.54-.308 2.1-.858l4.607-4.607a1 1 0 0 0-1.414-1.414l-4.596 4.596a1 1 0 0 1-1.394 0l-5.192-5.192a1 1 0 0 1 0-1.394l4.596-4.596ZM13.586 17 9 12.414 4 17.414V19h7.586l2-2Z" />
    </template>
    <template v-else-if="name === 'link'">
      <path d="M10 13.9a4 4 0 0 0 5.7.1l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.6 1.6M14 10.1a4 4 0 0 0-5.7-.1l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'superscript'">
      <path d="m3.5 9 5.5 5.5m0-5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M14 5.1c.3-.9 1.1-1.5 2.1-1.5 1.2 0 2.1.8 2.1 1.8 0 1.1-.8 1.8-3.9 3.9h4.1" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'subscript'">
      <path d="m3.5 8.5 5.5 5.5m0-5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M14 15.5c.3-.9 1.1-1.5 2.1-1.5 1.2 0 2.1.8 2.1 1.8 0 1.1-.8 1.8-3.9 3.9h4.1" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'text-wrap'">
      <rect x="3.5" y="4" width="8.5" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M14.5 5h6M14.5 8h6M3.5 14.5h17M3.5 18.5h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'clear-format'">
      <path d="M5 5h14M8 5v3l-2.5 9h13L16 8V5M10 12h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m4 20 16-16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'align-left'">
      <path d="M4 6h16M4 10h11M4 14h16M4 18h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'align-center'">
      <path d="M4 6h16M7 10h10M4 14h16M7 18h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'align-right'">
      <path d="M4 6h16M9 10h11M4 14h16M11 18h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'align-justify'">
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'image-plus'">
      <rect x="3" y="4" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" /><circle cx="7.5" cy="8.5" r="1.3" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="m4.5 17 3.5-3.5 2.5 2.5 2.2-2.2 3.3 3.2M19 5v6M16 8h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'table'">
      <rect x="3.5" y="4" width="17" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.2 4v16M14.8 4v16" fill="none" stroke="currentColor" stroke-width="1.6" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="m15.4 15.4 4.3 4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'chevron-down'">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });
</script>

<style scoped>
.tiptap-toolbar-icon { display: block; flex: none; }
</style>
