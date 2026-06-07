---
title: "Remote Sensing for the Wolfram Language"
date: "2023-07-12T05:58"
tags: ["Environmental Science","Geography & GIS","Programming","Wolfram Language","Work at Wolfram"]
thumbnail: "media/posts/28/BlogHeader-2.png"
thumbWidth: 2000
thumbHeight: 1017
---

## Some Context

This summer, I was fortunate to attend the Wolfram Summer School at Bentley University in Waltham MA. It was a fast-paced, intense, challenging and exciting experience, and I am grateful to all who contributed to making it such a motivating and worthwhile three weeks. 

The Wolfram Summer School is an educational program hosted by Wolfram Research, the company behind Wolfram Alpha, Mathematica, and the Wolfram Language. It brings together students once a year to explore cutting-edge computational topics, problem-solving techniques, and hands-on projects using Wolfram tech. Students engage in collaborative learning, work on their projects with industry experts, and develop practical skills in computational thinking and programming. 

At the heart of the program for each student is their summer school project. Students at the Wolfram Summer School choose (or are sometimes assigned) a project to work on in meetings with Stephen Wolfram and their summer school mentors. For my project, I decided to build as versatile and robust a remote sensing tool as I could for the Wolfram Language. 

My project progressed quickly throughout the program with the help and guidance of my project mentor, [Christopher Wolfram](https://christopherwolfram.com/), whose support was crucial to my success. At the end of the summer school, I delivered a presentation on my work, as well as a [post on the Wolfram Community forum](https://community.wolfram.com/groups/-/m/t/2959942), and a [Wolfram Language paclet: RemoteSensing](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/). 

You can also view other WSS projects [here](https://www.wolframcloud.com/obj/microsites/summerschool/projects.html).

## The RemoteSensing Paclet

**Just a heads up: **If you decide to try my paclet, be aware that it is and will likely continue to be a bit of a *work-in-progress*. I have found it to be quite robust, but you may encounter bugs, as well as service outages from the NASA GIBS and AppEEARS APIs. If you encounter issues with my paclet, including bugs or unclear documentation, please do not hesitate to contact me so that I may address them!

**What is the RemoteSensing Paclet? **<span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">The </span>[<span class="cc8" data-native-text="true">RemoteSensing paclet</span>](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/)<span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);"> contains various functions that allow you make requests to the GIBS and A</span><span class="cc7" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">ρρ</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">EEARS APIs for geographic products from various US federal agencies, and work with the returned data in the Wolfram Language. The RemoteSensing GIBS functions can be used with </span><span class="cc28" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">GeoImage</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);"> and </span><span class="cc28" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">GeoGraphics</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);"> through the </span><span class="cc28" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">GeoServer</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);"> option, while the A</span><span class="cc7" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">ρρ</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">EEARS functions can be used to request scientific grade geographic data product samples.</span>

### Installation

To install the RemoteSensing paclet to your version of Wolfram Language, you'll need to run the following lines of code:

<figure class="post__image"><img alt="" height="318" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-18.46.45.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-18.46.45-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-18.46.45-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-18.46.45-md.png 768w" width="1290"/></figure>

The second line is not strictly necessary, but it will help you to make sure the paclet installed correctly, and you have the latest version (1.0.3 as of Jul 21 2023, when I am writing this blog post). 

### Example Usage

Once you have the paclet installed and imported into your active kernel session, it's ready to use! So let's see some simple examples of what that can look like.

Please note: Admittedly, this short blog post leaves out a fairly large number of things you can do with the RemoteSensing paclet. If you'd like to know more about what is possible with it (including making timelapse animations with NASA imagery), I strongly suggest you take a look at my [Wolfram Community post](https://community.wolfram.com/groups/-/m/t/2959942) about RemoteSensing, and the [RemoteSensing paclet repository page](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/).

<h4>GIBS</h4>

<span class="cc4" data-native-text="true">The NASA GIBS (Global Imagery Browse Services) API is a web service provided by NASA used to access and retrieve satellite imagery and related data. The API provides an interface to access a vast collection of global Earth science data through WMTS (Web Map Tile Service).</span><br/><span class="cc4" data-native-text="true">​</span><span class="cc4" data-native-text="true">​</span><br/><span class="cc4" data-native-text="true">GIBS provides raster tiles, which can be useful for visualisation and data exploration, but should be avoided for serious research, as it does not provide access to the raw layer data. Its advantages are that is is fast, pretty robust, and very flexible.</span>

To request GIBS data using the RemoteSensing paclet, you'll make use of the following functions:

1. `GIBSData` which retrieves information about available GIBS layers.
2. <code style="font-weight: var(--font-weight-normal);">GIBSGeoServer</code> which builds a `GeoServer` request template for a layer.

Here's an example showing how you might use them: 

Find a layer of interest:

<figure class="post__image"><img alt="" height="198" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-20.21.34.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.21.34-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.21.34-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.21.34-md.png 768w" width="1352"/></figure>

Consult information about the layer:

<figure class="post__image"><img alt="" height="187" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-20.22.02.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.22.02-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.22.02-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.22.02-md.png 768w" width="519"/></figure>

Visualise layer using either `GeoGraphics` or `GeoImage`:

<figure class="post__image"><img alt="" height="384" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-20.23.39.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.23.39-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.23.39-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.23.39-md.png 768w" width="1376"/></figure>

Customise your visualisation as you might with any other `GeoGraphics` or `GeoImage` plot:

<figure class="post__image"><img alt="" height="584" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-20.24.07.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.24.07-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.24.07-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-20.24.07-md.png 768w" width="1316"/></figure>

And there you go! You've made a visualisation using a NASA GIBS WMTS product.

<h4><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit;">A</span><span class="cc7" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit;">ρρ</span><span class="cc6" data-native-text="true" style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit;">EEARS</span></h4>

<span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS is a geographic data access service provided by NASA. </span><span class="cc4" data-native-text="true">The </span>[<span class="cc6" data-native-text="true">A</span><span class="cc7" data-native-text="true">ρρ</span><span class="cc6" data-native-text="true">EEARS website</span>](https://appeears.earthdatacloud.nasa.gov/)<span class="cc4" data-native-text="true"> describes it like so: “The Application for Extracting and Exploring Analysis Ready Samples (A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS) offers a simple and efficient way to access and transform geospatial data from a variety of federal data archives. A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS enables users to subset geospatial datasets using spatial, temporal, and band/layer parameters.”</span><br/><span class="cc4" data-native-text="true">​</span><br/><span class="cc4" data-native-text="true">A<span class="cc5" data-native-text="true">ρρ</span>EEARS requires you to be signed in on </span>[<span class="cc6" data-native-text="true">NASA EarthData</span>](https://www.earthdata.nasa.gov/)<span class="cc4" data-native-text="true">. Fortunately, it’s quite easy (and most importantly, free) to register an account, and the RemoteSensing paclet provides tools to log you in programmatically.</span><br/><span class="cc4" data-native-text="true">​</span><br/><span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS allows you to access the real recorded data values for any available remote sensing product it offers. This makes it an appropriate tool to use if you are in need of accurate data for analysis or other scientific research. However, it is not so good for data exploration, as it can be fairly slow depending on the scale of the task and the availability of the API, and it will often return large numbers of heavy files. Use A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS if you already know what you want, and you need precise and accurate data.</span>

To request <span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS</span> data using the RemoteSensing paclet, you'll make use of the following functions:

1. `AppEEARSData` which retrieves information about available <span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS</span> products and layers.
2. <code style="font-weight: var(--font-weight-normal);">AppEEARSImages</code> which makes a request to <span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS and returns the resulting data when it completes.</span>

Now, the <span class="cc4" data-native-text="true">A</span><span class="cc5" data-native-text="true">ρρ</span><span class="cc4" data-native-text="true">EEARS workflow is a little different because depending on your task, you might prefer to make an A<span class="cc5" data-native-text="true">ρρ</span>EEARS request and work with it asynchronously. This is a little more involved, and although I will not show examples of it here, you can find some in my [community post](https://community.wolfram.com/groups/-/m/t/2959942), and the [paclet documentation](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/).</span>

Get a list of available A<span class="cc5" data-native-text="true">ρρ</span>EEARS products with `AppEEARSData`:

<figure class="post__image"><img alt="" height="114" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-21.29.03.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.29.03-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.29.03-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.29.03-md.png 768w" width="1538"/></figure>

Get information about a product:

<figure class="post__image"><img alt="" height="452" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-21.28.21.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.28.21-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.28.21-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.28.21-md.png 768w" width="625"/></figure>

The above dataset contains the names of available <span class="cc4" data-native-text="true">A<span class="cc5" data-native-text="true">ρρ</span>EEARS</span> layers for the MYDO9GA product. Now, to request information about a specific layer, you might do this:

<figure class="post__image"><img alt="" height="565" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-21.27.33.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.33-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.33-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.33-md.png 768w" width="617"/></figure>

And you might make a request for <span class="cc4" data-native-text="true">A<span class="cc5" data-native-text="true">ρρ</span>EEARS</span> imagery using <code style="font-weight: var(--font-weight-normal);">AppEEARSImages</code> <span style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">like this (note that this might take some time to process)</span><span style="color: var(--text-primary-color); font-family: var(--editor-font-family); font-size: inherit; font-weight: var(--font-weight-normal);">:</span>

<figure class="post__image"><img alt="" height="607" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/28/Screenshot-2023-07-21-at-21.27.00.png" srcset="../../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.00-xs.png 300w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.00-sm.png 480w, ../../media/posts/28/responsive/Screenshot-2023-07-21-at-21.27.00-md.png 768w" width="580"/></figure>

## Closing thoughts

If you've read this far, I hope this blog post has inspired you to try [my paclet](https://resources.wolframcloud.com/PacletRepository/resources/PhileasDazeleyGaist/RemoteSensing/) for yourself. Just take a chance to mess around with it! I am actively working to maintain and improve it, and I am always excited to receive [feedback](../../pages/inquiries/) about my work! If you find bugs or have suggestions for its improvement, please don't hesitate to be in touch with me! I look forward to your notes!