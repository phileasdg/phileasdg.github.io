import os
import re
import json

ROOT_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/phileasdg.github.io/newsite"
POSTS_JSON = os.path.join(ROOT_DIR, "data", "posts.json")

def load_post_slugs():
    with open(POSTS_JSON, "r", encoding="utf-8") as f:
        posts = json.load(f)
    return [p["slug"] for p in posts]

def update_links_in_file(file_path, post_slugs):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original_content = content
    
    # 1. Update relative links:
    # Look for href="...[slug]/" or href="...[slug]"
    # We want to replace "[slug]/" with "posts/[slug]/"
    # To avoid matching if it's already "posts/[slug]/", we make sure "posts/" is not before the slug.
    for slug in post_slugs:
        # Match pattern: href="([./]*)(?!posts/)[slug]/"
        # We use a negative lookahead for posts/
        # Wait, since python regex matches can be tricky, let's use a simpler approach:
        # Replace occurrences of (href="[prefix])(?!posts/)([slug]/)" with \1posts/\2
        
        # We search for href="[relative-prefix][slug]/" where the prefix does not end with "posts/"
        # A relative prefix can be: empty, "./", "../", "../../", "../../../../", etc.
        # We can find all instances of href="[prefix][slug]/" and if "posts/" is not at the end of the prefix, insert it.
        
        def link_replacer(match):
            prefix = match.group(1) or ""
            # If the prefix already ends with "posts/", do nothing
            if prefix.endswith("posts/"):
                return match.group(0)
            return f'href="{prefix}posts/{slug}/"'
            
        pattern = re.compile(rf'href="([\./]*){slug}/?"')
        content = pattern.sub(link_replacer, content)
        
        # Also match canonical/feed absolute links:
        # e.g., "https://phileasdg.github.io/[slug]/" -> "https://phileasdg.github.io/posts/[slug]/"
        content = content.replace(f"https://phileasdg.github.io/{slug}/", f"https://phileasdg.github.io/posts/{slug}/")
        # In case there's no trailing slash in some places:
        content = content.replace(f"https://phileasdg.github.io/{slug}\"", f"https://phileasdg.github.io/posts/{slug}\"")
        # JSON feed clean URLs:
        content = content.replace(f"https:\\/\\/phileasdg.github.io\\/{slug}\\/", f"https:\\/\\/phileasdg.github.io\\/posts\\/{slug}\\/")
        
    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated links in: {file_path}")

def main():
    if not os.path.exists(POSTS_JSON):
        print(f"Error: {POSTS_JSON} does not exist. Run reorganize.py first.")
        return
        
    post_slugs = load_post_slugs()
    print(f"Loaded {len(post_slugs)} post slugs from database.")
    
    # Files to process
    files_to_process = []
    
    # 1. Main index.html
    files_to_process.append(os.path.join(ROOT_DIR, "index.html"))
    files_to_process.append(os.path.join(ROOT_DIR, "404.html"))
    files_to_process.append(os.path.join(ROOT_DIR, "feed.json"))
    files_to_process.append(os.path.join(ROOT_DIR, "feed.xml"))
    files_to_process.append(os.path.join(ROOT_DIR, "sitemap.xml"))
    
    # 2. Process folders recursively
    excluded_dirs = {'posts', 'assets', 'media', 'scratch', 'data', '.git', '.github'}
    for item in os.listdir(ROOT_DIR):
        item_path = os.path.join(ROOT_DIR, item)
        if os.path.isdir(item_path) and item not in excluded_dirs:
            for root, dirs, files in os.walk(item_path):
                # Prune excluded directories
                dirs[:] = [d for d in dirs if d not in excluded_dirs]
                for file in files:
                    if file.endswith(".html") or file.endswith(".xml") or file.endswith(".json"):
                        files_to_process.append(os.path.join(root, file))
                        
    print(f"Scanning and updating links in {len(files_to_process)} files...")
    for file_path in files_to_process:
        if os.path.exists(file_path):
            update_links_in_file(file_path, post_slugs)
            
    print("Rebuilding links complete!")

if __name__ == "__main__":
    main()
