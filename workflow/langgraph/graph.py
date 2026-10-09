"""PORTABOOM QR recipe as LangGraph StateGraphs: one graph per version plus one for the build steps.

Generated from ../recipe.json (no logic of its own). Each node is a stub that appends the step it stands for
(label, the code lines in that version's file at the pinned commit, and the morph-config.json keys) to state["steps"],
so running a graph walks the recipe in order and returns it. Open it in LangGraph Studio with `langgraph dev`
from this folder (see langgraph.json), or print a graph with `python graph.py morph3`.
"""
from __future__ import annotations
import json, operator, sys
from pathlib import Path
from typing import Annotated, TypedDict

from langgraph.graph import StateGraph, START, END

RECIPE = json.loads((Path(__file__).resolve().parent.parent / "recipe.json").read_text())
NODES = {n["id"]: n for n in RECIPE["nodes"]}
VERSIONS = list(RECIPE["versions"])
BUILD = [n["id"] for n in RECIPE["nodes"] if n["group"] == "build"]


class RecipeState(TypedDict, total=False):
    version: str
    steps: Annotated[list, operator.add]


def _refs(code):
    out = []
    for c in code or []:
        if c.get("url"):
            lines = c["start"] if c["start"] == c["end"] else f'{c["start"]}-{c["end"]}'
            out.append({"symbol": c["symbol"], "where": f'{c["file"]}:{lines}', "url": c["url"]})
        else:
            out.append({"symbol": c["symbol"], "where": c.get("kind", ""), "what": c.get("what", "")})
    return out


def _stub(node_id, version):
    n = NODES[node_id]
    if version == "build":
        code, keys, note = n.get("code"), n["keys"], n.get("versions_note", "")
    else:
        st = next(s for s in RECIPE["versions"][version]["steps"] if s["node"] == node_id)
        code, keys, note = st["code"], st["keys"], st["note"] or n.get("overrides", {}).get(version, "")
    step = {"node": node_id, "label": n["label"], "purpose": n["purpose"], "note": note,
            "code": _refs(code), "config_keys": keys, "to_change": n["change"]}

    def run(state: RecipeState):
        return {"steps": [step]}
    run.__name__ = node_id
    return run


def build(version: str):
    """Compile the StateGraph for one version ('morph3', 'road', ...) or 'build' for the asset-build steps."""
    path = BUILD if version == "build" else RECIPE["versions"][version]["path"]
    g = StateGraph(RecipeState)
    for nid in path:
        g.add_node(nid, _stub(nid, version))
    g.add_edge(START, path[0])
    for a, b in zip(path, path[1:]):
        g.add_edge(a, b)
    g.add_edge(path[-1], END)
    return g.compile(name=f"portaboom_qr_{version}")


GRAPHS = {v: build(v) for v in VERSIONS + ["build"]}
graph = GRAPHS["morph3"]

if __name__ == "__main__":
    v = sys.argv[1] if len(sys.argv) > 1 else "morph3"
    out = GRAPHS[v].invoke({"version": v})
    for i, s in enumerate(out["steps"], 1):
        print(f'{i:2}. {s["label"]}  [{s["node"]}]')
        for c in s["code"]:
            print(f'      {c["where"]}  {c["symbol"]}')
        if s["config_keys"]:
            print("      keys: " + ", ".join(s["config_keys"]))
