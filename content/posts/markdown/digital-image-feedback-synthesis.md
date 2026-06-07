---
title: "Digital Image Feedback Synthesis"
date: "2022-12-09T03:57"
tags: ["Art","Complex Systems","Modelling","Programming","Undergraduate work","Wolfram Language"]
thumbnail: "media/posts/23/Screenshot-2022-12-08-at-23.12.15.png"
thumbWidth: 1258
thumbHeight: 736
---

## Update:

You can read an expanded exploration of this project at [this Wolfram community forum page](https://community.wolfram.com/groups/-/m/t/2816083). If you're interested in interacting directly with my code, that's the place. ;) If not, feel free to keep reading on! :) 

## Pre(r)amble

<figure class="post__image">I still haven't found the best way to share Mathematica projects, which is a shame because it has quickly become my favourite prototyping and computational exploration programming language. Somehow, linking to Mathematica notebooks in the cloud just doesn't feel right. It feels like cheating, like I'm getting away with a pretend blog post. It's all pretty silly, but there you go. <br/><br/>Just a couple days ago, I wrote a notebook implementing a video feedback synthesis process diagram by José María Castelo from his project [MorphogenCV](https://github.com/jmcastelo/MorphogenCV). <br/><br/>Here is José's diagram: <br/><br/><img alt="" height="824" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23//image.png" srcset="../../../media/posts/23//responsive/image-xs.png 300w, ../../media/posts/23//responsive/image-sm.png 480w, ../../media/posts/23//responsive/image-md.png 768w" width="449"/></figure>

<br/><br/>In this blog post, I'm going to write about this implementation and the cool things it does. I'll explore the code, providing explanations and code output as examples. Note: In this project, I wrote my code above all to be readable. It is quite slow, and I may rewrite it some day to be much faster. There are many obvious ways it could be improved, but I am satisfied now with how easy it is to parse when reading.

## Video Feedback

Video feedback is a unique visual phenomenon that occurs when a video camera is pointed at a monitor displaying the camera's own output. This creates a feedback loop, resulting in a pattern of video distortion and abstraction. By following José's diagram, we will be able to create a Mathematica function that can simulate this phenomenon and produce really cool video feedback patterns. Let's begin.

## Understanding the process

José's diagram allows us to break the feedback synthesis into discrete steps for each recursion. These are:

1. Preprocessing the input image by equalizing its histogram and optionally shifting the image hue.
2. Make three copies of the preprocessed input, and process them according to three different processes. The first process applies contrast, brightness, sharpening, rotating, and resizing adjustments to the copy. The second applies two blurring adjustments to the copy. Lastly, the third applies contrast, brightness, erosion, and blur to the copy.
3. Blend the processed copies

## Implementation

Let's see what this looks like in practice! First, let's define an input image:

<figure class="post__image"><img alt="" height="115" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-08-at-22.01.52.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-08-at-22.01.52-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-08-at-22.01.52-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-08-at-22.01.52-md.png 768w" width="214"/></figure>

Let's preprocess the image: 

<figure class="post__image"><img alt="" height="276" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-17.59.13.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-17.59.13-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-17.59.13-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-17.59.13-md.png 768w" width="697"/></figure>

Now, let's take the prepared image, and apply the processes described in the previous section to three separate copies:

The first process: 

<figure class="post__image"><img alt="" height="270" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.00.13.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.13-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.13-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.13-md.png 768w" width="694"/></figure>

The second process: 

<figure class="post__image"><img alt="" height="213" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.00.42.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.42-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.42-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.00.42-md.png 768w" width="698"/></figure>

The third process:

<figure class="post__image"><img alt="" height="302" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.01.11.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.01.11-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.01.11-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.01.11-md.png 768w" width="693"/></figure>

Finally, we blend the resulting images together:

<figure class="post__image"><img alt="" height="309" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.15.41.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.15.41-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.15.41-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.15.41-md.png 768w" width="693"/></figure>

Here is a visualisation of the steps of the process: 

<figure class="post__image"><img alt="" height="165" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.16.52.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.16.52-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.16.52-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.16.52-md.png 768w" width="698"/></figure>

All that's left to do is tie these steps together in a function:

<figure class="post__image"><img alt="" height="537" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.18.03.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.18.03-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.18.03-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.18.03-md.png 768w" width="696"/></figure>

Let's visualise the first few iterations of feedback from a starting image at some arbitrary settings:

<figure class="post__image"><img alt="" height="234" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.19.36.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.19.36-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.19.36-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.19.36-md.png 768w" width="696"/></figure>

<figure class="post__image"><img alt="" height="446" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.20.34.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.20.34-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.20.34-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.20.34-md.png 768w" width="696"/></figure>

Then let's visualise the result after many iterations starting from the same input.

<figure class="post__image"><img alt="" height="245" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.22.42.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.22.42-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.22.42-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.22.42-md.png 768w" width="694"/></figure>

<figure class="post__image"><img alt="" height="382" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.25.43.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.25.43-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.25.43-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.25.43-md.png 768w" width="697"/></figure>

Here are some examples of output I got from playing around with the settings for a bit:

<figure class="post__image"><img alt="" height="358" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.26.26.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.26.26-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.26.26-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.26.26-md.png 768w" width="696"/></figure>

You get these interesting stripy shapes for even very simple inputs, for instance: 

<figure class="post__image"><img alt="" height="372" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.28.21.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.21-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.21-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.21-md.png 768w" width="695"/></figure>

<figure class="post__image"><img alt="" height="738" loading="lazy" sizes="(max-width: 48em) 100vw, 100vw" src="../../media/posts/23/Screenshot-2022-12-09-at-18.28.41.png" srcset="../../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.41-xs.png 300w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.41-sm.png 480w, ../../media/posts/23/responsive/Screenshot-2022-12-09-at-18.28.41-md.png 768w" width="1336"/></figure>

I hope this exploration was fun! I'll end this post with a gallery of curated outputs from playing around with different inputs and settings: 

<div class="gallery-wrapper"><div class="gallery" data-columns="3" data-is-empty="false" data-translation="Add images"><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/23/gallery/pattern1-3.png"><img alt="" height="762" loading="lazy" src="../../media/posts/23/gallery/pattern1-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/23/gallery/pattern2-3.png"><img alt="" height="762" loading="lazy" src="../../media/posts/23/gallery/pattern2-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/23/gallery/pattern3-3.png"><img alt="" height="762" loading="lazy" src="../../media/posts/23/gallery/pattern3-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/23/gallery/pattern4-3.png"><img alt="" height="762" loading="lazy" src="../../media/posts/23/gallery/pattern4-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/23/gallery/pattern5-3.png"><img alt="" height="762" loading="lazy" src="../../media/posts/23/gallery/pattern5-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/23/gallery/pattern6-3.png"><img alt="" height="768" loading="lazy" src="../../media/posts/23/gallery/pattern6-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/23/gallery/pattern7-3.png"><img alt="" height="768" loading="lazy" src="../../media/posts/23/gallery/pattern7-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/23/gallery/pattern8-3.png"><img alt="" height="768" loading="lazy" src="../../media/posts/23/gallery/pattern8-3-thumbnail.png" width="768"/></a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/23/gallery/pattern9-3.png"><img alt="" height="768" loading="lazy" src="../../media/posts/23/gallery/pattern9-3-thumbnail.png" width="768"/></a></figure></div>

</div>