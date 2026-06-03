import os
import re
import shutil

ROOT_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/phileasdg.github.io/newsite"
PAGES_DIR = os.path.join(ROOT_DIR, "pages")

# List of pages to be consolidated
PAGES = [
    "a-few-words-about-me",
    "cv-francais",
    "guest-lectures-and-public-speaking-events",
    "inquiries",
    "playgrounds",
    "publications",
    "resume-cv",
    "resume-english"
]

def adjust_page_html_paths(html_content, pages_list):
    # Shift relative paths inside moved pages down one level (add ../)
    # except when it refers to another page inside PAGES (since they remain siblings under pages/)
    def replacer(match):
        attr = match.group(1)
        val = match.group(2)
        
        # Keep absolute URLs intact
        if val.startswith(("http://", "https://", "//", "mailto:", "javascript:", "#")):
            return match.group(0)
            
        if val.startswith("../"):
            # Check what it points to
            rest = val[3:]
            target = rest.split("/")[0] if rest else ""
            if target in pages_list:
                return match.group(0) # Keep sibling page link unchanged
            return f'{attr}="../{val}"'
            
        return match.group(0)

    pattern = re.compile(r'(src|href|xlink:href)="([^"]+)"')
    refactored = pattern.sub(replacer, html_content)
    
    # Handle srcset separately
    def srcset_replacer(match):
        srcset_val = match.group(1)
        parts = []
        for part in srcset_val.split(","):
            part = part.strip()
            sub_parts = part.split()
            if sub_parts:
                url = sub_parts[0]
                if url.startswith("../"):
                    rest = url[3:]
                    target = rest.split("/")[0] if rest else ""
                    if target not in pages_list:
                        url = "../" + url
                sub_parts[0] = url
                parts.append(" ".join(sub_parts))
        new_srcset = ", ".join(parts)
        return f'srcset="{new_srcset}"'

    refactored = re.sub(r'srcset="([^"]+)"', srcset_replacer, refactored)
    return refactored

def update_page_links_in_file(file_path, pages_list, root_dir):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    rel_path = os.path.relpath(file_path, root_dir)
    is_root = (rel_path == "index.html" or rel_path == "404.html" or os.sep not in rel_path)
    is_in_pages = rel_path.startswith("pages" + os.sep)
    
    # 1. Update absolute/sitemap/feed links in all files
    for page in pages_list:
        content = content.replace(f"https://phileasdg.github.io/{page}/", f"https://phileasdg.github.io/pages/{page}/")
        content = content.replace(f"https://phileasdg.github.io/{page}\"", f"https://phileasdg.github.io/pages/{page}\"")
        content = content.replace(f"https:\\/\\/phileasdg.github.io\\/{page}\\/", f"https:\\/\\/phileasdg.github.io\\/pages\\/{page}\\/")

    # 2. Update relative links in files NOT in pages/
    if not is_in_pages:
        for page in pages_list:
            def link_replacer(match):
                prefix = match.group(1) or ""
                # If it already has pages/, do nothing
                if "pages/" in prefix:
                    return match.group(0)
                    
                if is_root:
                    return f'href="pages/{page}/"'
                else:
                    return f'href="{prefix}pages/{page}/"'
                    
            pattern = re.compile(rf'href="([\./]*){page}/?"')
            content = pattern.sub(link_replacer, content)
            
    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated page links in: {rel_path}")

def update_common_js():
    js_path = os.path.join(ROOT_DIR, "assets/js/common.js")
    if not os.path.exists(js_path):
        print("common.js not found!")
        return
        
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    
    # Update link entries inside common.js
    for page in PAGES:
        # Match e.g. isActive('/page-name') and getLink('/page-name')
        content = content.replace(f"isActive('/{page}')", f"isActive('/pages/{page}')")
        content = content.replace(f"getLink('/{page}/')", f"getLink('/pages/{page}/')")
        content = content.replace(f"getLink('/{page}')", f"getLink('/pages/{page}')")
        
    if content != original_content:
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated common.js navigation items.")

def main():
    if not os.path.exists(PAGES_DIR):
        os.makedirs(PAGES_DIR)
        print(f"Created directory: {PAGES_DIR}")
        
    # 1. Move page folders and adjust paths inside them
    for page in PAGES:
        src = os.path.join(ROOT_DIR, page)
        dest = os.path.join(PAGES_DIR, page)
        
        if os.path.exists(src):
            # Process files inside src directory before moving
            for root, dirs, files in os.walk(src):
                for file in files:
                    if file.endswith(".html"):
                        file_path = os.path.join(root, file)
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        new_content = adjust_page_html_paths(content, PAGES)
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                            
            print(f"Moving page directory: {page}")
            if os.path.exists(dest):
                shutil.rmtree(dest)
            shutil.move(src, dest)
        else:
            print(f"Warning: Page directory {page} not found in root.")

    # 2. Update common.js links
    update_common_js()

    # 3. Scan and update all links globally
    excluded_dirs = {'assets', 'media', 'scratch', 'data', '.git', '.github'}
    files_to_process = [
        os.path.join(ROOT_DIR, "index.html"),
        os.path.join(ROOT_DIR, "404.html"),
        os.path.join(ROOT_DIR, "feed.json"),
        os.path.join(ROOT_DIR, "feed.xml"),
        os.path.join(ROOT_DIR, "sitemap.xml")
    ]
    
    for item in os.listdir(ROOT_DIR):
        item_path = os.path.join(ROOT_DIR, item)
        if os.path.isdir(item_path) and item not in excluded_dirs:
            for root, dirs, files in os.walk(item_path):
                dirs[:] = [d for d in dirs if d not in excluded_dirs]
                for file in files:
                    if file.endswith((".html", ".xml", ".json")):
                        files_to_process.append(os.path.join(root, file))
                        
    print(f"Scanning and updating page links in {len(files_to_process)} files...")
    for file_path in files_to_process:
        if os.path.exists(file_path):
            update_page_links_in_file(file_path, PAGES, ROOT_DIR)
            
    print("Page reorganization complete!")

if __name__ == "__main__":
    main()
