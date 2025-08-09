module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Enforce no semicolons
    'semi': ['error', 'never'],
    
    // Require semicolons only where they prevent ASI issues
    'semi-style': ['error', 'first'],
    
    // Other style preferences that might be relevant
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never']
  }
}