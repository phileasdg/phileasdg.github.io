**Note:** This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3445374). 

## Introduction

Ecoregions are distinct ecological zones with specific environmental conditions (climate, topography, soil composition…), habitats, and species. Each ecoregion contains characteristic species and ecological communities that are adapted to the region’s environment.

The Ecoregions2017©Resolve map is a revised version of the widely used 2001 map of terrestrial ecoregions of the world, originally developed by [Olson et al](https://doi.org/10.1641/0006-3568(2001)051%5B0933:TEOTWA%5D2.0.CO;2). The new map breaks up the Earth’s land into 846 distinct terrestrial ecoregions nested within 14 terrestrial [biomes](https://en.wikipedia.org/wiki/Biome). An interactive version of the map is available online [here](https://ecoregions.appspot.com/), and the work is discussed in the following article in BioScience: [An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm](https://academic.oup.com/bioscience/article/67/6/534/3102935?login=false) [(Dinerstein et al. 2017)](https://academic.oup.com/bioscience/article/67/6/534/3102935?login=false).

Terrestrial biomes of the world according to Dinerstein and Olson (also used in the [WWF Global 200 classification](https://www.worldwildlife.org/publications/global-200)) already have computational representations in Wolfram Language. Here’s how one might represent them on a map:

*Define a list of biomes:*

![](https://phileasdg.github.io/media/posts/47/0svwohkmtobvo.png =2522x108)

*Produce a map of major world biomes:*

![](https://phileasdg.github.io/media/posts/47/0ufjsmh9hw8yp.png =1262x168)

![](https://phileasdg.github.io/media/posts/47/13376kglpv3ht.png =1152x576)

The Ecoregions2017©Resolve data provide a more detailed ecological classification compared to the broader biome categories. While biomes represent large ecological zones based on similar climate conditions and dominant vegetation types, ecoregions offer finer granularity by incorporating specific environmental conditions, habitats, and species unique to each region.

Applications for the Ecoregions2017©Resolve include:

- Depicting the global distributions of species and ecological communities

- Modeling ecological impacts of climate change

- Assisting in the development of conservation strategies

- Reporting progress toward international conservation targets such as the [Aichi targets established by the Convention on Biological Diversity](https://www.cbd.int/sp/targets).

In this short article, I’ll construct a dataset of Ecoregions2017©Resolve data, demonstrate how to create ecoregion maps, apply data science techniques to filter and summarize the data, and make use of the [INaturalistSearch](https://resources.wolframcloud.com/FunctionRepository/resources/INaturalistSearch/) function to search for species observations within ecoregions.

## Setup

The Ecoregions2017©Resolve data are available [here](https://storage.googleapis.com/teow2016/Ecoregions2017.zip), licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Let’s load them in.

With the zip file downloaded from this page unzipped and copied to my chosen project directory, the data are ready to import.

*Import the ecoregion shapefile data:*

```wl
In[]:= freshwaterEcoregionsShapefileData = Association[Import[(*Path to the shapefile:*)FileNameJoin[{NotebookDirectory[], &quot;2017 Ecoregions&quot;, &quot;Ecoregions2017&quot;, &quot;Ecoregions2017.shp&quot;}], &quot;Data&quot;]];
```

In addition to the data found in the shapefile, the online interactive map also includes links to informative ecoregion descriptions hosted on [www.oneearth.org](http://www.oneearth.org). Let’s incorporate these links into our dataset.

*Define an association of ecoregion OneEarth pages:*

![](https://phileasdg.github.io/media/posts/47/1imj3zkxicqz0.png =327x41)

*Wrangle the data to produce a nice tabular dataset:*

```wl
In[]:= ecoregionsTab = Tabular[Join[
       (*LabeledData columns:*) ## & @@ KeyValueMap[Dataset[Map[Association, Thread[#1 -> #2]]] &, Association[freshwaterEcoregionsShapefileData[&quot;LabeledData&quot;]]],
       (*Geometry column:*) Dataset[Map[<|&quot;Geometry&quot; -> #|> &, freshwaterEcoregionsShapefileData[&quot;Geometry&quot;]]], 2]] // 
     (*Clean up the data and create new columns:*) 
      TransformColumns[#, {
        (*Interpret color data:*) 
         &quot;COLOR&quot; -> (RGBColor[#&quot;COLOR&quot;] &), &quot;COLOR_BIO&quot; -> (RGBColor[#&quot;COLOR_BIO&quot;] &), &quot;COLOR_NNH&quot; -> (RGBColor[#&quot;COLOR_NNH&quot;] &), 
        (*Ecoregion OneEarth page column:*) 
         &quot;OneEarthPage&quot; -> Function[If[KeyMemberQ[ecoregionPages, #&quot;ECO_NAME&quot;], ecoregionPages[#&quot;ECO_NAME&quot;], Missing[&quot;Not available&quot;]]], 
        (*GeoBounds regions column:*) 
         &quot;GeoBoundsRegion&quot; -> Function[GeoBoundsRegion[GeoBounds[#Geometry]]]}] & //(*Update column names:*)RenameColumns[#, {&quot;ObjectID&quot;, &quot;EcoregionName&quot;, &quot;BiomeNumber&quot;, &quot;BiomeName&quot;, &quot;Realm&quot;, &quot;EcoBiome&quot;, &quot;ProtectionStatusID&quot;, &quot;EcoregionID&quot;, &quot;ShapeLength&quot;, &quot;ShapeArea&quot;, &quot;ProtectionStatus&quot;, &quot;EcoregionColor&quot;, &quot;BiomeColor&quot;, &quot;ProtectionStatusColor&quot;, &quot;License&quot;}] &;
```

To avoid having to recompute this, I’ll save it to a parquet file and reload the data:

*Define the save path :*

```wl
In[]:= ecoregionsTabPath = FileNameJoin[{NotebookDirectory[], &quot;2017 Ecoregions&quot;, &quot;ecoregions2017.parquet&quot;}];
```

*Save the dataset :*

```wl
In[]:= Export[ecoregionsTabPath, ecoregionsTab];
```

*Load the data from the file, casting ID columns as machine integers:*

```wl
In[]:= ecoregionsTab = CastColumns[Import[ecoregionsTabPath], {&quot;ObjectID&quot; -> &quot;MachineInteger&quot;, &quot;BiomeNumber&quot; -> &quot;MachineInteger&quot;, &quot;ProtectionStatusID&quot; -> &quot;MachineInteger&quot;, &quot;EcoregionID&quot; -> &quot;MachineInteger&quot;}]
```

![](https://phileasdg.github.io/media/posts/47/01pn8ye1s90is.png =1788x595)

*Inspect the structure of the dataset:*

```wl
In[]:= TabularStructure[ecoregionsTab]
```

<table>
<thead>
<tr>
<th>ColumnKey</th>
<th>ColumnType</th>
<th>NonMissingCount</th>
<th>MissingCount</th>
<th>ByteCount</th>
</tr>
</thead>
<tbody><tr>
<td>ObjectID</td>
<td>Integer64</td>
<td>847</td>
<td>0</td>
<td>7016</td>
</tr>
<tr>
<td>EcoregionName</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>32271</td>
</tr>
<tr>
<td>BiomeNumber</td>
<td>Integer64</td>
<td>847</td>
<td>0</td>
<td>7016</td>
</tr>
<tr>
<td>BiomeName</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>37478</td>
</tr>
<tr>
<td>Realm</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>15195</td>
</tr>
<tr>
<td>EcoBiome</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>10411</td>
</tr>
<tr>
<td>ProtectionStatusID</td>
<td>Integer64</td>
<td>847</td>
<td>0</td>
<td>7016</td>
</tr>
<tr>
<td>EcoregionID</td>
<td>Integer64</td>
<td>847</td>
<td>0</td>
<td>7016</td>
</tr>
<tr>
<td>ShapeLength</td>
<td>Real64</td>
<td>847</td>
<td>0</td>
<td>7008</td>
</tr>
<tr>
<td>ShapeArea</td>
<td>Real64</td>
<td>847</td>
<td>0</td>
<td>7008</td>
</tr>
<tr>
<td>ProtectionStatus</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>26600</td>
</tr>
<tr>
<td>EcoregionColor</td>
<td>InertExpression</td>
<td>847</td>
<td>0</td>
<td>102016</td>
</tr>
<tr>
<td>BiomeColor</td>
<td>InertExpression</td>
<td>847</td>
<td>0</td>
<td>102016</td>
</tr>
<tr>
<td>ProtectionStatusColor</td>
<td>InertExpression</td>
<td>847</td>
<td>0</td>
<td>102016</td>
</tr>
<tr>
<td>License</td>
<td>String</td>
<td>847</td>
<td>0</td>
<td>14647</td>
</tr>
<tr>
<td>Geometry</td>
<td>InertExpression</td>
<td>847</td>
<td>0</td>
<td>1471945560</td>
</tr>
<tr>
<td>OneEarthPage</td>
<td>String</td>
<td>844</td>
<td>3</td>
<td>63549</td>
</tr>
<tr>
<td>GeoBoundsRegion</td>
<td>InertExpression</td>
<td>847</td>
<td>0</td>
<td>244312</td>
</tr>
</tbody></table>
## Exploration

### Visualizing Terrestrial Ecoregions

<h4 id="producing-ecoregion-maps">Producing ecoregion maps</h4>

For a start, let’s suppose we’d like to plot the footprint of a specific ecoregion. Here’s one approach:

*Extract and plot ecoregion geometry selected from a row in which the “EcoregionName” column matches a provided name:*

```wl
In[]:= ecoregionsTab // Select[#, Function[#&quot;EcoregionName&quot; == &quot;Irrawaddy moist deciduous forests&quot;]] & // First[Normal[Dataset[#][All, &quot;Geometry&quot;]]] & // GeoGraphics // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/0cg3z0mxchqmk.png =438x840)

In case you’re unfamiliar with the notation, “//“ (called [PostFix](https://reference.wolfram.com/language/ref/Postfix)) can be read as “and then”, and is one of the ways one can chain together function calls in Wolfram Language. For new WL users coming form scientific backgrounds, this is quite similar to pipes in Python and R.

We may also like to plot several ecoregion footprints. This time, let’s assume we’re matching to a list of ecoregion IDs.

*Extract and plot ecoregion geometry from rows where the “EcoregionID” column matches one of the IDs in the provided list:*

```wl
In[]:= ecoregionsTab // Select[#, Function[MemberQ[{649, 695, 812, 815}, #&quot;EcoregionID&quot;]]] & // Normal[Dataset[#][All, 
       (*Extract geometry and ecoregion colors, and add tooltips to the footprints:*) {#EcoregionColor, Tooltip[#Geometry, #EcoregionName]} &]] & // Legended[
     (*Plot the map:*) GeoGraphics[{GeoStyling[Opacity[.6]], #}], 
     (*Construct the legend:*) SwatchLegend[## & @@ {#1, #2[[All, 2]]} & @@ Transpose[#]]] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/08u4lj1xmvw3p.png =1112x840)

Note that in order to share this article online, I’ve had to rasterize these plots, which disables the tooltips. To enable the tooltips in this notebook, simply download it and delete calls to [Rasterize](https://reference.wolfram.com/language/ref/Rasterize).

To make a world map of terrestrial ecoregions, we simply include all ecoregions in the plot.

*Make a world Ecoregions map:*

```wl
In[]:= Rasterize[GeoGraphics[{GeoStyling[Opacity[1]], Values[Normal[Dataset[ConstructColumns[ecoregionsTab, {&quot;EcoregionColor&quot;, &quot;Geometry&quot;}]]]]}, GeoProjection -> &quot;Mercator&quot;, GeoBackground -> White], ImageSize -> Full]
```

![](https://phileasdg.github.io/media/posts/47/0h58k9z8lkdxs.png =1359x1359)

<h4 id="grouping-and-plotting-ecoregions-programmatically">Grouping and plotting ecoregions programmatically</h4>

You’re likely to want to select many ecoregions at a time according to logical or mathematical criteria. Here are a few examples to get you started:

*Find and plot the 3 largest ecoregions:*

```wl
In[]:= Take[ReverseSortBy[ecoregionsTab, #&quot;ShapeArea&quot; &], {2, 4}] // ConstructColumns[#, {&quot;EcoregionName&quot;, &quot;Geometry&quot;}] & // MapApply[GeoGraphics[#2, PlotLabel -> #1] &, FromTabular[#, &quot;Matrix&quot;]] &
```

![](https://phileasdg.github.io/media/posts/47/0jqvkdooppmyi.png =1137x288)

*Find and plot all ecoregions within a particular biome:*

```wl
In[]:= Select[ecoregionsTab, Function[#BiomeName == &quot;Deserts & Xeric Shrublands&quot;]] // Normal[Dataset[#][All, 
       (*Extract geometry and ecoregion colors, and add tooltips to the footprints:*) {#EcoregionColor, Tooltip[#Geometry, #EcoregionName]} &]] & // GeoGraphics[{GeoStyling[Opacity[.6]], #}, ImageSize -> Large] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/0jw1vmd4pjcrj.png =1152x576)

*Find and plot all ecoregions within a particular realm:*

```wl
In[]:= Select[ecoregionsTab, Function[#Realm == &quot;Indomalayan&quot;]] // Normal[Dataset[#][All, 
       (*Extract geometry and ecoregion colors, and add tooltips to the footprints:*) {#EcoregionColor, Tooltip[#Geometry, #EcoregionName]} &]] & // GeoGraphics[{GeoStyling[Opacity[.6]], #}, ImageSize -> Large] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/19q26rrj2pve0.png =1152x673)

*Find and plot all ecoregions whose names contain the word “forest”:*

```wl
In[]:= Select[ecoregionsTab, Function[StringContainsQ[ToLowerCase[#EcoregionName], &quot;forest&quot;]]] // Normal[Dataset[#][All, 
       (*Extract geometry and ecoregion colors, and add tooltips to the footprints:*) {#EcoregionColor, Tooltip[#Geometry, #EcoregionName]} &]] & // GeoGraphics[{GeoStyling[Opacity[.6]], #}, ImageSize -> Large, GeoCenter -> {0, 0}] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/1jt8yiqx0ov1y.png =1152x576)

*Plot protection status of neotropic tropical and subtropical moist broadleaf forests:*

![](https://phileasdg.github.io/media/posts/47/1r87ybh8686m1.png =2789x212)

![](https://phileasdg.github.io/media/posts/47/0jl3eszfxz97s.png =1307x738)

<h4 id="bonus-ecoregion2017-geoservers">*Bonus: Ecoregion2017 GeoServers*</h4>

For larger maps, assuming you’d like to include every ecoregion in your map’s geographic range, you may elect to connect to one of the Ecoregions2017 GeoServer services for your plotting. This is generally faster.

*Construct a dataset of Ecoregions2017 GeoServers:*

![](https://phileasdg.github.io/media/posts/47/060qitwoevl7m.png =1365x85)

*Create world maps for each GeoServer:*

```wl
In[]:= Dataset[GeoGraphics[&quot;World&quot;, GeoServer -> #, GeoZoomLevel -> 1] & /@ ecoGeoServers]
```

![](https://phileasdg.github.io/media/posts/47/1jgp7saxb9n8n.png =1399x1360)

*Define the Legends for each map type:*

![](https://phileasdg.github.io/media/posts/47/1pt735is35rm6.png =507x41)

<h4 id="fetching-ecoregion-images">Fetching ecoregion images</h4>

The ecoregion descriptions hosted on [www.oneearth.org](http://www.oneearth.org) contain illustrative of ecoregion landscapes and emblematic wildlife. Let’s define a function to fetch these images programmatically:

*Define a function to collect ecoregion images:*

```wl
In[]:= ClearAll[ecoregionImages] 
  (*OneEarth page URL input:*)
 ecoregionImages[ecoregionOneEarthPage_URL] := Dataset[Join[
     (*Import ecoregion page header images (typically landscapes):*) 
      Cases[
       Import[ecoregionOneEarthPage, &quot;XMLObject&quot;], XMLElement[&quot;img&quot;, {&quot;src&quot; -> url_, &quot;alt&quot; -> description_, &quot;data-image&quot; -> &quot;data-image&quot;, &quot;v-imageloaded&quot; -> &quot;v-imageloaded&quot;}, _] :> <|&quot;Image&quot; -> Import[url], &quot;ImageDescription&quot; -> description|>, {17}], 
     (*Import ecoregion page body images (typically animals or landscapes):*) 
      Cases[
       Import[ecoregionOneEarthPage, &quot;XMLObject&quot;], XMLElement[&quot;figure&quot;, {}, {XMLElement[&quot;img&quot;, {&quot;src&quot; -> url_}, {}], XMLElement[&quot;figcaption&quot;, {}, {XMLElement[&quot;span&quot;, {&quot;class&quot; -> &quot;caption&quot;}, {}], XMLElement[&quot;p&quot;, {}, {description_}], &quot; &quot;}]}] :> <|&quot;Image&quot; -> Import[url], &quot;ImageDescription&quot; -> description|>, \[Infinity]] 
     ]] 
   
  (*Ecoregion name input:*)
 ecoregionImages[ecoregionName_String] := ecoregionImages[URL[First[Values[Normal[First[
          ConstructColumns[Select[ecoregionsTab, Function[#EcoregionName == ecoregionName]], &quot;OneEarthPage&quot;]]]]]]] 
   
  (*ID input:*)
 ecoregionImages[ecoregionID_Integer] := ecoregionImages[URL[First[Values[Normal[First[
         ConstructColumns[Select[ecoregionsTab, Function[#EcoregionID == ecoregionID]], &quot;OneEarthPage&quot;]]]]]]]
```

*Fetch images for a specified ecoregion, along with their descriptions:*

```wl
In[]:= ecoregionImages[&quot;Myanmar coastal rain forests&quot;]
```

![](https://phileasdg.github.io/media/posts/47/0apewhueieqfw.png =1359x507)

### Searching for iNaturalist Species Observations Within Ecoregions

Finally, here’s an example showing one way you might use the ecoregions data explored in this text in combination with other Wolfram Language ecology functionality. 

iNaturalist is a citizen science project and online community of naturalists, biologists, and ordinary people who record and share observations of plants, animals, and other life forms. Users can upload photos and sounds, identify species, and contribute to a global biodiversity database.

Observations shared to the iNaturalist platform can be retrieved using the [INaturalistSearch](https://resources.wolframcloud.com/FunctionRepository/resources/INaturalistSearch/) function from the Wolfram Function Repository. Let’s use this function to fetch species observations from an specified ecoregion.

*Define the region in which to search for observations:*

```wl
In[]:= region = GeoGroup[Normal[First[Select[ecoregionsTab, Function[#&quot;EcoregionName&quot; == &quot;Puerto Rican moist forests&quot;]]]][&quot;Geometry&quot;]];
```

*Plot this region on a map:*

```wl
In[]:= GeoGraphics[region] // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/090jv8xpyxzy7.png =840x369)

*Fetch observations made within this region and within a specified date range (here, set to the last 10 days at time of computation):*

![](https://phileasdg.github.io/media/posts/47/1uroqt2g1edge.png =2339x103)

*Extract the positions and species names from the resulting dataset, and plot them on a map:*

```wl
In[]:= GeoListPlot[Flatten[FromTabular[ConstructColumns[observations, &quot;LabeledPosition&quot; -> Function[Labeled[#&quot;GeoPosition&quot;, #&quot;TaxonName&quot;]]], &quot;Matrix&quot;]], ImageSize -> 850] // Rasterize
```

![](https://phileasdg.github.io/media/posts/47/0tp97ku72duyh.png =1173x515)

## Conclusion

The Ecoregions2017©Resolve dataset lets us explore the incredible variety of ecosystems around the globe. By breaking down Earth’s landscapes into distinct ecological zones, it gives us a fresh perspective on Earth’s diverse habitats and the species that inhabit them. Whether you’re interested in research, conservation, or simply appreciating the beauty and complexity of life on Earth, this dataset offers a clear and engaging way to use computation to explore questions  about ecology, biodiversity, and environmental science.

## Cite this work

[Terrestrial ecoregions of the world: computational insights into global biodiversity](https://community.wolfram.com/groups/-/m/t/3445374)
by [Phileas Dazeley-Gaist](https://community.wolfram.com/web/phileasdg)
Wolfram Community, STAFF PICKS, April 17, 2025
[https://community.wolfram.com/groups/-/m/t/3445374](https://community.wolfram.com/groups/-/m/t/3445374)