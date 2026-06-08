**Note: **This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live demonstrations or to download this text and source source code as a Wolfram Notebook, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3028599). For brevity and readability, I've omitted several code implementation sections which were present in the original article. If you're looking to reproduce a function from this article and need the source code, please head to the original post.

## Introduction: A review of the Lotka-Volterra Model

### Overview

<div class="cell" id="cell-c3a94280-e8a4-4954-ac9d-109d26687d61"><div class="native-layout native-layout-simple">The Lotka-Volterra model, proposed in the early 20th century by mathematicians Alfred J. Lotka (1880-1949) and Vito Volterra (1860-1940), is an influential framework widely used to explore population dynamics of closed ecological systems.

<div class="cell" id="cell-6a2d1478-3121-4d98-924f-9325cd35f2f4"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">In general, the Lotka-Volterra model refers to the classic two-species construction by Lotka and Volterra, in which the respective instantaneous rates of population change of a predator and prey species are tied to the other species’ population size. In the two species case, the Lotka-Volterra model usually results in periodic population “boom and bust” cycles in which the predator population closely follows but lags behind the prey’s (Bacaër 2011).

<div class="cell" id="cell-45ba991c-2672-48ea-bd83-7c376c0fba06"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">Lotka proposed the classic formulation of the model in 1910 as a model of autocatalytic chemical reactions (Lotka 1910). In 1920, he applied the model to a two species food chain involving an idealised plant species and grazing predator (Lotka 1920). In 1925, Volterra independently began studying predator-prey interactions and published a short discussion of the subject in 1926 (Bacaër 2011). While Volterra’s work on the subject focused strictly on modelling predator-prey interactions in fisheries (Volterra 1927), Lotka took a broader interest in exploring competitive interactions and studying the “energetics of evolution” (Lotka 1922). He argued that natural selection could be understood as a physical principle as general as the laws of thermodynamics (Kingsland 2015).

<div class="cell" id="cell-c2b48c5c-b6f1-4b04-be5c-3dedc320f043"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">Lotka’s work is noteworthy beyond its contributions to the fields of theoretical population ecology, physical chemistry, and dynamical systems (non-exhaustive) for its interdisciplinarity. He envisioned and worked to create a new biological discipline, “physical biology”, which would apply physical principles and techniques to the study of biological systems composed of processes involving the exchange of matter or energy between system components (Kingsland, 2015). Lotka collected and published these ideas in Elements of Physical Biology (1925).

<div class="cell" id="cell-64e966f6-bdd6-4625-88b1-c3c0e5efbd49"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">Lotka-Volterra models serve as critical conceptual tools for ecologists, lending remarkable insights into real-world ecological system dynamics. Its simplicity makes it an excellent choice to demonstrate key ideas about predator-prey interactions, including the influential concept of the prey-predator cycle, whereby prey abundance increases followed by a delayed increase in predators. Its principles have been refined and extended by many subsequent researchers and continue to hold relevance. The primary contribution of the Lotka-Volterra model to the field of ecology is the theoretical underpinning it provides for understanding interspecies interactions, (mainly predation and competition). This fundamental understanding has guided the development of more complex models for describing the dynamics of entire ecosystems.

### How does it work?

<div class="cell" id="cell-f023857b-392c-44a9-ae6e-9bdbaf3b962e"><div class="native-layout native-layout-simple">Consider two species, one which preys on the other (for example, the Canada lynx and snowshoe hare). Let <em>x(t)</em> be the population density of the prey, and <em>y(t)</em> be the population density of the predators at time <em>t</em>. To capture how the populations of each species will vary over time, we need two kinds of information:

<div class="cell" id="cell-5239e989-3a09-491c-8b0c-4b1648af9769"><ol>- The growth rates of the species population in the absence of the other species.
- The effect of the presence of the other species on each species’ growth.
</ol>

<div class="cell" id="cell-bb246bdb-f5b8-461b-8235-c004afe4bf3f"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">In the classic formulation by Alfred J. Lotka, (1920), these parameters are <em>a</em>, <em>b</em>, <em>c</em>, and <em>d</em>, where:

<div class="cell" id="cell-a3ba13e8-e138-432e-ac6f-e82c06d31edb"><div class="HExNUSO6Shz5hgqMOEW9X"><div class="cell-dingbat">
- <em>a</em> is the intrinsic growth rate of the prey species
- <em>b</em> is the effect of the predators on the prey species growth rate; the rate at which predators kill prey
- <em>c</em> is the death rate of the predator species when there are no prey
- <em>d</em> is the effect of the prey on the predator species growth rate; the rate at which the predator population grows from consuming prey

