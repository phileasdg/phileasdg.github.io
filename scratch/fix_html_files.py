import os
import json
from bs4 import BeautifulSoup

BASE_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/phileasdg.github.io/newsite"
POSTS_JSON_PATH = os.path.join(BASE_DIR, "data", "posts.json")

print(f"Base Directory: {BASE_DIR}")

# Load posts metadata
with open(POSTS_JSON_PATH, "r", encoding="utf-8") as f:
    posts = json.load(f)
post_slugs = [p["slug"] for p in posts]

page_slugs = [
    "a-few-words-about-me",
    "cv-francais",
    "guest-lectures-and-public-speaking-events",
    "inquiries",
    "playgrounds",
    "publications",
    "resume-cv",
    "resume-english",
    "standing-stones-and-megaliths-of-st-just"
]

def make_relative(url, relative_prefix):
    if not url:
        return url
    
    # Normalize domain prefixes
    prefixes = [
        "https://phileasdg.github.io/newsite/",
        "http://phileasdg.github.io/newsite/",
        "https://phileasdg.github.io/",
        "http://phileasdg.github.io/"
    ]
    for p in prefixes:
        if url.startswith(p):
            sub = url[len(p):]
            if not sub:
                return f"{relative_prefix}index.html"
            
            clean_sub = sub.strip('/')
            
            # Sub-repositories and external links should remain absolute
            # Standard folders in this project are posts, pages, tags, authors, assets, media
            standard_starts = ("posts/", "pages/", "tags/", "authors/", "assets/", "media/", "feed.xml", "feed.json", "index.html", "robots.txt", "sitemap.xml")
            
            if clean_sub in post_slugs:
                return f"{relative_prefix}posts/{clean_sub}/"
            if clean_sub in page_slugs:
                return f"{relative_prefix}pages/{clean_sub}/"
                
            if sub.startswith(standard_starts) or any(sub.startswith(s) for s in standard_starts) or sub == 'index.html':
                return f"{relative_prefix}{sub}"
            else:
                return url
                
    # Also handle relative paths that are missing the parent directory prefix
    if relative_prefix and url.startswith(("assets/", "media/", "posts/", "tags/", "authors/", "pages/")):
        clean_url = url.strip('/')
        if '/' not in clean_url:
            if clean_url in post_slugs:
                return f"{relative_prefix}posts/{clean_url}/"
            if clean_url in page_slugs:
                return f"{relative_prefix}pages/{clean_url}/"
        return f"{relative_prefix}{url}"
        
    return url

def fix_html_file(file_path):
    rel_path = os.path.relpath(file_path, BASE_DIR)
    depth = len(rel_path.split(os.sep)) - 1
    rel_prefix = "../" * depth
    
    print(f"Fixing {rel_path} (depth={depth}, prefix={rel_prefix})...")
    
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    soup = BeautifulSoup(content, "html.parser")
    
    # 1. Ensure common.js is loaded in the <head>
    head = soup.find("head")
    if head:
        common_script = None
        for script in soup.find_all("script"):
            if "common.js" in script.get("src", ""):
                common_script = script
                break
                
        correct_src = f"{rel_prefix}assets/js/common.js"
        if common_script:
            if common_script.get("src") != correct_src:
                print(f"  -> Updating common.js src from '{common_script.get('src')}' to '{correct_src}'")
                common_script["src"] = correct_src
                common_script["defer"] = "defer"
        else:
            print(f"  -> Adding common.js script tag")
            new_script = soup.new_tag("script", src=correct_src, defer="defer")
            head.append(new_script)
            
    # 2. Replace hardcoded header and footer with dynamic custom elements
    header = soup.find("header", class_="header")
    if header:
        print("  -> Replacing hardcoded header with <site-header>")
        new_header = soup.new_tag("site-header")
        header.replace_with(new_header)
        
    footer = soup.find("footer", class_="footer")
    if footer:
        print("  -> Replacing hardcoded footer with <site-footer>")
        new_footer = soup.new_tag("site-footer")
        footer.replace_with(new_footer)
        
    # 3. Clean and make relative all standard links and assets
    for tag in soup.find_all(["a", "link", "img", "script", "source"]):
        for attr in ("href", "src", "srcset"):
            val = tag.get(attr)
            if val:
                if attr == "srcset":
                    parts = []
                    for part in val.split(","):
                        part = part.strip()
                        if part:
                            subparts = part.split()
                            if subparts:
                                subparts[0] = make_relative(subparts[0], rel_prefix)
                                parts.append(" ".join(subparts))
                    tag[attr] = ", ".join(parts)
                else:
                    tag[attr] = make_relative(val, rel_prefix)
                    
    # Write back the changes
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(str(soup))

# Find and process all HTML files
html_files = []
for root, dirs, files in os.walk(BASE_DIR):
    # Skip directories like .git or scratch
    if '.git' in dirs:
        dirs.remove('.git')
    if 'scratch' in dirs:
        dirs.remove('scratch')
    if 'publii' in dirs:
        dirs.remove('publii')
        
    for file in files:
        if file.endswith(".html"):
            html_files.append(os.path.join(root, file))

for path in sorted(html_files):
    fix_html_file(path)

print("\nAll HTML files successfully fixed!")
