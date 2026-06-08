**Note: **This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3582661). 

## Introduction: The ESA WorldCover dataset

The [European Space Agency's WorldCover](https://esa-worldcover.org/en) is a freely accessible dataset providing global land cover classification at 10-meter resolution derived from Sentinel-1 and Sentinel-2 satellite imagery. Released in 2020 and updated in 2021, the ESA reports that the updated dataset achieves an overall accuracy of 76.7% in identifying land cover types, including forests, grasslands, croplands, urban areas, and water bodies across the entire Earth's surface.

The high-resolution imagery WorldCover offers is especially valuable for environmental monitoring, urban planning, and understanding how human activity impacts and encroaches upon wild landscapes. WorldCover's 10-meter resolution can capture fine-grained details such as the difference a small forest patch and an adjacent agricultural field, or between building clusters within a neighborhood. The ESA distributes WorldCover imagery through several access points, including through two WMTS services (one for the 2020 product, and another for the 2021 version). You can find a list of these access points at[ this link](https://esa-worldcover.org/en/data-access).

ESA WorldCover classifies land cover using the following eleven land cover classes:

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.02.55.png =546x70)

In Wolfram Language (WL), it's fairly straightforward to access ESA WorldCover data through [GeoGraphics](https://reference.wolfram.com/language/ref/GeoGraphics.html) using the [GeoServer](https://reference.wolfram.com/language/ref/GeoServer.html) option. This way, we can visualize land cover for any region on Earth, from small scale features like countryside human settlements to entire continents, and compare it to other geographic data to uncover patterns in land use and other anthropogenic environmental impacts.

This short piece will demonstrate how to connect to ESA WorldCover to make custom geographic visualisations in WL, and illustrate the flexibility of the Wolfram environment for this kind of data exploration by visualizing the land cover around the twenty largest US cities by population size, and around the 63 US national parks. The code to generate the former set of maps will be about five lines long, and about twenty lines long for the latter.

## Connecting to ESA WorldCover with GeoGraphics

First, let's define the GeoServer options to access the WorldCover datasets.

*GeoServer specification for ESA WorldCover 2020:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.05.11.png =1330x224)

*GeoServer specification for ESA WorldCover 2021:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.05.31.png =1314x220)

While we're at it, let's define a legend with which to label our maps.

*Define a WorldCover legend: *

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.06.01.png =1278x678)

We now have all the pieces needed to make WorldCover visualizations. To make a land cover map, simply call specify the region you'd like to plot and the GeoServer specification to use inside GeoGraphics. 

*Map global land cover:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.06.44.png =553x242)

I've specified the [GeoZoomLevel](https://reference.wolfram.com/language/ref/GeoZoomLevel.html) option manually in this example because the default setting results in imagery just below the resolution I want. This is a side-effect of the way the ESA WorldCover data services are set up. Let's come back to that later. For now, we'll keep specifying the zoom level manually.

To add the legend we defined above to the plot, you can use [Labeled](https://reference.wolfram.com/language/ref/Labeled.html). The main advantage of using Labeled over [Legended](https://reference.wolfram.com/language/ref/Legended.html) is that you can control where the legend goes with the third argument. If the example below had resulted in a wide map, for instance, we might have instead chosen to add the legend below the map using [Below](https://reference.wolfram.com/language/ref/Below.html) as the third argument to [Labeled](https://reference.wolfram.com/language/ref/Labeled.html) instead of [Right](https://reference.wolfram.com/language/ref/Right.html).

*Map the land cover in Illinois:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.09.06.png =586x569)

We can easily compare both dataset versions by plotting the same map twice, once with each GeoServer specification.

*Compare imagery from WorldCover 2020 and WorldCover 2021 over the same region:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.09.48.png =1448x774)

By lightly modifying the previous example, we can make a side-by-side comparison of ESA WorldCover land cover classification with another map of the same region: 

*Map the land cover around London: *

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.11.04.png =1818x1140)

Since the WorldCover dataset has global coverage, it can be used to visualise land cover for remote areas.

*Map the land cover on Kerguelen:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.11.45.png =617x498)

To adjust the automatic GeoZoomLevel setting I've opted to generate the map once with automatic settings, retrieving the chosen GeoZoomLevel from the result and adding a constant (I chose 2) to the result to get the adjusted setting to use in the final map. Then I recompute the final map with the adjusted GeoZoomLevel.

