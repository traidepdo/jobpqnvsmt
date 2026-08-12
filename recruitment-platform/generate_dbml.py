import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

# Parse models
models = re.findall(r'model\s+(\w+)\s+\{([^}]+)\}', content)

print("// DBML for Eraser.io")
for model_name, body in models:
    print(f"Table {model_name} {{")
    lines = body.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        parts = line.split()
        if len(parts) >= 2:
            field_name = parts[0]
            field_type = parts[1]
            if field_type in ['String', 'Int', 'Boolean', 'DateTime', 'Json', 'Float', 'Decimal'] or '[]' in field_type or field_type[0].isupper():
                print(f"  {field_name} {field_type}")
    print("}\n")
