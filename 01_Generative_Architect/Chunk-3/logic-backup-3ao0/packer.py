import os
import brotli
import base64
import struct

# BRAIN-FIREBASE-RUNTIME: DNA PACKER (Phase 2.1)
# Optimized for binary efficiency and compatibility with the JS runtime.

def minify_code(code):
    # Simple minification: remove comments and collapse whitespace
    import re
    code = re.sub(r'/\*[\s\S]*?\*/|([^\\:]|^)//.*$', r'\1', code, flags=re.MULTILINE)
    code = re.sub(r'\s+', ' ', code)
    return code.strip()

def pack_directory(dir_path):
    binary_data = bytearray()
    evolvable_extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']

    print(f"Scanning {dir_path}...")

    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if not any(file.endswith(ext) for ext in evolvable_extensions):
                continue
            
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dir_path)
            
            # Skip hidden files and node_modules
            if any(part.startswith('.') for part in rel_path.split(os.sep)) or 'node_modules' in rel_path:
                continue

            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    minified = minify_code(content)
                    
                    path_bytes = rel_path.encode('utf-8')
                    content_bytes = minified.encode('utf-8')
                    
                    # Pack: [pathLen 2B][contentLen 4B][path][content] (Little Endian)
                    header = struct.pack('<HI', len(path_bytes), len(content_bytes))
                    binary_data.extend(header)
                    binary_data.extend(path_bytes)
                    binary_data.extend(content_bytes)
            except Exception as e:
                print(f"Skipping {file}: {e}")

    print("Concatenation complete. Compressing with Brotli...")
    
    compressed = brotli.compress(binary_data)
    base64_string = base64.b64encode(compressed).decode('utf-8')

    print("Compression complete.")
    print(f"Final Base64 Length: {len(base64_string)}")
    
    with open('brain_dna_payload.txt', 'w') as f:
        f.write(base64_string)
    print("Payload saved to brain_dna_payload.txt")

if __name__ == "__main__":
    import sys
    target_dir = sys.argv[1] if len(sys.argv) > 1 else './src'
    pack_directory(target_dir)