*Automatically set the zoom level to be a little higher than by default:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.12.29.png =692x498)

In the following sections, I'll apply the connection to this dataset to automatically survey the land cover around the largest US cities by population, and all 63 US national parks.

## Land cover around major US cities

We can apply this workflow to quickly visualize any set of locations. Let's start with the largest cities in the US. 

*List the largest US cities by population:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.13.09.png =698x172)

Plotting the ESA land cover for these cities yields important morphological visual contrasts. For example, Phoenix and Denver exemplify contiguous expansion into open terrain and are surrounded by arid shrubland and high plains grassland, respectively. In contrast, New York, San Jose and Seattle have sharp boundaries where development is strictly confined by valley topography or water bodies, and in Charlotte the built environment is heavily interspersed with dense tree canopy.

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.13.36.png =1350x434)

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.23.04.png =1740x1384)

*Map the land cover around any of the twenty largest US cities by population:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.34.00.png =555x132)

<div class="gallery-wrapper"><div class="gallery"  data-is-empty="false" data-translation="Add images" data-columns="3">
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Austin.png" data-size="668x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Austin-thumbnail.png =668x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Charlotte.png" data-size="652x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Charlotte-thumbnail.png =652x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Chicago.png" data-size="680x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Chicago-thumbnail.png =680x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Columbus.png" data-size="720x783">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Columbus-thumbnail.png =720x783)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Dallas.png" data-size="720x691">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Dallas-thumbnail.png =720x691)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Denver.png" data-size="720x588">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Denver-thumbnail.png =720x588)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Fort-Worth.png" data-size="720x790">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Fort-Worth-thumbnail.png =720x790)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Houston.png" data-size="720x628">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Houston-thumbnail.png =720x628)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Indianapolis.png" data-size="720x744">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Indianapolis-thumbnail.png =720x744)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Jacksonville.png" data-size="720x586">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Jacksonville-thumbnail.png =720x586)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Los-Angeles.png" data-size="558x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Los-Angeles-thumbnail.png =558x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/New-York-City.png" data-size="720x786">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/New-York-City-thumbnail.png =720x786)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Philadelphia.png" data-size="720x821">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Philadelphia-thumbnail.png =720x821)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Phoenix.png" data-size="440x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Phoenix-thumbnail.png =440x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Antonio.png" data-size="720x736">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Antonio-thumbnail.png =720x736)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Diego.png" data-size="488x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Diego-thumbnail.png =488x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Francisco.png" data-size="720x416">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Francisco-thumbnail.png =720x416)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Jose.png" data-size="720x718">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/San-Jose-thumbnail.png =720x718)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Seattle.png" data-size="531x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Seattle-thumbnail.png =531x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Washington.png" data-size="666x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Washington-thumbnail.png =666x864)</a></figure>

## Land cover around US National Parks

Let's also try this for US national parks. In the last example, we used entities from the Wolfram Knowledgebase to define the geographic footprints of US cities to be plotted. We'll need to to something similar for national but since the knowledgebase does not have built-in entities for every park yet, we'll have to supplement the list with some custom-defined regions as well.

*Define an Association representing US national parks:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.30.39.png =1564x1320)

Applying this workflow again to US National Parks, there are important contrasts in the landscape compositions. For instance, Denali and the Everglades have unique dominant cover types: permanent snow and grassland, and herbaceous wetland and mangroves, respectively, that stand apart from the arid shrubland and bare rock of Arches. Other contrasts are defined by topography and hydrography, such as the fragmented coastal forests of Acadia or the steep gradients of the Black Canyon. An outlier, Indiana Dunes is sharply bounded by adjacent urban and agricultural land.

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.30.58.png =1550x414)

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.31.19.png =1810x1334)

*Map the land cover of any US national park:*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.39.04.png =618x168)

