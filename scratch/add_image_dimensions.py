import os
import json
from PIL import Image

BASE_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io"
POSTS_JSON_PATH = os.path.join(BASE_DIR, "data", "posts.json")

print(f"Reading posts database from {POSTS_JSON_PATH}...")
with open(POSTS_JSON_PATH, "r", encoding="utf-8") as f:
    posts = json.load(f)

updated_count = 0
for post in posts:
    thumb_path = post.get("thumbnail")
    if thumb_path:
        full_path = os.path.join(BASE_DIR, thumb_path)
        if os.path.exists(full_path):
            try:
                with Image.open(full_path) as img:
                    width, height = img.size
                    post["thumbWidth"] = width
                    post["thumbHeight"] = height
                    updated_count += 1
                    print(f"Post '{post['name']}': {width}x{height}")
            except Exception as e:
                print(f"Error reading image {full_path}: {e}")
        else:
            print(f"Image not found: {full_path}")

print(f"\nWriting back updated posts database with {updated_count} image sizes...")
with open(POSTS_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)

print("Done!")
