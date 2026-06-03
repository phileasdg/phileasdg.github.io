import sys

def split_css():
    css_path = 'assets/css/style.css'
    try:
        with open(css_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Adjusting line offsets (remember lines are 0-indexed in Python)
        # style.css (global): lines 0-1120, then lines 1892-1915
        global_lines = lines[0:1121] + lines[1892:1916]
        
        # masonry.css: lines 1121-1452
        masonry_lines = lines[1121:1453]
        
        # post.css: lines 1453-1891, then lines 1916-2212
        post_lines = lines[1453:1892] + lines[1916:2213]
        
        # Write files
        with open('assets/css/style.css', 'w', encoding='utf-8') as f:
            f.writelines(global_lines)
            
        with open('assets/css/masonry.css', 'w', encoding='utf-8') as f:
            f.writelines(masonry_lines)
            
        with open('assets/css/post.css', 'w', encoding='utf-8') as f:
            f.writelines(post_lines)
            
        print("CSS successfully split into style.css, masonry.css, and post.css.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    split_css()
