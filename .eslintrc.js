module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['import'],
  env: {
    node: true,
  },
  rules: {
    'spaced-comment': ['warn', 'always', { markers: ['/'] }],
    'no-unused-vars': [1, { args: 'none', ignoreRestSiblings: true }],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'dir'] }],
    'no-await-in-loop': 0,
    'class-methods-use-this': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'import/order': [
      'error',
      {
        groups: [['builtin', 'external', 'internal']],
        'newlines-between': 'never',
      },
    ],
  },
};
