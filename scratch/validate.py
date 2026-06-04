import os
import json
import re
from bs4 import BeautifulSoup

workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
posts_json_path = os.path.join(workspace_dir, "data", "posts.json")
pages_json_path = os.path.join(workspace_dir, "data", "pages.json")

def validate_pages_json():
    print("--- Validating pages.json ---")
    if not os.path.exists(pages_json_path):
        print("FAIL: pages.json does not exist!")
        return None
    try:
        with open(pages_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"SUCCESS: pages.json parsed correctly. Total pages: {len(data)}")
        return data
    except Exception as e:
        print(f"FAIL: Error parsing pages.json: {e}")
        return None

def validate_posts_json():
    print("--- Validating posts.json ---")
    if not os.path.exists(posts_json_path):
        print("FAIL: posts.json does not exist!")
        return None
    try:
        with open(posts_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"SUCCESS: posts.json parsed correctly. Total posts: {len(data)}")
        return data
    except Exception as e:
        print(f"FAIL: Error parsing posts.json: {e}")
        return None

def check_file_exists(base_dir, relative_path, current_file_path, posts_data=None):
    # Resolve the path relative to the directory containing current_file_path
    file_dir = os.path.dirname(current_file_path)
    # Handle absolute looking or site-root looking paths if any, but since they should be relative:
    # Remove query params or hashes
    clean_path = relative_path.split('?')[0].split('#')[0]
    if not clean_path:
        return True # Just a hash link or empty
    
    # If it is absolute (starts with http, https, mailto, etc.), ignore
    if clean_path.startswith(('http://', 'https://', 'mailto:', '//', 'tel:')):
        return True
        
    # Check for SPA dynamic routes resolved relative to base_dir
    resolved_full_path = os.path.normpath(os.path.join(file_dir, clean_path))
    rel_from_root = os.path.relpath(resolved_full_path, base_dir).replace('\\', '/')

    if rel_from_root.startswith('posts/'):
        parts = rel_from_root.split('/')
        if len(parts) >= 2:
            slug = parts[1]
            if posts_data and any(p.get("slug") == slug for p in posts_data):
                return True
    elif rel_from_root.startswith('pages/'):
        parts = rel_from_root.split('/')
        if len(parts) >= 2:
            slug = parts[1]
            pages_json = os.path.join(base_dir, "data", "pages.json")
            if os.path.exists(pages_json):
                with open(pages_json, 'r', encoding='utf-8') as f:
                    pages_data = json.load(f)
                    if any(p.get("slug") == slug for p in pages_data):
                        return True
    elif rel_from_root.startswith('tags/') or rel_from_root.startswith('authors/'):
        return True

    resolved_path = os.path.normpath(os.path.join(file_dir, clean_path))
    
    # Check if file exists, or if it's a directory, check if index.html exists inside it
    if os.path.exists(resolved_path):
        return True
    
    # Check if appending index.html helps (e.g. if link is href="../../posts/some-post/")
    if os.path.isdir(resolved_path) or resolved_path.endswith('/') or not os.path.splitext(resolved_path)[1]:
        alt_path = os.path.normpath(os.path.join(resolved_path, "index.html"))
        if os.path.exists(alt_path):
            return True
            
    return False

