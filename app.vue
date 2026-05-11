<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

onMounted(() => {
  authStore.loadFromStorage()
  settingsStore.loadFromStorage()
})
</script>
