# react-app-rewired-single-spa

Use `single-spa` `systemjs` in your `create-react-app`.

> Quickly adapt `react-scripts` as a submodule of single-spa !!!  
> Support `react-scripts@4.x` `react-scripts@5.x` version.

## Features

- Support `react-scripts@5.x` compatible with common configuration migrations
- Output `systemjs` library auto add `SystemJSPublicPathPlugin`
- Support `ReactFastRefresh` hot refresh

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
  webpack: override(
    rewiredSingleSpa({
      orgName: "you",
      projectName: "test",
      reactPackagesAsExternal: true,
      peerDepsAsExternal: true,
      orgPackagesAsExternal: true,
    })
  ),
  devServer: overrideDevServer(rewiredSingleSpaDevServer()),
};
```

## Options

### orgName

Type: `string`  
The name of the organization this application is written for.

### projectName

Type: `string`  
The name of the current project. This usually matches the git repo's name.

### entry

Type: `string`  
Default: `src/{orgName}-{projectName}.{js|jsx|ts|tsx}` `src/index.{js|jsx|ts|tsx}`  
The entry file.

### outputFilename

Type: `string`  
Default:

- development `{orgName}-{projectName}.[contenthash:8].js`
- production `{orgName}-{projectName}.js`

### rootDirectoryLevel

Type: `number`  
This is the rootDirectoryLevel that is passed to https://github.com/joeldenning/systemjs-webpack-interop.

### reactPackagesAsExternal

Type: `boolean`  
This will `react` `react-dom` as webpack externals or not.

### orgPackagesAsExternal

Type: `boolean`  
This changes whether package names that start with @your-org-name are treated as webpack externals or not.

### peerDepsAsExternal

Type: `boolean`  
This will package.json `peerDependencies` as webpack externals or not.

## FQA

### FastRefresh invalid

- If `react` `react-dom` is external, `react-dev-tool` must be installed to refresh automatically.
  For details, please see https://github.com/facebook/react/issues/17552
- Check whether the ws connection is normal, you can set in `.env` file
  - `WDS_SOCKET_PORT` "2002"
  - `WDS_SOCKET_HOST` "localhost"
  - `WDS_SOCKET_PATH` "/projectName" **Please start with "/"**
    > The default hotreload client uses the relative website protocol,
    > which is the protocol of the main base. It can use the localhost
    > protocol and the local development port.

### webpack < 5 used to include polyfills for node.js core modules by default

The following packages have been integrated by default, and the specified dependencies can be installed directly in the project.

```json
{
  "url": "url",
  "fs": "fs",
  "assert": "assert",
  "crypto": "crypto-browserify",
  "http": "stream-http",
  "https": "https-browserify",
  "os": "os-browserify/browser",
  "buffer": "buffer",
  "stream": "stream-browserify"
}
```

### You attempted to import XXXXXXXX which falls outside of the project src/ directory

You can use `customize-cra` `removeModuleScopePlugin()`

### react@5.x postcss plugin error

You can use `customize-cra`

```js
adjustStyleLoaders(({ use: [, , postcss] }) => {
  const postcssOptions = postcss.options;
  postcss.options = { postcssOptions };
});
```

## License

MIT © [fupengl](https://github.com/fupengl)
