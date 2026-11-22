from pathlib import Path
import urllib.request, hashlib, json, io, subprocess
from pypdf import PdfReader
sources=[('syllabus','CBSE Class X Mathematics syllabus 2026–27','https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1X_2026-27.pdf'),('sample','CBSE Mathematics Standard sample paper 2026–27','https://cbseacademic.nic.in/web_material/SQP/ClassX_2026_27/MathsStandard-SQP.pdf'),('marking','CBSE Mathematics Standard marking scheme 2026–27','https://cbseacademic.nic.in/web_material/SQP/ClassX_2026_27/MathsStandard-MS.pdf')]
rows=[]
for kind,title,url in sources:
    data=subprocess.check_output(['curl.exe','--fail','--silent','--show-error','--location','--max-time','60',url])
    if not data.startswith(b'%PDF'): raise ValueError('Invalid PDF')
    digest=hashlib.sha256(data).hexdigest()
    for i,page in enumerate(PdfReader(io.BytesIO(data)).pages):
        text=' '.join((page.extract_text() or '').split())
        if len(text)>80: rows.append(dict(id=f'{kind}-p{i+1}',kind=kind,title=title,url=url,page=i+1,sha256=digest,text=text))
    print(kind, 'extracted')
Path('lib/server').mkdir(exist_ok=True)
Path('lib/server/cbse-source-pack.json').write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')
print('Source pages:',len(rows))
