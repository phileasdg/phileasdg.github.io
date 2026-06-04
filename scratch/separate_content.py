import os
import json
import re

ROOT_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io"
CONTENT_DIR = os.path.join(ROOT_DIR, "content")
POSTS_CONTENT_DIR = os.path.join(CONTENT_DIR, "posts")
PAGES_CONTENT_DIR = os.path.join(CONTENT_DIR, "pages")

def extract_slug_from_url(url):
    # e.g., "https://phileasdg.github.io/patchwork-with-coexisting-cellular-automata/" -> "patchwork-with-coexisting-cellular-automata"
    parts = url.strip('/').split('/')
    return parts[-1]

def process_posts():
    feed_path = os.path.join(ROOT_DIR, "feed.json")
    if not os.path.exists(feed_path):
        print(f"Error: {feed_path} not found.")
        return

    with open(feed_path, 'r', encoding='utf-8') as f:
        feed = json.load(f)

    os.makedirs(POSTS_CONTENT_DIR, exist_ok=True)
    
    items = feed.get("items", [])
    print(f"Processing {len(items)} posts from feed.json...")
    for item in items:
        url = item.get("url") or item.get("id")
        if not url:
            continue
        slug = extract_slug_from_url(url)
        content_html = item.get("content_html", "")
        
        content_path = os.path.join(POSTS_CONTENT_DIR, f"{slug}.html")
        with open(content_path, 'w', encoding='utf-8') as out_f:
            out_f.write(content_html)
        
        print(f"  Extracted post content: {slug}.html")

def process_pages():
    pages_path = os.path.join(DATA_DIR, "pages.json")
    if not os.path.exists(pages_path):
        print(f"Error: {pages_path} not found.")
        return

    with open(pages_path, 'r', encoding='utf-8') as f:
        pages = json.load(f)

    os.makedirs(PAGES_CONTENT_DIR, exist_ok=True)

    print(f"Processing {len(pages)} pages from pages.json...")
    updated_pages = []
    for page in pages:
        slug = page.get("slug")
        content_html = page.get("content_html", "")
        
        # Write to separate HTML file
        content_path = os.path.join(PAGES_CONTENT_DIR, f"{slug}.html")
        with open(content_path, 'w', encoding='utf-8') as out_f:
            out_f.write(content_html)
            
        print(f"  Extracted page content: {slug}.html")
        
        # Create a new dict without content_html
        clean_page = {k: v for k, v in page.items() if k != "content_html"}
        updated_pages.append(clean_page)

    # Write cleaned pages.json back
    with open(pages_path, 'w', encoding='utf-8') as f:
        json.dump(updated_pages, f, indent=2, ensure_ascii=False)
    print(f"Cleaned pages.json saved.")

if __name__ == "__main__":
    process_posts()
    process_pages()
    print("Content separation complete!")