<div class="gallery-wrapper"><div class="gallery"  data-is-empty="false" data-translation="Add images" data-columns="3">
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Acadia-National-Park.png" data-size="720x715">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Acadia-National-Park-thumbnail.png =720x715)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/American-Samoa.png" data-size="720x385">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/American-Samoa-thumbnail.png =720x385)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Arches-National-Park.png" data-size="632x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Arches-National-Park-thumbnail.png =632x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Badlands-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Badlands-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Big-Bend-National-Park.png" data-size="720x662">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Big-Bend-National-Park-thumbnail.png =720x662)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Biscayne-National-Park.png" data-size="516x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Biscayne-National-Park-thumbnail.png =516x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Black-Canyon-of-the-Gunnison-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Black-Canyon-of-the-Gunnison-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Bryce-Canyon-National-Park.png" data-size="495x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Bryce-Canyon-National-Park-thumbnail.png =495x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Canyonlands-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Canyonlands-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Capitol-Reef-National-Park.png" data-size="397x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Capitol-Reef-National-Park-thumbnail.png =397x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Carlsbad-Caverns-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Carlsbad-Caverns-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Channel-Islands-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Channel-Islands-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Congaree-National-Park.png" data-size="720x389">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Congaree-National-Park-thumbnail.png =720x389)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Crater-Lake-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Crater-Lake-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Cuyahoga-Valley-National-Park.png" data-size="351x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Cuyahoga-Valley-National-Park-thumbnail.png =351x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Death-Valley-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Death-Valley-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Denali-National-Park-and-Preserve.png" data-size="720x720">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Denali-National-Park-and-Preserve-thumbnail.png =720x720)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Dry-Tortugas-National-Park.png" data-size="720x358">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Dry-Tortugas-National-Park-thumbnail.png =720x358)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Everglades-National-Park.png" data-size="720x761">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Everglades-National-Park-thumbnail.png =720x761)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Gates-of-the-Arctic-National-Park-and-Preserve.png" data-size="720x821">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Gates-of-the-Arctic-National-Park-and-Preserve-thumbnail.png =720x821)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Gateway-Arch-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Gateway-Arch-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Glacier-Bay-National-Park-and-Preserve.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Glacier-Bay-National-Park-and-Preserve-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Glacier-National-Park.png" data-size="720x706">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Glacier-National-Park-thumbnail.png =720x706)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Grand-Canyon-National-Park.png" data-size="720x445">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Grand-Canyon-National-Park-thumbnail.png =720x445)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Grand-Teton-National-Park.png" data-size="583x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Grand-Teton-National-Park-thumbnail.png =583x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Basin-National-Park.png" data-size="593x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Basin-National-Park-thumbnail.png =593x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Sand-Dunes-National-Park-and-Preserve.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Sand-Dunes-National-Park-and-Preserve-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Smoky-Mountains-National-Park.png" data-size="720x409">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Great-Smoky-Mountains-National-Park-thumbnail.png =720x409)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Guadalupe-Mountains-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Guadalupe-Mountains-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Haleakala-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Haleakala-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Hawaii-Volcanoes-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Hawaii-Volcanoes-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Hot-Springs-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Hot-Springs-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Indiana-Dunes-National-Lakeshore.png" data-size="720x429">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Indiana-Dunes-National-Lakeshore-thumbnail.png =720x429)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Isle-Royale-National-Park.png" data-size="720x501">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Isle-Royale-National-Park-thumbnail.png =720x501)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Joshua-Tree-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Joshua-Tree-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Katmai-National-Park-and-Preserve.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Katmai-National-Park-and-Preserve-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kenai-Fjords-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kenai-Fjords-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kings-Canyon-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kings-Canyon-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kobuk-Valley-National-Park.png" data-size="720x808">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Kobuk-Valley-National-Park-thumbnail.png =720x808)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Lake-Clark-National-Park-and-Preserve.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Lake-Clark-National-Park-and-Preserve-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Lassen-Volcanic-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Lassen-Volcanic-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mammoth-Cave-National-Park.png" data-size="720x672">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mammoth-Cave-National-Park-thumbnail.png =720x672)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mesa-Verde-National-Park.png" data-size="720x844">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mesa-Verde-National-Park-thumbnail.png =720x844)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mount-Rainier-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Mount-Rainier-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/New-River-Gorge-National-Park-and-Preserve.png" data-size="477x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/New-River-Gorge-National-Park-and-Preserve-thumbnail.png =477x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/North-Cascades-National-Park.png" data-size="720x754">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/North-Cascades-National-Park-thumbnail.png =720x754)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Olympic-National-Park.png" data-size="720x623">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Olympic-National-Park-thumbnail.png =720x623)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Petrified-Forest-National-Park.png" data-size="687x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Petrified-Forest-National-Park-thumbnail.png =687x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Pinnacles-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Pinnacles-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Redwood-National-and-State-Parks.png" data-size="376x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Redwood-National-and-State-Parks-thumbnail.png =376x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Rocky-Mountain-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Rocky-Mountain-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Saguaro-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Saguaro-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Sequoia-National-Park.png" data-size="720x564">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Sequoia-National-Park-thumbnail.png =720x564)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Shenandoah-National-Park.png" data-size="530x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Shenandoah-National-Park-thumbnail.png =530x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Theodore-Roosevelt-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Theodore-Roosevelt-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/United-States-Virgin-Islands.png" data-size="520x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/United-States-Virgin-Islands-thumbnail.png =520x864)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Voyageurs-National-Park.png" data-size="720x754">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Voyageurs-National-Park-thumbnail.png =720x754)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/White-Sands-National-Park.png" data-size="720x577">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/White-Sands-National-Park-thumbnail.png =720x577)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Wind-Cave-National-Park.png" data-size="720x753">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Wind-Cave-National-Park-thumbnail.png =720x753)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Wrangell-St.-Elias-National-Park-and-Preserve.png" data-size="720x688">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Wrangell-St.-Elias-National-Park-and-Preserve-thumbnail.png =720x688)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Yellowstone-National-Park.png" data-size="720x769">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Yellowstone-National-Park-thumbnail.png =720x769)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Yosemite-National-Park.png" data-size="720x752">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Yosemite-National-Park-thumbnail.png =720x752)</a></figure>
<figure class="gallery__item"><a href="https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Zion-National-Park.png" data-size="671x864">![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/gallery/Zion-National-Park-thumbnail.png =671x864)</a></figure>

