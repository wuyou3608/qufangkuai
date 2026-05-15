import http.server
import socketserver

class NoCacheRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 禁用缓存
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        return super().end_headers()

PORT = 8000

with socketserver.TCPServer(("", PORT), NoCacheRequestHandler) as httpd:
    print(f"Serving no-cache HTTP on port {PORT}")
    httpd.serve_forever()
