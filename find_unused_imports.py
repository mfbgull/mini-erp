import re
import os
import sys

def find_unused_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match lines like: import { a, b as c } from '...'
    # Or: import d from '...'
    # Or: import * as e from '...'
    
    import_pattern = re.compile(r'import\s+((?:\{[^}]+\})|(?:\w+)|(?:\*\s+as\s+\w+)|(?:\w+\s*,\s*\{[^}]+\}))\s+from\s+[\'"]([^\'"]+)[\'"]', re.MULTILINE)
    
    unused = []
    
    for match in import_pattern.finditer(content):
        import_part = match.group(1).strip()
        
        # Extract individual names
        names = []
        if '{' in import_part:
            # Handle { a, b as c }
            inner = re.search(r'\{([^}]+)\}', import_part).group(1)
            parts = inner.split(',')
            for p in parts:
                p = p.strip()
                if ' as ' in p:
                    names.append(p.split(' as ')[1].strip())
                else:
                    names.append(p.strip())
        
        if not import_part.startswith('{'):
            # Handle: import d from '...' or import d, { ... } from '...'
            first_part = import_part.split('{')[0].strip().rstrip(',')
            if first_part:
                if '* as ' in first_part:
                    names.append(first_part.split('* as ')[1].strip())
                else:
                    names.append(first_part)
        
        for name in names:
            if not name: continue
            # Count occurrences of 'name' in content
            # We want to exclude the import statement itself
            # A simple way is to check if it appears more than once or if it appears in the code section
            
            # Use regex to find usage as a word
            usage_pattern = re.compile(r'\b' + re.escape(name) + r'\b')
            matches = usage_pattern.findall(content)
            
            # If it only appears once, it might be just the import
            # But wait, it could appear in the import and NOT be used.
            # Actually, if it's in the import, it appears at least once.
            # If it appears exactly once, and that's the import, it's unused.
            
            if len(matches) == 1:
                unused.append((name, file_path))
                
    return unused

root_dir = sys.argv[1]
all_unused = []
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
            file_path = os.path.join(root, file)
            all_unused.extend(find_unused_imports(file_path))

for name, path in all_unused:
    print(f"{path}: {name}")
