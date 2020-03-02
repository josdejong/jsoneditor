module.exports = {
  printWidth: 120,
  semi: false,
  singleQuote: true,
  tabWidth: 4,
  trailingComma: "es5",
  overrides: [
    {
      files: "*.scss",
      options: {
        singleQuote: false
      }
    }
  ]
};
