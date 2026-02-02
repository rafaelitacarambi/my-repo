// @ts-check
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import wix from "@wix/astro";
import dynamicDataPlugin from "@wix/babel-plugin-jsx-dynamic-data";
import sourceAttrsPlugin from "@wix/babel-plugin-jsx-source-attrs";
import cloudProviderFetchAdapter from "@wix/cloud-provider-fetch-adapter";
import monitoring from "@wix/monitoring-astro";
import postcssPseudoToData from "@wix/postcss-pseudo-to-data";
import { defineConfig } from "astro/config";
import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";

const isBuild = process.env.NODE_ENV == "production";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    {
      name: "framewire",
      hooks: {
        "astro:config:setup": ({ injectScript, command }) => {
          if (command === "dev") {
            injectScript(
              "page",
              `import loadFramewire from "framewire.js";
              loadFramewire(true);`
            );
          }
        },
      },
    },
    tailwind(),
    wix({
      htmlEmbeds: isBuild,
      auth: true,
    }),
    ...(isBuild ? [monitoring()] : []),
    react(isBuild ? {} : {
      babel: { plugins: [sourceAttrsPlugin, dynamicDataPlugin] },
    }),
  ],
  vite: {
    plugins: [customErrorOverlayPlugin()],
    cacheDir: 'node_modules/.cache/.vite',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'framer-motion',
        'date-fns',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
        '@radix-ui/*',
        '@wix/*',
        'zod',
      ],
    },
    css: !isBuild ? {
      postcss: {
        plugins: [
          postcssPseudoToData(),
        ],
      },
    } : undefined,
  },
  ...(isBuild && { adapter: cloudProviderFetchAdapter({}) }),
  devToolbar: {
    enabled: false,
  },
  image: {
    domains: ["static.wixstatic.com"],
  },
  server: {
    allowedHosts: true,
    host: true,
  },
  security: {
    checkOrigin: false
  }
});
