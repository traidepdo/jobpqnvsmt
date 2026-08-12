import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

# Models parsing
models_raw = re.findall(r'model\s+(\w+)\s+\{([^}]+)\}', content)

tables = []
relationships = []

# Color palette like Eraser
color_map = {
    'User': 'blue',
    'Company': 'purple',
    'Job': 'green',
    'Application': 'yellow',
    'Interview': 'orange',
    'Resume': 'red',
    'ResumeTemplate': 'red',
    'Category': 'cyan',
    'Tag': 'cyan',
    'Quiz': 'purple',
    'Question': 'purple',
    'Conversation': 'yellow',
    'Message': 'yellow',
    'Notification': 'blue',
    'Blog': 'red',
    'BlogCategory': 'red',
    'Province': 'gray',
    'District': 'gray',
    'Ward': 'gray'
}

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
    fields_str = ""
    lines = body.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        
        # Check relations
        rel_match = re.search(r'(\w+)\s+(\w+)\??\s+@relation\(fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]', line)
        if rel_match:
            _, target_model, local_fk, target_pk = rel_match.groups()
            if '@unique' in line or local_fk in ['ownerId', 'applicationId', 'jobId', 'job_id'] and model_name in ['Company', 'Interview', 'Conversation', 'JobEmbedding', 'AdminConversation']:
                relationships.append(f"{model_name}.{local_fk} 1 - 1 {target_model}.{target_pk}")
            else:
                relationships.append(f"{model_name}.{local_fk} N - 1 {target_model}.{target_pk}")
            continue

        parts = line.split()
        if len(parts) >= 2:
            fname = parts[0]
            ftype = parts[1].replace('?', '').replace('[]', '')
            
            if ftype in dict(models_raw) or parts[1].endswith('[]'):
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

    color = color_map.get(model_name, 'default')
    table_block = f"// {model_name} Table\nTable {model_name} {{\n{fields_str}}}\n"
    tables.append(table_block)

eraser_code = "// ==========================================\n"
eraser_code += "// ERASER.IO DIAGRAM CODE FOR YOUR RECRUITMENT PLATFORM\n"
eraser_code += "// ==========================================\n\n"
eraser_code += "\n".join(tables)
eraser_code += "\n// === RELATIONSHIPS (1-1, 1-N) ===\n"
eraser_code += "\n".join(relationships)

with open("eraser_diagram.txt", "w") as f:
    f.write(eraser_code)

print("Generated eraser_diagram.txt successfully!")
