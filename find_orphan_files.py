import os
import re
import sys

def get_imports(file_path):
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Match import ... from 'path' or require('path')
        pattern = re.compile(r'(?:import|from|require)\s+[\'"]([^\'"]+)[\'"]')
        for match in pattern.finditer(content):
            path = match.group(1)
            if path.startswith('.'):
                imports.append(path)
    except Exception:
        pass
    return imports

def resolve_path(current_file, import_path):
    dir_name = os.path.dirname(current_file)
    potential_path = os.path.join(dir_name, import_path)
    
    extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.css', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']
    for ext in extensions:
        if os.path.isfile(potential_path + ext):
            return os.path.abspath(potential_path + ext)
    return None

def find_reachable_files(start_files):
    reachable = set()
    queue = [os.path.abspath(f) for f in start_files]
    
    while queue:
        current = queue.pop(0)
        if current in reachable:
            continue
        reachable.add(current)
        
        for imp in get_imports(current):
            resolved = resolve_path(current, imp)
            if resolved and resolved not in reachable:
                queue.append(resolved)
    return reachable

# Start from main entry points
start_files = ['client/src/main.tsx', 'server/server.ts']
reachable = find_reachable_files(start_files)

# All files in src
all_files = []
for root_dir in ['client/src', 'server/src']:
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css')):
                all_files.append(os.path.abspath(os.path.join(root, file)))

orphans = [f for f in all_files if f not in reachable]

for f in orphans:
    print(f"ORPHAN FILE: {f}")
