**Note: **This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3258063). 

See also: [Mathematical marbling animation](https://community.wolfram.com/groups/-/m/t/3271633), for even more marbling magic.

## Paper Marbling and Mathematical Marbling

### What is Paper Marbling?

Ink marbling is the practice of dipping or dripping colorful inks or dyes onto a liquid surface, and swirling, displacing, cutting, dragging, and otherwise forming the ink into a design, often akin to patterns in marble. The earliest verified accounts of ink marbling date back to 12th century Japan, but the practice has a rich history throughout Asia, the Islamic World, and in Europe where it was extensively used to decorate book bindings. In Turkey, the practice is called “ebru” after the Persian word “ebrū”, which means “cloud-like”.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-20.48.07.png =538x345)

I find ink marbling deeply enchanting. The imprecision of the medium results in organic-seeming, flowing shapes - never perfectly regular or completely random. By combining techniques, artists can create a wide variety of motifs and designs, from waves and spirals to scallop shells, flowers, and trees.

### Mathematical Marbling

Mathematical marbling refers to the mathematical reproduction of the marbling process. Aubrey Jaffer has an excellent series of blog posts on the subject [on his website](https://people.csail.mit.edu/jaffer/Marbling/). He has also co-authored [several papers](https://ieeexplore.ieee.org/author/38513250100) on mathematical and computational methods for marbling, [including on marbling in 3D](https://ieeexplore.ieee.org/document/7478444). In this technical article, I will describe, reproduce, and demonstrate some mathematical marbling methods from his work.

In his blog post [The mathematics of marbling](https://people.csail.mit.edu/jaffer/Marbling/Mathematics), Jaffer outlines several marbling methods that don’t require fluid mechanics theory to perform. This article will explore vector graphics implementations of three of these methods in Wolfram Language, respectively, for dripping ink drops on a marbling canvas such that new drops displace and distort previous ones, for tracing lines through the ink using a pointed object (or tine), and for tracing circles through the ink using a pointed object. The lines and curves produced by displacing ink using a sharp tool like a toothpick are known as tine lines.

For each of these methods, I’ll split my exploration into a short description of the process, an implementation section containing my code, and an exploratory examples section demonstrating how you can use and combine these techniques to produce computational marbling art.

## Ink Drop Marbling

### Dropping Ink in a Marbling Tank

As we drip ink drops into the marbling tank, new drops will displace old ones such that given a point <em>P</em>, and a new paint drop of radius <em>r</em> centered at <em>C</em>, <em>P</em> will be displaced radially to the position:

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-20.53.05.png =234x84)

This transformations preserves the area of all neighbourhoods not containing <em>C</em> (though it is not guaranteed to preserve the area of individual polygons due to their finite detail). 

Please visit <a href="https://people.csail.mit.edu/jaffer/Marbling/Dropping-Paint">Aubrey Jaffer's website</a> for a more in-depth explanation.

## <em>Implementation:</em> inkDrop, marbleDisplace, and dripDrops

To download the original code, please consult the original post <a href="https://community.wolfram.com/groups/-/m/t/3258063">here</a>.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-20.54.54.png =1780x1586)
### Examples

The <em>dripDrops</em> function takes as its arguments: 

<ol>
- A list of polygons, or an empty list defining the existing geometry on the canvas.

- A list defining the sequence of new drop positions.

- A list of drop sizes. 

</ol>

It returns the transformed geometry after dripping. With this function defined, we can begin to make marbling designs. 

<h4>Basic examples</h4>

<em>Drop 5 randomly coloured drops with radius 1 in the same place:</em>

<figure class="post__image"><em>![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.00.08.png =507x150)</figure></em>

<em>Drop 12 randomly coloured drops with increasing radii in equally spaced intervals on a circle:</em>

<figure class="post__image"><em>![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.00.43.png =455x132)</figure></em>

<em>Drop 25 randomly coloured identically sized drops randomly dripped in a rectangular region of the marbling tank: </em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.01.26.png =584x368)

Note that in the displacement process, ink is pushed outside the ink-dropping region.

<em>Drop 50 randomly coloured drops with random radii in a defined interval, in random positions in a disk:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.02.20.png =594x389)
<h4>Layered designs</h4>

We can create layered designs by partitioning an ordered list of drops such as one generated by <em>dripDrops</em> into groups, and plotting the groups in different colours:

<em>Make a layered design by dropping ink, and interpreting a partition of the result as different colour layers:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.08.06.png =442x392)

<em>We can design a setup to generate a layered marbling automatically given a list of the numbers of drops in each layer: </em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.08.37.png =465x500)
<h4>Other ink drop shapes</h4>

By specifying a different ink drop function to <em>dripDrops</em> with the "InkDropFunction" Option, you can use arbitrary geometry as ink drops:

<em>Define a function to generate n-gons:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.09.25.png =536x94)

