---
title: "Trading Places: a Network Analysis of Global Commerce"
date: "2025-08-16T04:20"
tags: ["Complex Systems","Economics","Geography & GIS","Modelling","Network Science","Programming","Wolfram Language","Work at Wolfram"]
thumbnail: "media/posts/46/world_trade_banner.png"
thumbWidth: 2666
thumbHeight: 1001
date_modified: "2026-01-17T21:09:42+01:00"
date_published: "2025-08-16T04:20:01+02:00"
---

**Note:** This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3416904). 

<h2 id="introduction">Introduction</h2>

The global trade network is the backbone of international commerce, linking countries through a complex web of import and export relationships. Not only does it characterise the flow of goods and services, but it also shapes economic strategies and geopolitical landscapes. 

While the true global trade network is incredibly complex, with millions of individual transactions occurring daily across countless products and services, we can still build meaningful representations that capture important aspects of global commerce ties. In this article, I’ll use Wolfram Knowledgebase country data from [The World Factbook](https://www.cia.gov/the-world-factbook/) to define graphs of major import and export relationships on the global stage. 

By constructing network representations of international trade, we can visualize and quantify the connections between nations, revealing patterns that might otherwise remain hidden in tables of statistics. Which countries serve as central hubs in global commerce? How do smaller economies interact with larger ones? Where do we see asymmetric dependencies? And how do natural trading communities form? In this short article, I’ll explore these questions through a series of visualizations and analyses.

<h2 id="setup-building-a-dataset-of-international-commercial-relationships">Setup: Building a Dataset of International Commercial Relationships</h2>

The first thing we need to do is gather data on import and export relationships between countries. We can get this information from the Wolfram Knowledgebase.

Let’s start by creating a list of all countries: 

 

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/0mhu7w08drqns.png" alt="countries" width="914" height="49" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0mhu7w08drqns-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0mhu7w08drqns-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0mhu7w08drqns-md.png 768w"></figure>

We’re going to extract values associated with country entities above. Manually, we might access one such value like this:

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1axwz1yc3p4za.png" alt="" width="424" height="47" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1axwz1yc3p4za-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1axwz1yc3p4za-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1axwz1yc3p4za-md.png 768w"></figure>

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/0rhtbmil6fzi4.png" alt="" width="1084" height="48" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0rhtbmil6fzi4-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0rhtbmil6fzi4-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0rhtbmil6fzi4-md.png 768w"></figure>

We can also ask Wolfram Language to check the source of entity property data like so: 

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/096za5tfkwtq2.png" alt="" width="606" height="47" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/096za5tfkwtq2-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/096za5tfkwtq2-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/096za5tfkwtq2-md.png 768w"></figure>

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/1hbx1q5bewf0p-2.png" alt="" width="276" height="48" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1hbx1q5bewf0p-2-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1hbx1q5bewf0p-2-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1hbx1q5bewf0p-2-md.png 768w"></figure>

Now, let’s create a dataset of import and export information for these countries. We’ll extract key trade properties and remove entries with missing data.

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/0ob3dcrtldzxu.png" alt="" width="2243" height="278" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0ob3dcrtldzxu-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0ob3dcrtldzxu-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0ob3dcrtldzxu-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/0ovu7bhsqczea.png" alt="dataset preview" width="1452" height="546" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0ovu7bhsqczea-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0ovu7bhsqczea-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0ovu7bhsqczea-md.png 768w"></figure>

Since these are tabular data, we can represent them in a [Tabular](https://reference.wolfram.com/language/ref/Tabular) object (introduced in Wolfram Language 14.2). The Tabular representation makes it possible to apply [standard data science pipeline ](https://reference.wolfram.com/language/guide/TabularProcessing)techniques including filtering, aggregation, transformation, and visualisation to our data easily.

The dataset we’ve built contains international trade information for countries around the world, with data sourced from [The World Factbook](https://www.cia.gov/the-world-factbook/). Each column represents a key aspect of a country’s trade profile: 

- *ImportCommodities:* Major goods and product categories that each country primarily imports from international markets. These represent key dependencies on foreign products.

- *ExportCommodities:* Major goods and product categories that each country primarily sells to international markets. These represent the country’s key commercial outputs.

- *ImportPartners:* Major countries from which each nation sources its imports. These represent the primary international suppliers for each country.

- *ExportPartners:* Major countries to which each nation sells its exports. These represent the primary international customers for each country.

- *ImportPartnersFractions:* The approximate percentage of total imports that come from each major import partner. This quantifies the relative importance of each supplier country.

- *ExportPartnersFractions:* The approximate percentage of total exports that go to each major export partner. This quantifies the relative importance of each customer country.

Not only do these data provide a coarse sense of who trades with whom, but also what they trade and how significant those relationships are in percentage terms.

<h2 id="construction-and-analysis-of-network-representations-of-global-commerce">Construction and Analysis of Network Representations of Global Commerce</h2>

Global commerce naturally lends itself to network analysis, where countries represent nodes (vertices) and trade relationships form the connections (edges) between them. Using our dataset, we can construct several different graph representations that reveal different aspects of international trade patterns. 

<h3 id="unweighted-international-trade-network-representations">Unweighted international trade network representations</h3>

The simplest representations we can construct from our dataset are unweighted directed graphs where an edge from country A to country B indicates that B is a major trading partner of A. We can create two complementary networks:

- **Import Network:** In these networks, an edge from country A to country B means that country A imports goods from country B. The direction of the edge follows the flow of money (A pays B for goods).

- **Export Network**: Here, an edge from country A to country B means that country A exports goods to country B. The direction follows the flow of goods.

Let’s construct and visualise these graphs.

*Construct the global major import partner graph: *

```wl
In[]:= globalImportRelationships = Graph[Normal[Dataset[internationalCommerceData][All, Keys][Keys]], 
    Flatten[FromTabular[ConstructColumns[internationalCommerceData, 
       &quot;Edges&quot; -> (Thread[#Entity -> #ImportPartners] &)], &quot;Matrix&quot;]], ImageSize -> Small]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1m3tks5pkbkxu.png" alt="" width="360" height="305" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1m3tks5pkbkxu-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1m3tks5pkbkxu-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1m3tks5pkbkxu-md.png 768w"></figure>

*Construct the global major export partner graph:*

```wl
In[]:= globalExportRelationships = Graph[
    Normal[Dataset[internationalCommerceData][All, Keys][Keys]], 
    Flatten[FromTabular[ConstructColumns[internationalCommerceData, 
       &quot;Edges&quot; -> (Thread[#Entity -> #ExportPartners] &)], &quot;Matrix&quot;]], ImageSize -> Small]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1g9a5cg22b41i.png" alt="" width="360" height="367" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1g9a5cg22b41i-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1g9a5cg22b41i-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1g9a5cg22b41i-md.png 768w"></figure>

These networks are quite tangled, so it will help to represent them geographically.

*Visualise these graphs on maps:*

```wl
In[]:= Row[Rasterize[#, ImageSize -> Large, RasterSize -> 1500] & /@ {
     GeoGraphPlot[globalImportRelationships, 
      EdgeStyle -> Thin, VertexSize -> Small, 
      GeoProjection -> &quot;LambertAzimuthal&quot;, ImageSize -> 600, PlotRangePadding -> .1, 
      PlotLabel -> Style[&quot;Global Major Import Partner Network&quot;, 15], 
      GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}], 
     GeoGraphPlot[globalExportRelationships, 
      EdgeStyle -> Thin, VertexSize -> Small, 
      GeoProjection -> &quot;LambertAzimuthal&quot;, ImageSize -> 600, PlotRangePadding -> .1, 
      PlotLabel -> Style[&quot;Global Major Export Partner Network&quot;, 15], 
      GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}] 
    }]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/GlobalMajorImportPartnerNetwork.png" alt="" width="1500" height="1543" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorImportPartnerNetwork-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorImportPartnerNetwork-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorImportPartnerNetwork-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/GlobalMajorExportPartnerNetwork.png" alt="" width="1500" height="1543" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorExportPartnerNetwork-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorExportPartnerNetwork-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalMajorExportPartnerNetwork-md.png 768w"></figure>

<h3 id="analysis-of-discrepancies-between-import-and-export-networks">Analysis of discrepancies between import and export networks</h3>

While both networks are very visually similar, because they take different perspectives, the import and export graphs paint slightly different pictures of global trade. One source of discrepancies between the networks is asymmetries in trade relationships: The fact that country A features in the list of major partners to country B does not always entail that B features in the list of major partners of A. To better understand these asymmetries, we can study which relationships appear in one network but not the other.

- **Two-way major partnerships:** If an edge A  B is found in both graphs, it means that B is a major provider of goods to A (relative to A’s total imports) and A is a major exporter to B (relative to A’s total exports). This suggests A is economically dependent on its import and export relationships with B, as they make up significant portions of A’s total imports and exports.

- **Import dependencies:** If a A  B exists in the import network but not in the export network, it means B is a major source of imports to A, but is not a major export destination for A’s goods. This suggests A depends on B’s goods, but B is not a significant market for A.

- **Export dependencies:** Conversely, if  A  B exists in the export network but not in the import network, it means B is a major destination for A’s exports, but not one of A’s major import sources. ****This suggests A depends on B as a market for its goods, but not on imports from B.

Let’s examine which countries most frequently appear in these “one-way” relationships:

The charts below show the 20 countries which most frequently appear as the “source” country (country A) in these asymmetric import and export relationships. The left chart ranks countries by the number of major trade partners with whom they have major import dependencies. The right chart ranks countries by the number of major trade partners with whom they have major export dependencies.

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/0qssf2f86q1zq.png" alt="" width="1386" height="539" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0qssf2f86q1zq-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0qssf2f86q1zq-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0qssf2f86q1zq-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/Top20CountryOneWayImportDependencies.png" alt="" width="1086" height="577" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayImportDependencies-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayImportDependencies-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayImportDependencies-md.png 768w"></figure>

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/Top20CountryOneWayExportDependencies.png" alt="" width="1000" height="580" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayExportDependencies-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayExportDependencies-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryOneWayExportDependencies-md.png 768w"></figure>

Notably, smaller economies like Vanuatu, Samoa, and Guinea appear frequently in these one-way relationships, suggesting they may have significant dependencies on specific trading partners that don’t reciprocally depend on them.

These next charts reveal which countries most frequently appear as the “destination” country (country B) in asymmetric relationships. The left chart shows countries that are most frequently considered important import sources, but not major export destinations for their partners goods. The right chart shows countries that are most frequently considered important export destinations, but not major import sources:

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1sv1x08hlj4a0.png" alt="" width="1383" height="539" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1sv1x08hlj4a0-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1sv1x08hlj4a0-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1sv1x08hlj4a0-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/Top20CountryCriticalImportSources.png" alt="" width="1000" height="596" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalImportSources-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalImportSources-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalImportSources-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/Top20CountryCriticalExportMarkets.png" alt="" width="1000" height="626" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalExportMarkets-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalExportMarkets-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/Top20CountryCriticalExportMarkets-md.png 768w"></figure>

China dominates as a critical import source for numerous countries that don’t reciprocally consider China a major export destination. Meanwhile, the United Kingdom and United States serve as vital export markets for many nations that don’t rely heavily on them for imports. These patterns highlight the uneven dependencies in global trade - smaller economies often have one-way trade relationships with economic powerhouses, while major economies maintain more balanced bilateral trade relationships with their key partners. This asymmetry creates potential vulnerabilities where countries depend economically on partners who don’t equally depend on them.

<h3 id="country-centrality-in-global-commerce">Country Centrality in Global Commerce</h3>

Network centrality measures help us identify which countries play pivotal roles in the global trade network. Different centrality metrics capture different aspects of a country’s importance in international trade.

Betweenness centrality measures the extent to which a country acts as an intermediary in the trade network. It is calculated based on the number of times a country falls on the shortest path between other countries. High betweenness centrality indicates that a country is a major hub for trade, facilitating transactions between many other nations. This can highlight countries that play a vital role in the distribution of goods globally.

*Visualization of vertex betweenness centrality on the global imports network:*

```wl
In[]:= Module[{g = globalImportRelationships}, 
   g = Graph[g, VertexCoordinates -> Map[First[GeoGridPosition[#, &quot;WinkelTripel&quot;]] &, VertexList[g]]]; 
   GeoBubbleChart[Thread[VertexList[g] -> BetweennessCentrality[g]], 
    GeoProjection -> &quot;WinkelTripel&quot;, 
    PlotLabel -> Style[&quot;Global Trade Import Vertex Betweenness-Centrality&quot;, 14], 
    GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}] 
  ]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1l8auoboznwi6.png" alt="" width="1304" height="829" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1l8auoboznwi6-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1l8auoboznwi6-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1l8auoboznwi6-md.png 768w"></figure>

*Visualization of vertex betweenness centrality on the global exports network:*

```wl
In[]:= Module[{g = globalExportRelationships}, 
   g = Graph[g, VertexCoordinates -> Map[First[GeoGridPosition[#, &quot;WinkelTripel&quot;]] &, VertexList[g]]]; 
   GeoBubbleChart[Thread[VertexList[g] -> BetweennessCentrality[g]], 
    GeoProjection -> &quot;WinkelTripel&quot;, 
    PlotLabel -> Style[&quot;Global Trade Export Vertex Betweenness-Centrality&quot;, 14], 
    GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}] 
  ]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/0j6jsiinemtns.png" alt="" width="1301" height="827" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0j6jsiinemtns-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0j6jsiinemtns-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0j6jsiinemtns-md.png 768w"></figure>

Nations like the United States, China, and Germany show substantial centrality, reflecting their critical positions in both importing and exporting goods. These countries are central players in the international market, not just due to their economic size but also because they serve as major conduits for international trade.

Countries with high betweenness centrality play a significant role in the stability of global trade networks. Disruptions in these countries, be it political instability, natural disasters, or economic sanctions, could have ripple effects, impacting trade flows globally.

<h3 id="weighted-international-trade-network-representations">Weighted international trade network representations</h3>

While our previous unweighted network analysis provided insights into the structure of global trade relationships, it treated all connections equally. In reality, trade relationships vary significantly in their importance. Some countries depend heavily on specific trading partners, with a large percentage of their imports or exports flowing through them.

By incorporating the percentage data from our dataset (ImportPartnersFractions and ExportPartnersFractions), we can create weighted networks that better reflect the actual economic significance of each relationship. In these weighted networks, the thickness of each edge represents the percentage of a country’s total imports or exports that flows through that relationship. 

*Construct the weighted global import partner graph: *

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/1us4mokwx5dfd.png" alt="" width="2660" height="259" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1us4mokwx5dfd-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1us4mokwx5dfd-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1us4mokwx5dfd-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1gp61mwnbbhvs.png" alt="" width="360" height="405" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1gp61mwnbbhvs-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1gp61mwnbbhvs-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1gp61mwnbbhvs-md.png 768w"></figure>

*Construct the weighted global export partner graph: *

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/12nuslpcvt9tk.png" alt="" width="2654" height="259" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/12nuslpcvt9tk-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/12nuslpcvt9tk-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/12nuslpcvt9tk-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/17a0eaya4u61j.png" alt="" width="360" height="300" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/17a0eaya4u61j-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/17a0eaya4u61j-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/17a0eaya4u61j-md.png 768w"></figure>

Once again, let’s plot these networks geographically:

*Visualise the weighted global import and export partner networks on a map:*

```wl
In[]:= Row[Rasterize[#, ImageSize -> Large, RasterSize -> 1500] & /@ {
     GeoGraphValuePlot[globalWeightedImportRelationships, 
      GeoProjection -> &quot;LambertAzimuthal&quot;, ImageSize -> 500, ColorFunction -> &quot;Aquamarine&quot;, 
      EdgeValueRange -> {0, 1}, EdgeValueSizes -> 1/100, PlotRangePadding -> .1, VertexSize -> 5, 
      PlotLegends -> Automatic, MinPointSeparation -> None, PlotLabel -> Style[&quot;Global Weighted Major Import Partner Network&quot;, 15], 
      GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}], 
     GeoGraphValuePlot[globalWeightedExportRelationships, 
      GeoProjection -> &quot;LambertAzimuthal&quot;, ImageSize -> 500, ColorFunction -> &quot;Aquamarine&quot;, 
      EdgeValueRange -> {0, 1}, EdgeValueSizes -> 1/100, PlotRangePadding -> .1, VertexSize -> 5, 
      PlotLegends -> Automatic, MinPointSeparation -> None, PlotLabel -> Style[&quot;Global Weighted Major Export Partner Network&quot;, 15], 
      GeoBackground -> {&quot;Coastlines&quot;, {&quot;Land&quot; -> White}}] 
    }]
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/GlobalWeightedMajorImportPartnerNetwork.png" alt="" width="1500" height="1339" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorImportPartnerNetwork-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorImportPartnerNetwork-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorImportPartnerNetwork-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/GlobalWeightedMajorExportPartnerNetwork.png" alt="" width="1500" height="1339" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorExportPartnerNetwork-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorExportPartnerNetwork-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/GlobalWeightedMajorExportPartnerNetwork-md.png 768w"></figure>

These plots highlight strong regional trade patterns and commerce hubs centred at major economic powers. Thicker lines represent relationships where a higher percentage of a country’s imports or exports flow through that connection. 

<h3 id="comparison-of-import-and-export-relationship-weights">Comparison of import and export relationship weights</h3>

By comparing the weights of common edges in our import and export networks, we can identify key patterns of dependency and influence in international trade. 

*Produce a scatter plot of import and export edge weights for edges common to both weighted networks:*

```wl
In[]:= Module[{
     importEdges = EdgeList[globalWeightedImportRelationships], 
     importWeights = AnnotationValue[globalWeightedImportRelationships, EdgeWeight], 
     exportEdges = EdgeList[globalWeightedExportRelationships], 
     exportWeights = AnnotationValue[globalWeightedExportRelationships, EdgeWeight], 
     threadEm = Function[{a, b}, Thread[a -> b]], commonEdges}, 
    
    commonEdges = Intersection[importEdges, exportEdges]; 
    
    Labeled[Labeled[Show[
       Plot[x, {x, 0, 1}, PlotStyle -> Directive[Dashed, LightGray]], 
       ListPlot[KeyValueMap[Callout[#2, #1] &, Merge[{
          (*x axis values*) KeySort[FilterRules[threadEm[importEdges, importWeights], commonEdges]], 
          (*y axis values*) KeySort[FilterRules[threadEm[exportEdges, exportWeights], commonEdges]]}, 
          First[List[#]] &]], PlotRange -> Full], ImageSize -> Large], Map[Text, {&quot;Import network edge weight (fraction of total imports to country A coming from country B)&quot;, &quot;Export network edge weight (fraction of total exports of country A going to country B)&quot;}], {Bottom, Left}, RotateLabel -> True], 
     Text[Style[&quot;Scatterplot of Major Import and Export Relationship Weights in Global Commerce&quot;, 15]], Top] 
   ] // Rasterize[#, ImageSize -> Large, RasterSize -> 1500] &
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1x8fe3jjsmh5a.png" alt="" width="1230" height="871" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1x8fe3jjsmh5a-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1x8fe3jjsmh5a-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1x8fe3jjsmh5a-md.png 768w"></figure>

In this scatter plot:

1. Points above the diagonal line represent relationships where the export dependency (y-axis) is stronger than the import dependency (x-axis). For example, Puerto Rico depends on the United States as a market for a about 90% of its exports, whereas it imports a little under 60% of its goods from the US.

2. Points below the diagonal line represent relationships where the import dependency is stronger than the export dependency. For instance, the Falklands import over 70% of their imported goods from the UK, but the UK is a market for under 10% of the Falklands exports.

3. Clustered points near the origin indicate that most trading relationships involve relatively small percentages of total trade (&lt;20%), showing diversification in most countries’ trading patterns.

The scatter plot highlights how smaller economies often have highly concentrated trade relationships with major economic powers, while most countries maintain diversified trading portfolios with their major partners. This pattern of asymmetric dependencies is particularly evident in relationships influenced by geographic proximity, historical colonial ties, and economic size disparities. It’s important to remember that these edges represent only the major commercial relationships as identified by the World Factbook, meaning they capture the most significant trade flows from each country’s perspective rather than all trade relationships globally.

By subtracting the import network weights from the export network weights, and plotting a histogram of the resulting data, we can estimate the distribution of commercial relationships from most import-dependent to most export-dependent:

```wl
In[]:= With[{
     importEdges = EdgeList[globalWeightedImportRelationships], 
     importWeights = AnnotationValue[globalWeightedImportRelationships, EdgeWeight], 
     exportEdges = EdgeList[globalWeightedExportRelationships], 
     exportWeights = AnnotationValue[globalWeightedExportRelationships, EdgeWeight]}, 
    ReverseSort[Map[Subtract @@ Values[#] &, GroupBy[FilterRules[Join[Thread[exportEdges -> exportWeights], Thread[importEdges -> importWeights]], Intersection[importEdges, exportEdges]], First]]] // Labeled[Histogram[#, PlotRange -> Full, PlotLabel -> Style[&quot;Distribution of Trade Dependency Asymmetries in Global Commerce&quot;, 14]], Text /@ {&quot;Export dependency minus import dependency&quot;, &quot;Frequency&quot;}, {Bottom, Left}, RotateLabel -> True] & 
   ] // Rasterize[#, ImageSize -> Large, RasterSize -> 1500] &
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1pi2xibkyrpkm.png" alt="" width="1194" height="816" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1pi2xibkyrpkm-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1pi2xibkyrpkm-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1pi2xibkyrpkm-md.png 768w"></figure>

The x-axis measures the difference between import and export dependencies for each trading relationship. A value of zero on this axis represents a balanced trade relationship, in the sense that a country’s reliance on imports from another is equal to its reliance on exports to that same country. Negative values indicate a stronger import dependency, meaning a country imports more goods from another than it exports to them. Positive values suggest a stronger export dependency, where a country exports more to another than it imports.

We can also produce rankings of countries by the magnitude of their dependencies. Here are the top 10 largest trade asymmetries according to our data:

```wl
In[]:= With[{
      importEdges = EdgeList[globalWeightedImportRelationships], 
      importWeights = AnnotationValue[globalWeightedImportRelationships, EdgeWeight], 
      exportEdges = EdgeList[globalWeightedExportRelationships], 
      exportWeights = AnnotationValue[globalWeightedExportRelationships, EdgeWeight]}, 
     Labeled[#1, Text[Style[#2, 14]], Top] & @@@ Thread[{
        ReverseSort[Map[Subtract @@ Values[#] &, GroupBy[FilterRules[Join[Thread[exportEdges -> exportWeights], Thread[importEdges -> importWeights]] 
             , Intersection[importEdges, exportEdges]], First]]] // Map[Dataset, {Take[#, 10], Take[#, -10]}] &, 
        {&quot;Top 10 Relationships Where Countries Are Most Dependent on Partners as Export Markets&quot;, &quot;Top 10 Relationships Where Countries Are Most Dependent on Partners as Import Sources&quot;} 
       }] 
    ] // Reverse // Row[#, Spacer[10]] &
```

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/Screenshot-2025-08-16-at-11.31.11.png" alt="" width="1666" height="744" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/Screenshot-2025-08-16-at-11.31.11-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/Screenshot-2025-08-16-at-11.31.11-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/Screenshot-2025-08-16-at-11.31.11-md.png 768w"></figure>

Countries at the top of the import-dependent list (like Uruguay with Argentina) rely heavily on specific partners for their imports while exporting proportionally less to those same partners. Conversely, countries at the top of the export-dependent list (like Chad with the United States) are highly dependent on specific markets for their exports while importing proportionally less from those partners.

<h3 id="global-export-communities-by-modularity">Global export communities by modularity</h3>

The network visualizations we’ve examined so far don’t immediately show us how countries naturally cluster into trading groups or blocs. To identify these natural groupings, we can apply community detection algorithms to our weighted export network. Using modularity-based community detection on our weighted export network, we can identify clusters of countries that trade more with each other than with the rest of the world. 

*Visualise groups of countries whose mutual exports represent larger shares of total national exports than exports from other countries (white represents missing data):*

<figure class="post__image"><img src="https://phileasdg.github.io/media/posts/46/1whb0nt21kpwe.png" alt="" width="2758" height="462" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1whb0nt21kpwe-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1whb0nt21kpwe-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1whb0nt21kpwe-md.png 768w"></figure>

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/1a1ddw0auqv6f.png" alt="" width="2637" height="2009" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/1a1ddw0auqv6f-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/1a1ddw0auqv6f-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/1a1ddw0auqv6f-md.png 768w"></figure>

*Compare the plot above to this map of free trade areas worldwide form Wikipedia:*

<figure class="post__image"><img loading="lazy" src="https://phileasdg.github.io/media/posts/46/0pk71zdgnpvxx.png" alt="" width="1386" height="639" sizes="(max-width: 48em) 100vw, 100vw" srcset="https://phileasdg.github.io/media/posts/46/responsive/0pk71zdgnpvxx-xs.png 300w ,https://phileasdg.github.io/media/posts/46/responsive/0pk71zdgnpvxx-sm.png 480w ,https://phileasdg.github.io/media/posts/46/responsive/0pk71zdgnpvxx-md.png 768w"></figure>

*(**[Wikipedia: Trade bloc](https://en.wikipedia.org/wiki/Trade_bloc)**, Free trade areas worldwide, by user* *[Emilfaro](https://commons.wikimedia.org/wiki/User:Emilfaro)**)*

The modularity-based community detection results show striking regional patterns that largely overlap with established trade blocs and agreements. North America, South America, Europe, Russia and parts of Central Asia, China and parts of Southeast Asia, and Australia/New Zealand each form distinct communities. These natural groupings often mirror formal trade agreements like NAFTA, MERCOSUR, the EU, ASEAN, and others, demonstrating how geographic proximity and policy decisions reinforce natural trading patterns.

<h2 id="reflection-and-concluding-notes">Reflection and Concluding Notes</h2>

The analysis here reveals how smaller economies often develop asymmetric trade relationships with larger ones, sometimes relying heavily on a single partner for either imports or exports without reciprocity. These dependencies create potential vulnerabilities but also reflect practical economic realities shaped by geography, historical connections, and resource distribution.

Perhaps most interesting is how the detected trade communities largely align with formal trade agreements while occasionally revealing unexpected connections. These natural groupings demonstrate that while policy decisions certainly influence trade patterns, underlying economic complementarity and geographic proximity remain important forces in shaping global commerce.

This network perspective on international trade provides a different lens through which to understand global economic relationships; one that emphasizes connections and interdependencies rather than just individual country statistics. As global trade continues to evolve amid changing geopolitical landscapes, these network representations offer valuable insights into the resilience and vulnerability of international commercial relationships.

<h2 id="cite-this-work">Cite this work</h2>

[Trading places: a network analysis of global commerce](https://community.wolfram.com/groups/-/m/t/3416904)
by [Phileas Dazeley-Gaist](https://community.wolfram.com/web/phileasdg)
Wolfram Community, STAFF PICKS, March 14, 2025
[https://community.wolfram.com/groups/-/m/t/3416904](https://community.wolfram.com/groups/-/m/t/3416904)