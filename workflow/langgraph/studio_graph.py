import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from graph import GRAPHS  # noqa: E402  (entry points for `langgraph dev` / Studio, one per version)

morph1 = GRAPHS["morph1"]
morph2 = GRAPHS["morph2"]
morph3 = GRAPHS["morph3"]
road = GRAPHS["road"]
minions = GRAPHS["minions"]
minions2 = GRAPHS["minions2"]
night = GRAPHS["night"]
blueprint = GRAPHS["blueprint"]
rain = GRAPHS["rain"]
domino = GRAPHS["domino"]
domino2 = GRAPHS["domino2"]
drone = GRAPHS["drone"]
build = GRAPHS["build"]
