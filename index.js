const fs = require("fs");
const path = require("path");
const { paths } = require("react-app-rewired");
const webpack = require("webpack");
const SystemJSPublicPathPlugin = require("systemjs-webpack-interop/SystemJSPublicPathWebpackPlugin");

module.exports.rewiredSingleSpa = rewiredSingleSpa;
module.exports.rewiredSingleSpaDevServer = rewiredSingleSpaDevServer;

function rewiredSingleSpa({
    orgName,
    projectName,
    entry,
    outputFilename,
    rootDirectoryLevel,
    reactPackagesAsExternal,
    orgPackagesAsExternal,
    peerDepsAsExternal,
}) {
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
    const combinedName = `${orgName}-${projectName}`;
    const pkgJson = require(paths.appPackageJson);

    const inputEntry = entry
        ? path.resolve(entry)
        : getExistFile({
            cwd: process.cwd(),
            returnRelative: true,
            files: [
                `src/${combinedName}.jsx`,
                `src/${combinedName}.tsx`,
                `src/${combinedName}.js`,
                `src/${combinedName}.ts`,
                "src/index.jsx",
                "src/index.tsx",
                "src/index.ts",
                "src/index.js",
            ],
        });

    return function (config, webpackEnv = process.env.BABEL_ENV) {
        const isEnvProduction = webpackEnv === "production";

        // amend input output
        config.output = {
            ...config.output,
            filename: `${outputFilename || combinedName}${isEnvProduction ? ".[contenthash:8]" : ""
                }.js`,
            publicPath: paths.publicUrlOrPath,
            libraryTarget: "system",
            devtoolNamespace: `${orgName}-${projectName}`,
        };
        if (webpackMajorVersion < 5) {
            // support reactFastRefresh
            config.entry = isEnvProduction
                ? inputEntry
                : [require.resolve("react-dev-utils/webpackHotDevClient"), inputEntry];
            config.output.jsonpFunction = `webpackJsonp_${safeVarName(projectName)}`;
            config.output.hotUpdateFunction = `webpackHotUpdate_${safeVarName(
                projectName
            )}`;
        } else {
            config.entry = inputEntry;
            config.output.chunkLoadingGlobal = `webpackJsonp_${safeVarName(
                projectName
            )}`;
            config.output.hotUpdateGlobal = `webpackHotUpdate_${safeVarName(
                projectName
            )}`;
            // window will become globalThis
            config.output.globalObject = "self";
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
            config.optimization.namedModules = true;
            config.optimization.namedChunks = true;
        } else {
            config.optimization.moduleIds = "named";
            config.optimization.chunkIds = "named";
        }
        delete config.optimization.runtimeChunk;

        // amend plugins
        const plugins = config.plugins.filter((plugin) => {
            return ![
                "HtmlWebpackPlugin",
                "GenerateSW",
                "InterpolateHtmlPlugin",
                "MiniCssExtractPlugin",
            ].includes(plugin.constructor.name);
        });
        plugins.push(
            new SystemJSPublicPathPlugin({
                systemjsModuleName: `@${orgName}/${projectName}`,
                rootDirectoryLevel: rootDirectoryLevel,
            })
        );
        config.plugins = plugins;

        // process externals
        const externals = [];
        if (config.externals) {
            if (Array.isArray(config.externals)) {
                externals.push(...config.externals);
            } else {
                externals.push(config.externals);
            }
        }
        if (!!reactPackagesAsExternal) {
            externals.push("react", "react-dom");
        }
        if (!!orgPackagesAsExternal) {
            externals.push(new RegExp(`^@${orgName}/`));
        }
        if (!!peerDepsAsExternal) {
            externals.push(...Object.keys(pkgJson.peerDepsAsExternal || {}));
        }
        externals.push("single-spa");
        config.externals = externals;

        // process alias
        if (webpackMajorVersion < 5) {
            Object.assign(config.resolve.alias, {
                // alias parcel
                "single-spa-react/parcel": "single-spa-react/lib/esm/parcel.js",
            });
        }

        disableCSSExtraction(config);

        // for wp5
        // https://stackoverflow.com/questions/64557638/how-to-polyfill-node-core-modules-in-webpack-5
        if (webpackMajorVersion == 5) {
            config.plugins.push(
                new webpack.ProvidePlugin({
                    process: "process/browser.js",
                    Buffer: ["buffer", "Buffer"],
                })
            );
            config.resolve.fallback = Object.assign(config.resolve.fallback || {}, {
                url: require.resolve("url"),
                fs: require.resolve("fs"),
                assert: require.resolve("assert"),
                crypto: require.resolve("crypto-browserify"),
                http: require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                os: require.resolve("os-browserify/browser"),
                buffer: require.resolve("buffer"),
                stream: require.resolve("stream-browserify"),
            });
        }

        return config;
    };
}

function rewiredSingleSpaDevServer() {
    const webpackMajorVersion = getWebpackMajorVersion();

    return function (config) {
        config.historyApiFallback = true;
        if (webpackMajorVersion < 5) {
            config.headers = {
                ...config.headers,
                "Access-Control-Allow-Origin": "*",
            };
            config.compress = true;
        } else {
            config.allowedHosts = "all";
            config.webSocketServer = {
                type: "ws",
                options: { path: process.env.WDS_SOCKET_PATH || "/ws" },
            };
        }
        return config;
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

function disableCSSExtraction(config) {
    for (const rule of config.module.rules) {
        if (rule.oneOf) {
            rule.oneOf.forEach((x) => {
                if (x.use && Array.isArray(x.use)) {
                    x.use.forEach((use) => {
                        if (use.loader && use.loader.includes("mini-css-extract-plugin")) {
                            use.loader = require.resolve("style-loader/dist/cjs.js");
                            delete use.options;
                        }
                    });
                }
            });
        }
    }
}
