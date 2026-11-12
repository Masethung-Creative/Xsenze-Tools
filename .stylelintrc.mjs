export default {
  extends: ['stylelint-config-standard'],
  // .scss files (crayon) need the scss parser
  customSyntax: 'postcss-scss',
  rules: {
    // crayon functions and @use/@forward are sass, not css
    'function-no-unknown': null,
    'at-rule-no-unknown': null,
    // BEM-style names: block__element--modifier
    'selector-class-pattern': null,
    // component styles are layered on top of app.scss on purpose
    'no-descending-specificity': null,
    // -webkit-font-smoothing has no standard equivalent
    'property-no-vendor-prefix': null,
  },
};
