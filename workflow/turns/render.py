"""Write graph.mmd (hand-laid Mermaid with track subgraphs) and graph_langgraph.mmd (LangGraph's own export)."""
import json, textwrap
from graph import TURNS, ORDER, GRAPHS
def lab(t):
    sha = (" · " + ",".join(c["sha"] for c in t["commits"][:2])) if t["commits"] else ""
    ask = textwrap.shorten(t["ask"].replace('"', "'"), 60, placeholder="…")
    out = textwrap.shorten(t["outcome"].replace('"', "'"), 34, placeholder="…")
    return f'{t["id"]} · {t["when_aedt"][5:]}{sha}<br/>{ask}<br/><i>{out}</i>'
L = ["flowchart TD"]
groups = {"A0": "Predecessor (Sept)", "A": "Track A · PORTABOOM QR", "B": "Track B · QR as a product", "A+B": "Clean-up"}
for g, name in groups.items():
    L.append(f'  subgraph {g.replace("+","_")}["{name}"]')
    for i in ORDER:
        t = TURNS[i]
        if t["track"] != g: continue
        shape = ('{{"%s"}}' if t["kind"] == "fork" else '["%s"]') % lab(t)
        L.append(f"    {i}{shape}")
    L.append("  end")
for i in ORDER:
    p = TURNS[i]["parent"]
    if p: L.append(f'  {p} {"==>|product branch|" if i=="T26" else "-->"} {i}')
cls = {"rej": [i for i in ORDER if "REJECTED" in TURNS[i]["outcome"]], "fix": [i for i in ORDER if TURNS[i]["outcome"].startswith("fixed")],
       "fork": [i for i in ORDER if TURNS[i]["kind"] == "fork"], "b": [i for i in ORDER if TURNS[i]["track"] == "B" and TURNS[i]["kind"] != "fork"]}
L += ["  classDef rej fill:#fde2e1,stroke:#c0392b", "  classDef fix fill:#fff4d6,stroke:#d68910", "  classDef fork fill:#ffe0b3,stroke:#e67e22,stroke-width:3px", "  classDef b fill:#e3f0ff,stroke:#2e6fd8"]
for c, ids in cls.items():
    if ids: L.append(f"  class {','.join(ids)} {c}")
open("graph.mmd", "w").write("\n".join(L) + "\n")
open("graph_langgraph.mmd", "w").write(GRAPHS["all"].get_graph().draw_mermaid())
print("ok")
