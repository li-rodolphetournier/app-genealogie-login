module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@next/next/no-img-element': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-const': 'off'
  },
  ignorePatterns: [
    'pages/api/login.ts',
    'pages/api/genealogie/update.ts',
    'src/pages/api/login.ts',
    'pages/api/users/create.ts'
  ]
}; 