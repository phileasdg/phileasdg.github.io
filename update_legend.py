import re

markdown_path = '/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io/markdown/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity.md'
posts_html_path = '/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io/content/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity.html'
pages_html_path = '/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io/content/pages/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity.html'

# Code block for ecoGeoServerLegends
wl_code_block = '''```wl
ecoGeoServerLegends = 
 Dataset[<|"FreshwaterEcoregions2017" -> SwatchLegend[{
RGBColor[
      0.38823529411764707`, 0.8117647058823529, 0.6705882352941176], 
RGBColor[0.4392156862745098, 0.6588235294117647, 0.], 
RGBColor[1., 0.4980392156862745, 0.48627450980392156`], 
RGBColor[
      0.9803921568627451, 0.4666666666666667, 0.30196078431372547`], 
RGBColor[0.2980392156862745, 0.5098039215686274, 0.7137254901960784], 
RGBColor[0.792156862745098, 0.4, 0.20392156862745098`], 
RGBColor[
      0.9882352941176471, 0.6509803921568628, 0.45098039215686275`], 
RGBColor[
      0.9882352941176471, 0.9254901960784314, 0.20784313725490197`], 
RGBColor[
      0.9764705882352941, 0.6705882352941176, 0.34509803921568627`], 
RGBColor[0.3803921568627451, 0.8235294117647058, 0.9490196078431372], 
RGBColor[0.8862745098039215, 0.7803921568627451, 0.9803921568627451], 
RGBColor[1., 0.4980392156862745, 0.49411764705882355`], 
RGBColor[
      0.36470588235294116`, 0.6784313725490196, 0.2980392156862745], 
RGBColor[0.18823529411764706`, 0.2901960784313726, 0.]}, {"Tropic", "Subtropic", "Temperate", "Boreal", "Polar"}],
 "MajorBiomes" -> SwatchLegend[{
RGBColor[0.1450980392156863, 0.45098039215686275, 0.2235294117647059], 
RGBColor[0.4823529411764706, 0.7568627450980392, 0.2549019607843137], 
RGBColor[0.9333333333333333, 0.11764705882352941, 0.13725490196078433], 
RGBColor[0.9764705882352941, 0.6627450980392157, 0.10588235294117647], 
RGBColor[0.8862745098039215, 0.8862745098039215, 0.8784313725490196]}, {"Tropical & Subtropical Moist Broadleaf Forests", "Tropical & Subtropical Dry Broadleaf Forests", "Tropical & Subtropical Coniferous Forests", "Temperate Broadleaf & Mixed Forests", "Temperate Conifer Forests"}],
 "EcoregionProtectionStatus" -> SwatchLegend[{
RGBColor[0.1450980392156863, 0.45098039215686275, 0.2235294117647059], 
RGBColor[0.4823529411764706, 0.7568627450980392, 0.2549019607843137], 
RGBColor[0.9333333333333333, 0.11764705882352941, 0.13725490196078433], 
RGBColor[0.9764705882352941, 0.6627450980392157, 0.10588235294117647], 
RGBColor[0.8862745098039215, 0.8862745098039215, 0.8784313725490196]}, {"Half Protected", "Nature Could Reach Half Protected", "Nature Imperiled", "Nature Could Recover", "N/A"}]|>]'''

# Update markdown file
with open(markdown_path, 'r') as f:
    md_content = f.read()

target_img_md = '![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/1pt735is35rm6.png =507x41)'
if target_img_md in md_content:
    md_content = md_content.replace(target_img_md, wl_code_block)
    with open(markdown_path, 'w') as f:
        f.write(md_content)
    print("Updated markdown post!")
else:
    print("Image target not found in markdown!")
