# Local test server for the game: like `python -m http.server`, but tells the browser not to cache,
# so a normal refresh always picks up edited js/css/map files.
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


import os
port = int(os.environ.get('PORT') or (sys.argv[1] if len(sys.argv) > 1 else 8123))   # PORT (set by launchers) wins over the argument
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler).serve_forever()
