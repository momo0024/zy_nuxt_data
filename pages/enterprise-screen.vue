<template>
  <ClientOnly>
    <div class="es-embed">
      <iframe
        class="es-frame"
        :src="datavUrl"
        title="数据大屏"
        allow="fullscreen"
        referrerpolicy="no-referrer-when-downgrade"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', middleware: ['auth'], keepalive: false, ssr: false })

const config = useRuntimeConfig()

const datavUrl = computed(() => {
  const url = String(config.public.datavUrl || '').trim()
  return url || 'http://localhost:5173/sc-datav/'
})
</script>

<style scoped>
.es-embed {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0c1522;
}

.es-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #0c1522;
}
</style>
