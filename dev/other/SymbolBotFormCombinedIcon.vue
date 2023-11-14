<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="relative">
    <SymbolBotIcon class="w-8 h-8" />
    <div class="absolute bottom-0 right-0 mb-0 ml-1 rounded-lg bgCol">
      <FormOutline class="h-5 w-5" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { SymbolBotIcon, FormOutline } from "/@/modulesVue/useIcons/index";
</script>
<style scoped>
.bgCol {
  background-color: var(--aby-bg-color-basecontrast);
}
</style>
