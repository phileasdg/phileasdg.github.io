## Update:

You can read an expanded exploration of this project at [this Wolfram community forum page](https://community.wolfram.com/groups/-/m/t/2816083). If you're interested in interacting directly with my code, that's the place. ;) If not, feel free to keep reading on! :) 

## Pre(r)amble

<figure class="post__image">I still haven't found the best way to share Mathematica projects, which is a shame because it has quickly become my favourite prototyping and computational exploration programming language. Somehow, linking to Mathematica notebooks in the cloud just doesn't feel right. It feels like cheating, like I'm getting away with a pretend blog post. It's all pretty silly, but there you go. <br/><br/>Just a couple days ago, I wrote a notebook implementing a video feedback synthesis process diagram by José María Castelo from his project [MorphogenCV](https://github.com/jmcastelo/MorphogenCV). <br/><br/>Here is José's diagram: <br/><br/>![](../../media/posts/digital-image-feedback-synthesis//image.png =449x824)</figure>

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

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-08-at-22.01.52.png =214x115)

Let's preprocess the image: 

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-17.59.13.png =697x276)

Now, let's take the prepared image, and apply the processes described in the previous section to three separate copies:

The first process: 

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.00.13.png =694x270)

The second process: 

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.00.42.png =698x213)

The third process:

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.01.11.png =693x302)

Finally, we blend the resulting images together:

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.15.41.png =693x309)

Here is a visualisation of the steps of the process: 

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.16.52.png =698x165)

All that's left to do is tie these steps together in a function:

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.18.03.png =696x537)

Let's visualise the first few iterations of feedback from a starting image at some arbitrary settings:

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.19.36.png =696x234)

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.20.34.png =696x446)

Then let's visualise the result after many iterations starting from the same input.

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.22.42.png =694x245)

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.25.43.png =697x382)

Here are some examples of output I got from playing around with the settings for a bit:

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.26.26.png =696x358)

You get these interesting stripy shapes for even very simple inputs, for instance: 

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.28.21.png =695x372)

![](../../media/posts/digital-image-feedback-synthesis/Screenshot-2022-12-09-at-18.28.41.png =1336x738)

I hope this exploration was fun! I'll end this post with a gallery of curated outputs from playing around with different inputs and settings: 

<div class="gallery-wrapper"><div class="gallery" data-columns="3" data-is-empty="false" data-translation="Add images"><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern1-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern1-3-thumbnail.png =768x762)</a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern2-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern2-3-thumbnail.png =768x762)</a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern3-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern3-3-thumbnail.png =768x762)</a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern4-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern4-3-thumbnail.png =768x762)</a></figure><figure class="gallery__item"><a data-size="1000x992" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern5-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern5-3-thumbnail.png =768x762)</a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern6-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern6-3-thumbnail.png =768x768)</a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern7-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern7-3-thumbnail.png =768x768)</a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern8-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern8-3-thumbnail.png =768x768)</a></figure><figure class="gallery__item"><a data-size="1000x1000" href="../../media/posts/digital-image-feedback-synthesis/gallery/pattern9-3.png">![](../../media/posts/digital-image-feedback-synthesis/gallery/pattern9-3-thumbnail.png =768x768)</a></figure>