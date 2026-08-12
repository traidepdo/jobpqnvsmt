import re
import json

def parse_models(content):
    models = []
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        m = re.match(r'^\s*model\s+(\w+)\s*\{', lines[i])
        if m:
            name = m.group(1)
            body = []
            i += 1
            while i < len(lines) and lines[i].strip() != '}':
                body.append(lines[i])
                i += 1
            models.append((name, '\n'.join(body)))
        i += 1
    return models

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

models_raw = parse_models(content)
model_names = set(m[0] for m in models_raw)
excluded_models = {'Tag', 'JobTag', 'BlogTag'}

type_map = {
    'String': 'string',
    'Int': 'int',
    'Boolean': 'boolean',
    'DateTime': 'datetime',
    'Json': 'json',
    'Float': 'float',
    'Decimal': 'decimal'
}

def clean_mermaid_type(t):
    if 'vector' in t.lower():
        return 'vector'
    cleaned = type_map.get(t, t)
    # Remove special characters for Mermaid syntax safety
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '_', cleaned)
    return cleaned

tables_dict = {}
relationships = []

for model_name, body in models_raw:
    if model_name in excluded_models:
        continue

    fields = []
    lines = body.strip().split('\n')
    for line in lines:
        line = line.split('//')[0].strip()
        if not line or line.startswith('@@'):
            continue
        
        rel_match = re.search(r'(\w+)\s+(\w+)\??\s+@relation\(fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]', line)
        if rel_match:
            _, target_model, local_fk, target_pk = rel_match.groups()
            if target_model not in excluded_models:
                is_one_to_one = '@unique' in line or (local_fk in ['ownerId', 'applicationId', 'jobId', 'job_id'] and model_name in ['Company', 'Interview', 'Conversation', 'JobEmbedding', 'AdminConversation'])
                relationships.append({
                    'from': model_name,
                    'from_fk': local_fk,
                    'to': target_model,
                    'to_pk': target_pk,
                    'type': '1-1' if is_one_to_one else 'N-1'
                })
            continue

        parts = line.split()
        if len(parts) >= 2:
            fname = parts[0]
            ftype_raw = parts[1].replace('?', '').replace('[]', '')
            
            if ftype_raw in model_names or parts[1].endswith('[]'):
                continue
                
            is_pk = '@id' in line
            is_uk = '@unique' in line
            db_type = clean_mermaid_type(ftype_raw)
            
            fields.append({
                'name': fname,
                'type': db_type,
                'isPk': is_pk,
                'isUk': is_uk
            })

    tables_dict[model_name] = fields

# Build Mermaid erDiagram definition
mermaid_lines = ["erDiagram"]

for rel in relationships:
    f = rel['from']
    t = rel['to']
    if rel['type'] == '1-1':
        mermaid_lines.append(f'    {t} ||--|| {f} : "1-to-1"')
    else:
        mermaid_lines.append(f'    {t} ||--o{{ {f} : "1-to-N"')

for tname, fld_list in tables_dict.items():
    mermaid_lines.append(f'    {tname} {{')
    for f in fld_list:
        dt = f['type']
        fn = f['name']
        key_str = ""
        if f['isPk']:
            key_str = "PK"
        elif f['isUk']:
            key_str = "UK"
        mermaid_lines.append(f'        {dt} {fn} {key_str}'.strip())
    mermaid_lines.append('    }')

mermaid_code = "\n".join(mermaid_lines)

