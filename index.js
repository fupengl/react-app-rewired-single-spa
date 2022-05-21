const fs = require("fs");
const path = require("path");
const { paths } = require("react-app-rewired");
const webpack = require("webpack");
const SystemJSPublicPathPlugin = require("systemjs-webpack-interop/SystemJSPublicPathWebpackPlugin");

module.exports = rewiredSingleSpa;

function rewiredSingleSpa({ orgName, projectName, entry, outputFilename, rootDirectoryLevel }) {
    if (typeof orgName !== "string") {
        throw Error(
            `react-app-rewired-single-spa params requires "orgName" string`
        );
    }
    if (typeof projectName !== "string") {
        throw Error(
            `react-app-rewired-single-spa params requires "projectName" string`
        );
    }

    const webpackMajorVersion = getWebpackMajorVersion();
    const defaultPKGName = `${orgName}-${projectName}`;

    const entry =
        entry ||
        getExistFile({
            cwd: process.cwd(),
            returnRelative,
            files: [
                `src/${defaultPKGName}.jsx`,
                `src/${defaultPKGName}.tsx`,
                `src/${defaultPKGName}.js`,
                `src/${defaultPKGName}.ts`,
                "src/index.jsx",
                "src/index.tsx",
                "src/index.ts",
                "src/index.js",
            ],
        });

    return function (config, webpackEnv) {
        const isEnvProduction =
            (webpackEnv || process.env.BABEL_ENV) === "production";

        // amend input output
        config.output = {
            ...config.output,
            filename: `${outputFilename}${isEnvProduction ? ".[contenthash:8]" : ""
                }.js`,
            publicPath: paths.publicUrlOrPath,
            libraryTarget: "system",
            devtoolNamespace: `${orgName}-${projectName}`,
        };
        if (webpackMajorVersion < 5) {
            // support reactFastRefresh
            config.entry = isEnvProduction
                ? entry
                : [require.resolve("react-dev-utils/webpackHotDevClient"), entry];
            config.jsonpFunction = `webpackJsonp_${safeVarName(projectName)}`;
            config.hotUpdateFunction = `webpackHotUpdate_${safeVarName(projectName)}`;
        } else {
            config.entry = entry;
            config.chunkLoadingGlobal = `webpackJsonp_${safeVarName(projectName)}`;
            config.hotUpdateGlobal = `webpackHotUpdate_${safeVarName(projectName)}`;
        }

        // amend module
        if (webpackMajorVersion < 5) {
            // @see https://github.com/systemjs/systemjs#compatibility-with-webpack
            config.module.rules.unshift({ parser: { system: false } });
        }

        // amend optimization
        config.optimization.splitChunks = {
            chunks: "async",
            cacheGroups: { default: false },
        };
        if (webpackMajorVersion < 5) {
            config.optimization.moduleIds = true;
            config.optimization.chunkIds = true;
        } else {
            config.optimization.moduleIds = "named";
            config.optimization.chunkIds = "named";
        }
        delete optimization.runtimeChunk;

        // amend plugins
        config.plugins = config.plugins.filter((plugin) => {
            return !['HtmlWebpackPlugin', 'GenerateSW', 'InterpolateHtmlPlugin'].includes(
                plugin.constructor.name,
            );
        });
        config.plugins.push(new SystemJSPublicPathPlugin({
            systemjsModuleName: `@${orgName}/${projectName}`,
            rootDirectoryLevel: rootDirectoryLevel
        }))
    };
}

function getWebpackMajorVersion() {
    return webpack.version.split(".")[0];
}

function safeVarName(key) {
    return key.replace(/(\/|\@|\-)/g, "_");
}

function getExistFile({ cwd, files, returnRelative }) {
    for (const file of files) {
        const absFilePath = path.join(cwd, file);
        if (fs.existsSync(absFilePath)) {
            return returnRelative ? file : absFilePath;
        }
    }
}
