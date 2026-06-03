import os
import re
import json
import shutil
from bs4 import BeautifulSoup

ROOT_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/phileasdg.github.io/newsite"
DATA_DIR = os.path.join(ROOT_DIR, "data")
POSTS_DIR = os.path.join(ROOT_DIR, "posts")

# Known pages and folders that should stay in root
PAGES = {
    "a-few-words-about-me",
    "resume-cv",
    "resume-english",
    "cv-francais",
    "inquiries",
    "playgrounds",
    "publications",
    "guest-lectures-and-public-speaking-events"
}

EXCLUDED_FOLDERS = {
    "assets",
    "media",
    "tags",
    "authors",
    "page",
    "scratch",
    "posts",
    "data",
    ".git",
    ".github",
    ".DS_Store"
}.union(PAGES)

def extract_post_metadata(post_slug, html_path):
    print(f"Parsing metadata for post: {post_slug}")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    soup = BeautifulSoup(content, "html.parser")
    
    # Title
    title_el = soup.find(class_="content__title")
    title = title_el.get_text(strip=True) if title_el else ""
    if not title:
        title_el = soup.find("title")
        title = title_el.get_text(strip=True) if title_el else post_slug
        title = title.replace(" - Phileas Dazeley-Gaist", "")
    
    # Date
    time_el = soup.find("time")
    date_str = ""
    if time_el:
        date_str = time_el.get("datetime", "")
        if not date_str:
            date_str = time_el.get_text(strip=True)
    
    # Tags
    tags = []
    tag_list = soup.find(class_="content__tag")
    if tag_list:
        for a in tag_list.find_all("a"):
            tags.append(a.get_text(strip=True))
            
    # Thumbnail
    thumbnail = ""
    feat_img = soup.find(class_="content__featured-image")
    if feat_img:
        img_el = feat_img.find("img")
        if img_el:
            img_src = img_el.get("src", "")
            # Normalize thumbnail to be relative to newsite/ root
            # e.g., "../media/posts/36/Animation1.gif" -> "media/posts/36/Animation1.gif"
            thumbnail = re.sub(r'^\.\./', '', img_src)
            
    return {
        "id": post_slug,
        "name": title,
        "slug": post_slug,
        "date": date_str,
        "tags": tags,
        "thumbnail": thumbnail
    }

def adjust_html_paths(html_content, post_slug, post_slugs):
    # Regex to find links, images, srcset and custom xlink uses
    # We look for src="...", href="...", srcset="..."
    
    # 1. Update relative links pointing to root folders/pages
    # e.g., "../assets/..." -> "../../assets/..."
    # e.g., "../media/..." -> "../../media/..."
    # e.g., "../tags/..." -> "../../tags/..."
    # e.g., "../publications/" -> "../../publications/"
    
    def replacer(match):
        attr = match.group(1)  # src, href, etc.
        val = match.group(2)   # the URL value
        
        # Keep absolute URLs intact
        if val.startswith(("http://", "https://", "//", "mailto:", "javascript:", "#")):
            return match.group(0)
            
        # Handle relative links starting with "../"
        if val.startswith("../"):
            # Check if this link points to another post (which is now in posts/)
            # e.g., "../another-post-slug/"
            # We want to change it to "../../posts/another-post-slug/"
            relative_target = re.sub(r'^\.\./', '', val).strip("/")
            
            # Remove sub-paths (like pagination page/2/ inside tag or author folder)
            target_base = relative_target.split("/")[0]
            
            if target_base in post_slugs:
                # Point to the new posts/ location
                new_val = "../../posts/" + relative_target
                if not new_val.endswith("/") and not "." in new_val:
                    new_val += "/"
                return f'{attr}="{new_val}"'
            
            # If it's a page or asset
            # e.g., "../assets/..." -> "../../assets/..."
            new_val = "../" + val
            return f'{attr}="{new_val}"'
            
        return match.group(0)

    # Match src="...", href="...", srcset="...", xlink:href="..."
    pattern = re.compile(r'(src|href|srcset|xlink:href)="([^"]+)"')
    refactored_content = pattern.sub(replacer, html_content)
    
    # Special handling for srcset lists (which are comma-separated relative paths)
    # e.g., srcset="../media/posts/10/responsive/img.png 300w, ../media/posts/10/responsive/img2.png 480w"
    def srcset_replacer(match):
        srcset_val = match.group(1)
        parts = []
        for part in srcset_val.split(","):
            part = part.strip()
            # If it starts with ../
            if part.startswith("../"):
                part = "../" + part
            parts.append(part)
        new_srcset = ", ".join(parts)
        return f'srcset="{new_srcset}"'

    refactored_content = re.sub(r'srcset="([^"]+)"', srcset_replacer, refactored_content)
    
    return refactored_content

def main():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(POSTS_DIR):
        os.makedirs(POSTS_DIR)

    # 1. Identify posts
    post_slugs = []
    for item in os.listdir(ROOT_DIR):
        item_path = os.path.join(ROOT_DIR, item)
        if os.path.isdir(item_path) and item not in EXCLUDED_FOLDERS:
            # Check if it has index.html
            if os.path.exists(os.path.join(item_path, "index.html")):
                post_slugs.append(item)
                
    print(f"Identified {len(post_slugs)} posts to consolidate.")

    # 2. Extract metadata and compile posts.json
    posts_metadata = []
    for slug in post_slugs:
        html_path = os.path.join(ROOT_DIR, slug, "index.html")
        meta = extract_post_metadata(slug, html_path)
        posts_metadata.append(meta)
        
    # Sort posts by date descending
    posts_metadata.sort(key=lambda x: x.get("date", ""), reverse=True)

    posts_json_path = os.path.join(DATA_DIR, "posts.json")
    with open(posts_json_path, "w", encoding="utf-8") as f:
        json.dump(posts_metadata, f, indent=2, ensure_ascii=False)
    print(f"Saved database to {posts_json_path}")

    # 3. Consolidate posts and refactor URLs
    for slug in post_slugs:
        src_path = os.path.join(ROOT_DIR, slug)
        dest_path = os.path.join(POSTS_DIR, slug)
        
        # Read index.html content first
        html_file = os.path.join(src_path, "index.html")
        with open(html_file, "r", encoding="utf-8") as f:
            html_content = f.read()
            
        # Refactor relative links
        print(f"Refactoring paths in index.html for: {slug}")
        new_html_content = adjust_html_paths(html_content, slug, set(post_slugs))
        
        # Write updated content back before moving (or move first and then write)
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(new_html_content)
            
        # Move directory to newsite/posts/
        print(f"Moving {slug} to posts/")
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)
        shutil.move(src_path, dest_path)

    print("Post consolidation and path refactoring complete!")

if __name__ == "__main__":
    main()
