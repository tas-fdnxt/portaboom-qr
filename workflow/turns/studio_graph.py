import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from graph import GRAPHS  # noqa: E402  (entry points for `langgraph dev` / Studio)

all_turns = GRAPHS["all"]
track_a = GRAPHS["A"]
track_b = GRAPHS["B"]
