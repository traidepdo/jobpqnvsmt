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

color_map = {
    'User': '#3b82f6',              # Blue
    'Company': '#a855f7',           # Purple
    'Job': '#10b981',               # Emerald Green
    'JobEmbedding': '#059669',      # Dark Emerald
    'Application': '#f59e0b',       # Amber/Yellow
    'Interview': '#f97316',         # Orange
    'Resume': '#ef4444',            # Red/Rose
    'ResumeTemplate': '#dc2626',    # Dark Red
    'Category': '#06b6d4',          # Cyan
    'Quiz': '#8b5cf6',              # Violet
    'Question': '#7c3aed',          # Deep Violet
    'Conversation': '#06b6d4',      # Cyan
    'Message': '#0891b2',           # Dark Cyan
    'AdminConversation': '#6366f1', # Indigo
    'AdminMessage': '#4f46e5',      # Indigo
    'GroupConversation': '#3b82f6', # Blue
    'GroupMember': '#2563eb',       # Dark Blue
    'GroupMessage': '#1d4ed8',      # Blue
    'Notification': '#64748b',      # Slate
    'Blog': '#ec4899',              # Pink
    'BlogCategory': '#db2777',      # Dark Pink
    'Province': '#64748b',          # Slate
    'District': '#64748b',          # Slate
    'Ward': '#64748b',              # Slate
    'SavedJob': '#10b981',          # Emerald
    'SavedCompany': '#a855f7',       # Purple
    'SalaryModel': '#84cc16'        # Lime
}

# Module Filter Definitions
module_groups = {
    'all': ['User', 'Company', 'Province', 'District', 'Ward', 'ResumeTemplate', 'Resume', 'Category', 'Job', 'JobEmbedding', 'SavedJob', 'SavedCompany', 'Application', 'Interview', 'Quiz', 'Question', 'Conversation', 'Message', 'AdminConversation', 'AdminMessage', 'GroupConversation', 'GroupMember', 'GroupMessage', 'Notification', 'BlogCategory', 'Blog', 'SalaryModel'],
    'user_company': ['User', 'Company', 'SavedCompany', 'Province', 'District', 'Ward'],
    'jobs_cv': ['Job', 'Category', 'JobEmbedding', 'SavedJob', 'Resume', 'ResumeTemplate'],
    'apps': ['Application', 'Interview', 'User', 'Job', 'Resume'],
    'chat': ['Conversation', 'Message', 'AdminConversation', 'AdminMessage', 'GroupConversation', 'GroupMember', 'GroupMessage'],
    'other': ['Quiz', 'Question', 'Blog', 'BlogCategory', 'Notification', 'SalaryModel']
}

type_map = {
    'String': 'text',
    'Int': 'int',
    'Boolean': 'bool',
    'DateTime': 'timestamp',
    'Json': 'json',
    'Float': 'float',
    'Decimal': 'decimal'
}

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
                    'type': '1:1' if is_one_to_one else 'N:1'
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
            db_type = type_map.get(ftype_raw, ftype_raw.lower())
            if 'vector' in db_type:
                db_type = 'vector'
            
            fields.append({
                'name': fname,
                'type': db_type,
                'isPk': is_pk,
                'isUk': is_uk
            })

    tables_dict[model_name] = fields