<div class="cell" id="cell-66e601fc-fea5-4394-9542-5575b3f4df4c"><div class="_3Dqn7hOe5vVS6Nh0S54gcV"> 

<div class="native-layout native-layout-simple">Using these parameters, we can write the coupled system of ordinary differential equations:

<div class="cell" id="cell-4a78be8d-14d9-414a-be6b-8d0cff42114c"><div class="_3Dqn7hOe5vVS6Nh0S54gcV">![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.03.23.png =198x127)

<div class="cell" id="cell-e07d02be-46c2-4e1e-b152-dc7aa7f24459"><div class="native-layout native-layout-simple">We assume that each of these parameters is positive. The terms <em>-b x y</em> and <em>d x y</em> indicate that the larger prey and predator species are, the higher the mass/population/energy transfer from prey to predators will be.<br/>

### *Implementation: *In the Wolfram Language

Setting up a Lotka-Volterra model in the Wolfram Language is very straightforward using `[NDSolve](http://reference.wolfram.com/mathematica/ref/NDSolve.html)`, WL’s numerical differential equations solver.

- Since we know the model takes two initial conditions (species population sizes) and four parameters (*a*, *b*, *c*, *d*), we can write a helper function that takes in this information and returns the appropriate coupled equations:

*Set up the ODEs and initial conditions describing a two-species Lotka-Volterra model:*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.14.07.png =415x264)

*Example:*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.14.36.png =323x116)

- Now, we can simply call our helper function inside NDSolve, specifying our initial conditions and parameters. Additionally, we supply a list of variables to solve for, and another containing the name and range of the independent variable, *t*.

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2023-10-10-at-14.28.14.png =1388x198)

- Finally, we can plot these results in the time domain and state space:

*Time domain plot:*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.09.18.png =461x298)

*State space portrait: (I have iconised the options to make the code more readable, please visit the original community post to view the full code)*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.12.40.png =1452x1238)

## Relationships and Food Webs

### Predation Relationships and Food Webs

Suppose we would like to extend our model to three or more species. For a given *n*-species system, will need too keep track of the **relationships** between species, and their **effects** on one another. We will discuss two ways of storing this information: one to facilitate our conceptual understanding of model configurations, and the other to facilitate the process of building the model system of ODEs. We will discuss the first of these ways here.

Notice that as the number of species n in our model grows, so does the number of possible relationships between species (at a rate of 2^*n*, or 2^(*n*-1) if we assume the absence of cannibalism in the community). The number of possible combinations of relationships also grows without bounds (at a rate of 2^(*n*^2), or 2^((*n*-1)^2)without cannibalism). A set of predation relationships between species is known as a food web.

In a food web, predation relationships are usually represented as arrows from prey to predator species, representing transfer of energy up the web’s component food chains.

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.15.55.png =234x278)

Since food webs are graphs, we can express them directly in the Wolfram Language using Graph objects (see documentation: `[Graph](https://reference.wolfram.com/language/ref/Graph.html)`). Not all food web configurations will be ecologically meaningful, and some will be analogous to one-another, but expressing them like this helps to get a strong qualitative impression of the relationships they depict (Are we modelling a really simple web, or is it very complicated? How tangled is it? How loopy? How close together are the species? Do they form clusters? And so on). We can also answer questions about the food web parameter spaces. For instance: what structurally distinct categories of 3-species food web are there?

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.17.56.png =481x577)

### Aside: What species relationships are possible in an *n*-species system?

We can write a function to generate the possible predation configurations for a species in an n-species food web.

*Predation configurations for a species in an n-species food web:*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.18.42.png =1568x514)

In a 3-species food web, the predation relationship configurations for a species N1 are:

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-15.18.48.png =276x414)

We can sample possible food web configurations randomly, but this will rarely yield realistic food webs for most contexts. Instead, we might restrict configurations to a subset of forms that fit our criteria, or we might simply look to real world systems for examples.

*Random valid 3-species food webs (with cannibalism):*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.19.19.png =1498x282)

*Random valid 3-species food webs (without cannibalism):*

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.19.48.png =1526x298)

### Species to Species Effects Representation: The Community Matrix

Whereas graphs are great at helping us intuit the nature of interactions in a community, we typically express interactions in n-species Lotka-Volterra models using a matrix of interaction coefficients called an *interaction matrix*. A perk of this strategy is that it allows us to write the generalised Lotka-Volterra model in a condensed form using linear algebra. We will discuss this condensed form shortly. When the matrix stores the effects of species on other species growth rates, we call this matrix a *community matrix*.

