import os, sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
MM = Path(os.environ.get("MERMAID_JS", "node_modules/mermaid/dist/mermaid.min.js")).read_text()  # npm i mermaid
for src, out in [("graph.mmd", "graph.png"), ("graph_langgraph.mmd", "graph_langgraph.png")]:
    code = Path(src).read_text()
    html = f"""<html><body style="margin:0;background:#fff"><div id=c></div><script>{MM}</script>
<script>mermaid.initialize({{startOnLoad:false,flowchart:{{htmlLabels:true,useMaxWidth:false}},themeVariables:{{fontSize:'15px'}}}});
mermaid.render('g',{json.dumps(code)}).then(r=>{{document.getElementById('c').innerHTML=r.svg;window.done=1}}).catch(e=>{{window.err=String(e)}});</script></body></html>"""
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None); pg = b.new_page(device_scale_factor=1.5, viewport={"width": 1400, "height": 1000})
        pg.set_content(html); pg.wait_for_function("window.done||window.err", timeout=30000)
        err = pg.evaluate("window.err||''")
        if err: sys.exit(f"{src}: {err}")
        pg.locator("#c svg").screenshot(path=out); b.close()
    print(out)