# Clean Spaced Coordinates
grid_positions = {
    'Province': {'x': 80, 'y': 80},
    'District': {'x': 80, 'y': 320},
    'Ward': {'x': 80, 'y': 560},
    'SalaryModel': {'x': 80, 'y': 800},

    'User': {'x': 600, 'y': 80},
    'Company': {'x': 600, 'y': 680},

    'ResumeTemplate': {'x': 1120, 'y': 80},
    'Resume': {'x': 1120, 'y': 520},
    'Category': {'x': 1120, 'y': 1140},
    'Job': {'x': 1120, 'y': 1440},
    'JobEmbedding': {'x': 1120, 'y': 2400},
    'SavedJob': {'x': 1120, 'y': 2600},
    'SavedCompany': {'x': 1120, 'y': 2800},

    'Application': {'x': 1640, 'y': 80},
    'Interview': {'x': 1640, 'y': 680},
    'Quiz': {'x': 1640, 'y': 1140},
    'Question': {'x': 1640, 'y': 1500},

    'Conversation': {'x': 2160, 'y': 80},
    'Message': {'x': 2160, 'y': 440},
    'AdminConversation': {'x': 2160, 'y': 780},
    'AdminMessage': {'x': 2160, 'y': 1060},
    'GroupConversation': {'x': 2160, 'y': 1340},
    'GroupMember': {'x': 2160, 'y': 1600},
    'GroupMessage': {'x': 2160, 'y': 1840},
    'Notification': {'x': 2160, 'y': 2080},
    'BlogCategory': {'x': 2160, 'y': 2320},
    'Blog': {'x': 2160, 'y': 2540}
}