Community matrices are a key concept in quantitative ecology and are used in many competition and predation models. A community matrix A is a square matrix where each element represents the interaction strength between pairs of species in an ecological community. Each cell *A[i,j]* represents the effect of the average species *j* individual on species *i*’s population growth rate (Novak et al. 2016). The principal diagonal of the matrix captures the species self-interactions, which we usually assume to be negative, to capture the effect of interspecific competition. This constrains species growth in the absence of prey, imposing implicit instantaneous carrying capacities of the system for different species.

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.21.29.png =354x120)

Note that values in an interaction matrix don’t necessarily correspond to predation relationships. If both *A[i,j]* and *A[j,i]* are negative, then the two species are considered to be in direct competition with one another as they negatively affect each other’s population. If *A[i,j]* is positive but *A[i,j]* is negative then species *i* is a predator or parasite of species *j*, since *i*’s population grows at *j*’s expense (Positive values for *A[i,j] *and *A[j,i] *would be considered mutualism, but we won’t go into that).

To translate between community matrices and food webs, I have implemented some simple tools which you can find definitions for in the original version of this post.

## Generalised Lotka-Volterra: How Does it Work?

We can model competition and predation systems with more than two species using the generalised form of the Lotka-Volterra model, which we write: 

![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.24.26.png =181x94)

where

- *X* is a vector of population sizes or densities.
- The vector *f* is given by *f*=*r*+*A**X*, where *r* is a vector of intrinsic growth rates, and *A *is the community matrix or interaction matrix of the system.

We will define the intrinsic growth rates slightly differently from our approach for the two-species model, as we assume that each species has a positive intrinsic growth rate. We account for the negative effect of a species' intraspecific competition in the absence of food (on its intrinsic growth rates) in the diagonal of the community matrix.<br/>## Three Species Lotka-Volterra in the Wolfram Language

First, let's define a function to generate ODEs for an n-species Lotka-Volterra model:
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-13.23.34.png =2102x886)
We can use <code>GeneralizedLotkaVolterraODEs</code> to generate the system of ODEs for the given initial parameters:

- <em>vars</em> - a list of variable names (optional),
- <em>init</em> - a list of initial population sizes
- <em>r</em> - a list of species intrinsic growth rates
- <em>interactionMatrix</em> - a matrix describing community interactions (in our examples, a community matrix)

<em>Generate a system of ODEs for a Generalised Lotka-Volterra model from provided parameters:</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.20.24.png =582x310)
Using <code>CommunityMatrixGraph</code> (see definition in original post), we can construct a weighted graph from the community matrix to get an idea of the relationships that define the system at a glance.

<em>Visualise the community interactions described by the community matrix:</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.22.53.png =1278x526)
And <code>NDSolve</code> to numerically approximate the population trajectories of the model.

<em>Numerical solutions to the model ODEs:</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.23.38.png =1774x390)
We can then plot the solutions in the time domain and state space:

<em>Time domain plot:</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.24.12.png =1564x638)
<em>State space portrait (now in 3D!):</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.24.34.png =472x469)## Closing Notes: Four species and more

The generalised model we have discussed in this short text extends beyond three species systems. In fact, the tools we have developed will allow us to model any finite n-species closed-food web, that is, any system that we can express using a finite number of species initial population sizes, intrinsic growth rates, and interactions. It should be noted that just because we can specify a model does not always mean we can accurately solve for its behaviour: we are restricted by the limits of numerical approximation and our available computational power)

Still, we can easily model four species webs. Let’s prepare two four species models. We’ll define some weighted webs describing the various interaction effects of our system:
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.25.03.png =380x318)
We can construct the community matrix describing either of these using the <code>CommunityMatrix</code> function defined in the original version of this post. For example, take the first row of interaction webs from the above dataset:
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2023-10-10-at-15.20.16.png =403x136)
<em>Time domain plot:</em>
![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.25.51.png =1932x1216)![](../../media/posts/lotka-volterra-models-in-the-wolfram-language/Screenshot-2024-05-01-at-16.25.31.png =1892x938)
To interact with this graphical user interface, head to the original version of this post.

<strong>Note:</strong> What happened to the state-space plot? Well, we’ve run out of spatial dimensions to express the behaviour of the system, and in the interest of keeping this post short, we’ll leave things there for now.

Consider what we have achieved in this short text. If you have read this far, I hope to have inspired you to think of how you might answer your own ecological questions in the Wolfram Language. If your questions expand on the subject of this post, I hope the tools I have developed within will help jumpstart your exploration! And please, don’t hesitate to reach out to me with any questions you may have about this work.
## Sources Cited

