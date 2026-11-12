import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import BrandLogo from 'xsenze-tools/components/brand-logo';
import Omnibox from 'xsenze-tools/components/omnibox';
import IconBackdrop from 'xsenze-tools/components/icon-backdrop';
import ToolGrid from 'xsenze-tools/components/tool-grid';
import { toolCategories } from 'xsenze-tools/lib/tools';

<template>
  {{pageTitle "Home"}}
  <section class="hero">
    <IconBackdrop />
    <div class="hero__inner">
      <h2 class="hero__brand">
        <BrandLogo class="hero__logo" @size={{132}} />
        <span class="hero__wordmark">xsenze<span>tools</span></span>
      </h2>
      <Omnibox />
      <p class="hero__tagline">A collection of small, focused creative tools.</p>
      <p class="hero__fine">
        No logins, no paywalls, no uploads, no tracking.<br />
        Everything runs on your device.
        <LinkTo @route="privacy">How we handle privacy</LinkTo>.
      </p>
    </div>
  </section>

  <div class="page">
    <ToolGrid @categories={{toolCategories}} />
  </div>
</template>
