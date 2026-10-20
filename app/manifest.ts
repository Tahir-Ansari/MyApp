import type { MetadataRoute } from "next";

// Keep in sync with the dark background token in globals.css so the launch splash matches the app.
const NAVY = "#0b1020";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Docker & Kubernetes Quest",
    short_name: "DevOps Quest",
    description:
      "Learn Docker and Kubernetes through short missions, quizzes, and a simulated terminal. Works offline; progress stays on this device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: NAVY,
    theme_color: NAVY,
    categories: ["education", "developer", "productivity"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Continue learning", short_name: "Learn", url: "/learn", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Terminal playground", short_name: "Playground", url: "/playground", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Glossary", short_name: "Glossary", url: "/glossary", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
