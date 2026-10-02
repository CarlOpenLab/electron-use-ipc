<template>
  <div class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
    <p class="label">404</p>
    <h1 class="mt-3 text-3xl font-semibold text-foreground">No such page.</h1>
    <p class="mt-4 text-sm text-muted-foreground">
      That route does not exist. Try
      <RouterLink to="/docs/getting-started" class="text-foreground underline underline-offset-4">
        the documentation
      </RouterLink>
      instead.
    </p>
  </div>
</template>
