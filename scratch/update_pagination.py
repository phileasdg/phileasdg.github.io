import os
import json
from bs4 import BeautifulSoup
import shutil

# Path setup
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
POSTS_JSON_PATH = os.path.join(BASE_DIR, "data", "posts.json")

print(f"Base Directory: {BASE_DIR}")
print(f"Posts JSON Path: {POSTS_JSON_PATH}")

# Read posts database
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

# Helper to normalize tag to slug
def get_tag_slug(tag_name):
    if tag_name == "R programming":
        return "r"
    slug = tag_name.lower().replace('&', 'and')
    slug = "".join(c for c in slug if c.isalnum() or c.isspace() or c == '-')
    slug = slug.strip().replace(' ', '-')
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug

def make_relative(url, relative_prefix):
    if not url:
        return url
    
    # Normalise domain prefixes
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
            if clean_sub in post_slugs:
                return f"{relative_prefix}posts/{clean_sub}/"
            if clean_sub in page_slugs:
                return f"{relative_prefix}pages/{clean_sub}/"
                
            # Return relative path to the newsite folder structure
            return f"{relative_prefix}{sub}"
            
    # Also handle relative paths that are missing the parent directory prefix
    # e.g., if we are inside tags/ai/index.html and we have src="assets/css/style.css"
    if relative_prefix and url.startswith(("assets/", "media/", "posts/", "tags/", "authors/", "pages/")):
        # If it matches a post/page directly, rewrite appropriately
        clean_url = url.strip('/')
        if '/' not in clean_url:
            if clean_url in post_slugs:
                return f"{relative_prefix}posts/{clean_url}/"
            if clean_url in page_slugs:
                return f"{relative_prefix}pages/{clean_url}/"
        return f"{relative_prefix}{url}"
        
    return url

def process_html_file(file_path, page_type, filter_value=None):
    print(f"Processing {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    # Determine relative prefix
    relative_prefix = ""
    if "authors/" in file_path or "tags/" in file_path:
        relative_prefix = "../../"

    # Filter posts based on page type
    if page_type == "home":
        filtered_posts = posts
    elif page_type == "author":
        filtered_posts = posts
    elif page_type == "tag":
        filtered_posts = [p for p in posts if any(get_tag_slug(t) == filter_value for t in p.get("tags", []))]
    else:
        filtered_posts = []

    # 1. Clean masonry container (skip for 404.html)
    grid = soup.find(class_='l-masonry')
    if grid:
        grid.clear()
        
        # Add gutter-sizer
        gutter = soup.new_tag('div', attrs={'class': 'gutter-sizer'})
        grid.append(gutter)
        
        # Build noscript element
        noscript = soup.new_tag('noscript')
        fallback_div = soup.new_tag('div', attrs={
            'class': 'noscript-fallback',
            'style': 'padding: 20px; background: rgba(0,0,0,0.05); border-radius: 8px; margin-bottom: 20px;'
        })
        p_text = soup.new_tag('p')
        p_strong = soup.new_tag('strong')
        p_strong.string = "Archive Links:"
        p_text.append(p_strong)
        fallback_div.append(p_text)
        
        ul = soup.new_tag('ul')
        for post in filtered_posts:
            li = soup.new_tag('li')
            a = soup.new_tag('a', href=f"{relative_prefix}posts/{post['slug']}/")
            a.string = post['name']
            li.append(a)
            ul.append(li)
        fallback_div.append(ul)
        noscript.append(fallback_div)
        grid.append(noscript)

    # 2. Handle pagination container
    pag = soup.find('nav', class_='pagination')
    if pag:
        pag.clear()
        pag['id'] = 'pagination-container'
    else:
        if grid:
            pag = soup.new_tag('nav', attrs={'class': 'pagination desc', 'id': 'pagination-container'})
            grid.insert_after(pag)

    # 3. Disable/remove inline Masonry script
    for script in soup.find_all('script'):
        if script.string and ('new Masonry' in script.string or 'var msnry' in script.string):
            script.decompose()

    # 4. Remove link rel="next" and rel="prev" from head
    for link in soup.find_all('link', rel=['next', 'prev']):
        link.decompose()

    # 5. Replace hardcoded header and footer with dynamic components
    header = soup.find('header', class_='header')
    if header:
        new_header = soup.new_tag('site-header')
        header.replace_with(new_header)

    footer = soup.find('footer', class_='footer')
    if footer:
        new_footer = soup.new_tag('site-footer')
        footer.replace_with(new_footer)

    # 6. Make all link paths relative (assets, images, scripts, anchor links)
    for tag in soup.find_all(['a', 'link', 'img', 'script', 'source']):
        for attr in ('href', 'src', 'srcset'):
            val = tag.get(attr)
            if val:
                if attr == 'srcset':
                    parts = []
                    for part in val.split(','):
                        part = part.strip()
                        if part:
                            subparts = part.split()
                            if subparts:
                                subparts[0] = make_relative(subparts[0], relative_prefix)
                                parts.append(" ".join(subparts))
                    tag[attr] = ", ".join(parts)
                else:
                    tag[attr] = make_relative(val, relative_prefix)

    # Write back the modified HTML
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(str(soup))
    print(f"Successfully processed {file_path}")

# Process all files
process_html_file(os.path.join(BASE_DIR, "index.html"), "home")
process_html_file(os.path.join(BASE_DIR, "404.html"), "home")
process_html_file(os.path.join(BASE_DIR, "authors", "phileas-dazeley-gaist", "index.html"), "author")

tags_dir = os.path.join(BASE_DIR, "tags")
for tag_slug in os.listdir(tags_dir):
    tag_path = os.path.join(tags_dir, tag_slug)
    if os.path.isdir(tag_path):
        index_file = os.path.join(tag_path, "index.html")
        if os.path.exists(index_file):
            process_html_file(index_file, "tag", tag_slug)

# Delete all page directories (the static pagination folders)
dirs_to_delete = [
    os.path.join(BASE_DIR, "page"),
    os.path.join(BASE_DIR, "authors", "phileas-dazeley-gaist", "page")
]

for tag_slug in os.listdir(tags_dir):
    tag_path = os.path.join(tags_dir, tag_slug)
    if os.path.isdir(tag_path):
        page_dir = os.path.join(tag_path, "page")
        if os.path.exists(page_dir) and os.path.isdir(page_dir):
            dirs_to_delete.append(page_dir)

print("\nDeleting pagination directories...")
for path in dirs_to_delete:
    if os.path.exists(path):
        print(f"Removing directory: {path}")
        shutil.rmtree(path)
    else:
        print(f"Directory not found (already deleted): {path}")

print("\nCleanup and update complete!")
