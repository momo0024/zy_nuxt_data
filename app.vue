<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

onMounted(() => {
  authStore.loadFromStorage()
  settingsStore.loadFromStorage()
})
</script>
