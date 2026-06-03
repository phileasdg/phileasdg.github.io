import os
import re
import sys

def refactor_file(file_path, base_dir, dry_run=True):
    rel_path = os.path.relpath(file_path, base_dir)
    depth = len(rel_path.split(os.sep)) - 1
    rel_prefix = "../" * depth
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content
    
    # 1. Replace header
    header_pattern = r'<header class="header" id="js-header">.*?</header>'
    content, count_h = re.subn(header_pattern, '<site-header></site-header>', content)
    
    # 2. Replace footer
    footer_pattern = r'<footer class="footer">.*?</footer>'
    content, count_f = re.subn(footer_pattern, '<site-footer></site-footer>', content)
    
    # 3. Add common.js script in <head> if not present
    if 'common.js' not in content:
        script_tag = f'<script src="{rel_prefix}assets/js/common.js" defer></script>'
        content = content.replace('</head>', f'{script_tag}</head>')
        count_c = 1
    else:
        # Update existing common.js script tag to have the correct relative path
        content, count_c = re.subn(r'<script src="[^"]*assets/js/common\.js"[^>]*></script>', 
                                   f'<script src="{rel_prefix}assets/js/common.js" defer></script>', 
                                   content)
                         
    # 4. Update style.css link and insert modular sheets
    style_pattern = r'<link rel="stylesheet" href="[^"]*assets/css/style\.css[^"]*">'
    
    needs_masonry = 'class="home-template"' in content or 'class="tags-template"' in content or 'class="tag-template"' in content or 'l-masonry' in content or 'l-grid' in content
    needs_post = 'class="post-template"' in content or 'class="page-template"' in content or 'content__inner' in content
    
    stylesheets = [f'<link rel="stylesheet" href="{rel_prefix}assets/css/style.css">']
    if needs_masonry:
        stylesheets.append(f'<link rel="stylesheet" href="{rel_prefix}assets/css/masonry.css">')
    if needs_post:
        stylesheets.append(f'<link rel="stylesheet" href="{rel_prefix}assets/css/post.css">')
        
    content, count_s = re.subn(style_pattern, "\n".join(stylesheets), content)
    
    # 5. Make internal URLs relative
    def repl_url(match):
        attr = match.group(1)
        path = match.group(2)
        if not path or path == '/':
            if attr == 'href':
                return f'{attr}="{rel_prefix}index.html"'
            return f'{attr}="{rel_prefix}"'
        return f'{attr}="{rel_prefix}{path}"'
        
    url_pattern = r'(href|src|srcset)="https://phileasdg\.github\.io/([^"]*)"'
    
    new_lines = []
    count_urls = 0
    for line in content.split('\n'):
        if any(meta in line for meta in ['rel="canonical"', 'property="og:url"', 'property="og:image"', 'name="twitter:url"', 'name="twitter:image"', '"@id"']):
            new_lines.append(line)
        else:
            line_new, replaced = re.subn(url_pattern, repl_url, line)
            count_urls += replaced
            new_lines.append(line_new)
            
    content = "\n".join(new_lines)
    
    # 6. Replace scripts.min.js, masonry.pkgd.min.js, imagesloaded.pkgd.min.js links to be relative
    content, count_script1 = re.subn(r'src="https://phileasdg\.github\.io/assets/js/scripts\.min\.js[^"]*"', 
                                     f'src="{rel_prefix}assets/js/scripts.min.js"', content)
    content, count_script2 = re.subn(r'src="https://phileasdg\.github\.io/assets/js/masonry\.pkgd\.min\.js[^"]*"', 
                                     f'src="{rel_prefix}assets/js/masonry.pkgd.min.js"', content)
    content, count_script3 = re.subn(r'src="https://phileasdg\.github\.io/assets/js/imagesloaded\.pkgd\.min\.js[^"]*"', 
                                     f'src="{rel_prefix}assets/js/imagesloaded.pkgd.min.js"', content)
    
    has_changes = content != original_content
    
    if has_changes:
        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[REFACTORED] {rel_path} - Header: {count_h}, Footer: {count_f}, Stylesheets: {count_s}, URLs: {count_urls}")
        else:
            print(f"[DRY-RUN MATCH] {rel_path} - Header: {count_h}, Footer: {count_f}, Stylesheets: {count_s}, URLs: {count_urls}")
    return has_changes

def main():
    dry_run = '--write' not in sys.argv
    base_dir = os.getcwd()
    
    print(f"Starting HTML refactoring scan in: {base_dir}")
    print("Dry-run mode (use --write to save changes)" if dry_run else "Write mode (saving changes)")
    print("-" * 80)
    
    html_files = []
    for root, dirs, files in os.walk(base_dir):
        # Exclude directories like .git or scratch
        if '.git' in dirs:
            dirs.remove('.git')
        if 'scratch' in dirs:
            dirs.remove('scratch')
        if 'publii' in dirs:
            dirs.remove('publii') # critical safety check: do not touch publii
            
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
                
    changed_count = 0
    for file_path in html_files:
        try:
            if refactor_file(file_path, base_dir, dry_run=dry_run):
                changed_count += 1
        except Exception as e:
            print(f"Error refactoring {file_path}: {e}")
            
    print("-" * 80)
    print(f"Scan complete. Total HTML files found: {len(html_files)}. Files with changes: {changed_count}.")

if __name__ == '__main__':
    main()
