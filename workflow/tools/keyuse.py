"""Map every morph-config.json key to the code lines that read it (direct CFG paths, section aliases, nightC/bpC colour helpers, base overrides, minions2/domino2 overlays)."""
import json,re,sys,os

def key_uses(R, funcs):
    ALIAS={
     'app-road.js':{'ROAD_CFG':'road'},
     'app-drone.js':{'ROAD_CFG':'road','DRONE':'drone'},
     'app-night.js':{'NIGHT_CFG':'night','NIGHT_COL':'night.colours'},
     'app-blueprint.js':{'BP_CFG':'blueprint','BP_COL':'blueprint.colours'},
     'app-rain.js':{'RAIN_CFG':'rain','RAIN_COL':'rain.colours'},
     'app-minions.js':{'M':'minions'},
     'app-domino.js':{'M':'minions','D':'domino'},
     'app-domino2.js':{'M':'minions','D':'domino'},
     'road-scene.js':{'cfg':'road','C':'road.colours'},
     'drone-scene.js':{'cfg':'road','C':'road.colours'},
    }
    cfgjson=json.load(open(os.path.join(R,'morph-config.json')))
    def owner(f,ln):
        for x in funcs.get(f,{}).get('funcs',[]):
            if x['start']<=ln<=x['end']: return x['name']
        return '(top level)'
    uses={}
    hidden={}  # key -> list of (file, line, func)
    files=['app.js','app3.js','app-road.js','app-minions.js','app-night.js','app-blueprint.js','app-rain.js','app-domino.js','app-domino2.js','app-drone.js','road-scene.js','drone-scene.js']
    for f in files:
        lines=open(os.path.join(R,f)).read().split('\n')
        al=ALIAS.get(f,{})
        pats=[(re.compile(r'\bCFG\??((?:\??\.[A-Za-z_]\w*)+)'),'')]
        for a,sec in al.items():
            pats.append((re.compile(r'(?<![\w.])'+re.escape(a)+r'\??((?:\??\.[A-Za-z_]\w*)+)'),sec))
        for i,l in enumerate(lines):
            if f.startswith('app') and i<130 and 'MORPH_DEFAULTS' in l: continue
            for p,sec in pats:
                for m in p.finditer(l):
                    path=m.group(1).replace('?','').lstrip('.').split('.')
                    path=[x for x in path if x not in ('colours',) or True]
                    full=(sec+'.' if sec else '')+'.'.join(path)
                    # trim to known config path
                    parts=full.split('.')
                    node=cfgjson; keep=[]
                    for pp in parts:
                        if isinstance(node,dict) and pp in node: keep.append(pp); node=node[pp]
                        else: break
                    if not keep: 
                        keep=parts[:2] if sec=='' else parts  # unknown key (default-only)
                        tag='?'
                    else: tag=''
                    key='.'.join(keep)
                    if len(keep)<len(parts) and not isinstance(node,(str,int,float,bool)):
                        hidden.setdefault('.'.join(parts),[]).append((f,i+1,owner(f,i+1)))
                        continue
                    if key in ('_sources','__proto__') or key.startswith('_'): continue
                    uses.setdefault(key,[]).append((f,i+1,owner(f,i+1)))

    import re as _re
    for f in files:
        lines=open(os.path.join(R,f)).read().split('\n')
        curP=None
        for i,l in enumerate(lines):
            ln=i+1; own=owner(f,ln)
            m=_re.search(r'const P = CFG\.flight\.(boom|head|body)',l)
            if m: curP=m.group(1)
            if own!='morph2Assign': curP=None if not m else curP
            if curP:
                for mm in _re.finditer(r'(?<![\w.])P\.([a-z_]+)',l):
                    uses.setdefault('flight.%s.%s'%(curP,mm.group(1)),[]).append((f,ln,own))
            for mm in _re.finditer(r'(?<![\w.])LW\.([a-z_]+)',l):
                uses.setdefault('lift.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'nightC\("([a-z_]+)"',l):
                uses.setdefault('night.colours.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'bpC\("([a-z_]+)"',l):
                uses.setdefault('blueprint.colours.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'NIGHT_COL\.([a-z_]+)|BP_COL\.([a-z_]+)',l):
                pass
            if 'fill_${p}_s' in l:
                for p in ['cabinet','head','lenses','boom','wheels']:
                    uses.setdefault('blueprint.fill_%s_s'%p,[]).append((f,ln,own))
            if 'c[MODE_KEY].base' in l:
                mk={'app-blueprint.js':'blueprint','app-rain.js':'rain','app-night.js':'night'}.get(f)
                if mk:
                    def fl(d,pre):
                        for k,v in d.items():
                            if isinstance(v,dict): yield from fl(v,pre+k+'.')
                            else: yield pre+k
                    for k in fl(cfgjson.get(mk,{}).get('base',{}),mk+'.base.'):
                        uses.setdefault(k,[]).append((f,ln,'(top level: CFG = merge(base))'))
            # minions2 / domino2 overlays via M / D
            if f in ('app-minions.js','app-domino.js','app-domino2.js'):
                for mm in _re.finditer(r'(?<![\w.])M\.([a-z_0-9]+)',l):
                    k=mm.group(1)
                    if k in cfgjson['minions2']: uses.setdefault('minions2.'+k,[]).append((f,ln,own))
            if f=='app-domino2.js':
                for mm in _re.finditer(r'(?<![\w.])D\.([a-z_0-9]+)',l):
                    k=mm.group(1)
                    if k in cfgjson['domino2']: uses.setdefault('domino2.'+k,[]).append((f,ln,own))
    # drop bare-section keys produced by unknown leafs
    for k in list(uses):
        if k in ('minions','domino','minions2','domino2','road','night','blueprint','rain','drone'):
            pass


    import re as _re
    for f in files:
        lines=open(os.path.join(R,f)).read().split('\n')
        curP=None
        for i,l in enumerate(lines):
            ln=i+1; own=owner(f,ln)
            m=_re.search(r'const P = CFG\.flight\.(boom|head|body)',l)
            if m: curP=m.group(1)
            if own!='morph2Assign': curP=None if not m else curP
            if curP:
                for mm in _re.finditer(r'(?<![\w.])P\.([a-z_]+)',l):
                    uses.setdefault('flight.%s.%s'%(curP,mm.group(1)),[]).append((f,ln,own))
            for mm in _re.finditer(r'(?<![\w.])LW\.([a-z_]+)',l):
                uses.setdefault('lift.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'nightC\("([a-z_]+)"',l):
                uses.setdefault('night.colours.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'bpC\("([a-z_]+)"',l):
                uses.setdefault('blueprint.colours.'+mm.group(1),[]).append((f,ln,own))
            for mm in _re.finditer(r'NIGHT_COL\.([a-z_]+)|BP_COL\.([a-z_]+)',l):
                pass
            if 'fill_${p}_s' in l:
                for p in ['cabinet','head','lenses','boom','wheels']:
                    uses.setdefault('blueprint.fill_%s_s'%p,[]).append((f,ln,own))
            if 'c[MODE_KEY].base' in l:
                mk={'app-blueprint.js':'blueprint','app-rain.js':'rain','app-night.js':'night'}.get(f)
                if mk:
                    def fl(d,pre):
                        for k,v in d.items():
                            if isinstance(v,dict): yield from fl(v,pre+k+'.')
                            else: yield pre+k
                    for k in fl(cfgjson.get(mk,{}).get('base',{}),mk+'.base.'):
                        uses.setdefault(k,[]).append((f,ln,'(top level: CFG = merge(base))'))
            # minions2 / domino2 overlays via M / D
            if f in ('app-minions.js','app-domino.js','app-domino2.js'):
                for mm in _re.finditer(r'(?<![\w.])M\.([a-z_0-9]+)',l):
                    k=mm.group(1)
                    if k in cfgjson['minions2']: uses.setdefault('minions2.'+k,[]).append((f,ln,own))
            if f=='app-domino2.js':
                for mm in _re.finditer(r'(?<![\w.])D\.([a-z_0-9]+)',l):
                    k=mm.group(1)
                    if k in cfgjson['domino2']: uses.setdefault('domino2.'+k,[]).append((f,ln,own))
    # drop bare-section keys produced by unknown leafs
    for k in list(uses):
        if k in ('minions','domino','minions2','domino2','road','night','blueprint','rain','drone'):
            pass

    def flat(d,pre=''):
        for k,v in d.items():
            if k.startswith('_'): continue
            p=pre+k
            if isinstance(v,dict): yield from flat(v,p+'.')
            else: yield p,v
    allk=dict(flat(cfgjson))
    unused=[k for k in allk if k not in uses]
    unknown=[k for k in uses if k not in allk and not any(x.startswith(k+'.') for x in allk)]
    return uses, hidden