<em>Use it as the ink drop function in a dripDrops call:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.09.51.png =488x353)

Note that while changing ink drop shapes results in different designs, the method by which points are displaced stays constant.

<h4>Filling arbitrary shapes or text with ink drops</h4>

We might naively try to fill a shape by uniformly sampling points from the inside of the shape and dripping at these points. Unfortunately, this tends to be unsuccessful because ink drops push each other outside of the sampled region. One approach to mitigate this effect is to start with equally spaced points in the region, for example using the process described in <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://mathematica.stackexchange.com/a/141215/87521" target="_blank" data-testid="ButtonBoxView" rel="noopener">this StackExchange answer by user kirma</a> for Monte Carlo estimation of Voronoi cell centroids.

<em>Make an ink drop text marbling from roughly evenly spaced points in a text region:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.10.57.png =658x454)

<em>Here's an ink drop marbling from roughly evenly spaced sampled points in France:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.11.36.png =1146x1140)

As you can see, there's still some bleeding outside of the regions of interest, but much less than there would be without sampling approximately equally spaced points from the target regions.

<h4>Other interesting examples</h4>

<em>Displace arbitrary background geometry:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.12.33.png =621x446)

<em>Make multiple full rotations along a circle, dropping ink in regular intervals:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.12.55.png =587x239)

Try these methods yourself. Play around with with different shapes and combine different techniques. 

## Pin, Comb, and Other Tine Lines

Marbling techniques often involve dragging pointed objects such as needles, pencils, or combs through ink. Displacements created this way are called tine lines.<br><br>In the following sections, I’ll implement methods to trace straight infinite tine lines, and tine circles.

### Tracing Infinite Lines Through the Ink

Given <em>L</em>, a tine line with arbitrary slope, the vector mapping for a point <em>P</em> is:

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.15.41.png =168x50)

Where <em>d</em> is the minimum distance from the point <em>P</em> to the tine line, |<em>(P-B)•N</em>|, <em>N</em> is a unit vector perpendicular to the tine line <em>L</em>, <em>B</em> is a point on the tine line, and <em>M</em> is a unit vector along the tine line. The parameter <em>z</em> controls the maximum displacement of the tine line, and <em>c</em> controls the maximum sharpness of the bends as ink is dragged along the tine line in a laminar flow.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.17.33.png =226x205)

<em>(Illustration courtesy of Aubrey Jaffer)</em>

Please refer to Aubrey Jaffer’s website for a <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://people.csail.mit.edu/jaffer/Marbling/Mathematics" target="_blank" data-testid="ButtonBoxView" rel="noopener">more in-depth explanation</a>.

### <em>Implementation: </em>tineLine and combLine

To download the original code, please consult the original post <a href="https://community.wolfram.com/groups/-/m/t/3258063">here</a>.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.36.47.png =572x566)
### Examples: tineLine and combLine

<h4>Distort polygons with a single tine line using tineLine</h4>

The <em>tineLine</em> function distorts a polygon along an infinite tine line defined by a point <em>b</em> and unit vector <em>m</em>, alongside the tine parameters <em>z</em> and <em>c</em>. The function takes the following arguments:

<ol>
- A polygon to distort.

- An arbitrary point on the desired tine line.

- A unit vector in the direction of the tine line.

- The displacement magnitude parameter <em>z</em>.

- The bend sharpness parameter <em>c</em>.

</ol>

<em>Drag a tine line through a single ink drop:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.27.01.png =580x128)

<em>Drag a tine line through 10 stacked drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.27.21.png =538x158)
<h4>Distort polygons with an arbitrary number of tine lines using combLine</h4>

The <em>combLine</em> function extends <em>tineLine</em>'s functionality to allow dragging multiple tines across polygons with a single function call. It takes the following arguments: 

<ol>
- A list of polygons, or empty list representing the canvas, or marbling tank. 

- A list of arbitrary points on the desired tine lines.

- A list of unit vectors defining the line directions, or a single unit vector.

- A list of <em>z</em> parameters, or a single <em>z</em> parameter value. 

- A list of <em>c</em> parameters, or a single <em>c</em> parameter value.

</ol>

The function returns the transformed geometry after applying the specified tine transformations. 

<em>Make computational latte art by pulling a tine in a line through a stack of ink drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.29.28.png =591x417)

<em>Comb through a stack of ink drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.29.50.png =600x451)

<em>Trace a sequence of parallel tine lines in alternating directions across a stack of ink </em><em>drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.30.16.png =632x475)

<em>Draw tine lines counterclockwise around a point at the centre of a stack of ink drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.30.46.png =595x432)

<em>Draw tine lines along the edges of regular polygons, counterclockwise over a stack of drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.31.09.png =586x335)

