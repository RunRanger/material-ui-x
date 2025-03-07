const playwright = require('playwright');
const webpack = require('webpack');

const CI = Boolean(process.env.CI);
// renovate PRs are based off of upstream branches.
// Their CI run will be a branch based run not PR run and therefore won't have a CIRCLE_PR_NUMBER
const isPR = Boolean(process.env.CIRCLE_PULL_REQUEST);

let build = `mui-x local ${new Date().toISOString()}`;

if (process.env.CIRCLECI) {
  const buildPrefix =
    process.env.CIRCLE_PR_NUMBER !== undefined
      ? process.env.CIRCLE_PR_NUMBER
      : process.env.CIRCLE_BRANCH;
  build = `${buildPrefix}: ${process.env.CIRCLE_BUILD_URL}`;
}

const browserStack = {
  // |commits in PRs| >> |Merged commits|.
  // Since we have limited resources on browserstack we often time out on PRs.
  // However, browserstack rarely fails with a true-positive so we use it as a stop gap for release not merge.
  // But always enable it locally since people usually have to explicitly have to expose their browserstack access key anyway.
  enabled: !CI || !isPR || process.env.BROWSERSTACK_FORCE === 'true',
  username: process.env.BROWSERSTACK_USERNAME,
  accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
  build,
  // https://github.com/browserstack/api#timeout300
  timeout: 6 * 60, // Maximum time before a worker is terminated. Default 5 minutes.
};

process.env.CHROME_BIN = playwright.chromium.executablePath();

// BrowserStack rate limit after 1600 calls every 5 minutes.
// Per second, https://www.browserstack.com/docs/automate/api-reference/selenium/introduction#rest-api-projects
const MAX_REQUEST_PER_SECOND_BROWSERSTACK = 1600 / (60 * 5);
// Estimate the max number of concurrent karma builds
// For each PR, 4 concurrent builds are used, only one is using BrowserStack.
const AVERAGE_KARMA_BUILD = 1 / 4;
// CircleCI accepts up to 83 concurrent builds.
const MAX_CIRCLE_CI_CONCURRENCY = 83;

// Karma configuration
module.exports = function setKarmaConfig(config) {
  const baseConfig = {
    basePath: '../',
    browsers: ['chromeHeadless'],
    browserDisconnectTimeout: 3 * 60 * 1000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 6 * 60 * 1000, // default 10000
    colors: true,
    client: {
      mocha: {
        // Some BrowserStack browsers can be slow.
        timeout: (process.env.CIRCLECI === 'true' ? 5 : 2) * 1000,
      },
    },
    frameworks: ['mocha', 'webpack'],
    files: [
      {
        pattern: 'test/karma.tests.js',
        watched: true,
        served: true,
        included: true,
      },
    ],
    plugins: ['karma-mocha', 'karma-chrome-launcher', 'karma-sourcemap-loader', 'karma-webpack'],
    /**
     * possible values:
     * - config.LOG_DISABLE
     * - config.LOG_ERROR
     * - config.LOG_WARN
     * - config.LOG_INFO
     * - config.LOG_DEBUG
     */
    logLevel: config.LOG_INFO,
    port: 9876,
    preprocessors: {
      'test/karma.tests.js': ['webpack', 'sourcemap'],
    },
    reporters: ['dots'],
    webpack: {
      mode: 'development',
      devtool: CI ? 'inline-source-map' : 'eval-source-map',
      target: 'web',
      optimization: {
        nodeEnv: false, // https://twitter.com/wsokra/status/1378643098893443072
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"test"',
            CI: JSON.stringify(process.env.CI),
            KARMA: 'true',
          },
        }),
      ],
      module: {
        rules: [
          {
            test: /\.(js|ts|tsx)$/,
            loader: 'babel-loader',
            exclude: /node_modules\/(?!@mui\/monorepo)/,
          },
        ],
      },
      resolve: {
        extensions: ['.js', '.ts', '.tsx'],
        fallback: {
          fs: false, // Some tests import fs,
          stream: false,
          path: false,
        },
      },
    },
    webpackMiddleware: {
      noInfo: true,
      writeToDisk: CI,
    },
    customLaunchers: {
      chromeHeadless: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: CI,
  };

  let newConfig = baseConfig;

  if (browserStack.enabled && browserStack.accessKey) {
    newConfig = {
      ...baseConfig,
      browserStack,
      browsers: baseConfig.browsers.concat(['chrome', 'firefox', 'safari', 'edge']),
      plugins: baseConfig.plugins.concat(['karma-browserstack-launcher']),
      customLaunchers: {
        ...baseConfig.customLaunchers,
        chrome: {
          base: 'BrowserStack',
          os: 'OS X',
          os_version: 'Catalina',
          browser: 'chrome',
          // We support Chrome 90.x
          // However, >=88 fails on seemingly all focus-related tests.
          // TODO: Investigate why.
          browser_version: '87.0',
        },
        firefox: {
          base: 'BrowserStack',
          os: 'Windows',
          os_version: '10',
          browser: 'firefox',
          browser_version: '78.0',
        },
        safari: {
          base: 'BrowserStack',
          os: 'OS X',
          os_version: 'Catalina',
          browser: 'safari',
          // We support 12.5 on iOS.
          // However, 12.x is very flaky on desktop (mobile is always flaky).
          browser_version: '13.0',
        },
        edge: {
          base: 'BrowserStack',
          os: 'Windows',
          os_version: '10',
          browser: 'edge',
          browser_version: '91.0',
        },
      },
    };

    // -1 because chrome headless runs in the local machine
    const browserstackBrowsersUsed = newConfig.browsers.length - 1;

    // default 1000, Avoid Rate Limit Exceeded
    newConfig.browserStack.pollingTimeout =
      ((MAX_CIRCLE_CI_CONCURRENCY * AVERAGE_KARMA_BUILD * browserstackBrowsersUsed) /
        MAX_REQUEST_PER_SECOND_BROWSERSTACK) *
      1000;
  }

  config.set(newConfig);
};