## Connecting to NASA remote sensing services

The ESA WorldCover dataset is a great resource for understanding land cover patterns, and luckily for us, we live in a world in which there are many more. Many remote sensing services are available as map tile servers (WMTS), and two of my favourite providers of high quality free remote sensing imagery datasets of this kind, often with global and sometimes even near real time coverage, are Copernicus Marine and NASA GIBS (Global Imagery Browse Services). You can access NASA GIBS remote sensing imagery using the RemoteSensing paclet, which I've previously written about [here](https://community.wolfram.com/groups/-/m/t/2959942). 

Suppose our reason for consulting ESA LandCover is that we'd like to better understand human environmental impacts globally. In that case, another dataset I'd recommend consulting is the Anthropogenic Biomes (or "Anthromes") map by Ellis &amp; Ramankutty (2008), which classifies Earth's terrestrial surface by the degree and type of human settlements.

The anthropogenic biomes dataset puts human activity at the center of ecological classification, and that makes it an especially compelling tool to study the Anthropocene. It's also conveniently available through NASA GIBS via the RemoteSensing paclet, among over a thousand other remote sensing datasets. Here's how you can install and use this tool yourself:

*Run this code to install the paclet:*

`PacletInstall["PhileasDazeleyGaist`RemoteSensing`"]`

*Once the paclet is installed, it can be loaded like this:*

`Needs["PhileasDazeleyGaist`RemoteSensing`"]`

*Use the RemoteSensing paclet to fetch a map of anthropogenic biomes of the world (Ellis &amp; Ramankutty, 2008):*

![](https://phileasdg.github.io/media/posts/mapping-global-land-cover-with-european-space-agency-data/Screenshot-2026-01-10-at-11.46.15.png =1252x1000)

## Sources Cited

WorldCover 2020 v100: Zanaga, D., Van De Kerchove, R., De Keersmaecker, W., Souverijns, N., Brockmann, C., Quast, R., Wevers, J., Grosu, A., Paccini, A., Vergnaud, S., Cartus, O., Santoro, M., Fritz, S., Georgieva, I., Lesiv, M., Carter, S., Herold, M., Li, Linlin, Tsendbazar, N.E., Ramoino, F., Arino, O., 2021. ESA WorldCover 10 m 2020 v100. [https://doi.org/10.5281/zenodo.5571936 ](https://doi.org/10.5281/zenodo.5571936)<br>Ellis, Erle C., and Navin Ramankutty. 2008. Putting People in the Map: Anthropogenic Biomes of the World. https://doi.org/10.1890/070062.