We can also use combLine to draw curved tines. The easiest approach to do this is to cheat somewhat first applying a nonlinear transformation to the canvas geometry, then applying tine lines, and finally reversing the initial nonlinear transformation. For example, we can use this technique to trace sinusoidal tine lines.

<em>Sinusoidal tine lines:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.31.44.png =588x384)
![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.31.59.png =373x412)
### Tracing Circles Lines Through the Ink

We can also marble by displacing ink along a circle of centre <em>C</em> and radius <em>r</em>. In this case, we can define the mapping from a point <em>P</em> as:

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.33.18.png =294x57)

Where <em>a</em> is the angle of the displacement arc,

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.33.57.png =74x44)

<em>l</em> is the length of the displacement arc, <em>l=z•u^d</em>, and <em>d</em> is the distance from <em>P</em> to the closest point on the circle, <em>d=|(||P-C||-r)|</em>.

Just as is the case for tine lines, the parameters <em>z</em> and <em>c</em> control the maximum displacement of the tine, and the maximum sharpness of the bends along the tine circle, respectively.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.34.58.png =227x228)

<em>(Illustration courtesy of Aubrey Jaffer)</em>

Please read Aubrey Jaffer’s website for a <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://people.csail.mit.edu/jaffer/Marbling/Mathematics" target="_blank" data-testid="ButtonBoxView" rel="noopener">more in-depth explanation</a>.

### <em>Implementation:</em> tineCircle and combCircle

To download the original code, please consult the original post <a href="https://community.wolfram.com/groups/-/m/t/3258063">here</a>.

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.37.17.png =599x584)
### Examples

<h4>Distort polygons with a single tine line using tineCircle</h4>

The <em>tineCircle</em> function distorts a polygon along a tine circle defined by the central point <em>b</em> and radius <em>r</em>, alongside the tine parameters <em>z</em> and <em>c</em>. The function takes the following arguments:

<ol>
- A polygon to distort.

- The centre of the desired tine circle.

- The radius of the desired tine circle.

- The displacement magnitude parameter <em>z</em>.

- The bend sharpness parameter <em>c</em>.

</ol>

<em>Drag a tine circle through a single ink drop:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.38.43.png =570x130)

<em>Drag a tine circle through 10 stacked drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.39.01.png =594x175)
<h4>Distort polygons with an arbitrary number of tine circles using combCircle</h4>

The <em>combCircle</em> function extends <em>tineCircle</em>'s functionality to allow dragging multiple tines in circles through polygons with a single function call. It takes the following arguments: 

<ol>
- A list of polygons, or empty list representing the canvas, or marbling tank. 

- A list of centre points of the desired tine circles.

- A list of radii of the desired tine circles, or a single radius value for all specified tine circles.

- A list of<em> z</em> parameters, or a single <em>z</em> parameter value. 

- A list of <em>c</em> parameters, or a single <em>c</em> parameter value.

</ol>

The function returns the transformed geometry after applying the specified tine circle transformations. 

<em>Trace a tine circle through a stack of drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.41.55.png =465x400)

<em>Comb tine circles through a stack of drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.42.15.png =562x363)

<em>Trace tine circles in alternating directions through a stack of drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.42.39.png =615x424)

Using Module, it's easy to build up scenes by layering ink dripping and tine transformations.

<em>Concentric tine circles in alternating direction through a grid of ink drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.43.06.png =572x662)

<em>Trace tine circles centred on equally spaced points around a circle, alternating clockwise and counterclockwise directions through a stack of ink drops:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.43.31.png =600x457)

<em>Trace tine circles through a stack of ink drops in alternating directions along the arms of a spiral:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.43.53.png =603x444)
## Sampling Evenly Distanced Points on Polygon Boundaries for Custom Canvas Design Geometry

To achieve good results with manually prepared canvas geometry it's good to define polygons using roughly evenly separated points along their boundaries. High-detail polygons defined by a large number of evenly spaced points also deform more fluidly and naturally than low detail or varying detail polygons. To ensure polygons are optimally defined for marbling design it helps to be able to sample evenly spaced points from the boundaries of polygons. We can define a helper function for this.

<em>Sample n equally spaced points on the boundary of a polygon:</em>

- Based on Henrik Schumacher's answer on the Mathematica &amp; Wolfram Language StackExchange: <a href="https://mathematica.stackexchange.com/a/180931/87521">https://mathematica.stackexchange.com/a/180931/87521</a>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.44.55.png =1300x548)

<em>Example: Take a high-detail evenly spaced point sample from a low-detail star polygon:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.45.12.png =522x259)

Let's use this function to generate a striped background as the basis for the next marbling design:

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.45.36.png =1290x146)

<em>Preview the striped background design:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.45.52.png =370x237)
## Simulating Real Marbling Design Techniques

By combining the functions discussed in previous sections, we can generate an infinite variety of marbling patterns, and easily experiment with marbling ideas. We can also reproduce pattern-making techniques used in physical marbling designs.

