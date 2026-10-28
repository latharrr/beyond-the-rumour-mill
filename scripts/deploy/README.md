# VPS release safety

Do not build `.next` in a directory served by a running Next process.

Build each commit in `/opt/btrm/releases/<sha>` with its own `.next`, using a local hardlinked dependency snapshot (not a symlink outside Turbopack's project root). Copy only private environment files on the server, never commit them. Preserve hashed static assets in `/opt/btrm/static`, served by the canonical nginx host with immutable caching so open clients retain old assets.

The canonical proxy needs `proxy_buffer_size 32k`, `proxy_buffers 8 32k`, and `proxy_busy_buffers_size 64k`: Google session cookies can exceed nginx's default upstream response-header buffer. Without this, a successful OAuth exchange can still return nginx 502 and burn its one-time code.

Coordinate a restart-free real-auth acceptance window. A bare `/login` 200 is not an OAuth test. Check a fresh complete callback and signed-in session, and never replay callback codes. Prefer a separately health-checked loopback candidate plus graceful nginx upstream swap to avoid restart gaps. Keep the old process until in-flight requests finish; retain a rollback release. Changes must affect only BTRM's named host/services, not other sites.
