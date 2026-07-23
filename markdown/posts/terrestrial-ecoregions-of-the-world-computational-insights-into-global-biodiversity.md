**Note:** This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3445374). 

## Introduction

Ecoregions are distinct ecological zones with specific environmental conditions (climate, topography, soil composition…), habitats, and species. Each ecoregion contains characteristic species and ecological communities that are adapted to the region’s environment.

The Ecoregions2017©Resolve map is a revised version of the widely used 2001 map of terrestrial ecoregions of the world, originally developed by [Olson et al](https://doi.org/10.1641/0006-3568%282001%29051%5B0933:TEOTWA%5D2.0.CO;2). The new map breaks up the Earth’s land into 846 distinct terrestrial ecoregions nested within 14 terrestrial [biomes](https://en.wikipedia.org/wiki/Biome). An interactive version of the map is available online [here](https://ecoregions.appspot.com/), and the work is discussed in the following article in BioScience: [An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm](https://academic.oup.com/bioscience/article/67/6/534/3102935?login=false) [(Dinerstein et al. 2017)](https://academic.oup.com/bioscience/article/67/6/534/3102935?login=false).

Terrestrial biomes of the world according to Dinerstein and Olson (also used in the [WWF Global 200 classification](https://www.worldwildlife.org/publications/global-200)) already have computational representations in Wolfram Language. Here’s how one might represent them on a map:

```wl
biomes = {Entity["Biome", "ChaparralBiome"], Entity["Biome", "DesertOrDuneBiome"], Entity["Biome", "ForestBiome"], Entity["Biome", "MountainBiome"], Entity["Biome", "RainforestBiome"], Entity["Biome", "SavannaOrGrasslandBiome"], Entity["Biome", "TaigaBiome"], Entity["Biome", "TundraBiome"], Entity["Biome", "ScrubForestBiome"]};
```

*Produce a map of major world biomes:*

```wl
GeoGraphics[{Thread[{
     Map[
      GeoStyling[Opacity[1], #] &, {RGBColor[0.996078431372549, 0., 0.], RGBColor[0.8, 0.403921568627451, 0.403921568627451], RGBColor[0., 0.45098039215686275`, 0.2980392156862745], RGBColor[0.8392156862745098, 0.7647058823529411, 0.615686274509804], RGBColor[0.2196078431372549, 0.6549019607843137, 0.], RGBColor[0.996078431372549, 1., 0.45098039215686275`], RGBColor[0.47843137254901963`, 0.7137254901960784, 0.9607843137254902], RGBColor[0.6196078431372549, 0.8431372549019608, 0.7607843137254902], RGBColor[0.996078431372549, 0.6666666666666666, 0.00392156862745098]}],
     Map[#["Polygon"] &, biomes]}]},
  GeoBackground -> {{"Coastlines", "Land" -> White}, "VectorLabels"}, 
  ImageSize -> Large] // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/biomes.png)

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
freshwaterEcoregionsShapefileData = 
  Association[
   Import[(*Path to the shapefile:*)
    FileNameJoin[{NotebookDirectory[], "2017 Ecoregions", 
      "Ecoregions2017", "Ecoregions2017.shp"}], "Data"]];
