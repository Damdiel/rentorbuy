export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Strip /rentorbuy prefix for asset lookup
    if (url.pathname.startsWith('/rentorbuy')) {
      url.pathname = url.pathname.replace('/rentorbuy', '') || '/';
    }

    // Serve static assets
    return env.ASSETS.fetch(new Request(url, request));
  }
}
