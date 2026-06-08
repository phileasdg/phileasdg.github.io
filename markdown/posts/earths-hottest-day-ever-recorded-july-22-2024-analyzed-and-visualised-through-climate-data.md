July 22, 2024 was the hottest day in recorded history, according to provisional data from the European climate service.

**Note: **This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live demonstrations or to download this text and source code as a Wolfram Notebook, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3234937). 

## Introduction

On July 24 2024, [the Associated Press reported that July 22, 2024 broke the record for the hottest day ever recorded on earth](https://apnews.com/article/hottest-day-ever-climate-change-weather-heat-extreme-global-warming-8e2b0b7fa0360ecb931ca333a832c694), according to provisional data from the European climate service, Copernicus.

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">In the article, Sibi Arasu and Seth Borenstein report that “Monday was 0.06 degrees Celsius (0.1 degree Fahrenheit) hotter than Sunday, which was .01 degrees Celsius hotter (0.2 degrees Fahrenheit) than the previous hottest day on record, July 6, 2023.”

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">The data they cite are from the <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-single-levels?tab=overview" target="_blank" data-testid="ButtonBoxView" rel="noopener">ECMWF Reanalysis v5 (ERA5) dataset</a>, which provides hourly spatial estimates of many of atmospheric, land and oceanic climate variables, including surface air temperature and sea surface temperature, daily, from 1940 to the present day.

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">While Copernicus provides free access to these data, the size of raw dataset files (which are large gridded data layer stacks stored in NetCDF format) makes many ad hoc analyses prohibitively expensive. However, and fortunately, Copernicus and the University of Maine’s Climate Change Institute both provide trackers for the average global temperature based on ERA5 data. These are:

- Copernicus’ Climate Pulse: <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://pulse.climate.copernicus.eu/" target="_blank" data-testid="ButtonBoxView" rel="noopener">https://pulse.climate.copernicus.eu/</a> (near real time, typically 2 days behind)

- The University of Maine’s Climate Reanalyzer: <a class="GsEf0r4HiEK6fH_vutb_b EEKKPz0N2Ww3GdmB51Zgq" href="https://climatereanalyzer.org/clim/t2_daily/?dm_id=world" target="_blank" data-testid="ButtonBoxView" rel="noopener" style="font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">https://climatereanalyzer.org/clim/t2_daily/?dm_id=world</a> (a few more days delay)

<div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">How easy would it be to import and study these data in the Wolfram Language? Let’s find out.

## Getting Global Mean Surface Temperature Data

### Importing and Preprocessing Data from Climate Pulse:

Climate Pulse conveniently provides a [link](https://sites.ecmwf.int/data/climatepulse/data/series/era5_daily_series_2t_global.csv) to download a table of global surface air temperature data from 1940 to the latest data available. Let’s import these data:

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.20.10.png =2014x180)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.20.43.png =371x190)

Neat! The columns key (dropped from the .csv table during the import) defines the columns as: 

`# Columns:`<br><br>`#  2t: Daily mean absolute temperature based on hourly values from 00 to 23 UTC`<br>`#  clim_91-20: Daily climatology for 1991-2020`<br>`#  ano_91-20: Daily anomaly relative to the 1991-2020 daily climatology`<br>`#  status: Preliminary or final`<br><br>`# Units: deg. C`<br>`# Last updated: 25 Jul 2024`

To construct time series from these data, it'll help to convert the values from the date column into Wolfram Language date objects:

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.21.51.png =2204x76)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.22.06.png =371x186)

### Constructing and Plotting Time Series from the Data:

Now that we have the data, we can get a time series of daily mean absolute temperatures like so:

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.22.57.png =1490x62)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.23.35.png =352x66)

Plotting it is as easy as: 

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.24.05.png =548x96)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.24.32.png =1458x982)

### Verifying the Claims Made by the AP &amp; Others:

Based on these data, was the hottest day on record really last Monday? Let's confirm:

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.25.02.png =270x29)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.25.15.png =371x67)

What were the top 5 hottest recorded days since 1940?

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.25.45.png =276x26)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.26.05.png =373x155)

Note that the top four hottest days on record were this month.

## Reproducing the Famous Global Mean Surface Temperature Multi-Year Overlay Plot

With the data we have collected, we can now reproduce the now famous year over year plot of global mean surface temperatures from Climate Pulse.

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.26.54.png =2610x1398)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.27.20.png =1266x1586)

## Getting These Data for Specific Time Ranges and Regions from Climate Reanalyzer

It would be helpful to have a function that automates the process of importing these data for different available regions and time ranges. <br>This task is quite straightforward using data from Climate Reanalyzer.

*Define a function to import time series from Climate Reanalyzer:*

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.28.05.png =1978x424)

The function supports importing data from six regions, specified with the area parameter: 

- "World" ---&gt; The whole world, 90°S-90°N, 0-360°E

- "NH" ---&gt; The northern hemisphere, 0-90°N, 0-360°E

- "SH" ---&gt; The southern hemisphere, 0-90°S, 0-360°E

- "Arctic" ---&gt; 66.5-90°N, 0-360°E

- "Antarctic" ---&gt; 66.5-90°S, 0-360°E

- "Tropics" ---&gt; 23.5°S-23.5°N, 0-360°E

And takes an optional second argument specifying the start and end date for the requested data range in a list (from January 1st 1940 to seven days ago).

Consider the following examples:

*Request and plot the time series of daily surface temperatures in the Arctic from 1990 to 2000:*

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.29.31.png =530x126)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.31.09.png =1180x786)

## Map Animations:

Climate Pulse hosts recent raster maps of global surface temperatures. Here is the one corresponding to last Monday:

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.31.40.png =1348x784)

I'd like to take a moment to highlight my RemoteSensing paclet, which presently provides a WL interface to NASA's GIBS and AppEEARS APIs for remote sensing data retrieval. While my paclet does not yet support access to Copernicus ERA5 data (look out for future releases), GIBS and AppEEARS both provide access to similar data products, which we can import and work with directly in the Wolfram Language.

Please feel free to consult the paclet documentation here: [https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/)

*To install the paclet, run the following code: *

*`PacletInstall["PhileasDazeleyGaist/RemoteSensing"]`*

*Load the paclet: *

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.32.55.png =347x29)

*Using GIBSData, list global surface air temperature products:*

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.33.17.png =1520x44)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.33.30.png =2434x96)

*Animate a map using one of these products:*

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Screenshot-2024-07-28-at-03.37.14.png =1732x212)

![](https://phileasdg.github.io/media/posts/earths-hottest-day-ever-recorded-july-22-2024-analyzed-and-visualised-through-climate-data/Animation2.gif =1114x484)

## Conclusion

In this article, we've explored how one can readily access and analyse global climate data using the Wolfram Language. We've shown how one can pull daily global mean surface air temperature data from specific geographical ranges and plot the data over time, as well as how to import recent raster maps of global surface temperatures from Copernicus' Climate Pulse. We've also highlighted the RemoteSensing paclet, a powerful tool that can interface with NASA's GIBS and AppEEARS APIs for convenient remote sensing data retrieval. 

With these functionalities, researchers in climate science and related fields are better equipped to analyse and interpret vast amounts of climate data right from within the Wolfram Language.