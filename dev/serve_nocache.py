"""Dev server with no-cache headers.

  python dev/serve_nocache.py [port] [host]

Serves the project root. Default host 127.0.0.1 (this PC only); pass 0.0.0.0 to open it to your
Wi-Fi so a phone can play it (http://<this PC's IP>:<port>).
"""
import http.server
import os
import sys

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8131
HOST = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):
        pass


print(f"Rain of the Word test server: http://localhost:{PORT}  (host {HOST}, Ctrl+C to stop)", flush=True)
http.server.ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
