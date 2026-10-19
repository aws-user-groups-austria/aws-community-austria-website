import { existsSync } from "fs";
import { resolve } from "path";
import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * /present/ is a static folder (public/present/, the room-screen player), not a React route.
 * GitHub Pages serves it as plain files; this makes `vite` and `vite preview` do the same
 * instead of falling back to the SPA's index.html.
 */
function presentStaticFolder(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const request = req as { url?: string };
    const [path, query] = (request.url ?? "").split("?", 2);
    if (path === "/present") {
      res.statusCode = 301;
      res.setHeader("Location", `/present/${query ? `?${query}` : ""}`);
      res.end();
      return;
    }
    if (path === "/present/") request.url = `/present/index.html${query ? `?${query}` : ""}`;
    next();
  };
  return {
    name: "present-static-folder",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

/**
 * `vite preview` like GitHub Pages: /meetups/<id> redirects to /meetups/<id>/ when the
 * build has a folder with an index.html there (written by scripts/prerender-meetups.mjs),
 * so a reload gets that page's prerendered HTML instead of the SPA fallback.
 */
function folderRedirects(): Plugin {
  return {
    name: "folder-redirects",
    configurePreviewServer(server) {
      const outDir = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const [path, query] = (req.url ?? "").split("?", 2);
        if (path && path !== "/" && !path.endsWith("/") && !path.includes(".") && !path.includes("..")) {
          if (existsSync(resolve(outDir, `.${decodeURIComponent(path)}`, "index.html"))) {
            res.statusCode = 301;
            res.setHeader("Location", `${path}/${query ? `?${query}` : ""}`);
            res.end();
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), presentStaticFolder(), folderRedirects()],
  base: "/",
  server: { port: 5173 },
});
