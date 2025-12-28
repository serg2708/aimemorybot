import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   ppr: true,
  // },
  // NOTE: PPR temporarily disabled due to CVE-2025-66478 security fix
  // PPR is only available in canary versions, but we need stable patched version
  // Re-enable when stable versions support PPR
  transpilePackages: [
    "@autonomys/auto-drive",
    "@autonomys/auto-utils",
  ],
  // Force @autonomys packages to use browser version
  experimental: {
    esmExternals: "loose",
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Ignore React Native dependencies and AutoDrive on server
    if (isServer) {
      // Completely ignore @autonomys/auto-drive on server to prevent SSR errors
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@autonomys\/auto-drive$/,
        })
      );

      // Server-side fallbacks (minimal)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    } else {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@react-native-async-storage\/async-storage$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^react-native$/,
        })
      );

      // Add polyfills for Web3 libraries
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // Don't disable crypto - it's needed for Web3
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify/browser"),
        buffer: require.resolve("buffer/"),
      };

      // Provide Buffer globally for Web3 libraries
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }

    // Alias React Native modules to empty modules
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "react-native": false,
      "react-native-device-info": false,
      "react-native-randombytes": false,
    };

    // Force @autonomys/auto-drive to use browser version on both client and server
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@autonomys/auto-drive$": require.resolve("@autonomys/auto-drive/dist/browser.js"),
      };
    }

    // Suppress wallet extension conflicts warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
};

export default nextConfig;
