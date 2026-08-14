import sys, json
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path
import re

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
try:
    content = Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-16')
except:
    content = Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8')
detection = json.loads(content)
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))

G = build_from_json(extraction, root='.', directed=False)
communities = {int(k): v for k, v in analysis['communities'].items()}
cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

# Generate labels based on node names (simplistic heuristic)
labels = {}
for cid, nodes in communities.items():
    if not nodes:
        labels[cid] = f"Community {cid}"
        continue
        
    # Get top 5 node IDs (they are often file paths or function names)
    sample = [n for n in nodes[:5] if isinstance(n, str)]
    if sample:
        # Try to find common path or extension
        if any('.svelte' in s for s in sample):
            labels[cid] = "Svelte Components"
        elif any('.js' in s for s in sample):
            labels[cid] = "JS Logic & Store"
        elif any('.json' in s for s in sample):
            labels[cid] = "Config Files"
        elif any('.sql' in s for s in sample):
            labels[cid] = "Database Schema"
        else:
            labels[cid] = f"{Path(sample[0]).name if '/' in sample[0] else sample[0][:20]} related"
    else:
        labels[cid] = f"Community {cid}"

questions = suggest_questions(G, communities, labels)

report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')
print('Report updated with community labels')
