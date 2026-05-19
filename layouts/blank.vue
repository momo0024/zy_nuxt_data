<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<style>
.blank-layout {
  min-height: 100vh;
  background: var(--bg, #f1f5f9);
}
</style>