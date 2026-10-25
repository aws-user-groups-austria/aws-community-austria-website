import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * /live/ is a static folder (public/live/, the meetup web player), not a React route.
 * GitHub Pages serves it as plain files; this makes `vite` and `vite preview` do the same
 * instead of falling back to the SPA's index.html.
 */
function liveStaticFolder(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const request = req as { url?: string };
    const [path, query] = (request.url ?? "").split("?", 2);
    if (path === "/live") {
      res.statusCode = 301;
      res.setHeader("Location", `/live/${query ? `?${query}` : ""}`);
      res.end();
      return;
    }
    if (path === "/live/") request.url = `/live/index.html${query ? `?${query}` : ""}`;
    next();
  };
  return {
    name: "live-static-folder",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), liveStaticFolder()],
  base: "/",
  server: { port: 5173 },
});
