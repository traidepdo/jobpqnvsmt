import re

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

tables = []
relationships = []

# Excluded tag models
excluded_models = {'Tag', 'JobTag', 'BlogTag'}

type_map = {
    'String': 'text',
    'Int': 'integer',
    'Boolean': 'boolean',
    'DateTime': 'timestamp',
    'Json': 'json',
    'Float': 'float',
    'Decimal': 'decimal'
}

for model_name, body in models_raw:
    if model_name in excluded_models:
        continue

    fields_str = ""
    lines = body.strip().split('\n')
    for line in lines:
        # Strip inline comments
        line = line.split('//')[0].strip()
        if not line or line.startswith('@@'):
            continue
        
        # Check relation field
        rel_match = re.search(r'(\w+)\s+(\w+)\??\s+@relation\(fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]', line)
        if rel_match:
            _, target_model, local_fk, target_pk = rel_match.groups()
            if target_model in excluded_models:
                continue
            if '@unique' in line or (local_fk in ['ownerId', 'applicationId', 'jobId', 'job_id'] and model_name in ['Company', 'Interview', 'Conversation', 'JobEmbedding', 'AdminConversation']):
                relationships.append(f"{model_name}.{local_fk} 1 - 1 {target_model}.{target_pk}")
            else:
                relationships.append(f"{model_name}.{local_fk} N - 1 {target_model}.{target_pk}")
            continue

        parts = line.split()
        if len(parts) >= 2:
            fname = parts[0]
            ftype = parts[1].replace('?', '').replace('[]', '')
            
            # Skip relations without explicit @relation attribute (e.g. resumes Resume[])
            if ftype in model_names or parts[1].endswith('[]'):
                continue
                
            is_pk = '@id' in line
            is_uk = '@unique' in line
            
            db_type = type_map.get(ftype, 'text')
            
            tags = []
            if is_pk:
                tags.append("pk")
            if is_uk:
                tags.append("unique")
            
            tag_str = f" [{', '.join(tags)}]" if tags else ""
            fields_str += f"  {fname} {db_type}{tag_str}\n"

    table_block = f"// {model_name} Table\nTable {model_name} {{\n{fields_str}}}\n"
    tables.append(table_block)

eraser_code = "// ==========================================\n"
eraser_code += "// ERASER.IO DIAGRAM CODE (EXCLUDED TAG TABLES)\n"
eraser_code += "// ==========================================\n\n"
eraser_code += "\n".join(tables)
eraser_code += "\n// === RELATIONSHIPS (1-1, 1-N) ===\n"
eraser_code += "\n".join(relationships)

with open("eraser_diagram.txt", "w") as f:
    f.write(eraser_code)

print("Updated eraser_diagram.txt without Tag tables!")


