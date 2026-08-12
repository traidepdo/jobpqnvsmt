import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

enums = set(re.findall(r'enum\s+(\w+)\s+\{', content))
models_raw = re.findall(r'model\s+(\w+)\s+\{([^}]+)\}', content)

tables = {}
relations = []

type_map = {
    'String': 'varchar',
    'Int': 'integer',
    'Boolean': 'boolean',
    'DateTime': 'timestamp',
    'Json': 'json',
    'Float': 'float',
    'Decimal': 'decimal'
}

for model_name, body in models_raw:
    fields = []
    lines = body.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        
        rel_match = re.search(r'(\w+)\s+(\w+)\??\s+@relation\(fields:\s*\[(\w+)\]\s*,\s*references:\s*\[(\w+)\]', line)
        if rel_match:
            field_var, target_model, local_fk, target_pk = rel_match.groups()
            if '@unique' in line or local_fk in ['ownerId', 'applicationId', 'jobId', 'job_id'] and model_name in ['Company', 'Interview', 'Conversation', 'JobEmbedding', 'AdminConversation']:
                relations.append(f"Ref: {model_name}.{local_fk} - {target_model}.{target_pk}")
            else:
                relations.append(f"Ref: {model_name}.{local_fk} > {target_model}.{target_pk}")
            continue

        parts = line.split()
        if len(parts) >= 2:
            fname = parts[0]
            ftype = parts[1].replace('?', '').replace('[]', '')
            
            if ftype in dict(models_raw) or parts[1].endswith('[]'):
                continue
                
            is_pk = '@id' in line
            is_uk = '@unique' in line
            
            db_type = type_map.get(ftype, ftype.lower() if ftype in enums else 'varchar')
            
            settings = []
            if is_pk:
                settings.append("pk")
            if is_uk:
                settings.append("unique")
            
            setting_str = f" [{', '.join(settings)}]" if settings else ""
            fields.append(f"  {fname} {db_type}{setting_str}")
            
    tables[model_name] = fields

dbml_output = "// === DBML SCHEMA OF YOUR RECRUITMENT PLATFORM ===\n\n"
for tname, flist in tables.items():
    dbml_output += f"Table {tname} {{\n" + "\n".join(flist) + "\n}\n\n"

dbml_output += "// === RELATIONSHIPS ===\n"
dbml_output += "\n".join(relations)

with open("eraser_schema.dbml", "w") as f:
    f.write(dbml_output)

print("SUCCESS: eraser_schema.dbml generated successfully!")
