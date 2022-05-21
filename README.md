# react-app-rewired-single-spa

Use `single-spa` `systemjs` in your `create-react-app`.

> It is recommended to use the development mode to ensure stability !!!

## Installation

```bash
npm i react-app-rewired-single-spa -D
```

## Usage

This project is based on [`react-app-rewired`](https://github.com/timarney/react-app-rewired).

```js
/* config-overrides.js */

const rewiredSingleSpa = require("react-app-rewired-single-spa");

module.exports = function override(config, env) {
  // your config ...
  return rewiredSingleSpa()(config, env);
};

// use `customize-cra`
const { override } = require("customize-cra");

module.exports = override(rewiredSingleSpa());
```

## License

MIT © [fupengl](https://github.com/fupengl)
