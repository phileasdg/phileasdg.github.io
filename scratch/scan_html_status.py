import os
from bs4 import BeautifulSoup

BASE_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/phileasdg.github.io/newsite"

print("Scanning HTML files for issues...")
html_files = []
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith(".html"):
            html_files.append(os.path.join(root, file))

for path in sorted(html_files):
    rel_path = os.path.relpath(path, BASE_DIR)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Check for common.js
    has_common_js = any('common.js' in script.get('src', '') for script in soup.find_all('script'))
    
    # Check for hardcoded header class="header"
    has_hardcoded_header = soup.find('header', class_='header') is not None
    
    # Check for site-header element
    has_site_header = soup.find('site-header') is not None
    
    # Check for site-footer element
    has_site_footer = soup.find('site-footer') is not None
    
    # Check for grid container that needs tiles
    has_grid = soup.find(class_='l-masonry') is not None

    if not has_common_js or has_hardcoded_header or (not has_site_header and has_site_footer) or (not has_site_footer and has_site_header):
        print(f"\nFile: {rel_path}")
        print(f"  Loads common.js: {has_common_js}")
        print(f"  Has hardcoded header: {has_hardcoded_header}")
        print(f"  Has <site-header>: {has_site_header}")
        print(f"  Has <site-footer>: {has_site_footer}")
        print(f"  Has grid container: {has_grid}")