```

In addition to the data found in the shapefile, the online interactive map also includes links to informative ecoregion descriptions hosted on [www.oneearth.org](http://www.oneearth.org). Let’s incorporate these links into our dataset.

*Define an association of ecoregion OneEarth pages:*

```wl
ecoregionPages = Iconize[<| 
  "Adelie Land tundra" -> 
   "https://www.oneearth.org/ecoregions/adelie-land-tundra/", 
   "Admiralty Islands lowland rain forests" -> 
   "https://www.oneearth.org/ecoregions/admiralty-islands-lowland-\
rainforests/", 
   "Aegean and Western Turkey sclerophyllous and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/aegean-and-western-turkey-\
sclerophyllous-and-mixed-forests/", "Afghan Mountains semi-desert" -> 
   "https://www.oneearth.org/ecoregions/afghan-mountains-semi-desert/\
", "Ahklun and Kilbuck Upland Tundra" -> 
   "https://www.oneearth.org/ecoregions/ahklun-and-kilbuck-upland-\
tundra/", "Al-Hajar foothill xeric woodlands and shrublands" -> 
   "https://www.oneearth.org/ecoregions/al-hajar-foothill-xeric-\
woodlands-and-shrublands/", 
   "Al-Hajar montane woodlands and shrublands" -> 
   "https://www.oneearth.org/ecoregions/al-hajar-montane-woodlands-\
and-shrublands/", "Alai-Western Tian Shan steppe" -> 
   "https://www.oneearth.org/ecoregions/alai-western-tian-shan-steppe/\
", "Alashan Plateau semi-desert" -> 
   "https://www.oneearth.org/ecoregions/alashan-plateau-semi-desert/",
    "Alaska-St. Elias Range tundra" -> 
   "https://www.oneearth.org/ecoregions/alaska-st-elias-range-tundra/\
", "Alaska Peninsula montane taiga" -> 
   "https://www.oneearth.org/ecoregions/alaska-peninsula-montane-\
taiga/", "Albany thickets" -> 
   "https://www.oneearth.org/ecoregions/albany-thickets/", 
   "Alberta-British Columbia foothills forests" -> 
   "https://www.oneearth.org/ecoregions/alberta-british-columbia-\
foothills-forests/", "Albertine Rift montane forests" -> 
   "https://www.oneearth.org/ecoregions/albertine-rift-montane-\
forests/", "Aldabra Island xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/aldabra-island-xeric-scrub/", 
   "Aleutian Islands tundra" -> 
   "https://www.oneearth.org/ecoregions/aleutian-islands-tundra/", 
   "Allegheny Highlands forests" -> 
   "https://www.oneearth.org/ecoregions/allegheny-highlands-forests/",
    "Alps conifer and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/alps-conifer-and-mixed-\
forests/", "Altai alpine meadow and tundra" -> 
   "https://www.oneearth.org/ecoregions/altai-alpine-meadow-and-\
tundra/", "Altai montane forest and forest steppe" -> 
   "https://www.oneearth.org/ecoregions/altai-montane-forest-and-\
forest-steppe/", "Altai steppe and semi-desert" -> 
   "https://www.oneearth.org/ecoregions/altai-steppe-and-semi-desert/\
", "Alto Paraná Atlantic forests" -> 
   "https://www.oneearth.org/ecoregions/alto-parana-atlantic-forests/\
", "Amazon-Orinoco-Southern Caribbean mangroves" -> 
   "https://www.oneearth.org/ecoregions/amazon-orinoco-southern-\
caribbean-mangroves/", 
   "Amsterdam-Saint Paul Islands temperate grasslands" -> 
   "https://www.oneearth.org/ecoregions/amsterdam-saint-paul-islands-\
temperate-grasslands/", "Amur meadow steppe" -> 
   "https://www.oneearth.org/ecoregions/amur-meadow-steppe/", 
   "Anatolian conifer and deciduous mixed forests" -> 
   "https://www.oneearth.org/ecoregions/anatolian-conifer-and-\
deciduous-mixed-forests/", "Andaman Islands rain forests" -> 
   "https://www.oneearth.org/ecoregions/andaman-islands-rainforests/",
    "Angolan montane forest-grassland" -> 
   "https://www.oneearth.org/ecoregions/angolan-montane-forest-\
grassland/", "Angolan mopane woodlands" -> 
   "https://www.oneearth.org/ecoregions/angolan-mopane-woodlands/", 
   "Angolan scarp savanna and woodlands" -> 
   "https://www.oneearth.org/ecoregions/angolan-scarp-savanna-and-\
woodlands/", "Angolan wet miombo woodlands" -> 
   "https://www.oneearth.org/ecoregions/angolan-wet-miombo-woodlands/\
", "Antipodes Subantarctic Islands tundra" -> 
   "https://www.oneearth.org/ecoregions/antipodes-subantarctic-\
islands-tundra/", "Appalachian-Blue Ridge forests" -> 
   "https://www.oneearth.org/ecoregions/appalachian-blue-ridge-\
forests/", "Appalachian mixed mesophytic forests" -> 
   "https://www.oneearth.org/ecoregions/appalachian-mixed-mesophytic-\
forests/", "Appalachian Piedmont forests" -> 
   "https://www.oneearth.org/ecoregions/appalachian-piedmont-forests/\
", "Appenine deciduous montane forests" -> 
   "https://www.oneearth.org/ecoregions/appenine-deciduous-montane-\
forests/", "Apure-Villavicencio dry forests" -> 
   "https://www.oneearth.org/ecoregions/apure-villavicencio-dry-\
forests/", "Arabian sand desert" -> 
   "https://www.oneearth.org/ecoregions/arabian-sand-desert/", 
   "Araucaria moist forests" -> 
   "https://www.oneearth.org/ecoregions/araucaria-moist-forests/", 
   "Araya and Paria xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/araya-and-paria-xeric-scrub/",
    "Arctic coastal tundra" -> 
   "https://www.oneearth.org/ecoregions/arctic-coastal-tundra/", 
   "Russian Arctic desert" -> 
   "https://www.oneearth.org/ecoregions/russian-arctic-desert/", 
   "Arctic foothills tundra" -> 
   "https://www.oneearth.org/ecoregions/arctic-foothills-tundra/", 
   "Arizona Mountains forests" -> 
   "https://www.oneearth.org/ecoregions/arizona-mountains-forests/", 
   "Arnhem Land tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/arnhem-land-tropical-savanna/\
", "Ascension scrub and grasslands" -> 
   "https://www.oneearth.org/ecoregions/ascension-scrub-and-\
grasslands/", "Atacama desert" -> 
   "https://www.oneearth.org/ecoregions/atacama-desert/", 
   "Atlantic Coast restingas" -> 
   "https://www.oneearth.org/ecoregions/atlantic-coast-restingas/", 
   "Saharan Atlantic coastal desert" -> 
   "https://www.oneearth.org/ecoregions/saharan-atlantic-coastal-\
desert/", "Atlantic coastal pine barrens" -> 
   "https://www.oneearth.org/ecoregions/atlantic-coastal-pine-barrens/\
", "Congolian coastal forests" -> 
   "https://www.oneearth.org/ecoregions/congolian-coastal-forests/", 
   "European Atlantic mixed forests" -> 
   "https://www.oneearth.org/ecoregions/european-atlantic-mixed-\
forests/", "Australian Alps montane grasslands" -> 
   "https://www.oneearth.org/ecoregions/australian-alps-montane-\
grasslands/", "Azerbaijan shrub desert and steppe" -> 
   "https://www.oneearth.org/ecoregions/azerbaijan-shrub-desert-and-\
steppe/", "Azores temperate mixed forests" -> 
   "https://www.oneearth.org/ecoregions/azores-temperate-mixed-\
forests/", "Badghyz and Karabil semi-desert" -> 
   "https://www.oneearth.org/ecoregions/badghyz-and-karabil-semi-\
desert/", "Bahamian-Antillean mangroves" -> 
   "https://www.oneearth.org/ecoregions/bahamian-antillean-mangroves/\
", "Bahia coastal forests" -> 
   "https://www.oneearth.org/ecoregions/bahia-coastal-forests/", 
   "Bahia interior forests" -> 
   "https://www.oneearth.org/ecoregions/bahia-interior-forests/", 
   "Baja California desert" -> 
   "https://www.oneearth.org/ecoregions/baja-california-desert/", 
   "Bajío dry forests" -> 
   "https://www.oneearth.org/ecoregions/bajio-dry-forests/", 
   "Balkan mixed forests" -> 
   "https://www.oneearth.org/ecoregions/balkan-mixed-forests/", 
   "Balsas dry forests" -> 
   "https://www.oneearth.org/ecoregions/balsas-dry-forests/", 
   "Baltic mixed forests" -> 
   "https://www.oneearth.org/ecoregions/baltic-mixed-forests/", 
   "Baluchistan xeric woodlands" -> 
   "https://www.oneearth.org/ecoregions/baluchistan-xeric-woodlands/",
    "Banda Sea Islands moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/banda-sea-islands-moist-\
deciduous-forests/", "Belizian pine savannas" -> 
   "https://www.oneearth.org/ecoregions/belizian-pine-savannas/", 
   "Beni savanna" -> 
   "https://www.oneearth.org/ecoregions/beni-savanna/", 
   "Russian Bering tundra" -> 
   "https://www.oneearth.org/ecoregions/russian-bering-tundra/", 
   "Beringia lowland tundra" -> 
   "https://www.oneearth.org/ecoregions/beringia-lowland-tundra/", 
   "Beringia upland tundra" -> 
   "https://www.oneearth.org/ecoregions/beringia-upland-tundra/", 
   "Bermuda subtropical conifer forests" -> 
   "https://www.oneearth.org/ecoregions/bermuda-subtropical-conifer-\
forests/", "Biak-Numfoor rain forests" -> 
   "https://www.oneearth.org/ecoregions/biak-numfoor-rainforests/", 
   "Blue Mountains forests" -> 
   "https://www.oneearth.org/ecoregions/blue-mountains-forests/", 
   "Bohai Sea saline meadow" -> 
   "https://www.oneearth.org/ecoregions/bohai-sea-saline-meadow/", 
   "Bolivian montane dry forests" -> 
   "https://www.oneearth.org/ecoregions/bolivian-montane-dry-forests/\
", "Bolivian Yungas" -> 
   "https://www.oneearth.org/ecoregions/bolivian-yungas/", 
   "Borneo lowland rain forests" -> 
   "https://www.oneearth.org/ecoregions/borneo-lowland-rainforests/", 
   "Borneo peat swamp forests" -> 
   "https://www.oneearth.org/ecoregions/borneo-peat-swamp-forests/", 
   "Brahmaputra Valley semi-evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/brahmaputra-valley-semi-\
evergreen-forests/", "Brigalow tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/brigalow-tropical-savanna/", 
   "British Columbia coastal conifer forests" -> 
   "https://www.oneearth.org/ecoregions/british-columbia-coastal-\
conifer-forests/", "Brooks-British Range tundra" -> 
   "https://www.oneearth.org/ecoregions/brooks-british-range-tundra/",
    "Buru rain forests" -> 
   "https://www.oneearth.org/ecoregions/buru-rainforests/", 
   "Caatinga" -> "https://www.oneearth.org/ecoregions/caatinga/", 
   "Caatinga Enclaves moist forests" -> 
   "https://www.oneearth.org/ecoregions/caatinga-enclaves-moist-\
forests/", "Caledon conifer forests" -> 
   "https://www.oneearth.org/ecoregions/caledon-conifer-forests/", 
   "California Central Valley grasslands" -> 
   "https://www.oneearth.org/ecoregions/california-central-valley-\
grasslands/", "California coastal sage and chaparral" -> 
   "https://www.oneearth.org/ecoregions/california-coastal-sage-and-\
chaparral/", "California interior chaparral and woodlands" -> 
   "https://www.oneearth.org/ecoregions/california-interior-chaparral-\
and-woodlands/", "California montane chaparral and woodlands" -> 
   "https://www.oneearth.org/ecoregions/california-montane-chaparral-\
and-woodlands/", "Cameroon Highlands forests" -> 
   "https://www.oneearth.org/ecoregions/cameroon-highlands-forests/", 
   "Campos Rupestres montane savanna" -> 
   "https://www.oneearth.org/ecoregions/campos-rupestres-montane-\
savanna/", "Canadian Aspen forests and parklands" -> 
   "https://www.oneearth.org/ecoregions/canadian-aspen-forests-and-\
parklands/", "Canadian Low Arctic tundra" -> 
   "https://www.oneearth.org/ecoregions/canadian-low-arctic-tundra/", 
   "Canary Islands dry woodlands and forests" -> 
   "https://www.oneearth.org/ecoregions/canary-islands-dry-woodlands-\
and-forests/", "Cantabrian mixed forests" -> 
   "https://www.oneearth.org/ecoregions/cantabrian-mixed-forests/", 
   "Canterbury-Otago tussock grasslands" -> 
   "https://www.oneearth.org/ecoregions/canterbury-otago-tussock-\
grasslands/", "Cape Verde Islands dry forests" -> 
   "https://www.oneearth.org/ecoregions/cape-verde-islands-dry-\
forests/", "Cape York Peninsula tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/cape-york-peninsula-tropical-\
savanna/", "Caqueta moist forests" -> 
   "https://www.oneearth.org/ecoregions/caqueta-moist-forests/", 
   "Cardamom Mountains rain forests" -> 
   "https://www.oneearth.org/ecoregions/cardamom-mountains-\
rainforests/", "Caribbean shrublands" -> 
   "https://www.oneearth.org/ecoregions/caribbean-shrublands/", 
   "Carnarvon xeric shrublands" -> 
   "https://www.oneearth.org/ecoregions/carnarvon-xeric-shrublands/", 
   "Carolines tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/carolines-tropical-moist-\
forests/", "Carpathian montane forests" -> 
   "https://www.oneearth.org/ecoregions/carpathian-montane-forests/", 
   "Carpentaria tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/carpentaria-tropical-savanna/\
", "Caspian Hyrcanian mixed forests" -> 
   "https://www.oneearth.org/ecoregions/caspian-hyrcanian-mixed-\
forests/", "Caspian lowland desert" -> 
   "https://www.oneearth.org/ecoregions/caspian-lowland-desert/", 
   "Catatumbo moist forests" -> 
   "https://www.oneearth.org/ecoregions/catatumbo-moist-forests/", 
   "Cauca Valley dry forests" -> 
   "https://www.oneearth.org/ecoregions/cauca-valley-dry-forests/", 
   "Cauca Valley montane forests" -> 
   "https://www.oneearth.org/ecoregions/cauca-valley-montane-forests/\
", "Caucasus mixed forests" -> 
   "https://www.oneearth.org/ecoregions/caucasus-mixed-forests/", 
   "Cayos Miskitos-San Andrés and Providencia moist forests" -> 
   "https://www.oneearth.org/ecoregions/cayos-miskitos-san-andres-and-\
providencia-moist-forests/", "Celtic broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/celtic-broadleaf-forests/", 
   "Central Afghan Mountains xeric woodlands" -> 
   "https://www.oneearth.org/ecoregions/central-afghan-mountains-\
xeric-woodlands/", "Central African mangroves" -> 
   "https://www.oneearth.org/ecoregions/central-african-mangroves/", 
   "Central American Atlantic moist forests" -> 
   "https://www.oneearth.org/ecoregions/central-american-atlantic-\
moist-forests/", "Central American dry forests" -> 
   "https://www.oneearth.org/ecoregions/central-american-dry-forests/\
", "Central American montane forests" -> 
   "https://www.oneearth.org/ecoregions/central-american-montane-\
forests/", "Central American pine-oak forests" -> 
   "https://www.oneearth.org/ecoregions/central-american-pine-oak-\
forests/", "Central Anatolian steppe" -> 
   "https://www.oneearth.org/ecoregions/central-anatolian-steppe/", 
   "Central Anatolian steppe and woodlands" -> 
   "https://www.oneearth.org/ecoregions/central-anatolian-steppe-and-\
woodlands/", "Central-Southern Cascades Forests" -> 
   "https://www.oneearth.org/ecoregions/central-southern-cascades-\
forests/", "Central-Southern US mixed grasslands" -> 
   "https://www.oneearth.org/ecoregions/central-southern-us-mixed-\
grasslands/", "Central Andean dry puna" -> 
   "https://www.oneearth.org/ecoregions/central-andean-dry-puna/", 
   "Central Andean puna" -> 
   "https://www.oneearth.org/ecoregions/central-andean-puna/", 
   "Central Andean wet puna" -> 
   "https://www.oneearth.org/ecoregions/central-andean-wet-puna/", 
   "Central Asian northern desert" -> 
   "https://www.oneearth.org/ecoregions/central-asian-northern-desert/\
", "Central Asian riparian woodlands" -> 
   "https://www.oneearth.org/ecoregions/central-asian-riparian-\
woodlands/", "Central Asian southern desert" -> 
   "https://www.oneearth.org/ecoregions/central-asian-southern-desert/\
", "Central British Columbia Mountain forests" -> 
   "https://www.oneearth.org/ecoregions/central-british-columbia-\
mountain-forests/", "Central bushveld" -> 
   "https://www.oneearth.org/ecoregions/central-bushveld/", 
   "Central Canadian Shield forests" -> 
   "https://www.oneearth.org/ecoregions/central-canadian-shield-\
forests/", "Central China Loess Plateau mixed forests" -> 
   "https://www.oneearth.org/ecoregions/central-china-loess-plateau-\
mixed-forests/", "Central Congolian lowland forests" -> 
   "https://www.oneearth.org/ecoregions/central-congolian-lowland-\
forests/", "Central Deccan Plateau dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/central-deccan-plateau-dry-\
deciduous-forests/", "Central European mixed forests" -> 
   "https://www.oneearth.org/ecoregions/central-european-mixed-\
forests/", "Central US forest-grasslands transition" -> 
   "https://www.oneearth.org/ecoregions/central-us-forest-grasslands-\
transition/", "Central Indochina dry forests" -> 
   "https://www.oneearth.org/ecoregions/central-indochina-dry-forests/\
", "Central Korean deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/central-korean-deciduous-\
forests/", "Central Mexican matorral" -> 
   "https://www.oneearth.org/ecoregions/central-mexican-matorral/", 
   "Central Pacific Northwest coastal forests" -> 
   "https://www.oneearth.org/ecoregions/central-pacific-northwest-\
coastal-forests/", "Central Persian desert basins" -> 
   "https://www.oneearth.org/ecoregions/central-persian-desert-basins/\
", "Central Polynesian tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/central-polynesian-tropical-\
moist-forests/", "Central Range Papuan montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/central-range-papuan-montane-\
rainforests/", "Papuan Central Range sub-alpine grasslands" -> 
   "https://www.oneearth.org/ecoregions/papuan-central-range-sub-\
alpine-grasslands/", "Central Ranges xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/central-ranges-xeric-scrub/", 
   "Central South Antarctic Peninsula tundra" -> 
   "https://www.oneearth.org/ecoregions/central-south-antarctic-\
peninsula-tundra/", "Central Tallgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/central-tallgrass-prairie/", 
   "Central Tibetan Plateau alpine steppe" -> 
   "https://www.oneearth.org/ecoregions/central-tibetan-plateau-\
alpine-steppe/", "Central Zambezian wet miombo woodlands" -> 
   "https://www.oneearth.org/ecoregions/central-zambezian-wet-miombo-\
woodlands/", "Cerrado" -> 
   "https://www.oneearth.org/ecoregions/cerrado/", 
   "Changbai Mountains mixed forests" -> 
   "https://www.oneearth.org/ecoregions/changbai-mountains-mixed-\
forests/", "Changjiang Plain evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/changjiang-plain-evergreen-\
forests/", "Chao Phraya freshwater swamp forests" -> 
   "https://www.oneearth.org/ecoregions/chao-phraya-freshwater-swamp-\
forests/", "Chao Phraya lowland moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/chao-phraya-lowland-moist-\
deciduous-forests/", "Chatham Island temperate forests" -> 
   "https://www.oneearth.org/ecoregions/chatham-island-temperate-\
forests/", "Cherskii-Kolyma mountain tundra" -> 
   "https://www.oneearth.org/ecoregions/cherskii-kolyma-mountain-\
tundra/", "Chhota-Nagpur dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/chhota-nagpur-dry-deciduous-\
forests/", "Chiapas Depression dry forests" -> 
   "https://www.oneearth.org/ecoregions/chiapas-depression-dry-\
forests/", "Chiapas montane forests" -> 
   "https://www.oneearth.org/ecoregions/chiapas-montane-forests/", 
   "Chihuahuan desert" -> 
   "https://www.oneearth.org/ecoregions/chihuahuan-desert/", 
   "Chilean Matorral" -> 
   "https://www.oneearth.org/ecoregions/chilean-matorral/", 
   "Chimalapas montane forests" -> 
   "https://www.oneearth.org/ecoregions/chimalapas-montane-forests/", 
   "Chin Hills-Arakan Yoma montane forests" -> 
   "https://www.oneearth.org/ecoregions/chin-hills-arakan-yoma-\
montane-forests/", "Chiquitano dry forests" -> 
   "https://www.oneearth.org/ecoregions/chiquitano-dry-forests/", 
   "Chocó-Darién moist forests" -> 
   "https://www.oneearth.org/ecoregions/choco-darien-moist-forests/", 
   "Christmas and Cocos Islands tropical forests" -> 
   "https://www.oneearth.org/ecoregions/christmas-and-cocos-islands-\
tropical-forests/", "Chukchi Peninsula tundra" -> 
   "https://www.oneearth.org/ecoregions/chukchi-peninsula-tundra/", 
   "Clipperton Island shrub and grasslands" -> 
   "https://www.oneearth.org/ecoregions/clipperton-island-shrub-and-\
grasslands/", "Cocos Island moist forests" -> 
   "https://www.oneearth.org/ecoregions/cocos-island-moist-forests/", 
   "Colorado Plateau shrublands" -> 
   "https://www.oneearth.org/ecoregions/colorado-plateau-shrublands/",
    "Colorado Rockies forests" -> 
   "https://www.oneearth.org/ecoregions/colorado-rockies-forests/", 
   "Comoros forests" -> 
   "https://www.oneearth.org/ecoregions/comoros-forests/", 
   "Cook Inlet taiga" -> 
   "https://www.oneearth.org/ecoregions/cook-inlet-taiga/", 
   "Cook Islands tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/cook-islands-tropical-moist-\
forests/", "Coolgardie woodlands" -> 
   "https://www.oneearth.org/ecoregions/coolgardie-woodlands/", 
   "Copper Plateau taiga" -> 
   "https://www.oneearth.org/ecoregions/copper-plateau-taiga/", 
   "Cordillera Central páramo" -> 
   "https://www.oneearth.org/ecoregions/cordillera-central-paramo/", 
   "Cordillera de Merida páramo" -> 
   "https://www.oneearth.org/ecoregions/cordillera-de-merida-paramo/",
    "Cordillera La Costa montane forests" -> 
   "https://www.oneearth.org/ecoregions/cordillera-de-la-costa-\
montane-forests/", "Cordillera Oriental montane forests" -> 
   "https://www.oneearth.org/ecoregions/cordillera-oriental-montane-\
forests/", "Corsican montane broadleaf and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/corsican-montane-broadleaf-\
and-mixed-forests/", "Costa Rican seasonal moist forests" -> 
   "https://www.oneearth.org/ecoregions/costa-rican-seasonal-moist-\
forests/", "Crete Mediterranean forests" -> 
   "https://www.oneearth.org/ecoregions/crete-mediterranean-forests/",
    "Crimean Submediterranean forest complex" -> 
   "https://www.oneearth.org/ecoregions/crimean-submediterranean-\
forest-complex/", "Cross-Niger transition forests" -> 
   "https://www.oneearth.org/ecoregions/cross-niger-transition-\
forests/", "Cross-Sanaga-Bioko coastal forests" -> 
   "https://www.oneearth.org/ecoregions/cross-sanaga-bioko-coastal-\
forests/", "Cross-Timbers savanna-woodland" -> 
   "https://www.oneearth.org/ecoregions/cross-timbers-savanna-\
woodland/", "Cuban cactus scrub" -> 
   "https://www.oneearth.org/ecoregions/cuban-cactus-scrub/", 
   "Cuban dry forests" -> 
   "https://www.oneearth.org/ecoregions/cuban-dry-forests/", 
   "Cuban moist forests" -> 
   "https://www.oneearth.org/ecoregions/cuban-moist-forests/", 
   "Cuban pine forests" -> 
   "https://www.oneearth.org/ecoregions/cuban-pine-forests/", 
   "Cuban wetlands" -> 
   "https://www.oneearth.org/ecoregions/cuban-wetlands/", 
   "Cyprus Mediterranean forests" -> 
   "https://www.oneearth.org/ecoregions/cyprus-mediterranean-forests/\
", "Da Hinggan-Dzhagdy Mountains conifer forests" -> 
   "https://www.oneearth.org/ecoregions/da-hinggan-dzhagdy-mountains-\
conifer-forests/", "Daba Mountains evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/daba-mountains-evergreen-\
forests/", "Daurian forest steppe" -> 
   "https://www.oneearth.org/ecoregions/daurian-forest-steppe/", 
   "Davis Highlands tundra" -> 
   "https://www.oneearth.org/ecoregions/davis-highlands-tundra/", 
   "Deccan thorn scrub forests" -> 
   "https://www.oneearth.org/ecoregions/deccan-thorn-scrub-forests/", 
   "Dinaric Mountains mixed forests" -> 
   "https://www.oneearth.org/ecoregions/dinaric-mountains-mixed-\
forests/", "Djibouti xeric shrublands" -> 
   "https://www.oneearth.org/ecoregions/djibouti-xeric-shrublands/", 
   "Drakensberg Escarpment savanna and thicket" -> 
   "https://www.oneearth.org/ecoregions/drakensberg-escarpment-\
savanna-and-thicket/", "Drakensberg grasslands" -> 
   "https://www.oneearth.org/ecoregions/drakensberg-grasslands/", 
   "Dry Chaco" -> "https://www.oneearth.org/ecoregions/dry-chaco/", 
   "East Afghan montane conifer forests" -> 
   "https://www.oneearth.org/ecoregions/east-afghan-montane-conifer-\
forests/", "East African halophytics" -> 
   "https://www.oneearth.org/ecoregions/east-african-halophytics/", 
   "East African mangroves" -> 
   "https://www.oneearth.org/ecoregions/east-african-mangroves/", 
   "East Antarctic tundra" -> 
   "https://www.oneearth.org/ecoregions/east-antarctic-tundra/", 
   "East Arabian fog shrublands and sand desert" -> 
   "https://www.oneearth.org/ecoregions/east-arabian-fog-shrublands-\
and-sand-desert/", "East Central Texas forests" -> 
   "https://www.oneearth.org/ecoregions/east-central-texas-savanna-\
woodland/", "East Deccan dry-evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/east-deccan-dry-evergreen-\
forests/", "East European forest steppe" -> 
   "https://www.oneearth.org/ecoregions/east-european-forest-steppe/",
    "East Sahara Desert" -> 
   "https://www.oneearth.org/ecoregions/east-sahara-desert/", 
   "East Saharan montane xeric woodlands" -> 
   "https://www.oneearth.org/ecoregions/east-saharan-montane-xeric-\
woodlands/", "East Siberian taiga" -> 
   "https://www.oneearth.org/ecoregions/east-siberian-taiga/", 
   "East Sudanian savanna" -> 
   "https://www.oneearth.org/ecoregions/east-sudanian-savanna/", 
   "Eastern Anatolian deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-anatolian-deciduous-\
forests/", "Eastern Anatolian montane steppe" -> 
   "https://www.oneearth.org/ecoregions/eastern-anatolian-montane-\
steppe/", "Eastern Australia mulga shrublands" -> 
   "https://www.oneearth.org/ecoregions/eastern-australia-mulga-\
shrublands/", "Eastern Australian temperate forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-australian-temperate-\
forests/", "Eastern Canadian forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-canadian-boreal-\
forests/", "Eastern Canadian Shield taiga" -> 
   "https://www.oneearth.org/ecoregions/eastern-canadian-shield-taiga/\
", "Eastern Cascades forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-cascades-forests/", 
   "Eastern Congolian swamp forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-congolian-swamp-\
forests/", "Eastern Cordillera Real montane forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-cordillera-real-\
montane-forests/", "Eastern Canadian Forest-Boreal transition" -> 
   "https://www.oneearth.org/ecoregions/eastern-canadian-temperate-\
boreal-forest-transition/", "Eastern Gobi desert steppe" -> 
   "https://www.oneearth.org/ecoregions/eastern-gobi-desert-steppe/", 
   "Eastern Great Lakes lowland forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-great-lakes-lowland-\
forests/", "Eastern Guinean forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-guinean-forests/", 
   "East Deccan moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/east-deccan-moist-deciduous-\
forests/", "Eastern Himalayan alpine shrub and meadows" -> 
   "https://www.oneearth.org/ecoregions/eastern-himalayan-alpine-\
shrub-and-meadows/", "Eastern Himalayan broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-himalayan-broadleaf-\
forests/", "Eastern Himalayan subalpine conifer forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-himalayan-subalpine-\
conifer-forests/", "Eastern Java-Bali montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-java-bali-montane-\
rainforests/", "Eastern Java-Bali rain forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-java-bali-rainforests/\
", "Eastern Mediterranean conifer-broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-mediterranean-conifer-\
broadleaf-forests/", "Eastern Micronesia tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-micronesia-tropical-\
moist-forests/", "Eastern Panamanian montane forests" -> 
   "https://www.oneearth.org/ecoregions/eastern-panamanian-montane-\
forests/", "Ecuadorian dry forests" -> 
   "https://www.oneearth.org/ecoregions/ecuadorian-dry-forests/", 
   "Edwards Plateau savanna" -> 
   "https://www.oneearth.org/ecoregions/edwards-plateau-savanna/", 
   "Einasleigh upland savanna" -> 
   "https://www.oneearth.org/ecoregions/einasleigh-upland-savanna/", 
   "Elburz Range forest steppe" -> 
   "https://www.oneearth.org/ecoregions/elburz-range-forest-steppe/", 
   "Ellsworth Land tundra" -> 
   "https://www.oneearth.org/ecoregions/ellsworth-land-tundra/", 
   "Ellsworth Mountains tundra" -> 
   "https://www.oneearth.org/ecoregions/ellsworth-mountains-tundra/", 
   "Emin Valley steppe" -> 
   "https://www.oneearth.org/ecoregions/emin-valley-steppe/", 
   "Enderby Land tundra" -> 
   "https://www.oneearth.org/ecoregions/enderby-land-tundra/", 
   "English Lowlands beech forests" -> 
   "https://www.oneearth.org/ecoregions/english-lowlands-beech-\
forests/", "Enriquillo wetlands" -> 
   "https://www.oneearth.org/ecoregions/enriquillo-wetlands/", 
   "Eritrean coastal desert" -> 
   "https://www.oneearth.org/ecoregions/eritrean-coastal-desert/", 
   "Esperance mallee" -> 
   "https://www.oneearth.org/ecoregions/esperance-mallee/", "Espinal" -> 
   "https://www.oneearth.org/ecoregions/espinal/", 
   "Ethiopian montane forests" -> 
   "https://www.oneearth.org/ecoregions/ethiopian-montane-forests/", 
   "Ethiopian montane grasslands and woodlands" -> 
   "https://www.oneearth.org/ecoregions/ethiopian-montane-grasslands-\
and-woodlands/", "Ethiopian montane moorlands" -> 
   "https://www.oneearth.org/ecoregions/ethiopian-montane-moorlands/",
    "Etosha Pan halophytics" -> 
   "https://www.oneearth.org/ecoregions/etosha-pan-halophytics/", 
   "Euxine-Colchic broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/euxine-colchic-broadleaf-\
forests/", "Everglades flooded grasslands" -> 
   "https://www.oneearth.org/ecoregions/everglades-flooded-grasslands/\
", "Eyre and York mallee" -> 
   "https://www.oneearth.org/ecoregions/eyre-and-yorke-mallee/", 
   "Faroe Islands boreal grasslands" -> 
   "https://www.oneearth.org/ecoregions/faroe-islands-boreal-\
grasslands/", "Fernando de Noronha-Atol das Rocas moist forests" -> 
   "https://www.oneearth.org/ecoregions/fernando-de-noronha-atol-das-\
rocas-moist-forests/", "Fiji tropical dry forests" -> 
   "https://www.oneearth.org/ecoregions/fiji-tropical-dry-forests/", 
   "Fiji tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/fiji-tropical-moist-forests/",
    "Fiordland temperate forests" -> 
   "https://www.oneearth.org/ecoregions/fiordland-temperate-forests/",
    "Flinders-Lofty montane woodlands" -> 
   "https://www.oneearth.org/ecoregions/flinders-lofty-montane-\
woodlands/", "Flint Hills tallgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/flint-hills-tallgrass-prairie/\
", "Fraser Plateau and Basin conifer forests" -> 
   "https://www.oneearth.org/ecoregions/fraser-plateau-and-basin-\
conifer-forests/", "Fynbos shrubland" -> 
   "https://www.oneearth.org/ecoregions/fynbos-shrubland/", 
   "Galápagos Islands xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/galapagos-islands-xeric-scrub/\
", "Gariep Karoo" -> 
   "https://www.oneearth.org/ecoregions/gariep-karoo/", 
   "Ghorat-Hazarajat alpine meadow" -> 
   "https://www.oneearth.org/ecoregions/ghorat-hazarajat-alpine-\
meadow/", "Gibson desert" -> 
   "https://www.oneearth.org/ecoregions/gibson-desert/", 
   "Gissaro-Alai open woodlands" -> 
   "https://www.oneearth.org/ecoregions/gissaro-alai-open-woodlands/",
    "Godavari-Krishna mangroves" -> 
   "https://www.oneearth.org/ecoregions/godavari-krishna-mangroves/", 
   "Gobi Lakes Valley desert steppe" -> 
   "https://www.oneearth.org/ecoregions/gobi-lakes-valley-desert-\
steppe/", "Granitic Seychelles forests" -> 
   "https://www.oneearth.org/ecoregions/granitic-seychelles-forests/",
    "Great Basin montane forests" -> 
   "https://www.oneearth.org/ecoregions/great-basin-montane-forests/",
    "Great Basin shrub steppe" -> 
   "https://www.oneearth.org/ecoregions/great-basin-shrub-steppe/", 
   "Great Lakes Basin desert steppe" -> 
   "https://www.oneearth.org/ecoregions/great-lakes-basin-desert-\
steppe/", "Great Sandy-Tanami desert" -> 
   "https://www.oneearth.org/ecoregions/great-sandy-tanami-desert/", 
   "Great Victoria desert" -> 
   "https://www.oneearth.org/ecoregions/great-victoria-desert/", 
   "Greater Negros-Panay rain forests" -> 
   "https://www.oneearth.org/ecoregions/greater-negros-panay-\
rainforests/", "Guajira-Barranquilla xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/guajira-barranquilla-xeric-\
scrub/", "Guayaquil flooded grasslands" -> 
   "https://www.oneearth.org/ecoregions/guayaquil-flooded-grasslands/\
", "Guianan freshwater swamp forests" -> 
   "https://www.oneearth.org/ecoregions/guianan-freshwater-swamp-\
forests/", "Guianan Highlands moist forests" -> 
   "https://www.oneearth.org/ecoregions/guianan-highlands-moist-\
forests/", "Guianan lowland moist forests" -> 
   "https://www.oneearth.org/ecoregions/guianan-lowland-moist-forests/\
", "Guianan piedmont moist forests" -> 
   "https://www.oneearth.org/ecoregions/guianan-piedmont-moist-\
forests/", "Guianan savanna" -> 
   "https://www.oneearth.org/ecoregions/guianan-savanna/", 
   "Guinean forest-savanna" -> 
   "https://www.oneearth.org/ecoregions/guinean-forest-savanna/", 
   "Guinean mangroves" -> 
   "https://www.oneearth.org/ecoregions/guinean-mangroves/", 
   "Guinean montane forests" -> 
   "https://www.oneearth.org/ecoregions/guinean-montane-forests/", 
   "Guizhou Plateau broadleaf and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/guizhou-plateau-broadleaf-and-\
mixed-forests/", "Gulf of California xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/gulf-of-california-xeric-\
scrub/", "Gulf of St. Lawrence lowland forests" -> 
   "https://www.oneearth.org/ecoregions/gulf-of-st-lawrence-lowland-\
forests/", "Gurupa várzea" -> 
   "https://www.oneearth.org/ecoregions/gurupa-varzea/", 
   "Hainan Island monsoon rain forests" -> 
   "https://www.oneearth.org/ecoregions/hainan-island-monsoon-\
rainforests/", "Halmahera rain forests" -> 
   "https://www.oneearth.org/ecoregions/halmahera-rainforests/", 
   "Hampton mallee and woodlands" -> 
   "https://www.oneearth.org/ecoregions/hampton-mallee-and-woodlands/\
", "Hawai'i tropical dry forests" -> 
   "https://www.oneearth.org/ecoregions/hawaii-tropical-dry-forests/",
    "Hawai'i tropical high shrublands" -> 
   "https://www.oneearth.org/ecoregions/hawaii-tropical-high-\
shrublands/", "Hawai'i tropical low shrublands" -> 
   "https://www.oneearth.org/ecoregions/hawaii-tropical-low-\
shrublands/", "Hawai'i tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/hawaii-tropical-moist-forests/\
", "Helanshan montane conifer forests" -> 
   "https://www.oneearth.org/ecoregions/helanshan-montane-conifer-\
forests/", "Hengduan Mountains subalpine conifer forests" -> 
   "https://www.oneearth.org/ecoregions/hengduan-mountains-subalpine-\
conifer-forests/", "Canadian High Arctic tundra" -> 
   "https://www.oneearth.org/ecoregions/canadian-high-arctic-tundra/",
    "High Monte" -> "https://www.oneearth.org/ecoregions/high-monte/",
    "Highveld grasslands" -> 
   "https://www.oneearth.org/ecoregions/highveld-grasslands/", 
   "Himalayan subtropical broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/himalayan-subtropical-\
broadleaf-forests/", "Himalayan subtropical pine forests" -> 
   "https://www.oneearth.org/ecoregions/himalayan-subtropical-pine-\
forests/", "Hindu Kush alpine meadow" -> 
   "https://www.oneearth.org/ecoregions/hindu-kush-alpine-meadow/", 
   "Hispaniolan dry forests" -> 
   "https://www.oneearth.org/ecoregions/hispaniolan-dry-forests/", 
   "Hispaniolan moist forests" -> 
   "https://www.oneearth.org/ecoregions/hispaniolan-moist-forests/", 
   "Hispaniolan pine forests" -> 
   "https://www.oneearth.org/ecoregions/hispaniolan-pine-forests/", 
   "Hobyo grasslands and shrublands" -> 
   "https://www.oneearth.org/ecoregions/hobyo-grasslands-and-\
shrublands/", "Hokkaido deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/hokkaido-deciduous-forests/", 
   "Hokkaido montane conifer forests" -> 
   "https://www.oneearth.org/ecoregions/hokkaido-montane-conifer-\
forests/", "Honshu alpine conifer forests" -> 
   "https://www.oneearth.org/ecoregions/honshu-alpine-conifer-forests/\
", "Horn of Africa xeric bushlands" -> 
   "https://www.oneearth.org/ecoregions/horn-of-africa-xeric-\
bushlands/", "Huang He Plain mixed forests" -> 
   "https://www.oneearth.org/ecoregions/huang-he-plain-mixed-forests/\
", "Humid Chaco" -> 
   "https://www.oneearth.org/ecoregions/humid-chaco/", "Humid Pampas" -> 
   "https://www.oneearth.org/ecoregions/humid-pampas/", 
   "Huon Peninsula montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/huon-peninsula-montane-\
rainforests/", "Iberian conifer forests" -> 
   "https://www.oneearth.org/ecoregions/iberian-conifer-forests/", 
   "Iberian sclerophyllous and semi-deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/iberian-sclerophyllous-and-\
semi-deciduous-forests/", 
   "Iceland boreal birch forests and alpine tundra" -> 
   "https://www.oneearth.org/ecoregions/iceland-boreal-birch-forests-\
and-alpine-tundra/", "Illyrian deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/illyrian-deciduous-forests/", 
   "Indochina mangroves" -> 
   "https://www.oneearth.org/ecoregions/indochina-mangroves/", 
   "Indus River Delta-Arabian Sea mangroves" -> 
   "https://www.oneearth.org/ecoregions/indus-river-delta-arabian-sea-\
mangroves/", "Indus Valley desert" -> 
   "https://www.oneearth.org/ecoregions/indus-valley-desert/", 
   "Inner Niger Delta flooded savanna" -> 
   "https://www.oneearth.org/ecoregions/inner-niger-delta-flooded-\
savanna/", "Interior Alaska-Yukon lowland taiga" -> 
   "https://www.oneearth.org/ecoregions/interior-alaska-yukon-lowland-\
taiga/", "Interior Plateau US Hardwood Forests" -> 
   "https://www.oneearth.org/ecoregions/interior-plateau-us-hardwood-\
forests/", "Interior Yukon-Alaska alpine tundra" -> 
   "https://www.oneearth.org/ecoregions/interior-alaska-yukon-alpine-\
tundra/", "Iquitos várzea" -> 
   "https://www.oneearth.org/ecoregions/iquitos-varzea/", 
   "Irrawaddy dry forests" -> 
   "https://www.oneearth.org/ecoregions/irrawaddy-dry-forests/", 
   "Irrawaddy freshwater swamp forests" -> 
   "https://www.oneearth.org/ecoregions/irrawaddy-freshwater-swamp-\
forests/", "Irrawaddy moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/irrawaddy-moist-deciduous-\
forests/", "Islas Revillagigedo dry forests" -> 
   "https://www.oneearth.org/ecoregions/islas-revillagigedo-dry-\
forests/", "Isthmian-Atlantic moist forests" -> 
   "https://www.oneearth.org/ecoregions/isthmian-atlantic-moist-\
forests/", "Isthmian-Pacific moist forests" -> 
   "https://www.oneearth.org/ecoregions/isthmian-pacific-moist-\
forests/", "Italian sclerophyllous and semi-deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/italian-sclerophyllous-and-\
semi-deciduous-forests/", "Itigi-Sumbu thicket" -> 
   "https://www.oneearth.org/ecoregions/itigi-sumbu-thicket/", 
   "Jalisco dry forests" -> 
   "https://www.oneearth.org/ecoregions/jalisco-dry-forests/", 
   "Jamaican dry forests" -> 
   "https://www.oneearth.org/ecoregions/jamaican-dry-forests/", 
   "Jamaican moist forests" -> 
   "https://www.oneearth.org/ecoregions/jamaican-moist-forests/", 
   "Japurá-Solimões-Negro moist forests" -> 
   "https://www.oneearth.org/ecoregions/japura-solimoes-negro-moist-\
forests/", "Jarrah-Karri forest and shrublands" -> 
   "https://www.oneearth.org/ecoregions/jarrah-karri-forest-and-\
shrublands/", "Jian Nan subtropical evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/jian-nan-subtropical-\
evergreen-forests/", "Jos Plateau forest-grassland" -> 
   "https://www.oneearth.org/ecoregions/jos-plateau-forest-grassland/\
", "Juan Fernández Islands temperate forests" -> 
   "https://www.oneearth.org/ecoregions/juan-fernandez-islands-\
temperate-forests/", "Junggar Basin semi-desert" -> 
   "https://www.oneearth.org/ecoregions/junggar-basin-semi-desert/", 
   "Juruá-Purus moist forests" -> 
   "https://www.oneearth.org/ecoregions/jurua-purus-moist-forests/", 
   "Kalaallit Nunaat High Arctic tundra" -> 
   "https://www.oneearth.org/ecoregions/kalaallit-nunaat-high-arctic-\
tundra/", "Kalahari Acacia woodlands" -> 
   "https://www.oneearth.org/ecoregions/kalahari-acacia-woodlands/", 
   "Kalahari xeric savanna" -> 
   "https://www.oneearth.org/ecoregions/kalahari-xeric-savanna/", 
   "Kamchatka-Kurile meadows and sparse forests" -> 
   "https://www.oneearth.org/ecoregions/kamchatka-kurile-meadows-and-\
sparse-forests/", "Kamchatka taiga" -> 
   "https://www.oneearth.org/ecoregions/kamchatka-taiga/", 
   "Kaokoveld desert" -> 
   "https://www.oneearth.org/ecoregions/kaokoveld-desert/", 
   "Karakoram-West Tibetan Plateau alpine steppe" -> 
   "https://www.oneearth.org/ecoregions/karakoram-west-tibetan-\
plateau-alpine-steppe/", "Kayah-Karen montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/kayah-karen-montane-\
rainforests/", "Kazakh forest steppe" -> 
   "https://www.oneearth.org/ecoregions/kazakh-forest-steppe/", 
   "Kazakh semi-desert" -> 
   "https://www.oneearth.org/ecoregions/kazakh-semi-desert/", 
   "Kazakh steppe" -> 
   "https://www.oneearth.org/ecoregions/kazakh-steppe/", 
   "Kazakh upland steppe" -> 
   "https://www.oneearth.org/ecoregions/kazakh-upland-steppe/", 
   "Kermadec Islands subtropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/kermadec-islands-subtropical-\
moist-forests/", "Khangai Mountains alpine meadow" -> 
   "https://www.oneearth.org/ecoregions/khangai-mountains-alpine-\
meadow/", "Khangai Mountains conifer forests" -> 
   "https://www.oneearth.org/ecoregions/khangai-mountains-conifer-\
forests/", "Khathiar-Gir dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/khathiar-gir-dry-deciduous-\
forests/", "Kimberly tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/kimberly-tropical-savanna/", 
   "Klamath-Siskiyou forests" -> 
   "https://www.oneearth.org/ecoregions/klamath-siskiyou-forests/", 
   "Knysna-Amatole montane forests" -> 
   "https://www.oneearth.org/ecoregions/knysna-amatole-montane-\
forests/", "Kola Peninsula tundra" -> 
   "https://www.oneearth.org/ecoregions/kola-peninsula-tundra/", 
   "Kopet Dag semi-desert" -> 
   "https://www.oneearth.org/ecoregions/kopet-dag-semi-desert/", 
   "Kopet Dag woodlands and forest steppe" -> 
   "https://www.oneearth.org/ecoregions/kopet-dag-woodlands-and-\
forest-steppe/", "Kuh Rud and Eastern Iran montane woodlands" -> 
   "https://www.oneearth.org/ecoregions/kuh-rud-and-eastern-iran-\
montane-woodlands/", "Kwazulu Natal-Cape coastal forests" -> 
   "https://www.oneearth.org/ecoregions/kwazulu-natal-cape-coastal-\
forests/", "La Costa xeric shrublands" -> 
   "https://www.oneearth.org/ecoregions/la-costa-xeric-shrublands/", 
   "Lake Chad flooded savanna" -> 
   "https://www.oneearth.org/ecoregions/lake-chad-flooded-savanna/", 
   "Lara-Falcón dry forests" -> 
   "https://www.oneearth.org/ecoregions/lara-falcon-dry-forests/", 
   "Leeward Islands moist forests" -> 
   "https://www.oneearth.org/ecoregions/leeward-islands-moist-forests/\
", "Lesser Sundas deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/lesser-sundas-deciduous-\
forests/", "Limpopo lowveld" -> 
   "https://www.oneearth.org/ecoregions/limpopo-lowveld/", "Llanos" -> 
   "https://www.oneearth.org/ecoregions/llanos/", 
   "Lord Howe Island subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/lord-howe-island-subtropical-\
forests/", "Louisiade Archipelago rain forests" -> 
   "https://www.oneearth.org/ecoregions/louisiade-archipelago-\
rainforests/", "Low Monte" -> 
   "https://www.oneearth.org/ecoregions/low-monte/", 
   "Lower Gangetic Plains moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/lower-gangetic-plains-moist-\
deciduous-forests/", "Luang Prabang montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/luang-prabang-montane-\
rainforests/", "Luzon montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/luzon-montane-rainforests/", 
   "Luzon rain forests" -> 
   "https://www.oneearth.org/ecoregions/luzon-rainforests/", 
   "Luzon tropical pine forests" -> 
   "https://www.oneearth.org/ecoregions/luzon-tropical-pine-forests/",
    "Madagascar dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/madagascar-dry-deciduous-\
forests/", "Madagascar ericoid thickets" -> 
   "https://www.oneearth.org/ecoregions/madagascar-ericoid-thickets/",
    "Madagascar humid forests" -> 
   "https://www.oneearth.org/ecoregions/madagascar-humid-forests/", 
   "Madagascar mangroves" -> 
   "https://www.oneearth.org/ecoregions/madagascar-mangroves/", 
   "Madagascar spiny thickets" -> 
   "https://www.oneearth.org/ecoregions/madagascar-spiny-thickets/", 
   "Madagascar subhumid forests" -> 
   "https://www.oneearth.org/ecoregions/madagascar-subhumid-forests/",
    "Madagascar succulent woodlands" -> 
   "https://www.oneearth.org/ecoregions/madagascar-succulent-\
woodlands/", "Madeira-Tapajós moist forests" -> 
   "https://www.oneearth.org/ecoregions/madeira-tapajos-moist-forests/\
", "Madeira evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/madeira-evergreen-forests/", 
   "Magdalena-Urabá moist forests" -> 
   "https://www.oneearth.org/ecoregions/magdalena-uraba-moist-forests/\
", "Magdalena Valley dry forests" -> 
   "https://www.oneearth.org/ecoregions/magdalena-valley-dry-forests/\
", "Magdalena Valley montane forests" -> 
   "https://www.oneearth.org/ecoregions/magdalena-valley-montane-\
forests/", "Magellanic subpolar forests" -> 
   "https://www.oneearth.org/ecoregions/magellanic-subpolar-forests/",
    "Makgadikgadi halophytics" -> 
   "https://www.oneearth.org/ecoregions/makgadikgadi-halophytics/", 
   "Malabar Coast moist forests" -> 
   "https://www.oneearth.org/ecoregions/malabar-coast-moist-forests/",
    "Maldives-Lakshadweep-Chagos Archipelago tropical moist forests" -> "\
https://www.oneearth.org/ecoregions/maldives-lakshadweep-chagos-\
archipelago-tropical-moist-forests/", "Malpelo Island xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/malpelo-island-xeric-scrub/", 
   "Manchurian mixed forests" -> 
   "https://www.oneearth.org/ecoregions/manchurian-mixed-forests/", 
   "Mandara Plateau woodlands" -> 
   "https://www.oneearth.org/ecoregions/mandara-plateau-woodlands/", 
   "Maputaland coastal forests and woodlands" -> 
   "https://www.oneearth.org/ecoregions/maputaland-coastal-forests-\
and-woodlands/", "Maracaibo dry forests" -> 
   "https://www.oneearth.org/ecoregions/maracaibo-dry-forests/", 
   "Marajó várzea" -> 
   "https://www.oneearth.org/ecoregions/marajo-varzea/", 
   "Maranhão Babaçu forests" -> 
   "https://www.oneearth.org/ecoregions/maranhao-babacu-forests/", 
   "Marañón dry forests" -> 
   "https://www.oneearth.org/ecoregions/maranon-dry-forests/", 
   "Marianas tropical dry forests" -> 
   "https://www.oneearth.org/ecoregions/marianas-tropical-dry-forests/\
", "Marquesas tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/marquesas-tropical-moist-\
forests/", "Masai xeric grasslands and shrublands" -> 
   "https://www.oneearth.org/ecoregions/masai-xeric-grasslands-and-\
shrublands/", "Mascarene forests" -> 
   "https://www.oneearth.org/ecoregions/mascarene-forests/", 
   "Mato Grosso tropical dry forests" -> 
   "https://www.oneearth.org/ecoregions/mato-grosso-tropical-dry-\
forests/", 
   "Mediterranean Acacia-Argania dry woodlands and succulent \
thickets" -> 
   "https://www.oneearth.org/ecoregions/mediterranean-acacia-argania-\
dry-woodlands-and-succulent-thickets/", 
   "Mediterranean conifer and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/mediterranean-conifer-and-\
mixed-forests/", "Mediterranean dry woodlands and steppe" -> 
   "https://www.oneearth.org/ecoregions/mediterranean-dry-woodlands-\
and-steppe/", "Mediterranean High Atlas juniper steppe" -> 
   "https://www.oneearth.org/ecoregions/mediterranean-high-atlas-\
juniper-steppe/", "Mediterranean woodlands and forests" -> 
   "https://www.oneearth.org/ecoregions/mediterranean-woodlands-and-\
forests/", "Meghalaya subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/meghalaya-subtropical-forests/\
", "Mentawai Islands rain forests" -> 
   "https://www.oneearth.org/ecoregions/mentawai-islands-rainforests/\
", "Meseta Central matorral" -> 
   "https://www.oneearth.org/ecoregions/meseta-central-matorral/", 
   "Mesoamerican Gulf-Caribbean mangroves" -> 
   "https://www.oneearth.org/ecoregions/mesoamerican-gulf-caribbean-\
mangroves/", "Mesopotamian shrub desert" -> 
   "https://www.oneearth.org/ecoregions/mesopotamian-shrub-desert/", 
   "Mid-Canada Boreal Plains forests" -> 
   "https://www.oneearth.org/ecoregions/mid-canada-boreal-plains-\
forests/", "Canadian Middle Arctic Tundra" -> 
   "https://www.oneearth.org/ecoregions/canadian-middle-arctic-tundra/\
", "Mid-Atlantic US coastal savannas" -> 
   "https://www.oneearth.org/ecoregions/mid-atlantic-us-coastal-\
savannas/", "Midwest Canadian Shield forests" -> 
   "https://www.oneearth.org/ecoregions/midwest-canadian-shield-\
forests/", "Mindanao-Eastern Visayas rain forests" -> 
   "https://www.oneearth.org/ecoregions/mindanao-eastern-visayas-\
rainforests/", "Mindanao montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/mindanao-montane-rainforests/\
", "Mindoro rain forests" -> 
   "https://www.oneearth.org/ecoregions/mindoro-rainforests/", 
   "Miskito pine forests" -> 
   "https://www.oneearth.org/ecoregions/miskito-pine-forests/", 
   "Mississippi lowland forests" -> 
   "https://www.oneearth.org/ecoregions/mississippi-lowland-forests/",
    "Mitchell grass downs" -> 
   "https://www.oneearth.org/ecoregions/mitchell-grass-downs/", 
   "Mizoram-Manipur-Kachin rain forests" -> 
   "https://www.oneearth.org/ecoregions/mizoram-manipur-kachin-\
rainforests/", "Mojave desert" -> 
   "https://www.oneearth.org/ecoregions/mojave-desert/", 
   "Mongolian-Manchurian grassland" -> 
   "https://www.oneearth.org/ecoregions/mongolian-manchurian-\
grassland/", "Montane Fynbos and renosterveld" -> 
   "https://www.oneearth.org/ecoregions/montane-fynbos-and-\
renosterveld/", "Montezuma Oropendola" -> 
   "https://www.oneearth.org/ecoregions/montezuma-oropendola/", 
   "Monte Alegre várzea" -> 
   "https://www.oneearth.org/ecoregions/monte-alegre-varzea/", 
   "Montane Southwest Papuan rain forests" -> 
   "https://www.oneearth.org/ecoregions/montane-southwest-papuan-\
rainforests/", "Moroccan High Atlas Mediterranean juniper steppe" -> 
   "https://www.oneearth.org/ecoregions/moroccan-high-atlas-\
mediterranean-juniper-steppe/", "Mosquito Coast mangroves" -> 
   "https://www.oneearth.org/ecoregions/mosquito-coast-mangroves/", 
   "Mount Cameroon and Bioko montane forests" -> 
   "https://www.oneearth.org/ecoregions/mount-cameroon-and-bioko-\
montane-forests/", "Maputaland-Pondoland bushland and thickets" -> 
   "https://www.oneearth.org/ecoregions/maputaland-pondoland-bushland-\
and-thickets/", "Murray-Darling depression mallee" -> 
   "https://www.oneearth.org/ecoregions/murray-darling-depression-\
mallee/", "Muscat fog woodland and shrubland" -> 
   "https://www.oneearth.org/ecoregions/muscat-fog-woodland-and-\
shrubland/", "Myanmar coastal rain forests" -> 
   "https://www.oneearth.org/ecoregions/myanmar-coastal-rainforests/",
    "Northeast Siberian coastal tundra" -> 
   "https://www.oneearth.org/ecoregions/northeast-siberian-coastal-\
tundra/", "Nairobi flooded grasslands" -> 
   "https://www.oneearth.org/ecoregions/nairobi-flooded-grasslands/", 
   "Nama Karoo" -> "https://www.oneearth.org/ecoregions/nama-karoo/", 
   "Namib desert" -> 
   "https://www.oneearth.org/ecoregions/namib-desert/", 
   "Namibian savanna woodlands" -> 
   "https://www.oneearth.org/ecoregions/namibian-savanna-woodlands/", 
   "Napo moist forests" -> 
   "https://www.oneearth.org/ecoregions/napo-moist-forests/", 
   "Narmada Valley dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/narmada-valley-dry-deciduous-\
forests/", "Nassau Island tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/nassau-island-tropical-moist-\
forests/", "Natal cave springs" -> 
   "https://www.oneearth.org/ecoregions/natal-cave-springs/", 
   "Natural Region of the Venezuelan Andes" -> 
   "https://www.oneearth.org/ecoregions/natural-region-of-the-\
venezuelan-andes/", "Near East desert" -> 
   "https://www.oneearth.org/ecoregions/near-east-desert/", 
   "Negro-Branco moist forests" -> 
   "https://www.oneearth.org/ecoregions/negro-branco-moist-forests/", 
   "Nelson Coast temperate forests" -> 
   "https://www.oneearth.org/ecoregions/nelson-coast-temperate-\
forests/", "New Caledonian dry forests" -> 
   "https://www.oneearth.org/ecoregions/new-caledonian-dry-forests/", 
   "New Caledonian rain forests" -> 
   "https://www.oneearth.org/ecoregions/new-caledonian-rainforests/", 
   "New Britain-New Ireland lowland rain forests" -> 
   "https://www.oneearth.org/ecoregions/new-britain-new-ireland-\
lowland-rainforests/", "New Britain-New Ireland montane rain forests" -> \
"https://www.oneearth.org/ecoregions/new-britain-new-ireland-montane-\
rainforests/", "New England-Acadian forests" -> 
   "https://www.oneearth.org/ecoregions/new-england-acadian-forests/",
    "New Georgia rain forests" -> 
   "https://www.oneearth.org/ecoregions/new-georgia-rainforests/", 
   "New South Wales tropical rain forests" -> 
   "https://www.oneearth.org/ecoregions/new-south-wales-tropical-\
rainforests/", "Nicobar Islands rain forests" -> 
   "https://www.oneearth.org/ecoregions/nicobar-islands-rainforests/",
    "Nipigon taiga" -> 
   "https://www.oneearth.org/ecoregions/nipigon-taiga/", 
   "Niue tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/niue-tropical-moist-forests/",
    "Nivenia capitata" -> 
   "https://www.oneearth.org/ecoregions/nivenia-capitata/", 
   "Nordic montane birch forest and grasslands" -> 
   "https://www.oneearth.org/ecoregions/nordic-montane-birch-forest-\
and-grasslands/", "North Arab desert and shrublands" -> 
   "https://www.oneearth.org/ecoregions/north-arabian-desert-and-\
shrublands/", "North Arabian highland xeric woodlands" -> 
   "https://www.oneearth.org/ecoregions/north-arabian-highland-xeric-\
woodlands/", "North Atlantic humid mixed forests" -> 
   "https://www.oneearth.org/ecoregions/north-atlantic-humid-mixed-\
forests/", "North Cascades conifer forests" -> 
   "https://www.oneearth.org/ecoregions/north-cascades-conifer-\
forests/", "North Central Indochina moist forests" -> 
   "https://www.oneearth.org/ecoregions/north-central-indochina-\
moist-forests/", "North Central Rockies forests" -> 
   "https://www.oneearth.org/ecoregions/north-central-rockies-\
forests/", "North Congolian forest-savanna" -> 
   "https://www.oneearth.org/ecoregions/north-congolian-forest-\
savanna/", "North Indochina subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/north-indochina-subtropical-\
forests/", "North Triangle moist forests" -> 
   "https://www.oneearth.org/ecoregions/north-triangle-moist-\
forests/", "North Triangle subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/north-triangle-subtropical-\
forests/", "Northeast Australian tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/northeast-australian-\
tropical-savanna/", "Northeast China Plain acacia savanna" -> 
   "https://www.oneearth.org/ecoregions/northeast-china-plain-\
acacia-savanna/", "Northeast Congo lowland forests" -> 
   "https://www.oneearth.org/ecoregions/northeast-congo-lowland-\
forests/", "Northeast India-Myanmar pine forests" -> 
   "https://www.oneearth.org/ecoregions/northeast-india-myanmar-pine-\
forests/", "Northeastern Brazil restingas" -> 
   "https://www.oneearth.org/ecoregions/northeastern-brazil-\
restingas/", "Northeastern coastal forests" -> 
   "https://www.oneearth.org/ecoregions/northeastern-coastal-forests/\
", "Northeastern Congolian lowland forests" -> 
   "https://www.oneearth.org/ecoregions/northeastern-congolian-\
lowland-forests/", "Northern Acacia-Commiphora bushlands and thickets" -> \
"https://www.oneearth.org/ecoregions/northern-acacia-commiphora-\
bushlands-and-thickets/", "Northern Annamites rain forests" -> 
   "https://www.oneearth.org/ecoregions/northern-annamites-\
rainforests/", "Northern Australian tropical savanna" -> 
   "https://www.oneearth.org/ecoregions/northern-australian-tropical-\
savanna/", "Northern California coastal forests" -> 
   "https://www.oneearth.org/ecoregions/northern-california-coastal-\
forests/", "Northern Canadian Shield taiga" -> 
   "https://www.oneearth.org/ecoregions/northern-canadian-shield-\
taiga/", "Northern Cordillera forest steppe" -> 
   "https://www.oneearth.org/ecoregions/northern-cordillera-forest-\
steppe/", "Northern Great Plains tallgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/northern-great-plains-\
tallgrass-prairie/", "Northern Indochina subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/northern-indochina-\
subtropical-forests/", "Northern Kanso-Gansu Plateau mixed forests" -> 
   "https://www.oneearth.org/ecoregions/northern-kanso-gansu-plateau-\
mixed-forests/", "Northern Korat Plateau moist forests" -> 
   "https://www.oneearth.org/ecoregions/northern-korat-plateau-moist-\
forests/", "Northern New Guinea lowland rain and freshwater swamp \
forests" -> 
   "https://www.oneearth.org/ecoregions/northern-new-guinea-lowland-\
rain-and-freshwater-swamp-forests/", 
   "Northern New Guinea montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/northern-new-guinea-montane-\
rainforests/", "Northern Pacific coastal forests" -> 
   "https://www.oneearth.org/ecoregions/northern-pacific-coastal-\
forests/", "Northern Shortgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/northern-shortgrass-prairie/\
", "Northern Swampa" -> 
   "https://www.oneearth.org/ecoregions/northern-swampa/", 
   "Northern Tallgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/northern-tallgrass-prairie/", 
   "Northern Triangle moist forests" -> 
   "https://www.oneearth.org/ecoregions/northern-triangle-moist-\
forests/", "Northern Triangle subtropical forests" -> 
   "https://www.oneearth.org/ecoregions/northern-triangle-subtropical-\
forests/", "Northern Vietnam lowland rain forests" -> 
   "https://www.oneearth.org/ecoregions/northern-vietnam-lowland-\
rainforests/", "Northwest Hawaii tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/northwest-hawaii-tropical-\
moist-forests/", "Northwest Iberian montane forests" -> 
   "https://www.oneearth.org/ecoregions/northwest-iberian-montane-\
forests/", "Northwestern Andean montane forests" -> 
   "https://www.oneearth.org/ecoregions/northwestern-andean-montane-\
forests/", "Northwestern Congolian lowland forests" -> 
   "https://www.oneearth.org/ecoregions/northwestern-congolian-\
lowland-forests/", "Northwestern Hawaiian Islands xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/northwestern-hawaiian-\
islands-xeric-scrub/", "Northwestern Himalayan alpine shrub and \
meadows" -> 
   "https://www.oneearth.org/ecoregions/northwestern-himalayan-\
alpine-shrub-and-meadows/", 
   "Northwestern Himalayan broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/northwestern-himalayan-\
broadleaf-forests/", "Northwestern Oregon Coast Range forests" -> 
   "https://www.oneearth.org/ecoregions/northwestern-oregon-coast-\
range-forests/", "Northwestern Thorn Scrub" -> 
   "https://www.oneearth.org/ecoregions/northwestern-thorn-scrub/", 
   "Nubo-Sindian tropical desert and semi-desert" -> 
   "https://www.oneearth.org/ecoregions/nubo-sindian-tropical-desert-\
and-semi-desert/", "Nullarbor Plain xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/nullarbor-plain-xeric-scrub/\
", "Nunavut coastal tundra" -> 
   "https://www.oneearth.org/ecoregions/nunavut-coastal-tundra/", 
   "Oahu tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/oahu-tropical-moist-forests/",
    "Oaxaca Valley dry forests" -> 
   "https://www.oneearth.org/ecoregions/oaxaca-valley-dry-forests/", 
   "Oaxacan montane forests" -> 
   "https://www.oneearth.org/ecoregions/oaxacan-montane-forests/", 
   "Ogallala grassland" -> 
   "https://www.oneearth.org/ecoregions/ogallala-grassland/", 
   "Ogaden bushlands and thickets" -> 
   "https://www.oneearth.org/ecoregions/ogaden-bushlands-and-\
thickets/", "Okhotsk-Manchurian taiga" -> 
   "https://www.oneearth.org/ecoregions/okhotsk-manchurian-taiga/", 
   "Oman desert and semi-desert" -> 
   "https://www.oneearth.org/ecoregions/oman-desert-and-semi-desert/",
    "Ordos Plateau steppe" -> 
   "https://www.oneearth.org/ecoregions/ordos-plateau-steppe/", 
   "Oregon Coulee" -> 
   "https://www.oneearth.org/ecoregions/oregon-coulee/", 
   "Orinoco Delta swamp forests" -> 
   "https://www.oneearth.org/ecoregions/orinoco-delta-swamp-forests/",
    "Orinoco wetlands" -> 
   "https://www.oneearth.org/ecoregions/orinoco-wetlands/", 
   "Orissa semi-evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/orissa-semi-evergreen-\
forests/", "Overberg renosterveld" -> 
   "https://www.oneearth.org/ecoregions/overberg-renosterveld/", 
   "Palawan tropical rain forests" -> 
   "https://www.oneearth.org/ecoregions/palawan-tropical-rainforests/\
", "Palearctic desert" -> 
   "https://www.oneearth.org/ecoregions/palearctic-desert/", 
   "Palouse prairie" -> 
   "https://www.oneearth.org/ecoregions/palouse-prairie/", 
   "Pamir alpine desert and tundra" -> 
   "https://www.oneearth.org/ecoregions/pamir-alpine-desert-and-\
tundra/", "Pampa" -> "https://www.oneearth.org/ecoregions/pampa/", 
   "Panamanian dry forests" -> 
   "https://www.oneearth.org/ecoregions/panamanian-dry-forests/", 
   "Pantanal" -> "https://www.oneearth.org/ecoregions/pantanal/", 
   "Pantelleria Mediterranean forests" -> 
   "https://www.oneearth.org/ecoregions/pantelleria-mediterranean-\
forests/", "Pindus Mountains mixed forests" -> 
   "https://www.oneearth.org/ecoregions/pindus-mountains-mixed-\
forests/", "Paramaribo swamp forests" -> 
   "https://www.oneearth.org/ecoregions/paramaribo-swamp-forests/", 
   "Paraná flooded savanna" -> 
   "https://www.oneearth.org/ecoregions/parana-flooded-savanna/", 
   "Paraguaná xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/paraguana-xeric-scrub/", 
   "Paraúna moist forests" -> 
   "https://www.oneearth.org/ecoregions/parauna-moist-forests/", 
   "Patagonian steppe" -> 
   "https://www.oneearth.org/ecoregions/patagonian-steppe/", 
   "Península de Paraguaná dry forests" -> 
   "https://www.oneearth.org/ecoregions/peninsula-de-paraguana-dry-\
forests/", "Pernambuco coastal forests" -> 
   "https://www.oneearth.org/ecoregions/pernambuco-coastal-forests/", 
   "Pernambuco interior forests" -> 
   "https://www.oneearth.org/ecoregions/pernambuco-interior-forests/",
    "Peruvian Yungas" -> 
   "https://www.oneearth.org/ecoregions/peruvian-yungas/", 
   "Petén-Veracruz moist forests" -> 
   "https://www.oneearth.org/ecoregions/peten-veracruz-moist-forests/\
", "Phoenix Islands tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/phoenix-islands-tropical-\
moist-forests/", "Pilbara shrublands" -> 
   "https://www.oneearth.org/ecoregions/pilbara-shrublands/", 
   "Pindus Mountains broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/pindus-mountains-broadleaf-\
forests/", "Pohang deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/pohang-deciduous-forests/", 
   "Poitevin Marsh" -> 
   "https://www.oneearth.org/ecoregions/poitevin-marsh/", 
   "Polynesian tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/polynesian-tropical-moist-\
forests/", "Pontic steppe" -> 
   "https://www.oneearth.org/ecoregions/pontic-steppe/", 
   "Pothohar Plateau semi-desert" -> 
   "https://www.oneearth.org/ecoregions/pothohar-plateau-semi-desert/\
", "Pudacuo National Park" -> 
   "https://www.oneearth.org/ecoregions/pudacuo-national-park/", 
   "Puerto Rican dry forests" -> 
   "https://www.oneearth.org/ecoregions/puerto-rican-dry-forests/", 
   "Puerto Rican moist forests" -> 
   "https://www.oneearth.org/ecoregions/puerto-rican-moist-forests/", 
   "Puget lowland forests" -> 
   "https://www.oneearth.org/ecoregions/puget-lowland-forests/", 
   "Purus-Madeira moist forests" -> 
   "https://www.oneearth.org/ecoregions/purus-madeira-moist-forests/",
    "Purus várzea" -> 
   "https://www.oneearth.org/ecoregions/purus-varzea/", 
   "Pyrenees conifer and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/pyrenees-conifer-and-mixed-\
forests/", "Qaidam Basin semi-desert" -> 
   "https://www.oneearth.org/ecoregions/qaidam-basin-semi-desert/", 
   "Qilian Mountains conifer forests" -> 
   "https://www.oneearth.org/ecoregions/qilian-mountains-conifer-\
forests/", "Qin Ling Mountains deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/qin-ling-mountains-deciduous-\
forests/", "Qionglai-Minshan conifer forests" -> 
   "https://www.oneearth.org/ecoregions/qionglai-minshan-conifer-\
forests/", "Rapa Nui subtropical broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/rapa-nui-subtropical-\
broadleaf-forests/", "Red Sea coastal desert" -> 
   "https://www.oneearth.org/ecoregions/red-sea-coastal-desert/", 
   "Red Sea-Dead Sea depression" -> 
   "https://www.oneearth.org/ecoregions/red-sea-dead-sea-depression/",
    "Red Sea Nubo-Sindian tropical desert and semi-desert" -> 
   "https://www.oneearth.org/ecoregions/red-sea-nubo-sindian-tropical-\
desert-and-semi-desert/", "Riau Pocket freshwater swamp forests" -> 
   "https://www.oneearth.org/ecoregions/riau-pocket-freshwater-swamp-\
forests/", "Rodrigues forests" -> 
   "https://www.oneearth.org/ecoregions/rodrigues-forests/", 
   "Roraima moist forests" -> 
   "https://www.oneearth.org/ecoregions/roraima-moist-forests/", 
   "Samoan tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/samoan-tropical-moist-\
forests/", "Sandaun rain forests" -> 
   "https://www.oneearth.org/ecoregions/sandaun-rainforests/", 
   "San Lucan xeric scrub" -> 
   "https://www.oneearth.org/ecoregions/san-lucan-xeric-scrub/", 
   "Santa Marta montane forests" -> 
   "https://www.oneearth.org/ecoregions/santa-marta-montane-forests/",
    "Sayan Alpine Meadow and tundra" -> 
   "https://www.oneearth.org/ecoregions/sayan-alpine-meadow-and-\
tundra/", "Sayan montane conifer forests" -> 
   "https://www.oneearth.org/ecoregions/sayan-montane-conifer-\
forests/", "Sayan Intermontane steppe" -> 
   "https://www.oneearth.org/ecoregions/sayan-intermontane-steppe/", 
   "Scandinavian Coastal Conifer Forests" -> 
   "https://www.oneearth.org/ecoregions/scandinavian-coastal-conifer-\
forests/", "Scandinavian and Russian taiga" -> 
   "https://www.oneearth.org/ecoregions/scandinavian-and-russian-\
taiga/", "Scottish Highlands conifer forests" -> 
   "https://www.oneearth.org/ecoregions/scottish-highlands-conifer-\
forests/", "Seram rain forests" -> 
   "https://www.oneearth.org/ecoregions/seram-rainforests/", 
   "Sierra de la Laguna dry forests" -> 
   "https://www.oneearth.org/ecoregions/sierra-de-la-laguna-dry-\
forests/", "Sierra Madre de Oaxaca pine-oak forests" -> 
   "https://www.oneearth.org/ecoregions/sierra-madre-de-oaxaca-pine-\
oak-forests/", "Sierra Madre del Sur pine-oak forests" -> 
   "https://www.oneearth.org/ecoregions/sierra-madre-del-sur-pine-\
oak-forests/", "Sierra Nevada forests" -> 
   "https://www.oneearth.org/ecoregions/sierra-nevada-forests/", 
   "Socotra Island xeric shrublands" -> 
   "https://www.oneearth.org/ecoregions/socotra-island-xeric-\
shrublands/", "Solomon Islands rain forests" -> 
   "https://www.oneearth.org/ecoregions/solomon-islands-rainforests/",
    "Sonoran desert" -> 
   "https://www.oneearth.org/ecoregions/sonoran-desert/", 
   "South African bushveld" -> 
   "https://www.oneearth.org/ecoregions/south-african-bushveld/", 
   "South American Pacific coastal desert" -> 
   "https://www.oneearth.org/ecoregions/south-american-pacific-\
coastal-desert/", "South China Sea Islands rain forests" -> 
   "https://www.oneearth.org/ecoregions/south-china-sea-islands-\
rainforests/", "South China-Vietnam subtropical evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/south-china-vietnam-\
subtropical-evergreen-forests/", 
   "South Deccan Plateau dry deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/south-deccan-plateau-dry-\
deciduous-forests/", "South European Forest Steppe" -> 
   "https://www.oneearth.org/ecoregions/south-european-forest-steppe/\
", "South Iran Nubo-Sindian desert and semi-desert" -> 
   "https://www.oneearth.org/ecoregions/south-iran-nubo-sindian-\
desert-and-semi-desert/", "South Siberian forest steppe" -> 
   "https://www.oneearth.org/ecoregions/south-siberian-forest-steppe/\
", "Southeast Asian mangroves" -> 
   "https://www.oneearth.org/ecoregions/southeast-asian-mangroves/", 
   "Southeast Indochina dry evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/southeast-indochina-dry-\
evergreen-forests/", "Southeast US Conifer Savannas" -> 
   "https://www.oneearth.org/ecoregions/southeast-us-conifer-\
savannas/", "Southeast US Hardwood Forests" -> 
   "https://www.oneearth.org/ecoregions/southeast-us-hardwood-\
forests/", "Southeastern Iberian shrubs and woodlands" -> 
   "https://www.oneearth.org/ecoregions/southeastern-iberian-shrubs-\
and-woodlands/", "Southern Anatolian conifer and deciduous forests" -> \
"https://www.oneearth.org/ecoregions/southern-anatolian-conifer-and-\
deciduous-forests/", "Southern Andean steppe" -> 
   "https://www.oneearth.org/ecoregions/southern-andean-steppe/", 
   "Southern Atlantic mangroves" -> 
   "https://www.oneearth.org/ecoregions/southern-atlantic-mangroves/\
", "Southern Cone mesic grasslands" -> 
   "https://www.oneearth.org/ecoregions/southern-cone-mesic-\
grasslands/", "Southern Great Lakes forests" -> 
   "https://www.oneearth.org/ecoregions/southern-great-lakes-forests/\
", "Southern Hudson Bay taiga" -> 
   "https://www.oneearth.org/ecoregions/southern-hudson-bay-taiga/", 
   "Southern Indian Ocean Islands tundra" -> 
   "https://www.oneearth.org/ecoregions/southern-indian-ocean-\
islands-tundra/", "Southern Rift montane forest-grassland" -> 
   "https://www.oneearth.org/ecoregions/southern-rift-montane-forest-\
grassland/", "Southwestern Amazon moist forests" -> 
   "https://www.oneearth.org/ecoregions/southwestern-amazon-moist-\
forests/", "Southwestern Australian savannas" -> 
   "https://www.oneearth.org/ecoregions/southwestern-australian-\
savannas/", "Southwestern Australian woodlands" -> 
   "https://www.oneearth.org/ecoregions/southwestern-australian-\
woodlands/", "Sunda Shelf mangroves" -> 
   "https://www.oneearth.org/ecoregions/sunda-shelf-mangroves/", 
   "Sundarbans freshwater swamp forests" -> 
   "https://www.oneearth.org/ecoregions/sundarbans-freshwater-swamp-\
forests/", "Sundarbans mangroves" -> 
   "https://www.oneearth.org/ecoregions/sundarbans-mangroves/", 
   "Superior highlands forests" -> 
   "https://www.oneearth.org/ecoregions/superior-highlands-forests/", 
   "Taiwan subtropical evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/taiwan-subtropical-evergreen-\
forests/", "Taklimakan desert" -> 
   "https://www.oneearth.org/ecoregions/taklimakan-desert/", 
   "Talamancan montane forests" -> 
   "https://www.oneearth.org/ecoregions/talamancan-montane-forests/", 
   "Tarim Basin deciduous forests and steppe" -> 
   "https://www.oneearth.org/ecoregions/tarim-basin-deciduous-\
forests-and-steppe/", "Tasmanian Central Highlands forests" -> 
   "https://www.oneearth.org/ecoregions/tasmanian-central-highlands-\
forests/", "Tasmanian temperate forests" -> 
   "https://www.oneearth.org/ecoregions/tasmanian-temperate-forests/",
    "Tasmanian temperate rain forests" -> 
   "https://www.oneearth.org/ecoregions/tasmanian-temperate-\
rainforests/", "Taimyr-Central Siberian tundra" -> 
   "https://www.oneearth.org/ecoregions/taimyr-central-siberian-\
tundra/", "Tian Shan montane steppe and meadows" -> 
   "https://www.oneearth.org/ecoregions/tian-shan-montane-steppe-and-\
meadows/", "Tibetan Plateau alpine shrublands and meadows" -> 
   "https://www.oneearth.org/ecoregions/tibetan-plateau-alpine-\
shrublands-and-meadows/", "Tigris-Euphrates alluvial salt marsh" -> 
   "https://www.oneearth.org/ecoregions/tigris-euphrates-alluvial-\
salt-marsh/", "Timor and Wetar deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/timor-and-wetar-deciduous-\
forests/", "Toledo Intermontane dry forests" -> 
   "https://www.oneearth.org/ecoregions/toledo-intermontane-dry-\
forests/", "Tonga tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/tonga-tropical-moist-forests/\
", "Trans-Baikal conifer forests" -> 
   "https://www.oneearth.org/ecoregions/trans-baikal-conifer-forests/\
", "Trindade-Martin Vaz Islands tropical forests" -> 
   "https://www.oneearth.org/ecoregions/trindade-martin-vaz-islands-\
tropical-forests/", "Tristan da Cunha-Gough Islands shrub and \
grasslands" -> 
   "https://www.oneearth.org/ecoregions/tristan-da-cunha-gough-\
islands-shrub-and-grasslands/", "Tubuai tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/tubuai-tropical-moist-\
forests/", "Tuamotu tropical moist forests" -> 
   "https://www.oneearth.org/ecoregions/tuamotu-tropical-moist-\
forests/", "Tumbes-Piura dry forests" -> 
   "https://www.oneearth.org/ecoregions/tumbes-piura-dry-forests/", 
   "Tyrrhenian-Adriatic sclerophyllous and mixed forests" -> 
   "https://www.oneearth.org/ecoregions/tyrrhenian-adriatic-\
sclerophyllous-and-mixed-forests/", "Ural montane tundra and taiga" -> 
   "https://www.oneearth.org/ecoregions/ural-montane-tundra-and-\
taiga/", "Uruguayan savanna" -> 
   "https://www.oneearth.org/ecoregions/uruguayan-savanna/", 
   "Usumacinta moist forests" -> 
   "https://www.oneearth.org/ecoregions/usumacinta-moist-forests/", 
   "Valdivian temperate forests" -> 
   "https://www.oneearth.org/ecoregions/valdivian-temperate-forests/",
    "Vanuatu rain forests" -> 
   "https://www.oneearth.org/ecoregions/vanuatu-rainforests/", 
   "Venezuelan Andes montane forests" -> 
   "https://www.oneearth.org/ecoregions/venezuelan-andes-montane-\
forests/", "Veracruz dry forests" -> 
   "https://www.oneearth.org/ecoregions/veracruz-dry-forests/", 
   "Veracruz moist forests" -> 
   "https://www.oneearth.org/ecoregions/veracruz-moist-forests/", 
   "Veracruz montane forests" -> 
   "https://www.oneearth.org/ecoregions/veracruz-montane-forests/", 
   "Victoria Basin forest-savanna" -> 
   "https://www.oneearth.org/ecoregions/victoria-basin-forest-\
savanna/", "Volcanos of Kamchatka" -> 
   "https://www.oneearth.org/ecoregions/volcanos-of-kamchatka/", 
   "Võro" -> "https://www.oneearth.org/ecoregions/voro/", 
   "Wasatch and Uinta montane forests" -> 
   "https://www.oneearth.org/ecoregions/wasatch-and-uinta-montane-\
forests/", "West African mangroves" -> 
   "https://www.oneearth.org/ecoregions/west-african-mangroves/", 
   "West Saharan montane xeric woodlands" -> 
   "https://www.oneearth.org/ecoregions/west-saharan-montane-xeric-\
woodlands/", "Western Australian mulga shrublands" -> 
   "https://www.oneearth.org/ecoregions/western-australian-mulga-\
shrublands/", "Western Congolian forest-savanna" -> 
   "https://www.oneearth.org/ecoregions/western-congolian-forest-\
savanna/", "Western Congolian swamp forests" -> 
   "https://www.oneearth.org/ecoregions/western-congolian-swamp-\
forests/", "Western European broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/western-european-broadleaf-\
forests/", "Western Ghats moist deciduous forests" -> 
   "https://www.oneearth.org/ecoregions/western-ghats-moist-\
deciduous-forests/", "Western Ghats montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/western-ghats-montane-\
rainforests/", "Western Great Lakes forests" -> 
   "https://www.oneearth.org/ecoregions/western-great-lakes-forests/",
    "Western Himalayan alpine shrub and meadows" -> 
   "https://www.oneearth.org/ecoregions/western-himalayan-alpine-\
shrub-and-meadows/", "Western Himalayan broadleaf forests" -> 
   "https://www.oneearth.org/ecoregions/western-himalayan-broadleaf-\
forests/", "Western Himalayan subalpine conifer forests" -> 
   "https://www.oneearth.org/ecoregions/western-himalayan-subalpine-\
conifer-forests/", "Western Java montane rain forests" -> 
   "https://www.oneearth.org/ecoregions/western-java-montane-\
rainforests/", "Western Java rain forests" -> 
   "https://www.oneearth.org/ecoregions/western-java-rainforests/", 
   "Western Shortgrass prairie" -> 
   "https://www.oneearth.org/ecoregions/western-shortgrass-prairie/", 
   "Western Siberian hemiboreal forests" -> 
   "https://www.oneearth.org/ecoregions/western-siberian-hemiboreal-\
forests/", "Western Siberian taiga" -> 
   "https://www.oneearth.org/ecoregions/western-siberian-taiga/", 
   "Windward Islands moist forests" -> 
   "https://www.oneearth.org/ecoregions/windward-islands-moist-\
forests/", "Wrangel Island Arctic desert" -> 
   "https://www.oneearth.org/ecoregions/wrangel-island-arctic-\
desert/", "Xingu-Tocantins-Araguaia moist forests" -> 
   "https://www.oneearth.org/ecoregions/xingu-tocantins-araguaia-\
moist-forests/", "Yarlung Zangbo arid steppe" -> 
   "https://www.oneearth.org/ecoregions/yarlung-zangbo-arid-steppe/", 
   "Yucatán dry forests" -> 
   "https://www.oneearth.org/ecoregions/yucatan-dry-forests/", 
   "Yucatán moist forests" -> 
   "https://www.oneearth.org/ecoregions/yucatan-moist-forests/", 
   "Yucatán mangroves" -> 
   "https://www.oneearth.org/ecoregions/yucatan-mangroves/", 
   "Yunnan Plateau subtropical evergreen forests" -> 
   "https://www.oneearth.org/ecoregions/yunnan-plateau-subtropical-\
evergreen-forests/", "Zambezian baikiaea woodlands" -> 
   "https://www.oneearth.org/ecoregions/zambezian-baikiaea-woodlands/\
", "Zambezian mopane woodlands" -> 
   "https://www.oneearth.org/ecoregions/zambezian-mopane-woodlands/", 
   "Zambezian coastal flooded savanna" -> 
   "https://www.oneearth.org/ecoregions/zambezian-coastal-flooded-\
savanna/", "Zambezian flooded grasslands" -> 
   "https://www.oneearth.org/ecoregions/zambezian-flooded-grasslands/\
", "Zambezian-Limpopo mixed woodlands" -> 
   "https://www.oneearth.org/ecoregions/zambezian-limpopo-mixed-\
woodlands/", "Zagros Mountains forest steppe" -> 
   "https://www.oneearth.org/ecoregions/zagros-mountains-forest-\
steppe/", "Zanzibar-Inhambane coastal forest mosaic" -> 
   "https://www.oneearth.org/ecoregions/zanzibar-inhambane-coastal-\
forest-mosaic/", "Zapata swamp" -> 
   "https://www.oneearth.org/ecoregions/zapata-swamp/"|>, "847 rules"];
