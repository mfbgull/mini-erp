import re
import os
import sys

def find_orphan_exports(root_dir):
    exports = {} # (name, file_path) -> usage_count
    
    # First pass: find all exports
    export_patterns = [
        re.compile(r'export\s+(?:const|function|class|interface|type)\s+(\w+)'),
        re.compile(r'export\s+default\s+(?:function|class)?\s*(\w+)?'),
    ]
    
    # For default exports without a name, we'll use the filename
    
    all_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                all_files.append(os.path.join(root, file))
                
    for file_path in all_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Named exports
        for match in re.finditer(r'export\s+(?:const|function|class|interface|type)\s+(\w+)', content):
            name = match.group(1)
            exports[(name, file_path)] = 0
            
        # Default exports
        match = re.search(r'export\s+default\s+(?:function|class)?\s*(\w+)?', content)
        if match:
            name = match.group(1)
            if not name:
                # Use filename as name for anonymous default export
                name = os.path.basename(file_path).split('.')[0]
            exports[(name, file_path)] = 0

    # Second pass: count imports
    import_pattern = re.compile(r'import\s+.*?[\'"]([^\'"]+)[\'"]', re.MULTILINE)
    
    for file_path in all_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # This is a bit complex because imports can be relative.
        # Let's just search for the export names in all files' contents (excluding the file where it's defined)
        pass

    # Better approach for second pass:
    for (name, source_path), _ in exports.items():
        count = 0
        for file_path in all_files:
            if file_path == source_path: continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                # Just check if the name exists as a word in the file
                if re.search(r'\b' + re.escape(name) + r'\b', f.read()):
                    count += 1
                    break # Found one usage, that's enough to not be an orphan
        exports[(name, source_path)] = count

    return [ (name, path) for (name, path), count in exports.items() if count == 0 ]

results = find_orphan_exports('client/src')
for name, path in results:
    print(f"CLIENT ORPHAN: {name} in {path}")

results = find_orphan_exports('server/src')
for name, path in results:
    print(f"SERVER ORPHAN: {name} in {path}")
