import os
import json
import subprocess
from bs4 import BeautifulSoup

ROOT_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io"
DATA_DIR = os.path.join(ROOT_DIR, "data")
POSTS_CONTENT_DIR = os.path.join(DATA_DIR, "posts")

def recover_missing_posts():
    posts_json_path = os.path.join(DATA_DIR, "posts.json")
    if not os.path.exists(posts_json_path):
        print(f"Error: {posts_json_path} not found.")
        return

    with open(posts_json_path, 'r', encoding='utf-8') as f:
        posts = json.load(f)

    os.makedirs(POSTS_CONTENT_DIR, exist_ok=True)

    print(f"Checking {len(posts)} posts from posts.json...")
    recovered_count = 0
    skipped_count = 0
    failed_count = 0

    for post in posts:
        slug = post.get("slug")
        if not slug:
            continue

        content_path = os.path.join(POSTS_CONTENT_DIR, f"{slug}.html")
        if os.path.exists(content_path):
            print(f"  [Exists] {slug}.html")
            skipped_count += 1
            continue

        # Try to retrieve from git HEAD
        git_path = f"posts/{slug}/index.html"
        print(f"  [Missing] Recovering {slug} from git: {git_path}...")
        try:
            content = subprocess.check_output(['git', 'show', f'HEAD:{git_path}']).decode('utf-8')
            soup = BeautifulSoup(content, 'html.parser')
            entry = soup.find(class_='content__entry')
            if not entry:
                print(f"    FAIL: class='content__entry' not found in HTML!")
                failed_count += 1
                continue
            
            inner_html = entry.decode_contents()
            
            with open(content_path, 'w', encoding='utf-8') as out_f:
                out_f.write(inner_html)
                
            print(f"    SUCCESS: Recovered {slug}.html")
            recovered_count += 1
        except Exception as e:
            print(f"    FAIL: Could not retrieve or parse file from git: {e}")
            failed_count += 1

    print("\nSummary:")
    print(f"  Total posts in posts.json: {len(posts)}")
    print(f"  Already existed: {skipped_count}")
    print(f"  Successfully recovered: {recovered_count}")
    print(f"  Failed: {failed_count}")

if __name__ == "__main__":
    recover_missing_posts()