```

*Wrangle the data to produce a nice tabular dataset:*

```wl
ecoregionsTab = Tabular[Join[
      (*LabeledData columns:*)## & @@ 
       KeyValueMap[Dataset[Map[Association, Thread[#1 -> #2]]] &, 
        Association[freshwaterEcoregionsShapefileData["LabeledData"]]],
      (*Geometry column:*)
      Dataset[Map[<|"Geometry" -> #|> &, 
        freshwaterEcoregionsShapefileData["Geometry"]]], 2]] //
    (*Clean up the data and create new columns:*)
    TransformColumns[#, {
       (*Interpret color data:*)
       "COLOR" -> (RGBColor[#"COLOR"] &), 
       "COLOR_BIO" -> (RGBColor[#"COLOR_BIO"] &), 
       "COLOR_NNH" -> (RGBColor[#"COLOR_NNH"] &),
       (*Ecoregion OneEarth page column:*)
       "OneEarthPage" -> 
        Function[
         If[KeyMemberQ[ecoregionPages, #"ECO_NAME"], 
          ecoregionPages[#"ECO_NAME"], Missing["Not available"]]],
       (*GeoBounds regions column:*)
       "GeoBoundsRegion" -> 
        Function[
         GeoBoundsRegion[
          GeoBounds[#Geometry]]]}] & //(*Update column names:*)
   RenameColumns[#, {"ObjectID", "EcoregionName", "BiomeNumber", 
      "BiomeName", "Realm", "EcoBiome", "ProtectionStatusID", 
      "EcoregionID", "ShapeLength", "ShapeArea", "ProtectionStatus", 
      "EcoregionColor", "BiomeColor", "ProtectionStatusColor", 
      "License"}] &;
```

To avoid having to recompute this, I’ll save it to a parquet file and reload the data:

*Define the save path :*

```wl
ecoregionsTabPath = 
  FileNameJoin[{NotebookDirectory[], "2017 Ecoregions", 
    "ecoregions2017.parquet"}];
```

*Save the dataset :*

```wl
Export[ecoregionsTabPath, ecoregionsTab];
```

*Load the data from the file, casting ID columns as machine integers:*

```wl
ecoregionsTab = 
 CastColumns[
  Import[ecoregionsTabPath], {"ObjectID" -> "MachineInteger", 
   "BiomeNumber" -> "MachineInteger", 
   "ProtectionStatusID" -> "MachineInteger", 
   "EcoregionID" -> "MachineInteger"}]
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/ecoregionsTab.png =1788x595)

*Inspect the structure of the dataset:*

```wl
TabularStructure[ecoregionsTab]
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
ecoregionsTab // 
    Select[#, 
      Function[#"EcoregionName" == 
        "Irrawaddy moist deciduous forests"]] & // 
   First[Normal[Dataset[#][All, "Geometry"]]] & // 
  GeoGraphics // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0cg3z0mxchqmk.png =438x840)

In case you’re unfamiliar with the notation, “//“ (called [PostFix](https://reference.wolfram.com/language/ref/Postfix)) can be read as “and then”, and is one of the ways one can chain together function calls in Wolfram Language. For new WL users coming form scientific backgrounds, this is quite similar to pipes in Python and R.

We may also like to plot several ecoregion footprints. This time, let’s assume we’re matching to a list of ecoregion IDs.

*Extract and plot ecoregion geometry from rows where the “EcoregionID” column matches one of the IDs in the provided list:*

```wl
ecoregionsTab // 
    Select[#, 
      Function[MemberQ[{649, 695, 812, 815}, #"EcoregionID"]]] & // 
   Normal[Dataset[#][All,
      (*Extract geometry and ecoregion colors, 
      and add tooltips to the footprints:*){#EcoregionColor, 
        Tooltip[#Geometry, #EcoregionName]} &]] & // Legended[
    (*Plot the map:*)GeoGraphics[{GeoStyling[Opacity[.6]], #}],
    (*Construct the legend:*)
    SwatchLegend[## & @@ {#1, #2[[All, 2]]} & @@ 
      Transpose[#]]] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/08u4lj1xmvw3p.png =1112x840)

Note that in order to share this article online, I’ve had to rasterize these plots, which disables the tooltips. To enable the tooltips in this notebook, simply download it and delete calls to [Rasterize](https://reference.wolfram.com/language/ref/Rasterize).

To make a world map of terrestrial ecoregions, we simply include all ecoregions in the plot.

*Make a world Ecoregions map:*

```wl
Rasterize[
 GeoGraphics[{GeoStyling[Opacity[1]], 
   Values[Normal[
     Dataset[ConstructColumns[
       ecoregionsTab, {"EcoregionColor", "Geometry"}]]]]}, 
  GeoProjection -> "Mercator", GeoBackground -> White], 
 ImageSize -> Full]
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0h58k9z8lkdxs.png =1359x1359)

<h4 id="grouping-and-plotting-ecoregions-programmatically">Grouping and plotting ecoregions programmatically</h4>

You’re likely to want to select many ecoregions at a time according to logical or mathematical criteria. Here are a few examples to get you started:

*Find and plot the 3 largest ecoregions:*

```wl
Take[ReverseSortBy[ecoregionsTab, #"ShapeArea" &], {2, 4}] // 
  ConstructColumns[#, {"EcoregionName", "Geometry"}] & // 
 MapApply[GeoGraphics[#2, PlotLabel -> #1] &, FromTabular[#, "Matrix"]] 
  &
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0jqvkdooppmyi.png =1137x288)

*Find and plot all ecoregions within a particular biome:*

```wl
Select[ecoregionsTab, 
    Function[#BiomeName == "Deserts & Xeric Shrublands"]] // 
   Normal[Dataset[#][All,
      (*Extract geometry and ecoregion colors, 
      and add tooltips to the footprints:*){#EcoregionColor, 
        Tooltip[#Geometry, #EcoregionName]} &]] & // 
  GeoGraphics[{GeoStyling[Opacity[.6]], #}, 
    ImageSize -> Large] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0jw1vmd4pjcrj.png =1152x576)

*Find and plot all ecoregions within a particular realm:*

```wl
Select[ecoregionsTab, Function[#Realm == "Indomalayan"]] // 
   Normal[Dataset[#][All,
      (*Extract geometry and ecoregion colors, 
      and add tooltips to the footprints:*){#EcoregionColor, 
        Tooltip[#Geometry, #EcoregionName]} &]] & // 
  GeoGraphics[{GeoStyling[Opacity[.6]], #}, 
    ImageSize -> Large] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/19q26rrj2pve0.png =1152x673)

*Find and plot all ecoregions whose names contain the word “forest”:*

```wl
Select[ecoregionsTab, 
    Function[
     StringContainsQ[ToLowerCase[#EcoregionName], "forest"]]] // 
   Normal[Dataset[#][All,
      (*Extract geometry and ecoregion colors, 
      and add tooltips to the footprints:*){#EcoregionColor, 
        Tooltip[#Geometry, #EcoregionName]} &]] & // 
  GeoGraphics[{GeoStyling[Opacity[.6]], #}, ImageSize -> Large, 
    GeoCenter -> {0, 0}] & // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/1jt8yiqx0ov1y.png =1152x576)

*Plot protection status of neotropic tropical and subtropical moist broadleaf forests:*

```wl
Legended[
  GeoGraphics[{GeoStyling[Opacity[.6]], 
    Normal[Values[
      Dataset[ConstructColumns[
        Select[ecoregionsTab, 
         Function[#"Realm" === "Neotropic" && #"BiomeName" === 
            "Tropical & Subtropical Moist Broadleaf Forests"]], \
{"ProtectionStatusColor", "Geometry"}]]]]}], 
  SwatchLegend[{RGBColor[0.1450980392156863, 0.45098039215686275, 0.2235294117647059], RGBColor[0.4823529411764706, 0.7568627450980392, 0.2549019607843137], RGBColor[0.9333333333333333, 0.11764705882352941, 0.13725490196078433], RGBColor[0.9764705882352941, 0.6627450980392157, 0.10588235294117647], RGBColor[0.8862745098039215, 0.8862745098039215, 0.8784313725490196]}, {"Half Protected", "Nature Could Reach Half Protected", "Nature Imperiled", "Nature Could Recover", "N/A"}]] // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0jl3eszfxz97s.png =1307x738)

<h4 id="bonus-ecoregion2017-geoservers">*Bonus: Ecoregion2017 GeoServers*</h4>

For larger maps, assuming you’d like to include every ecoregion in your map’s geographic range, you may elect to connect to one of the Ecoregions2017 GeoServer services for your plotting. This is generally faster.

*Construct a dataset of Ecoregions2017 GeoServers:*

```wl
ecoGeoServers = 
  AssociationThread[{"Ecoregions2017", "MajorBiomes", 
    "EcoregionProtectionStatus"}, Iconize[{{
    "https://storage.googleapis.com/teow2016/Ecoregions2017ee/`1`/`2`/\
`3`.png", "Projection" -> "Mercator"}, {
    "https://storage.googleapis.com/teow2016/Ecoregions2017ee_Biome/`\
1`/`2`/`3`.png", "Projection" -> "Mercator"}, {
    "https://storage.googleapis.com/teow2016/Ecoregions2017ee_NNH/`1`/\
`2`/`3`.png", "Projection" -> "Mercator"}}, "List"]];
Dataset[ecoGeoServers]
```

*Create world maps for each GeoServer:*

```wl
Dataset[GeoGraphics["World", GeoServer -> #, GeoZoomLevel -> 1] & /@ 
  ecoGeoServers]
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/1jgp7saxb9n8n.png =1399x1360)

*Define the Legends for each map type:*

```wl
ecoGeoServerLegends = 
 Dataset[Iconize[<|"FreshwaterEcoregions2017" -> SwatchLegend[{RGBColor[0.38823529411764707`, 0.8117647058823529, 0.6705882352941176], RGBColor[0.4392156862745098, 0.6588235294117647, 0.], RGBColor[1., 0.4980392156862745, 0.48627450980392156`], RGBColor[0.9803921568627451, 0.4666666666666667, 0.30196078431372547`], RGBColor[0.2980392156862745, 0.5098039215686274, 0.7137254901960784], RGBColor[0.792156862745098, 0.4, 0.20392156862745098`], RGBColor[0.9882352941176471, 0.6509803921568628, 0.45098039215686275`], RGBColor[0.9882352941176471, 0.9254901960784314, 0.20784313725490197`], RGBColor[0.9764705882352941, 0.6705882352941176, 0.34509803921568627`], RGBColor[0.3803921568627451, 0.8235294117647058, 0.9490196078431372], RGBColor[0.8862745098039215, 0.7803921568627451, 0.9803921568627451], RGBColor[1., 0.4980392156862745, 0.49411764705882355`], RGBColor[0.36470588235294116`, 0.6784313725490196, 0.2980392156862745], RGBColor[0.18823529411764706`, 0.2901960784313726, 0.]}, {"Tropic", "Subtropic", "Temperate", "Boreal", "Polar"}], "MajorBiomes" -> SwatchLegend[{RGBColor[0.1450980392156863, 0.45098039215686275, 0.2235294117647059], RGBColor[0.4823529411764706, 0.7568627450980392, 0.2549019607843137], RGBColor[0.9333333333333333, 0.11764705882352941, 0.13725490196078433], RGBColor[0.9764705882352941, 0.6627450980392157, 0.10588235294117647], RGBColor[0.8862745098039215, 0.8862745098039215, 0.8784313725490196]}, {"Tropical & Subtropical Moist Broadleaf Forests", "Tropical & Subtropical Dry Broadleaf Forests", "Tropical & Subtropical Coniferous Forests", "Temperate Broadleaf & Mixed Forests", "Temperate Conifer Forests"}], "EcoregionProtectionStatus" -> SwatchLegend[{RGBColor[0.1450980392156863, 0.45098039215686275, 0.2235294117647059], RGBColor[0.4823529411764706, 0.7568627450980392, 0.2549019607843137], RGBColor[0.9333333333333333, 0.11764705882352941, 0.13725490196078433], RGBColor[0.9764705882352941, 0.6627450980392157, 0.10588235294117647], RGBColor[0.8862745098039215, 0.8862745098039215, 0.8784313725490196]}, {"Half Protected", "Nature Could Reach Half Protected", "Nature Imperiled", "Nature Could Recover", "N/A"}]|>, "Association"]]
```

<h4 id="fetching-ecoregion-images">Fetching ecoregion images</h4>

The ecoregion descriptions hosted on [www.oneearth.org](http://www.oneearth.org) contain illustrative of ecoregion landscapes and emblematic wildlife. Let’s define a function to fetch these images programmatically:

*Define a function to collect ecoregion images:*

```wl
ClearAll[ecoregionImages]
(*OneEarth page URL input:*)
ecoregionImages[ecoregionOneEarthPage_URL] := Dataset[Join[
   (*Import ecoregion page header images (typically landscapes):*)
   Cases[
    Import[ecoregionOneEarthPage, "XMLObject"], 
    XMLElement[
      "img", {"src" -> url_, "alt" -> description_, 
       "data-image" -> "data-image", 
       "v-imageloaded" -> "v-imageloaded"}, _] :> <|
      "Image" -> Import[url], 
      "ImageDescription" -> description|>, {17}],
   (*Import ecoregion page body images (typically animals or landscapes):*)
   Cases[
    Import[ecoregionOneEarthPage, "XMLObject"], 
    XMLElement[
      "figure", {}, {XMLElement["img", {"src" -> url_}, {}], 
       XMLElement[
        "figcaption", {}, {XMLElement[
          "span", {"class" -> "caption"}, {}], 
         XMLElement["p", {}, {description_}], " "}]}] :> <|
      "Image" -> Import[url], 
      "ImageDescription" -> description|>, \[Infinity]]
   ]]

(*Ecoregion name input:*)
ecoregionImages[ecoregionName_String] := 
 ecoregionImages[URL[First[Values[Normal[First[
       ConstructColumns[
        Select[ecoregionsTab, 
         Function[#EcoregionName == ecoregionName]], "OneEarthPage"]]]]]]]

(*ID input:*)
ecoregionImages[ecoregionID_Integer] := 
 ecoregionImages[URL[First[Values[Normal[First[
       ConstructColumns[
        Select[ecoregionsTab, Function[#EcoregionID == ecoregionID]], 
        "OneEarthPage"]]]]]]]
```

*Fetch images for a specified ecoregion, along with their descriptions:*

```wl
ecoregionImages["Myanmar coastal rain forests"]
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0apewhueieqfw.png =1359x507)

### Searching for iNaturalist Species Observations Within Ecoregions

Finally, here’s an example showing one way you might use the ecoregions data explored in this text in combination with other Wolfram Language ecology functionality. 

iNaturalist is a citizen science project and online community of naturalists, biologists, and ordinary people who record and share observations of plants, animals, and other life forms. Users can upload photos and sounds, identify species, and contribute to a global biodiversity database.

Observations shared to the iNaturalist platform can be retrieved using the [INaturalistSearch](https://resources.wolframcloud.com/FunctionRepository/resources/INaturalistSearch/) function from the Wolfram Function Repository. Let’s use this function to fetch species observations from an specified ecoregion.

*Define the region in which to search for observations:*

```wl
region = 
  GeoGroup[
   Normal[First[
      Select[ecoregionsTab, 
       Function[#"EcoregionName" == "Puerto Rican moist forests"]]]][
    "Geometry"]];
```

*Plot this region on a map:*

```wl
GeoGraphics[region] // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/090jv8xpyxzy7.png =840x369)

*Fetch observations made within this region and within a specified date range (here, set to the last 10 days at time of computation):*

```wl
observations = Select[Tabular[ResourceFunction[
ResourceObject[<|
      "Name" -> "INaturalistSearch", "ShortName" -> 
       "INaturalistSearch", "UUID" -> 
       "52cc24aa-c5a6-47ca-998f-3e5c08b4ed53", "ResourceType" -> 
       "Function", "Version" -> "1.1.1", "Description" -> 
       "Search for iNaturalist observations using the iNaturalist API", "RepositoryLocation" -> 
       URL["https://www.wolframcloud.com/obj/resourcesystem/api/1.0"],
        "SymbolName" -> 
       "FunctionRepository`$2941ab2fbece423cb47ef83042e88aaf`INaturalistSearch", "FunctionLocation" -> 
       CloudObject[
        "https://www.wolframcloud.com/obj/56d4026f-00a5-4e4f-b910-6ea80a592d0d"]|>, {
      ResourceSystemBase -> 
       "https://www.wolframcloud.com/obj/resourcesystem/api/1.0"}]][
    All, "Threatened" -> True, 
    "ObservationGeoRange" -> GeoBounds[region], 
    "ObservationDateRange" -> {DatePlus[Today, -Quantity[10, "Days"]],
       Today}]], Function[GeoWithinQ[region, #GeoPosition]]]
```

*Extract the positions and species names from the resulting dataset, and plot them on a map:*

```wl
GeoListPlot[Flatten[FromTabular[ConstructColumns[observations, "LabeledPosition" -> Function[Labeled[#"GeoPosition", #"TaxonName"]]], "Matrix"]], ImageSize -> 850] // Rasterize
```

![](https://phileasdg.github.io/media/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity/0tp97ku72duyh.png =1173x515)

## Conclusion

The Ecoregions2017©Resolve dataset lets us explore the incredible variety of ecosystems around the globe. By breaking down Earth’s landscapes into distinct ecological zones, it gives us a fresh perspective on Earth’s diverse habitats and the species that inhabit them. Whether you’re interested in research, conservation, or simply appreciating the beauty and complexity of life on Earth, this dataset offers a clear and engaging way to use computation to explore questions  about ecology, biodiversity, and environmental science.

## Cite this work

[Terrestrial ecoregions of the world: computational insights into global biodiversity](https://community.wolfram.com/groups/-/m/t/3445374)
by [Phileas Dazeley-Gaist](https://community.wolfram.com/web/phileasdg)
Wolfram Community, STAFF PICKS, April 17, 2025
[https://community.wolfram.com/groups/-/m/t/3445374](https://community.wolfram.com/groups/-/m/t/3445374)