def validate_html_files(posts_data, pages_data):
    print("--- Validating Post and Page HTML files ---")
    all_ok = True
    
    # 1. Validate posts
    for post in posts_data:
        slug = post["slug"]
        html_file = os.path.join(workspace_dir, "data", "posts", f"{slug}.html")
        fake_file_path = os.path.join(workspace_dir, "posts", slug, "index.html")
        
        if not os.path.exists(html_file):
            print(f"FAIL: Post HTML file missing for slug: {slug} at {html_file}")
            all_ok = False
            continue
            
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        elements_to_check = []
        for tag in soup.find_all(['a', 'link', 'img', 'script', 'source']):
            url = None
            attr = None
            if tag.name in ('a', 'link'):
                url = tag.get('href')
                attr = 'href'
            elif tag.name in ('img', 'script', 'source'):
                url = tag.get('src') or tag.get('srcset')
                attr = 'src/srcset'
                
            if url:
                urls = []
                if tag.name == 'source' or (tag.name == 'img' and tag.has_attr('srcset')):
                    for part in url.split(','):
                        part = part.strip()
                        if part:
                            urls.append(part.split()[0])
                else:
                    urls = [url]
                    
                for u in urls:
                    elements_to_check.append((tag.name, attr, u))
                    
        broken_links = []
        for name, attr, val in elements_to_check:
            if not check_file_exists(workspace_dir, val, fake_file_path, posts_data):
                broken_links.append((name, attr, val))
                
        if broken_links:
            print(f"FAIL: data/posts/{slug}.html has broken links:")
            for name, attr, val in broken_links:
                print(f"  - <{name} {attr}=\"{val}\"> is broken!")
            all_ok = False
            
    # 2. Validate pages
    for page in pages_data:
        slug = page["slug"]
        html_file = os.path.join(workspace_dir, "data", "pages", f"{slug}.html")
        fake_file_path = os.path.join(workspace_dir, "pages", slug, "index.html")
        
        if not os.path.exists(html_file):
            print(f"FAIL: Page HTML file missing for slug: {slug} at {html_file}")
            all_ok = False
            continue
            
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        elements_to_check = []
        for tag in soup.find_all(['a', 'link', 'img', 'script', 'source']):
            url = None
            attr = None
            if tag.name in ('a', 'link'):
                url = tag.get('href')
                attr = 'href'
            elif tag.name in ('img', 'script', 'source'):
                url = tag.get('src') or tag.get('srcset')
                attr = 'src/srcset'
                
            if url:
                urls = []
                if tag.name == 'source' or (tag.name == 'img' and tag.has_attr('srcset')):
                    for part in url.split(','):
                        part = part.strip()
                        if part:
                            urls.append(part.split()[0])
                else:
                    urls = [url]
                    
                for u in urls:
                    elements_to_check.append((tag.name, attr, u))
                    
        broken_links = []
        for name, attr, val in elements_to_check:
            if not check_file_exists(workspace_dir, val, fake_file_path, posts_data):
                broken_links.append((name, attr, val))
                
        if broken_links:
            print(f"FAIL: data/pages/{slug}.html has broken links:")
            for name, attr, val in broken_links:
                print(f"  - <{name} {attr}=\"{val}\"> is broken!")
            all_ok = False
            
    if all_ok:
        print("SUCCESS: All post and page HTML files have valid relative resource and link paths.")
    return all_ok

def validate_main_pages(posts_data=None):
    print("--- Validating Main HTML Pages ---")
    all_ok = True
    main_files = [
        os.path.join(workspace_dir, "index.html"),
        os.path.join(workspace_dir, "404.html")
    ]
    
    # Add paginated pages and tag pages
    for root, dirs, files in os.walk(workspace_dir):
        # skip posts and some system/data directories
        if any(p in root for p in ['/posts/', '/.git/', '/scratch/', 'data/posts', 'data/pages']):
            continue
        for f in files:
            if f.endswith('.html'):
                main_files.append(os.path.join(root, f))
                
    main_files = list(set(main_files)) # deduplicate
    print(f"Checking {len(main_files)} html files...")
    
    for html_file in main_files:
        if not os.path.exists(html_file):
            continue
        with open(html_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        elements_to_check = []
        for tag in soup.find_all(['a', 'link', 'img', 'script']):
            url = tag.get('href') or tag.get('src')
            attr = 'href' if tag.get('href') else 'src'
            if url:
                elements_to_check.append((tag.name, attr, url))
                
        broken_links = []
        for name, attr, val in elements_to_check:
            if not check_file_exists(workspace_dir, val, html_file, posts_data):
                broken_links.append((name, attr, val))
                
        # Report
        rel_path = os.path.relpath(html_file, workspace_dir)
        if broken_links:
            print(f"FAIL: {rel_path} has broken links:")
            for name, attr, val in broken_links:
                print(f"  - <{name} {attr}=\"{val}\"> is broken!")
            all_ok = False
            
    if all_ok:
        print("SUCCESS: All main pages have valid links/resources.")
    return all_ok

if __name__ == "__main__":
    posts = validate_posts_json()
    pages = validate_pages_json()
    if posts and pages:
        html_ok = validate_html_files(posts, pages)
        main_ok = validate_main_pages(posts)
        if html_ok and main_ok:
            print("\n*** ALL CHECKS PASSED SUCCESSFULLY! ***")
        else:
            print("\n*** SOME CHECKS FAILED! ***")
    else:
        print("Validation stopped due to metadata file loading failure.")
