import { pageTitle } from 'ember-page-title';
import AppShell from 'xsenze-tools/components/app-shell';
import XzToast from 'xsenze-tools/components/xz/toast';

<template>
  {{pageTitle "Xsenze Tools"}}
  <AppShell>
    {{outlet}}
  </AppShell>
  <XzToast />
</template>
