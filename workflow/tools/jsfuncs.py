"""Extract top-level function ranges + CFG refs from big JS files (approximate lexer: skips strings, comments, templates, regex-ish)."""
import re, json, sys, hashlib
DEF = re.compile(r'^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|^(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>')
def depth_scan(src):
    """return list depth at start of each line"""
    depths=[]; d=0; i=0; n=len(src); line_start=True
    state=None  # None, '"', "'", '`', '//', '/*'
    tmpl_stack=[]
    lines_depth=[0]
    prev_sig=''
    while i<n:
        c=src[i]
        if c=='\n':
            lines_depth.append(d)
            if state=='//': state=None
            i+=1; continue
        if state is None:
            if c=='/' and src[i+1:i+2]=='/': state='//'; i+=2; continue
            if c=='/' and src[i+1:i+2]=='*': state='/*'; i+=2; continue
            if c in '"\'': state=c; i+=1; continue
            if c=='`': state='`'; i+=1; continue
            if c=='/' and prev_sig in '(,=:[!&|?{};+-*%<>~^' :
                # regex literal
                j=i+1; cls=False
                while j<n and src[j]!='\n':
                    if src[j]=='\\': j+=2; continue
                    if src[j]=='[': cls=True
                    elif src[j]==']': cls=False
                    elif src[j]=='/' and not cls: break
                    j+=1
                if j<n and src[j]=='/': i=j+1; prev_sig='a'; continue
                i+=1; prev_sig='/'; continue
            if c=='{': d+=1
            elif c=='}':
                if tmpl_stack and tmpl_stack[-1]==d: tmpl_stack.pop(); d-=1; state='`'; i+=1; continue
                d-=1
            if not c.isspace(): prev_sig=c if not (c.isalnum() or c in '_$') else 'a'
            # keyword before regex e.g. return /x/
            i+=1; continue
        if state in ('"',"'"):
            if c=='\\' and src[i+1:i+2]!='\n': i+=2; continue
            if c==state: state=None; prev_sig='a'
            i+=1; continue
        if state=='`':
            if c=='\\' and src[i+1:i+2]!='\n': i+=2; continue
            if c=='`': state=None; prev_sig='a'; i+=1; continue
            if c=='$' and src[i+1:i+2]=='{': d+=1; tmpl_stack.append(d); state=None; i+=2; prev_sig='{'; continue
            i+=1; continue
        if state=='/*':
            if c=='*' and src[i+1:i+2]=='/': state=None; i+=2; continue
            i+=1; continue
        if state=='//': i+=1; continue
    return lines_depth
def analyse(path):
    src=open(path,encoding='utf-8').read()
    lines=src.split('\n')
    dep=depth_scan(src)
    funcs=[]
    for idx,l in enumerate(lines):
        if dep[idx]!=0: continue
        m=DEF.match(l)
        if m:
            name=m.group(1) or m.group(2)
            # end: first subsequent line where depth at start of next line returns to 0
            end=idx
            j=idx+1
            while j<len(lines) and dep[j]!=0: j+=1
            end=j  # line j (0-based) begins at depth 0 -> function ends at line j (1-based = j)
            body='\n'.join(lines[idx:end])
            funcs.append({"name":name,"start":idx+1,"end":end,"sha":hashlib.sha1(re.sub(r'\s+',' ',body).encode()).hexdigest()[:10],
                          "cfg":sorted(set(re.findall(r'CFG(?:\.[A-Za-z_]\w*)+',body)))})
    return {"file":path,"lines":len(lines),"funcs":funcs}
if __name__=='__main__':
    out={}
    for p in sys.argv[1:]:
        out[p]=analyse(p)
    json.dump(out,sys.stdout,indent=1)
