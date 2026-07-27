import os
import json
import shutil
import subprocess
import getpass
import urllib.request
import urllib.error
from pathlib import Path

# ==============================================================================
# CONFIG
# ==============================================================================
REPO_URL = "https://github.com/craighckby-stack/AI-Project-Genesis-Scaffold.git"
REPO_FOLDER = "/content/AI-Project-Genesis-Scaffold"
GH_OWNER = "craighckby-stack"
GITHUB_API = "https://api.github.com"
ALLOWED_EXTENSIONS = ('.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.yaml', '.yml', '.md')

def api_request(token: str, url: str) -> dict:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "AI-Project-Genesis"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"    [!] API Error {e.code} on {url}")
        return []
    except Exception as e:
        print(f"    [!] Unexpected API Error: {e}")
        return []

def main():
    print("Enter your GitHub Token (it will be hidden):")
    token = getpass.getpass("Token: ").strip()
    
    if not token:
        print("[!] No token provided. Aborting.")
        return

    os.chdir("/content")
    
    # 1. Clone Scaffold
    print("\n[+] Cloning Scaffold Repository...")
    if os.path.exists(REPO_FOLDER):
        shutil.rmtree(REPO_FOLDER, ignore_errors=True)
        
    auth_url = REPO_URL.replace("https://", f"https://{token}@")
    result = subprocess.run(["git", "clone", auth_url, REPO_FOLDER], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("\n[!] FAILED TO CLONE REPOSITORY.")
        print("Git Error Message:")
        print(result.stderr)
        return
        
    os.chdir(REPO_FOLDER)
    subprocess.run(["git", "config", "user.name", "AHI Synthesizer Bot"], check=True)
    subprocess.run(["git", "config", "user.email", "bot@ahi.local"], check=True)
    
    # 2. Build Search Map (Stub File -> Keywords) using a robust line-by-line parser
    print("\n[+] Building Search Map from Stub Lineages...")
    search_map = {}
    
    for stub_path in Path(".").rglob("*.py"):
        try:
            content = stub_path.read_text(encoding="utf-8")
        except Exception:
            continue
            
        keywords = []
        in_lineage = False
        for line in content.split('\n'):
            if 'KNOWN SOURCE LINEAGE' in line:
                in_lineage = True
                continue
            if in_lineage:
                if line.strip().startswith('- '):
                    # Extract the word after the hyphen, stop at space or parenthesis
                    kw = line.strip()[2:].split(' ')[0].split('(')[0].strip()
                    kw = kw.rstrip(',').rstrip(':') # Clean up trailing punctuation
                    if len(kw) > 2 and kw.lower() not in ['any', 'the', 'main', 'orgional', 'original']:
                        keywords.append(kw.lower())
                elif line.strip() == '' or line.strip().startswith('TODO'):
                    in_lineage = False
        
        if keywords:
            search_map[str(stub_path)] = keywords
            
    print(f"[✓] Found {len(search_map)} stubs with keywords to search for.")
    
    # 3. Get all Repos
    print("\n[+] Fetching all Repositories...")
    repos = []
    page = 1
    while True:
        data = api_request(token, f"{GITHUB_API}/user/repos?per_page=100&page={page}&affiliation=owner")
        if not data: break
        repos.extend([r["name"] for r in data if r["owner"]["login"].lower() == GH_OWNER.lower()])
        page += 1
    print(f"[✓] Found {len(repos)} total repositories to siphon.")

    temp_dir = Path("/content/_temp_clone")
    if temp_dir.exists(): 
        shutil.rmtree(temp_dir, ignore_errors=True)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    total_matched_files = 0

    # 4. Siphon Everything
    for repo in repos:
        print(f"\n--- Processing Repo: {repo} ---")
        branches = []
        page = 1
        while True:
            data = api_request(token, f"{GITHUB_API}/repos/{GH_OWNER}/{repo}/branches?per_page=100&page={page}")
            if not data: break
            branches.extend([b["name"] for b in data])
            page += 1
            
        for branch in branches:
            clone_dest = temp_dir / repo / branch.replace("/", "__")
            clone_url = f"https://{token}@github.com/{GH_OWNER}/{repo}.git"
            
            subprocess.run(
                ["git", "clone", "--depth", "1", "--branch", branch, "--single-branch", clone_url, str(clone_dest)],
                capture_output=True, text=True
            )
            
            if not clone_dest.exists():
                continue
                
            for file_path in clone_dest.rglob("*"):
                if file_path.is_file() and file_path.suffix in ALLOWED_EXTENSIONS:
                    if "node_modules" in str(file_path) or "package-lock" in file_path.name:
                        continue
                        
                    try:
                        content = file_path.read_text(encoding='utf-8', errors='ignore')
                        content_lower = content.lower()
                        file_name_lower = file_path.name.lower()
                        
                        for stub_path, keywords in search_map.items():
                            if any(kw in content_lower or kw in file_name_lower for kw in keywords):
                                with open(stub_path, "a", encoding="utf-8") as f_out:
                                    f_out.write(f'\n# ==============================================================================\n')
                                    f_out.write(f'# REPOSITORY: {repo} | BRANCH: {branch}\n')
                                    f_out.write(f'# ==============================================================================\n')
                                    f_out.write(f'\n# --- File: {file_path.relative_to(clone_dest)} ---\n')
                                    safe_content = content.replace('"""', '\\"\\"\\"')
                                    f_out.write(f'"""\n{safe_content}\n"""\n')
                                    
                                print(f"  [✓] MATCH -> {stub_path} ({repo}@{branch})")
                                total_matched_files += 1
                                break 
                                
                    except Exception:
                        pass
            
            shutil.rmtree(clone_dest, ignore_errors=True)

    print(f"\n[✓] Master Siphon Complete! Total files stacked: {total_matched_files}")
    
    if total_matched_files > 0:
        print("[+] Committing and pushing all changes to GitHub...")
        try:
            subprocess.run(["git", "add", "."], check=True)
            subprocess.run(["git", "commit", "-m", "Master Siphon: Stacked all historical branches for all stubs"], check=True)
            subprocess.run(["git", "push", "origin", "main"], check=True)
            print("\n✅ SUCCESS! All stubs populated and pushed to GitHub.")
        except subprocess.CalledProcessError as e:
            print(f"\n[!] Git push failed. Error: {e}")
    else:
        print("[!] No new matches found. Nothing to commit.")

if __name__ == "__main__":
    main()
