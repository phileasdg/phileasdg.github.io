**Note: **This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live demonstrations or to download this text and source code as a Wolfram Notebook, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3096615?p_p_auth=jA2YdLGR). 

## Introduction

The forest fire model is one of the simplest computational models to display self-organised criticality. The model is a probabilistic cellular automaton with the following rules. At each computation/time step:

- Trees on fire burn down, leaving wasteland.

- Trees catch fire if they are adjacent to at least one tree already on fire.

- Tree cells catch fire independently with probability <em>P(f)</em>

- Trees grow in wasteland cells with probability <em>P(t)</em>

We'll use the following values for the possible cell states:

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.32.53.png =397x165)

Here is a visualisation of the fire-spreading process in two-dimensions, with <em>P(t)</em> and <em>P(f)</em> set to 0:

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.35.46.png =619x119)

In the implementation that follows, the <code>forestFireStep</code> function computes simulation steps. <em>P(f)</em> is specified using the option <code>"NewFireProb"</code>, and <em>P(t)</em> with <code>"NewTreeProb"</code>. I have introduced the two additional (optional) terms <code>"MaxNewFires"</code> and <code>"MaxNewTrees"</code>, allowing the user to specify the maximum numbers of new fires and trees per step in addition to the probabilities of spontaneous ignition and new tree growth. This allows for more intuitive and varied system setups.

## Implementation: Forest Fire Functions

<em>Retrieve the positions of trees, actively burning fires, and wasteland:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.37.56.png =259x104)

<em>Retrieve the positions of trees adjacent to actively burning fires in the landscape:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.38.21.png =673x115)

<em>Compute a forest fire simulation step:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.38.46.png =1772x802)
## Performing Forest Fire Simulations

Given an array defining the initial state of a landscape, the forestFireStep function returns the state of the landscape at the following time step. We'll see in a moment that it is flexible enough to be used to perform simulations in one, two, and three dimensions.

### Forest Fires on 2D Arrays

<em>Generate some forests:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.39.30.png =549x165)

<em>Compute a single step of a forest fire simulation on a 2D array:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-08-at-16.39.54.png =553x286)

You can specify the probabilities that tree cell spontaneously will catch fire, or that a wasteland cell will grow a tree with the <code>"NewFireProb"</code> and <code>"NewTreeProb"</code> options. Likewise, you can specify the maximum number of new fires or trees per step by specifying the options <code>"MaxNewFires"</code> and <code>"MaxNewTrees"</code>.

<em>Compute and animate 200 steps of a forest fire trajectory in a light forest with gaps and clearings:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-11.44.00.png =385x165)
![](https://phileasdg.github.io/media/posts/36/ForestFireAnim1.gif =530x404)

By default, <code>“MaxNewFires”</code> and <code>“MaxNewTrees”</code> are set to <code>∞</code>. When this is the case, the occurrence of new fires or trees is determined entirely by the <code>“NewFireProb”</code> and <code>“NewTreeProb”</code> options.

<em>Compute and animate 200 steps of a forest fire trajectory on a partitioned landscape:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-11.46.43.png =370x121)
![](https://phileasdg.github.io/media/posts/36/ForestFireAnim2.gif =529x402)

<em>Compute and animate 200 steps of a forest fire trajectory exhibiting self-organised criticality:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-11.50.24.png =390x221)
![](https://phileasdg.github.io/media/posts/36/ForestFireAnim3.gif =529x403)

<em>Produce time-series and phase space plots for the trajectory above:</em>

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-05-20-at-13.17.34.png =1402x976)
### One-Dimensional Forest Fires

We can apply the forest fire rules to one dimensional arrays as we would apply them in two dimensions. Rather than spreading to adjacent cells in two spatial dimensions, then, fires only spread along one.

Following the convention for 1-dimensional cellular automata, we stack the arrays for subsequent time steps vertically and in sequence. In the resulting graphic, space is represented horizontally and time flows vertically from top to bottom.

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-11.54.01.png =530x292)

See some one dimensional trajectories in the animation below, or head to [the original post](https://community.wolfram.com/groups/-/m/t/3096615) to see an interactive example:

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-12.07.29.png =609x208)
![](https://phileasdg.github.io/media/posts/36/ForestFireAnim4-2.gif =434x499)
### Forest Fires in 3D

In three dimensions, we can also define forested landscapes with more complicated topographies, for example, by layering different cell types. 

The following example is of a forested layer on top of a layer of soil. Both layers vary in thickness (check out [the original post](https://community.wolfram.com/groups/-/m/t/3096615) for the interactive version).

*Three-dimensional forest fire model trajectories through a dense hilly forest.*

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-13.16.57.png =1378x616)

Depending on the forest initial configuration, it can be difficult to visualise all cell states at once. This is the case for forest fire trajectories through dense volumes of trees, for example:

*Three-dimensional forest fire model trajectories through a cubic forest:*

![](https://phileasdg.github.io/media/posts/36/Screenshot-2024-07-26-at-13.17.50.png =1378x852)
### Closing Note

I hope you found these examples interesting and entertaining! The implementation discussed in this short text should in principle work for higher than 3-dimensional arrays but I have not tested it for such cases. If you do, please make sure to share your results in the comment section under this post. In fact, please feel free to share any interesting behaviours you find or modifications you make in the comments! I look forward to hearing your ideas and suggestions! 

### Sources

- ['Forest-Fire Model'. In Wikipedia, 18 August 2023.](https://en.wikipedia.org/w/index.php?title=Forest-fire_model&oldid=%201170972820)
- [E, C. 'Answer to "Can You Apply the Cellular Automata Function to a Grid Containing Numbers?"' Mathematica Stack Exchange, 5 January 2014.](https://mathematica.stackexchange.com/questions/39793/can-you-apply-the-cellular-automata-function-to-a-grid-containing-numbers/39863#39863)
- [Bak, Per, Kan Chen, and Chao Tang. 'A Forest-Fire Model and Some Thoughts on Turbulence'. Physics Letters A 147, no. 5 (16 July 1990): 297-300.](https://www.sciencedirect.com/science/article/abs/pii/037596019090451S?via%3Dihub)