Allesina, Stefano. 2 Generalized Lotka-Volterra | A Tour of the Generalized Lotka-Volterra Model. Accessed 5 October 2023. <a href="https://stefanoallesina.github.io/Sao_Paulo_School/intro.html">https://stefanoallesina.github.io/Sao_Paulo_School/intro.html</a>.

———. 2 Generalized Lotka-Volterra | A Tour of the Generalized Lotka-Volterra Model. Accessed 5 October 2023. <a href="https://stefanoallesina.github.io/Sao_Paulo_School/intro.html">https://stefanoallesina.github.io/Sao_Paulo_School/intro.html</a>.

Bacaër, Nicolas. ‘Lotka, Volterra and the Predator–Prey System (1920–1926)’. In A Short History of Mathematical Population Dynamics, edited by Nicolas Bacaër, 71–76. London: Springer, 2011. <a href="https://doi.org/10.1007/978-0-85729-115-8_13">https://doi.org/10.1007/978-0-85729-115-8_13</a>.

Baigent, Steve. ‘Lotka-Volterra Dynamics - An Introduction.’, 2010.

Hsu, Sze-Bi, Shigui Ruan, and Ting-Hui Yang. ‘Analysis of Three Species Lotka–Volterra Food Web Models with Omnivory’. Journal of Mathematical Analysis and Applications 426, no. 2 (15 June 2015): 659–87. <a href="https://doi.org/10.1016/j.jmaa.2015.01.035">https://doi.org/10.1016/j.jmaa.2015.01.035</a>.

Kingsland, Sharon. ‘Alfred J. Lotka and the Origins of Theoretical Population Ecology’. Proceedings of the National Academy of Sciences of the United States of America 112, no. 31 (4 August 2015): 9493–95. <a href="https://doi.org/10.1073/pnas.1512317112">https://doi.org/10.1073/pnas.1512317112</a>.

Lee, Benjamin. ‘Determination of the Parameters in Lotka-Volterra Equations from Population Measurements---Algorithms and Numerical Experiments’. SIAM Undergraduate Research Online 14 (1 January 2021). <a href="https://doi.org/10.1137/20S1383161">https://doi.org/10.1137/20S1383161</a>.

Lotka, Alfred J. ‘Analytical Note on Certain Rhythmic Relations in Organic Systems’. Proceedings of the National Academy of Sciences of the United States of America 6, no. 7 (July 1920): 410–15.

———. ‘Contribution to the Theory of Periodic Reactions’. The Journal of Physical Chemistry 14, no. 3 (1 March 1910): 271–74. <a href="https://doi.org/10.1021/j150111a004">https://doi.org/10.1021/j150111a004</a>.

———. ‘Natural Selection as a Physical Principle*’. Proceedings of the National Academy of Sciences 8, no. 6 (June 1922): 151–54. <a href="https://doi.org/10.1073/pnas.8.6.151">https://doi.org/10.1073/pnas.8.6.151</a>.

Novak, Mark, Justin D. Yeakel, Andrew E. Noble, Daniel F. Doak, Mark Emmerson, James A. Estes, Ute Jacob, M. Timothy Tinker, and J. Timothy Wootton. ‘Characterizing Species Interactions to Understand Press Perturbations: What Is the Community Matrix?’ Annual Review of Ecology, Evolution, and Systematics 47, no. 1 (2016): 409–32. <a href="https://doi.org/10.1146/annurev-ecolsys-032416-010215">https://doi.org/10.1146/annurev-ecolsys-032416-010215</a>.

Volterra, Vito. Variazioni e fluttuazioni del numero d’individui in specie animali conviventi, &amp;c. Memoria / R. comitato talassografico italiano, 1927.
## Further Readings

‘Lotka-Volterra Equations -- from Wolfram MathWorld’. Accessed 5 October 2023. <a href="https://mathworld.wolfram.com/Lotka-VolterraEquations.html">https://mathworld.wolfram.com/Lotka-VolterraEquations.html</a>.

‘Lotka-Volterra Model - an Overview | ScienceDirect Topics’. Accessed 5 October 2023. <a href="https://www.sciencedirect.com/topics/earth-and-planetary-sciences/lotka-volterra-model">https://www.sciencedirect.com/topics/earth-and-planetary-sciences/lotka-volterra-model</a>.

A Short History of Mathematical Population Dynamics by Nicolas Bacaër, n.d.

Essington, Timothy E. Introduction to Quantitative Ecology: Mathematical and Statistical Modelling for Beginners. Oxford, United Kingdom: Oxford University Press, 2021.

Kot, Mark. Elements of Mathematical Ecology. 1st edition. Cambridge: Cambridge University Press, 2001.