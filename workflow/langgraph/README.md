# PORTABOOM QR recipe as LangGraph

One StateGraph per version (morph1 ... drone) plus `build` for the asset-build steps, generated from `../recipe.json`.
Each node is a stub: running a graph walks the version's steps in order and returns, for each step, the code lines
in that version's file (pinned commit), the morph-config.json keys, and what to change.

    pip install -r requirements.txt
    python graph.py road          # print the road recipe
    langgraph dev                 # open every version in LangGraph Studio (langgraph.json)

- `graph.py`: builds the graphs (`GRAPHS["road"]`, `graph` = morph3)
- `studio_graph.py`, `langgraph.json`: Studio entry points, one per version
- `graph.mmd` / `graph.png`: morph3; `graphs/<version>.mmd|png`: every version (LangGraph's own Mermaid export)
- Labelled, colour-coded versions of the same graphs (own steps in orange) are in `../graphs/`.