### Peacock Feathers

The following pattern, sometimes called the <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://marbleart.us/Peacock-Bouquet.htm#:~:text=The%20real%20name%20for%20this,the%20comb%20and%20the%20rake." target="_blank" data-testid="ButtonBoxView" rel="noopener">peacock, bouquet</a>, or scallop shells, is often found in end-paper designs:

![](https://phileasdg.github.io/media/posts/41/bouquet-2.png =354x442)

<em>Marbled endpaper from Die Nachfolge Christi ed. Ludwig Donin (Vienna ca. 1875) - Wikimedia Commons</em>

Following <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://people.csail.mit.edu/jaffer/Marbling/Scallops" target="_blank" data-testid="ButtonBoxView" rel="noopener">instructions from Aubrey Jaffer's website</a>, we can reproduce this design by combining geometric sine transformations and tine combing, starting with the striped canvas defined previously. The result is very regular, and might benefit from additional displacement from 2D noise for a more natural effect, or from the addition of noise to the tine.

<em>Create a perfect scallop array marbling:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.48.20.png =589x441)
![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.48.35.png =584x519)
### Combinations of Dripping and Combing

By alternating dripping and combing sequences, we can produce designs resembling ebru marbling. For example, by dripping, combing up and down, then dripping again with different colours:

<em>Create a computational ebru marbling:</em>

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.49.23.png =596x560)
![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.49.43.png =544x533)
## The Marble-Tron: An Interactive Marbling Canvas

Download <a href="https://community.wolfram.com/groups/-/m/t/3258063">this notebook</a> and make your own marbling designs with the interactive canvas below. 

<h4>Usage:</h4>

- To add a drop of ink to the canvas, click the "Ink" radio button, choose your drop settings using the <em>Drop scale</em> slider.

- By default, the colour selection is random for each ink drop. Click the "Manual" radio button to show manual colour selection tools.

- To trace a tine line through the ink, click the "Tine" radio button, choose your tine settings using the <em>Tine z</em> and <em>Tine c</em> sliders, then click and drag the mouse along the screen. An arrow will follow your mouse pointer, giving you a preview of the tine settings. Release the mouse to apply the tine line to the canvas.

Screen capture of the interactive marbling canvas interface:

![](https://phileasdg.github.io/media/posts/41/Screenshot-2024-12-16-at-21.24.33.png =485x658)

## Conclusion

This exploration into mathematical marbling showcases the power and flexibility of Wolfram Language for generative art exploration, process design, and process implementation. By combining mathematical transformations, we can simulate traditional marbling techniques digitally, opening up endless possibilities for experimentation and creativity.

One advantage of the vector graphics marbling methods explored in this text is that a marbling process will always output a list of polygons, making it easy to pick and modify colour schemes without having to recompute the marbling from scratch. These polygons can also be magnified and exported without loss of detail for prints, or further manually or programmatically manipulated. 

I encourage you to try out these techniques and create your own marbling designs! Happy marbling! 

## Acknowledgements and Sources Cited

### Special Thank You to Aubrey Jaffer

This article would not exist without Aubrey Jaffer's mathematical marbling articles, his kind support, and advice at the 2024 Wolfram Summer School. Aubrey's work provided the foundation for this exploration, and his guidance has been invaluable. Thank you, Aubrey, for your dedication to the art and science of marbling, and for inspiring us to delve deeper into this fascinating subject, and thank you again for presenting your work at the 2024 Wolfram Summer School.

### Sources Cited

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple"><a href="https://commons.wikimedia.org/wiki/File:Battal_Ebru.jpg">Akcire.14. (2020). Battal Ebru.</a>

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple"><a href="https://commons.wikimedia.org/wiki/File:Marbled_endpaper_from_Die_Nachfolge_Christi_ed._Ludwig_Donin_(Vienna_ca._1875)_1000ppi_(cropped).png">Aristeas, C. (1875). English: Marbled endpaper from a copy of Die Nachfolge Christi in vier Büchern von Thomas von Kempis.</a>

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple"><a href="https://people.csail.mit.edu/jaffer/Marbling/Mathematics">Jaffer, A. (n.d.). The Mathematics of Marbling. Retrieved 26 August 2024</a>

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple"><a href="https://doi.org/10.1109/MCG.2011.51">Shufang Lu, Jaffer, A., Xiaogang Jin, Hanli Zhao, &amp; Xiaoyang Mao. (2012). Mathematical Marbling. IEEE Computer Graphics and Applications, 32(6), 26–35.</a>

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple"><a href="https://www.skillshare.com/es/blog/suminagashi-aprende-el-arte-del-marmoleado-de-papel-japones/">Turner, E. (2022, April 13). Suminagashi: Aprende el arte del marmoleado de papel japonés. Skillshare Blog.</a>