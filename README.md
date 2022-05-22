# react-app-rewired-single-spa

Use `single-spa` `systemjs` in your `create-react-app`.

> Quickly adapt cra as a submodule of single-spa !!!

## Installation

```bash
npm i react-app-rewired-single-spa -D
```

## Usage

This project is based on [`react-app-rewired`](https://github.com/timarney/react-app-rewired).

```js
/* config-overrides.js */

const {
  rewiredSingleSpa,
  rewiredSingleSpaDevServer,
} = require("react-app-rewired-single-spa");

module.exports = {
  webpack: rewiredSingleSpa(),
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      return rewiredSingleSpaDevServer()(config);
    };
  },
};

// use `customize-cra`
const { override, overrideDevServer } = require("customize-cra");

module.exports = {
  webpack: override(rewiredSingleSpa()),
  devServer: overrideDevServer(rewiredSingleSpaDevServer()),
};
```

## License

MIT © [fupengl](https://github.com/fupengl)