# Generate HTML
html_content = f"""<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sơ Đồ Cơ Sở Dữ Liệu ERD - Job Recruitment Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
  <style>
    :root {{
      --bg-main: #0f172a;
      --bg-card: #1e293b;
      --bg-hover: #334155;
      --accent-primary: #6366f1;
      --accent-secondary: #06b6d4;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border-color: #334155;
    }}
    
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }}

    /* Sidebar Navigation */
    .sidebar {{
      width: 320px;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 10;
    }}

    .sidebar-header {{
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      background: rgba(15, 23, 42, 0.4);
    }}

    .sidebar-header h1 {{
      font-size: 1.15rem;
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }}

    .sidebar-header p {{
      font-size: 0.8rem;
      color: var(--text-muted);
    }}

    .search-box {{
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-color);
    }}

    .search-input {{
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }}

    .search-input:focus {{
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }}

    .table-list {{
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }}

    .table-item {{
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s;
    }}

    .table-item:hover {{
      background: var(--bg-hover);
    }}

    .table-item.active {{
      background: var(--accent-primary);
      color: #fff;
    }}

    .table-item .name {{
      font-weight: 500;
      font-size: 0.9rem;
    }}

    .table-item .badge {{
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
    }}

    .table-item.active .badge {{
      color: #fff;
      background: rgba(255, 255, 255, 0.2);
    }}

    /* Main View Area */
    .main-area {{
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }}

    .top-bar {{
      height: 60px;
      border-bottom: 1px solid var(--border-color);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(10px);
    }}

    .view-tabs {{
      display: flex;
      gap: 8px;
    }}

    .tab-btn {{
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      transition: all 0.2s;
    }}

    .tab-btn.active, .tab-btn:hover {{
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }}

    .controls {{
      display: flex;
      gap: 8px;
    }}

    .ctrl-btn {{
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      background: var(--bg-hover);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      cursor: pointer;
    }}

    .ctrl-btn:hover {{
      background: var(--accent-primary);
    }}

    .viewport {{
      flex: 1;
      position: relative;
      overflow: hidden;
    }}

    /* Diagram Canvas */
    #mermaid-container {{
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      background: #0f172a;
    }}

    #mermaid-container svg {{
      width: 100% !important;
      height: 100% !important;
      max-width: none !important;
    }}

    /* Grid Details View */
    #grid-container {{
      display: none;
      padding: 24px;
      height: 100%;
      overflow-y: auto;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }}

    .card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: transform 0.2s, border-color 0.2s;
    }}

    .card:hover {{
      transform: translateY(-2px);
      border-color: var(--accent-primary);
    }}

    .card-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }}

    .card-title {{
      font-weight: 700;
      color: var(--accent-secondary);
      font-size: 1rem;
    }}

    .field-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 0.85rem;
      border-bottom: 1px dashed rgba(255,255,255,0.05);
    }}

    .field-name {{
      font-family: 'Fira Code', monospace;
      color: #e2e8f0;
    }}

    .field-tags {{
      display: flex;
      gap: 4px;
    }}

    .tag {{
      font-size: 0.65rem;
      padding: 2px 5px;
      border-radius: 4px;
      font-weight: 600;
    }}

    .tag-pk {{ background: #ef4444; color: #fff; }}
    .tag-uk {{ background: #f59e0b; color: #fff; }}
    .tag-type {{ background: #3b82f6; color: #fff; opacity: 0.8; }}

    .loading-spinner {{
      color: var(--accent-secondary);
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }}
  </style>
</head>
<body>

  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>Database ERD Viewer</h1>
      <p>Job Recruitment Platform ({len(tables_dict)} Bảng)</p>
    </div>
    
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="Tìm kiếm bảng hoặc cột..." oninput="filterTables()">
    </div>

    <div class="table-list" id="tableList">
      <!-- Generated via JS -->
    </div>
  </div>

  <!-- Main View -->
  <div class="main-area">
    <div class="top-bar">
      <div class="view-tabs">
        <button class="tab-btn active" onclick="switchView('diagram')">Sơ Đồ ERD (Mermaid)</button>
        <button class="tab-btn" onclick="switchView('grid')">Danh Sách Bảng Chi Tiết</button>
      </div>

      <div class="controls" id="diagramControls">
        <button class="ctrl-btn" onclick="zoomIn()">Phóng to (+)</button>
        <button class="ctrl-btn" onclick="zoomOut()">Thu nhỏ (-)</button>
        <button class="ctrl-btn" onclick="resetZoom()">Về giữa</button>
      </div>
    </div>

    <div class="viewport">
      <!-- Diagram View -->
      <div id="mermaid-container">
        <div class="loading-spinner">Đang vẽ sơ đồ ERD...</div>
      </div>

      <!-- Grid View -->
      <div id="grid-container">
        <!-- Rendered via JS -->
      </div>
    </div>
  </div>

  <script>
    const tablesData = {json.dumps(tables_dict, indent=2)};
    const rawMermaidSyntax = `{mermaid_code}`;
    let panZoomInstance = null;

    mermaid.initialize({{
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      er: {{
        useMaxWidth: false,
        layoutDirection: 'TB'
      }}
    }});

    window.addEventListener('load', () => {{
      renderTableList();
      renderGridCards();
      renderMermaidDiagram();
    }});

    async function renderMermaidDiagram() {{
      const container = document.getElementById('mermaid-container');
      try {{
        const {{ svg }} = await mermaid.render('mermaidGraphSvg', rawMermaidSyntax);
        container.innerHTML = svg;
        const svgElement = container.querySelector('svg');
        if (svgElement) {{
          panZoomInstance = svgPanZoom(svgElement, {{
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.1,
            maxZoom: 10
          }});
        }}
      }} catch (err) {{
        console.error("Lỗi vẽ Mermaid:", err);
        container.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">
          <h3>⚠️ Lỗi vẽ sơ đồ ERD</h3>
          <p style="margin-top:8px; font-size:0.9rem;">${{err.message}}</p>
        </div>`;
      }}
    }}

    function renderTableList() {{
      const listEl = document.getElementById('tableList');
      listEl.innerHTML = '';
      
      Object.keys(tablesData).forEach(tname => {{
        const count = tablesData[tname].length;
        const item = document.createElement('div');
        item.className = 'table-item';
        item.id = `sidebar-item-${{tname}}`;
        item.onclick = () => highlightTable(tname);
        item.innerHTML = `
          <span class="name">${{tname}}</span>
          <span class="badge">${{count}} cột</span>
        `;
        listEl.appendChild(item);
      }});
    }}

    function renderGridCards() {{
      const gridEl = document.getElementById('grid-container');
      gridEl.innerHTML = '';

      Object.keys(tablesData).forEach(tname => {{
        const fields = tablesData[tname];
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${{tname}}`;

        let rowsHtml = '';
        fields.forEach(f => {{
          let tagsHtml = `<span class="tag tag-type">${{f.type}}</span>`;
          if (f.isPk) tagsHtml += `<span class="tag tag-pk">PK</span>`;
          if (f.isUk) tagsHtml += `<span class="tag tag-uk">UK</span>`;

          rowsHtml += `
            <div class="field-row">
              <span class="field-name">${{f.name}}</span>
              <div class="field-tags">${{tagsHtml}}</div>
            </div>
          `;
        }});

        card.innerHTML = `
          <div class="card-header">
            <span class="card-title">${{tname}}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${{fields.length}} cột</span>
          </div>
          <div class="card-body">
            ${{rowsHtml}}
          </div>
        `;
        gridEl.appendChild(card);
      }});
    }}

    function filterTables() {{
      const query = document.getElementById('searchInput').value.toLowerCase();
      
      Object.keys(tablesData).forEach(tname => {{
        const fields = tablesData[tname];
        const matchTable = tname.toLowerCase().includes(query);
        const matchField = fields.some(f => f.name.toLowerCase().includes(query));

        const sidebarItem = document.getElementById(`sidebar-item-${{tname}}`);
        const cardItem = document.getElementById(`card-${{tname}}`);

        if (matchTable || matchField) {{
          if (sidebarItem) sidebarItem.style.display = 'flex';
          if (cardItem) cardItem.style.display = 'block';
        }} else {{
          if (sidebarItem) sidebarItem.style.display = 'none';
          if (cardItem) cardItem.style.display = 'none';
        }}
      }});
    }}

    function highlightTable(tname) {{
      document.querySelectorAll('.table-item').forEach(el => el.classList.remove('active'));
      const sidebarItem = document.getElementById(`sidebar-item-${{tname}}`);
      if (sidebarItem) sidebarItem.classList.add('active');

      const cardItem = document.getElementById(`card-${{tname}}`);
      if (cardItem && document.getElementById('grid-container').style.display === 'grid') {{
        cardItem.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
      }}
    }}

    function switchView(mode) {{
      const diagramEl = document.getElementById('mermaid-container');
      const gridEl = document.getElementById('grid-container');
      const diagramCtrl = document.getElementById('diagramControls');
      const tabs = document.querySelectorAll('.tab-btn');

      tabs.forEach(t => t.classList.remove('active'));

      if (mode === 'diagram') {{
        diagramEl.style.display = 'flex';
        gridEl.style.display = 'none';
        diagramCtrl.style.display = 'flex';
        tabs[0].classList.add('active');
      }} else {{
        diagramEl.style.display = 'none';
        gridEl.style.display = 'grid';
        diagramCtrl.style.display = 'none';
        tabs[1].classList.add('active');
      }}
    }}

    function zoomIn() {{ if (panZoomInstance) panZoomInstance.zoomIn(); }}
    function zoomOut() {{ if (panZoomInstance) panZoomInstance.zoomOut(); }}
    function resetZoom() {{ if (panZoomInstance) {{ panZoomInstance.reset(); panZoomInstance.center(); }} }}
  </script>
</body>
</html>
"""

with open("er_diagram.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Generated fixed er_diagram.html successfully!")
