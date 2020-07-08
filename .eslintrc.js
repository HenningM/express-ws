'use strict';

module.exports = {
  extends: 'airbnb/base',
  overrides: [
    {
      files: '.eslintrc.js',
      parserOptions: {
        sourceType: 'script'
      },
      // airbnb's config here is too inflexible as it prevents strict mode
      //  even with scripts, so set to `safe`
      // Changed: https://github.com/airbnb/javascript/pull/1962
      rules: {
        strict: ['error', 'safe']
      }
    },
    {
      files: ['examples/**'],
      rules: {
        'no-console': 0
      }
    },
    {
      files: ['test/**'],
      env: {
        mocha: true
      },
      globals: {
        expect: true
      },
      rules: {
        'no-console': 0,
        // Is otherwise reporting in Atom ESLint linter (though not on command line)
        'import/no-extraneous-dependencies': 0
      }
    }
  ],
  rules: {
    'comma-dangle': 0,
    'no-param-reassign': 0
  }
};