html_content = f"""<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sơ Đồ Dễ Hiểu & Bảng Giải Thích Chi Tiết ERD</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-dark: #070a12;
      --bg-card: #111827;
      --bg-card-hover: #1f2937;
      --border-card: #1f293d;
      --text-title: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6366f1;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }}

    body {{
      font-family: 'Outfit', -apple-system, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-title);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }}

    .toolbar {{
      height: 64px;
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 100;
    }}

    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .brand-logo {{
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      color: #fff;
    }}

    .brand-info h1 {{
      font-size: 1.05rem;
      font-weight: 700;
    }}

    .brand-info p {{
      font-size: 0.75rem;
      color: var(--text-muted);
    }}

    /* Module Selector Tabs */
    .filter-tabs {{
      display: flex;
      gap: 6px;
      background: #070a12;
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--border-card);
    }}

    .tab-btn {{
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--text-muted);
      transition: all 0.2s;
    }}

    .tab-btn:hover {{
      color: #fff;
    }}

    .tab-btn.active {{
      background: var(--accent);
      color: #fff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }}

    .controls {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .btn {{
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border-card);
      background: #1f2937;
      color: var(--text-title);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }}

    .btn:hover {{
      background: var(--accent);
      border-color: var(--accent);
    }}

    /* Main Container & Inspector Sidebar */
    .main-body {{
      flex: 1;
      display: flex;
      position: relative;
      overflow: hidden;
    }}

    #canvas-container {{
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 32px 32px;
    }}

    #canvas-container:active {{
      cursor: grabbing;
    }}

    #viewport-transform {{
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
    }}

    #svg-connections {{
      position: absolute;
      top: 0;
      left: 0;
      width: 5000px;
      height: 5000px;
      pointer-events: none;
      z-index: 1;
    }}

    .rel-path {{
      stroke: #334155;
      stroke-width: 2px;
      fill: none;
      opacity: 0.08; /* Soft subtle by default */
      transition: opacity 0.2s, stroke-width 0.2s, stroke 0.2s;
    }}

    .rel-path.active {{
      stroke: #38bdf8 !important;
      stroke-width: 4px !important;
      opacity: 1 !important;
      filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.8));
    }}

    .rel-label {{
      font-size: 0.65rem;
      font-weight: 700;
      fill: #38bdf8;
      background: #070a12;
      font-family: 'Fira Code', monospace;
      opacity: 0.15;
    }}

    .rel-group.active .rel-label {{
      opacity: 1;
    }}

    /* Cards */
    .table-card {{
      position: absolute;
      width: 300px;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      z-index: 2;
      transition: box-shadow 0.2s, border-color 0.2s, opacity 0.2s;
      cursor: pointer;
    }}

    .table-card:hover {{
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
    }}

    .table-card.dimmed {{
      opacity: 0.2;
    }}

    .table-card.highlighted {{
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px #38bdf8, 0 14px 40px rgba(56, 189, 248, 0.5);
      z-index: 10;
    }}

    .card-header {{
      padding: 11px 16px;
      border-top-left-radius: 11px;
      border-top-right-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
    }}

    .card-title {{
      font-weight: 700;
      font-size: 0.92rem;
    }}

    .card-count {{
      font-size: 0.72rem;
      padding: 2px 7px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.25);
      font-weight: 600;
    }}

    .card-body {{
      padding: 6px 0;
    }}

    .field-row {{
      height: 26px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }}

    .field-row:hover {{
      background: var(--bg-card-hover);
    }}

    .field-row.highlighted-field {{
      background: rgba(56, 189, 248, 0.25);
    }}

    .field-info {{
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .field-name {{
      font-family: 'Fira Code', monospace;
      color: #e2e8f0;
      font-size: 0.78rem;
    }}

    .key-badge {{
      font-size: 0.62rem;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 700;
    }}

    .badge-pk {{ background: #ef4444; color: #fff; }}
    .badge-uk {{ background: #f59e0b; color: #fff; }}
    .badge-fk {{ background: #8b5cf6; color: #fff; }}

    .type-badge {{
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: 'Fira Code', monospace;
    }}

    /* Inspector Sidebar Panel */
    .inspector {{
      width: 380px;
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(16px);
      border-left: 1px solid var(--border-card);
      display: flex;
      flex-direction: column;
      padding: 20px;
      overflow-y: auto;
      z-index: 50;
    }}

    .inspector-header {{
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-card);
      margin-bottom: 16px;
    }}

    .inspector-title {{
      font-size: 1.2rem;
      font-weight: 700;
      color: #38bdf8;

    }}

    .inspector-desc {{
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 4px;
    }}

    .section-title {{
      font-size: 0.85rem;
      font-weight: 700;
      color: #f1f5f9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 10px 0;
    }}

    .rel-item {{
      background: #111827;
      border: 1px solid var(--border-card);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 8px;
      font-size: 0.83rem;

    }}

    .rel-item strong {{
      color: #818cf8;
    }}

    .tip-box {{
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      color: #c7d2fe;
      line-height: 1.4;
      margin-top: 10px;
    }}
  </style>
</head>
<body>

  <!-- Top Toolbar -->
  <div class="toolbar">
    <div class="brand">
      <div class="brand-logo">E</div>
      <div class="brand-info">
        <h1>Sơ Đồ ERD Dễ Hiểu (Kèm Bảng Giải Thích Chi Tiết)</h1>
        <p>Recruitment Platform • 27 Bảng</p>
      </div>
    </div>

    <!-- Module Filters -->
    <div class="filter-tabs">
      <button class="tab-btn active" onclick="setModule('all', this)">Tất cả (27 Bảng)</button>
      <button class="tab-btn" onclick="setModule('user_company', this)">👤 Người Dùng & Cty</button>
      <button class="tab-btn" onclick="setModule('jobs_cv', this)">💼 Việc Làm & CV</button>
      <button class="tab-btn" onclick="setModule('apps', this)">📝 Ứng Tuyển & Phỏng Vấn</button>
      <button class="tab-btn" onclick="setModule('chat', this)">💬 Chat & Tin Nhắn</button>
      <button class="tab-btn" onclick="setModule('other', this)">📰 Khác</button>
    </div>

    <div class="controls">
      <button class="btn" onclick="zoomIn()">Phóng to (+)</button>
      <button class="btn" onclick="zoomOut()">Thu nhỏ (-)</button>
      <button class="btn" onclick="autoFitCanvas()">🔍 Nhìn toàn cảnh</button>
    </div>
  </div>

  <!-- Main Body -->
  <div class="main-body">
    <div id="canvas-container">
      <div id="viewport-transform">
        <svg id="svg-connections">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>
        </svg>
        <div id="tables-layer"></div>
      </div>
    </div>

    <!-- Inspector Sidebar -->
    <div class="inspector" id="inspectorPanel">
      <div class="inspector-header">
        <div class="inspector-title" id="inspTitle">Nhấp vào một Bảng</div>
        <div class="inspector-desc" id="inspDesc">Chọn một bảng để xem giải thích các mối quan hệ cụ thể mà không bị rối mắt.</div>
      </div>

      <div class="tip-box">
        💡 <strong>Mẹo nhỏ:</strong> Để tránh màn hình bị rối đường đâm chằng chịt, các đường nối mặc định ẩn nhẹ. Nhấp vào bảng bất kỳ (ví dụ <strong>User</strong> hoặc <strong>Job</strong>) để chỉ hiện duy nhất các kết nối của bảng đó!
      </div>

      <div class="section-title">🔗 Mối quan hệ kết nối</div>
      <div id="inspRels">
        <div style="font-size:0.82rem; color:var(--text-muted);">Chưa chọn bảng nào.</div>
      </div>
    </div>
  </div>

  <script>
    const tablesData = {json.dumps(tables_dict, indent=2)};
    const relsData = {json.dumps(relationships, indent=2)};
    const colorMap = {json.dumps(color_map, indent=2)};
    const moduleGroups = {json.dumps(module_groups, indent=2)};
    const defaultPositions = {json.dumps(grid_positions, indent=2)};

    let currentPositions = JSON.parse(JSON.stringify(defaultPositions));
    let currentModule = 'all';
    let selectedTable = null;

    let scale = 0.75;
    let panX = 40;
    let panY = 40;
    let isPanning = false;
    let startX, startY;

    let draggedCard = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const container = document.getElementById('canvas-container');
    const viewport = document.getElementById('viewport-transform');
    const svgLayer = document.getElementById('svg-connections');
    const tablesLayer = document.getElementById('tables-layer');

    window.addEventListener('load', () => {{
      renderTables();
      autoFitCanvas();
      setTimeout(renderConnections, 50);
    }});

    function updateTransform() {{
      viewport.style.transform = `translate(${{panX}}px, ${{panY}}px) scale(${{scale}})`;
    }}

    function zoomIn() {{ scale = Math.min(scale * 1.15, 3); updateTransform(); }}
    function zoomOut() {{ scale = Math.max(scale / 1.15, 0.15); updateTransform(); }}
    
    function autoFitCanvas() {{
      scale = 0.70;
      panX = 30;
      panY = 30;
      updateTransform();
    }}

    container.addEventListener('pointerdown', (e) => {{
      if (e.target.closest('.table-card')) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    }});

    window.addEventListener('pointermove', (e) => {{
      if (isPanning) {{
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
      }} else if (draggedCard) {{
        const pos = currentPositions[draggedCard];
        pos.x = (e.clientX - panX) / scale - dragOffsetX;
        pos.y = (e.clientY - panY) / scale - dragOffsetY;
        const cardEl = document.getElementById(`card-${{draggedCard}}`);
        if (cardEl) {{
          cardEl.style.left = `${{pos.x}}px`;
          cardEl.style.top = `${{pos.y}}px`;
        }}
        renderConnections();
      }}
    }});

    window.addEventListener('pointerup', () => {{
      isPanning = false;
      draggedCard = null;
    }});

    container.addEventListener('wheel', (e) => {{
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      scale = Math.min(Math.max(scale * zoomFactor, 0.15), 3);
      updateTransform();
    }});

    function getFieldOffsetY(tname, fname) {{
      const fields = tablesData[tname] || [];
      const idx = fields.findIndex(f => f.name === fname);
      if (idx === -1) return 40;
      return 46 + idx * 26 + 13;
    }}

    function renderTables() {{
      tablesLayer.innerHTML = '';
      const activeList = moduleGroups[currentModule] || moduleGroups['all'];

      Object.keys(tablesData).forEach(tname => {{
        if (!activeList.includes(tname)) return;

        const pos = currentPositions[tname] || {{ x: 100, y: 100 }};
        const fields = tablesData[tname];
        const headerColor = colorMap[tname] || '#6366f1';
        const fkFields = new Set(relsData.filter(r => r.from === tname).map(r => r.from_fk));

        const card = document.createElement('div');
        card.className = 'table-card';
        card.id = `card-${{tname}}`;
        card.style.left = `${{pos.x}}px`;
        card.style.top = `${{pos.y}}px`;

        card.addEventListener('pointerdown', (e) => {{
          draggedCard = tname;
          dragOffsetX = (e.clientX - panX) / scale - pos.x;
          dragOffsetY = (e.clientY - panY) / scale - pos.y;
          e.stopPropagation();
        }});

        card.addEventListener('click', () => {{
          selectTable(tname);
        }});

        let rowsHtml = '';
        fields.forEach(f => {{
          let badgesHtml = '';
          if (f.isPk) badgesHtml += `<span class="key-badge badge-pk">PK</span>`;
          if (f.isUk) badgesHtml += `<span class="key-badge badge-uk">UK</span>`;
          if (fkFields.has(f.name)) badgesHtml += `<span class="key-badge badge-fk">FK</span>`;
          
          rowsHtml += `
            <div class="field-row" id="field-${{tname}}-${{f.name}}">
              <div class="field-info">
                ${{badgesHtml}}
                <span class="field-name">${{f.name}}</span>
              </div>
              <span class="type-badge">${{f.type}}</span>
            </div>
          `;
        }});

        card.innerHTML = `
          <div class="card-header" style="background: ${{headerColor}}">
            <span class="card-title">${{tname}}</span>
            <span class="card-count">${{fields.length}}</span>
          </div>
          <div class="card-body">
            ${{rowsHtml}}
          </div>
        `;

        tablesLayer.appendChild(card);
      }});
      renderConnections();
    }}

    function renderConnections() {{
      const defs = `<defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>`;
      
      let pathsHtml = defs;
      const activeList = moduleGroups[currentModule] || moduleGroups['all'];

      relsData.forEach((rel, idx) => {{
        if (!activeList.includes(rel.from) || !activeList.includes(rel.to)) return;

        const fromCard = document.getElementById(`card-${{rel.from}}`);
        const toCard = document.getElementById(`card-${{rel.to}}`);

        if (!fromCard || !toCard) return;

        const fromPos = currentPositions[rel.from];
        const toPos = currentPositions[rel.to];

        const fromWidth = fromCard.offsetWidth || 300;
        const toWidth = toCard.offsetWidth || 300;

        const fromOffsetY = getFieldOffsetY(rel.from, rel.from_fk);
        const toOffsetY = getFieldOffsetY(rel.to, rel.to_pk);

        let x1, y1, x2, y2;

        if (fromPos.x + fromWidth < toPos.x) {{
          x1 = fromPos.x + fromWidth;
          y1 = fromPos.y + fromOffsetY;
          x2 = toPos.x;
          y2 = toPos.y + toOffsetY;
        }} else if (toPos.x + toWidth < fromPos.x) {{
          x1 = fromPos.x;
          y1 = fromPos.y + fromOffsetY;
          x2 = toPos.x + toWidth;
          y2 = toPos.y + toOffsetY;
        }} else {{
          x1 = fromPos.x + fromWidth;
          y1 = fromPos.y + fromOffsetY;
          x2 = toPos.x + toWidth;
          y2 = toPos.y + toOffsetY;
        }}

        const channelOffset = (idx % 7) * 14 - 42;
        const midX = (x1 + x2) / 2 + channelOffset;
        const r = 8;
        const dirY = y2 > y1 ? 1 : -1;

        let pathData = '';
        if (Math.abs(y1 - y2) < 10) {{
          pathData = `M ${{x1}} ${{y1}} L ${{x2}} ${{y2}}`;
        }} else {{
          pathData = `M ${{x1}} ${{y1}} H ${{midX - r}} Q ${{midX}} ${{y1}} ${{midX}} ${{y1 + r * dirY}} V ${{y2 - r * dirY}} Q ${{midX}} ${{y2}} ${{midX + r}} ${{y2}} L ${{x2}} ${{y2}}`;
        }}

        const labelX = midX;
        const labelY = (y1 + y2) / 2;

        pathsHtml += `
          <g id="group-${{rel.from}}-${{rel.to}}-${{idx}}" class="rel-group">
            <path d="${{pathData}}" class="rel-path" id="rel-${{rel.from}}-${{rel.to}}-${{idx}}" marker-end="url(#arrow)"/>
            <rect x="${{labelX - 14}}" y="${{labelY - 9}}" width="28" height="18" rx="4" fill="#070a12" stroke="#1f293d" stroke-width="1"/>
            <text x="${{labelX}}" y="${{labelY + 4}}" text-anchor="middle" class="rel-label">${{rel.type}}</text>
          </g>
        `;
      }});

      svgLayer.innerHTML = pathsHtml;
    }}

    function selectTable(tname) {{
      selectedTable = tname;
      highlightRelationships(tname);
      updateInspector(tname);
    }}

    function highlightRelationships(tname) {{
      const connected = new Set([tname]);

      relsData.forEach((rel, idx) => {{
        const group = document.getElementById(`group-${{rel.from}}-${{rel.to}}-${{idx}}`);
        const path = document.getElementById(`rel-${{rel.from}}-${{rel.to}}-${{idx}}`);
        if (rel.from === tname || rel.to === tname) {{
          connected.add(rel.from);
          connected.add(rel.to);
          if (path) path.classList.add('active');
          if (group) group.classList.add('active');
          
          const fromField = document.getElementById(`field-${{rel.from}}-${{rel.from_fk}}`);
          const toField = document.getElementById(`field-${{rel.to}}-${{rel.to_pk}}`);
          if (fromField) fromField.classList.add('highlighted-field');
          if (toField) toField.classList.add('highlighted-field');
        }} else {{
          if (path) path.classList.remove('active');
          if (group) group.classList.remove('active');
        }}
      }});

      document.querySelectorAll('.table-card').forEach(card => {{
        const id = card.id.replace('card-', '');
        if (connected.has(id)) {{
          card.classList.remove('dimmed');
          if (id === tname) card.classList.add('highlighted');
        }} else {{
          card.classList.add('dimmed');
          card.classList.remove('highlighted');
        }}
      }});
    }}

    function updateInspector(tname) {{
      document.getElementById('inspTitle').textContent = tname;
      document.getElementById('inspDesc').textContent = `Bảng ${{tname}} chứa ${{tablesData[tname].length}} thuộc tính.`;

      const relsContainer = document.getElementById('inspRels');
      relsContainer.innerHTML = '';

      const relatedRels = relsData.filter(r => r.from === tname || r.to === tname);

      if (relatedRels.length === 0) {{
        relsContainer.innerHTML = '<div style="font-size:0.82rem; color:var(--text-muted);">Không có mối quan hệ trực tiếp.</div>';
        return;
      }}

      relatedRels.forEach(r => {{
        const el = document.createElement('div');
        el.className = 'rel-item';

        if (r.from === tname) {{
          el.innerHTML = `Chứa khoá ngoại <strong>${{r.from_fk}}</strong> liên kết tới <strong>${{r.to}}.${{r.to_pk}}</strong> (${{r.type}})`;
        }} else {{
          el.innerHTML = `Được liên kết từ bảng <strong>${{r.from}}</strong> qua cột <strong>${{r.from_fk}}</strong> (${{r.type}})`;
        }}
        relsContainer.appendChild(el);
      }});
    }}

    function setModule(modName, btnEl) {{
      currentModule = modName;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
      renderTables();
    }}
  </script>
</body>
</html>
"""

with open("er_diagram.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Generated Clean Readable Inspector ERD er_diagram.html successfully!")
