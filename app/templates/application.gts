import { pageTitle } from 'ember-page-title';
import AppShell from 'xsenze-tools/components/app-shell';

<template>
  {{pageTitle "Xsenze Tools"}}
  <AppShell>
    {{outlet}}
  </AppShell>
</template>
