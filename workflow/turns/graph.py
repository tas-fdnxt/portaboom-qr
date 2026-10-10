"""PORTABOOM QR key turns as a LangGraph StateGraph.

Every key turn of the PORTABOOM QR work (2026-10-08 .. 2026-10-10 AEDT) is a node built from turns.json:
Fabian's ask, what was built or changed, the commits and Drive/box artifacts, and the outcome.
Edges follow the decision lineage (each turn -> the turns that built on it). T10 (auto-start) fans out into
road / minions / the five-version fork / the Drive clean-up; T26 is the fork node where the QR-as-a-product
branch (track B) spins off after the recipe viewer (T25).

  python graph.py            # run the full graph, print turns in execution order
  python graph.py A|B        # only track A (PORTABOOM QR) or track B (QR product) turns, root-first
  python graph.py lineage T30   # the chain of turns that led to T30
  langgraph dev              # open in LangGraph Studio (see langgraph.json)
"""
from __future__ import annotations
import json, operator, sys
from pathlib import Path
from typing import Annotated, TypedDict

from langgraph.graph import StateGraph, START, END

DATA = json.loads((Path(__file__).resolve().parent / "turns.json").read_text())
TURNS = {t["id"]: t for t in DATA["turns"]}
ORDER = [t["id"] for t in DATA["turns"]]


class TurnState(TypedDict, total=False):
    track: str
    turns: Annotated[list, operator.add]


def _node(tid):
    t = TURNS[tid]
    rec = {k: t[k] for k in ("id", "when_aedt", "track", "kind", "ask", "change", "commits", "drive", "outcome", "parent")}

    def run(state: TurnState):
        return {"turns": [rec]}
    run.__name__ = tid
    return run


def _in_track(tid, track):
    tr = TURNS[tid]["track"]
    return track == "all" or track in tr or (track == "A" and tr == "A0")


def build(track: str = "all"):
    ids = [i for i in ORDER if _in_track(i, track)]
    g = StateGraph(TurnState)
    for i in ids:
        g.add_node(i, _node(i))
    children = {i: [] for i in ids}
    for i in ids:
        p = TURNS[i]["parent"]
        if p in children:
            children[p].append(i)
        else:
            g.add_edge(START, i)          # root of this track's subtree
    for i, kids in children.items():
        for k in kids:
            g.add_edge(i, k)
        if not kids:
            g.add_edge(i, END)
    return g.compile(name=f"portaboom_qr_turns_{track}")


def lineage(tid):
    out = []
    while tid:
        out.append(tid)
        tid = TURNS[tid]["parent"]
    return out[::-1]


GRAPHS = {k: build(k) for k in ("all", "A", "B")}
graph = GRAPHS["all"]

if __name__ == "__main__":
    arg = sys.argv[1:] or ["all"]
    if arg[0] == "lineage":
        for i in lineage(arg[1]):
            t = TURNS[i]
            print(f'{i}  {t["when_aedt"]:<22} [{t["track"]}] {t["ask"][:90]}')
        sys.exit()
    out = GRAPHS[arg[0]].invoke({"track": arg[0]})
    for t in out["turns"]:
        sha = ",".join(c["sha"] for c in t["commits"]) or "-"
        print(f'{t["id"]}  {t["when_aedt"]:<22} [{t["track"]:<3}] {t["kind"]:<11} <- {t["parent"] or "START":<5} {sha:<28} {t["outcome"][:40]}')
        print(f'      ask: {t["ask"][:110]}')
    print(f'\n{len(out["turns"])} turns executed ({arg[0]})')
