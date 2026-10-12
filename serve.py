# -*- coding: utf-8 -*-
"""
回家种苞米 · 本地预览服务

和 `python -m http.server` 的区别：

  1) 代码文件（html/css/js）发 Cache-Control: no-store
     —— 浏览器不会拿旧的代码糊弄你
  2) 提供一个 /__build 接口，内容是"代码文件的修改时间"算出的短版本号
     —— 页面会轮询它，**代码一改，页面自动重载**，手机上不用手动刷新
  3) 图片照常缓存一天 —— 手机不用每次重下十几 MB
  4) 多线程 —— 图片并行下载

用法：  python serve.py [端口]     默认 8080，绑定 0.0.0.0（局域网可访问）
"""

import hashlib
import http.server
import os
import socketserver
import sys
import time

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))

NO_STORE_EXT = (".html", ".htm", ".css", ".js", ".mjs", ".json", ".map")
CODE_EXT = (".html", ".htm", ".css", ".js", ".mjs")

_token = {"at": 0.0, "val": ""}


def code_token():
    """把项目里所有 html/css/js 的修改时间揉成一个短版本号。
    改任何一个代码文件，这个号都会变。"""
    now = time.time()
    if now - _token["at"] < 1.0:
        return _token["val"]

    h = hashlib.md5()
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "preview", "node_modules")]
        for name in sorted(filenames):
            if name.lower().endswith(CODE_EXT):
                path = os.path.join(dirpath, name)
                try:
                    h.update(name.encode("utf-8"))
                    h.update(str(os.path.getmtime(path)).encode())
                except OSError:
                    pass

    _token["at"] = now
    _token["val"] = h.hexdigest()[:12]
    return _token["val"]


class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        # 版本号接口：页面轮询它，变了就自动重载
        if self.path.split("?")[0] == "/__build":
            body = code_token().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        path = self.path.split("?")[0].split("#")[0]
        name = os.path.basename(path)

        if path.endswith("/") or "." not in name or name.lower().endswith(NO_STORE_EXT):
            # 代码：绝对不缓存
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            # 图片等：缓存一天
            self.send_header("Cache-Control", "public, max-age=86400")

        super().end_headers()

    def log_message(self, fmt, *args):
        # 只打 4xx/5xx，别把窗口刷满
        try:
            code = args[1]
        except Exception:
            code = ""
        if str(code).startswith(("4", "5")):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print("服务已启动： http://localhost:%d/" % PORT)
        print("目录： %s" % ROOT)
        print("版本号： %s  （代码一改这个号就变，页面会自动重载）" % code_token())
        print("按 Ctrl+C 停止。")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。")