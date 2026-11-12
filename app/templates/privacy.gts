import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "Privacy"}}
  <article class="page prose">
    <h2>Nothing leaves your device</h2>
    <p>
      Every Xsenze tool runs on your own device, inside your browser. Files you
      open are read and processed locally using Web APIs such as Web Audio,
      WebCodecs and WebAssembly. They are never sent to a server.
    </p>
    <ul>
      <li>No accounts, logins or registration.</li>
      <li>No file uploads. Ever.</li>
      <li>No tracking cookies or analytics profiles.</li>
      <li>
        Preferences such as light or dark theme are stored only in your
        browser's local storage.
      </li>
    </ul>
  </article>
</template>
