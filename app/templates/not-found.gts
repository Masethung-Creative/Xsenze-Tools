import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import Icon from 'xsenze-tools/components/icon';

<template>
  {{pageTitle "Not found"}}
  <article class="page prose">
    <h2>Page not found</h2>
    <p>That tool or page doesn't exist (yet).</p>
    <LinkTo @route="index" class="button">
      <Icon @name="arrow-left" />
      Back to all tools
    </LinkTo>
  </article>
</template>
