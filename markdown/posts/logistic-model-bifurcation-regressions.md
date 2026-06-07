In this project, I will build nonlinear models using spline regressions, and a general additive model to predict the initial conditions of sets of points of the bifurcation diagram (final state diagram) of the logistic function:

![](../../media/posts/11/logistic_equation.png =382x55)

## The bifurcation diagram of the logistic equation

First, let’s briefly explore the bifurcation diagram of the logistic equation, which we can plot using the code below:

<code class="hljs">logistic_eq &lt;- function(x, r){return(r*x*(1-x))}

x &lt;- seq(0, 4, length=500) # r scale
y &lt;- c()

bifurcation_data &lt;- function(r_values, x_0, min_iter=101, max_iter=300){
  for(r in r_values){
    new_y &lt;- x_0
    orbit &lt;- c()
    for(i in 0:max_iter){
      new_y &lt;- logistic_eq(new_y, r)
      if(i &lt;  min_iter){next}
      orbit &lt;- c(orbit, new_y)
    }
    y &lt;- c(y, tibble(orbit))
  }
  return(tibble(x_0=x_0, r=x, final_state=y, iter_num=rep(tibble(min_iter:max_iter), 
                                                          length(r_values))))
}</code></pre>
<code class="hljs">x_0 &lt;- 0.5

head(bifurcation_data(x, x_0))</code></pre>
<code class="hljs">## # A tibble: 6 × 4
##     x_0       r final_state  iter_num    
##   &lt;dbl&gt;   &lt;dbl&gt; &lt;named list&gt; &lt;named list&gt;
## 1   0.5 0       &lt;dbl [200]&gt;  &lt;int [200]&gt; 
## 2   0.5 0.00802 &lt;dbl [200]&gt;  &lt;int [200]&gt; 
## 3   0.5 0.0160  &lt;dbl [200]&gt;  &lt;int [200]&gt; 
## 4   0.5 0.0240  &lt;dbl [200]&gt;  &lt;int [200]&gt; 
## 5   0.5 0.0321  &lt;dbl [200]&gt;  &lt;int [200]&gt; 
## 6   0.5 0.0401  &lt;dbl [200]&gt;  &lt;int [200]&gt;</code></pre>
<code class="hljs">bifurcation_data(x, x_0) %&gt;% unnest(everything()) %&gt;% ggplot(aes(r, final_state)) + 
  geom_point(size=0.01) + 
  labs(title=paste0("Bifurcation diagram of the logistic equation for x_0 = ", x_0)) +
  theme_tufte()</code></pre>

![](../../media/posts/11/figure1.png =1344x960)

The bifurcation diagram of the logistic equation, (also known as a final state diagram), shows the orbits of the logistic function <span class="math" id="MathJax-Span-22"><span class="mrow" id="MathJax-Span-23"><span class="msubsup" id="MathJax-Span-24"><span class="mi" id="MathJax-Span-25">x<span class="mrow" id="MathJax-Span-27"><span class="mi" id="MathJax-Span-28">n+1</span></span>=rxn(1−xn)</span></span>xn+1=rxn(1−xn)</span></span> for values of <span class="math" id="MathJax-Span-43"><span class="mrow" id="MathJax-Span-44"><span class="mi" id="MathJax-Span-45">r</span>r</span></span> between 0 and 1. The resolution of the plot/set is determined by the cardinality of the set of <span class="math" id="MathJax-Span-46"><span class="mrow" id="MathJax-Span-47"><span class="mi" id="MathJax-Span-48">r</span>r</span></span> values used as the x axis, and the number of iterations computed by the `bifurcation_data()` function, plotted on the y axis. In the plot above, orbits were computed for 301 iterations, (iterations 0 to 300 as it is specified in the code), but the points corresponding to the first 101 iterations were skipped, resulting in a plot that ignores the beginning of the orbits. We could also choose to not skip iterates, which would result in a plot like the following:

**A plot of the bifurcation diagram points for x_0 = 0.5, with no iterates skipped:**

<code class="hljs">bifurcation_data(x, x_0, 0, 300) %&gt;% unnest(everything()) %&gt;% ggplot(aes(r, final_state)) + 
  geom_point(size=0.01) + 
  labs(title=paste0("Bifurcation diagram of the logistic equation for x_0 = ", x_0)) +
  theme_tufte()</code></pre>

![](../../media/posts/11/figure2.png =1344x960)

For ease of computation and interpretability, in this project I will first constitute a working data set from which to produce visualisations and models from low-resolution data sets of points on the bifurcation diagram of the logistic equation. The resolution in r values and in number of iterations will be `resolution`, and `resolution` respectively, with no iterates skipped. I have plotted an example below:

**A plot of the lower resolution bifurcation diagram points for x_0 = 0.5:**

<code class="hljs">resolution &lt;- 10 # resolution, in number of units per dimension

x &lt;- seq(0, 4, length=resolution) # r scale
bifurcation_data(x, x_0, 0, resolution-1) %&gt;% unnest(everything()) %&gt;% ggplot(aes(r, final_state)) + 
  geom_point(size=0.01) + 
  labs(title=paste0("Bifurcation diagram of the logistic equation for x_0 = ", x_0)) +
  theme_tufte()</code></pre>

![](../../media/posts/11/figure3-2.png =1344x960)

## Data generation and formatting

Now that we’re a bit more comfortable with bifurcation diagram of the logistic equation conceptually, let’s collect the data we’ll need to visualise variation of initial conditions, and from which we could build a model to predict the initial conditions used to generate a set of points using iterations of the logistic equations for values in the set of `r` values `x`.

The following code will give us `resolution` r resolution by `resolution` iteration resolution point sets for `resolution` initial condition values between 0 and 1. Together, these variables form a `resolution^3` resolution 3d space which that data will occupy.

We’ll use a little higher resolution settings for our visualisations and data exploration:

<code class="hljs">resolution &lt;- 60 # resolution, in number of units per dimension

x &lt;- seq(0, 4, length=resolution) # r scale
min_iter &lt;- 0; max_iter &lt;- resolution-1
x_0s &lt;- seq(0, 1, length=resolution)

data &lt;- tibble()
for(x_0 in x_0s){
  data &lt;- bind_rows(data, bifurcation_data(r=x, x_0, min_iter, max_iter))
}</code></pre>
Let’s preview the data by peeking at the data tibble:

<code class="hljs">head(data)</code></pre>

<div class="section level2" id="data-generation-and-formatting">
<code class="hljs">## # A tibble: 6 × 4
##     x_0      r final_state  iter_num    
##   &lt;dbl&gt;  &lt;dbl&gt; &lt;named list&gt; &lt;named list&gt;
## 1     0 0      &lt;dbl [60]&gt;   &lt;int [60]&gt;  
## 2     0 0.0678 &lt;dbl [60]&gt;   &lt;int [60]&gt;  
## 3     0 0.136  &lt;dbl [60]&gt;   &lt;int [60]&gt;  
## 4     0 0.203  &lt;dbl [60]&gt;   &lt;int [60]&gt;  
## 5     0 0.271  &lt;dbl [60]&gt;   &lt;int [60]&gt;  
## 6     0 0.339  &lt;dbl [60]&gt;   &lt;int [60]&gt;</code></pre>

<div class="section level2" id="data-exploration-and-visualisation">## Data exploration and visualisation

Let’s also preview the data graphically altogether as a scatter plot:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  ggplot(aes(r, final_state, colour=x_0)) + 
  geom_point(size=0.01) + 
  scale_colour_gradientn(colours = rainbow(10)) + # + theme(legend.position = "none")
  theme_tufte()</code></pre>![](../../media/posts/11/figure4.png =1344x960)
The scatter plot gives us limited insight because values are stacked upon one another. But we can plot the <code>x_0</code> axis in the third dimension, as a 3d point cloud, as below:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% plot_ly(data=., 
                                          x = ~r, 
                                          y = ~x_0, 
                                          z = ~final_state,
                                          color = ~iter_num,
                                          colors=viridis(50, alpha = 1, begin = 0, end = 1, direction = 1),
                                          marker = list(size = 1,
                                                        colorbar=list(title="iteration number"),
                                                        reversescale=F)) %&gt;% 
  add_markers() %&gt;% 
  layout(scene=list(xaxis = list(title = "r"),
                    yaxis = list(title = "x_0"),
                    zaxis = list(title = "final state"), 
                    camera = list(eye = list(x = -1.25, y = 1.25, z = 1.25))))</code></pre>![](../../media/posts/11/figure5.png =1404x890)
Note that the structure produced by the point cloud in the plot above has symmetry along the <code>x_0</code> axis. This tells us that for any r value and iteration step, a function cannot approach the orbit values for an initial condition between 0 and 1, as there will be two initial conditions for which the orbits are identical.

However, all hope is not lost! The good news is that we can make a cheaper model that will work just as well! All we need to do is to cut the data set in half so as to contain only <code><span class="math" id="MathJax-Span-66"><span class="mrow" id="MathJax-Span-67"><span class="msubsup" id="MathJax-Span-68"><span class="mi" id="MathJax-Span-69">x_0</span></span></span></span></code> values above or below <code>0.5</code> to obtain non-mirrored data for which the orbit coordinates for an iteration step and r value can be approached by a deterministic function.

While we’re at it, let’s also visualise how the orbits gravitate towards a shape constituted of final states as the logistic equation is iterated:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% plot_ly(data=., 
                                          x = ~r, 
                                          y = ~iter_num, 
                                          z = ~final_state,
                                          color = ~x_0,
                                          colors=viridis(50, alpha = 1, begin = 0, end = 1, direction = 1),
                                          marker = list(size = 1,
                                                        reversescale=F)) %&gt;% 
  add_markers() %&gt;% 
  layout(scene=list(xaxis = list(title = "r"),
                    yaxis = list(title = "iteration number"),
                    zaxis = list(title = "orbit values"), 
                    camera = list(eye = list(x = -1.25, y = 1.25, z = 1.25))))</code></pre>![](../../media/posts/11/figure6.png =1324x886)
And let’s observe how the initial condition <code>x_0</code> affects the orbit values at different iterations:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% plot_ly(data=., 
                                          x = ~x_0, 
                                          y = ~iter_num, 
                                          z = ~final_state,
                                          color = ~r,
                                          colors=viridis(50, alpha = 1, begin = 0, end = 1, direction = 1),
                                          marker = list(size = 1,
                                                        reversescale=F)) %&gt;% 
  add_markers() %&gt;% 
  layout(scene=list(xaxis = list(title = "x_0"),
                    yaxis = list(title = "iteration number"),
                    zaxis = list(title = "orbit values"), 
                    camera = list(eye = list(x = 1.25, y = -1.25, z = 1.25))))</code></pre>![](../../media/posts/11/figure7.png =1232x902)
Let’s take slices of <code>x_0</code> by final state at different iteration numbers values and have a look at the shapes they form. But first, let’s generate higher resolution data to get nicer, more detailed plots.

<code class="hljs">resolution &lt;- 200 # resolution, in number of units per dimension
x &lt;- seq(0, 4, length=resolution) # r scale
min_iter &lt;- 0; max_iter &lt;- 100
x_0s &lt;- seq(0, 1, length=resolution)

data &lt;- tibble()
for(x_0 in x_0s){
  data &lt;- bind_rows(data, bifurcation_data(r=x, x_0, min_iter, max_iter))
}</code></pre>
Let’s preview a few slices:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% filter(iter_num==iter_num[1]) %&gt;% 
  ggplot(aes(x_0, final_state, alpha=r)) + geom_point(size=0.1) + 
  labs(title=paste0("Orbit value by initial condition for iterate ", 1),
       y="orbit values") +
  theme_tufte()</code></pre>![](../../media/posts/11/figure8.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% filter(iter_num==iter_num[5]) %&gt;% 
  ggplot(aes(x_0, final_state, alpha=r)) + geom_point(size=0.1) + 
  labs(title=paste0("Orbit value by initial condition for iterate ", 5),
       y="orbit values") +
  theme_tufte()</code></pre>![](../../media/posts/11/figure9.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% filter(iter_num==iter_num[25]) %&gt;% 
  ggplot(aes(x_0, final_state, alpha=r)) + geom_point(size=0.1) + 
  labs(title=paste0("Orbit value by initial condition for iterate ", 25),
       y="orbit values") +
  theme_tufte()</code></pre>![](../../media/posts/11/figure10.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% filter(iter_num==iter_num[50]) %&gt;% 
  ggplot(aes(x_0, final_state, alpha=r)) + geom_point(size=0.1) + 
  labs(title=paste0("Orbit value by initial condition for iterate ", 50),
       y="orbit values") +
  theme_tufte()</code></pre>![](../../media/posts/11/figure11.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% filter(iter_num==iter_num[100]) %&gt;% 
  ggplot(aes(x_0, final_state, alpha=r)) + geom_point(size=0.1) + 
  labs(title=paste0("Orbit value by initial condition for iterate ", 100),
       y="orbit values") +
  theme_tufte()</code></pre>![](../../media/posts/11/figure12.png =1344x960)
Optionally, we couls save an image sequence for <code>iter_num</code> values

<code class="hljs"># iter_num &lt;- min_iter:max_iter
# for(i in iter_num){ # add in [1:10] when done with animation
#   plot &lt;- data %&gt;% unnest(everything()) %&gt;% filter(iter_num==i) %&gt;%
#     ggplot(aes(x_0, final_state, alpha=r/4)) +
#     geom_point(size=0.1) +
#     labs(title=paste0("Orbit value by initial condition for iterate ", i),
#          y = "orbit values") +
#     theme_tufte()
#   ggsave(paste0("image sequences/final state by initial condition by iterate line plot/", "orbit values by initial condition for iterate ", i, ".png"),
#          width=30, height=20, units="cm")
# }</code></pre>
The code above results in the following animation sequence: <span class="math" id="MathJax-Span-84"><span class="mrow" id="MathJax-Span-85"><span class="mrow" id="MathJax-Span-86"><span class="mi" id="MathJax-Span-87">https:<span class="mrow" id="MathJax-Span-94"><span class="mo" id="MathJax-Span-95">/</span><span class="mo" id="MathJax-Span-98">/</span>youtu.be<span class="mo" id="MathJax-Span-109">/</span>mmFu3PikEsc</span></span></span></span></span>

Let’s reset the resolution to our working resolution:

<code class="hljs">resolution &lt;- 60 # resolution, in number of units per dimension
x &lt;- seq(0, 4, length=resolution) # r scale
min_iter &lt;- 0; max_iter &lt;- resolution-1
x_0s &lt;- seq(0, 1, length=resolution)

data &lt;- tibble()
for(x_0 in x_0s){
  data &lt;- bind_rows(data, bifurcation_data(r=x, x_0, min_iter, max_iter))
}</code></pre>
Finally, let’s observe how orbit values for different iteration steps and initial conditions form a 3d object with a fuzzy or spiky upper boundary in the <span class="math" id="MathJax-Span-121"><span class="mrow" id="MathJax-Span-122"><span class="mi" id="MathJax-Span-123">r</span>r</span></span> dimension.

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% mutate(orbit_values=final_state) %&gt;% 
  plot_ly(data=., 
          x = ~x_0, 
          y = ~iter_num, 
          z = ~r,
          color = ~orbit_values,
          colors=viridis(50, alpha = 1, begin = 0, end = 1, direction = 1) ,
          marker = list(size = 1,
                        reversescale=F,
                        opacity = ~final_state)) %&gt;% 
  add_markers() %&gt;% 
  layout(scene=list(xaxis = list(title = "x_0"),
                    yaxis = list(title = "iteration number"),
                    zaxis = list(title = "r")))</code></pre>![](../../media/posts/11/figure13.png =1274x906)## Model-planning considerations

Now that we have a solid understanding of the shape of our data set, we can design a modelling approach.

The goal is to predict the initial condition <span class="math" id="MathJax-Span-124"><span class="mrow" id="MathJax-Span-125"><span class="msubsup" id="MathJax-Span-126"><span class="mi" id="MathJax-Span-127">x0</span></span>x0</span></span> used to produce a bifurcation diagram. In other words, we are going to construct a model using <code>final_state</code> orbit values + <code>r</code> + <code>iter_num</code> to predict <code>x_0</code>.

I hypothesise that it will be easier to produce models with high predictive power and reliability for early iterations, and for <code>r</code> values under 3, but that predictive power will tend to be harder to maintain for later iterations, or most values or <code>r</code> above 3.

We can confirm this hypothesis quite easily: Firstly, simply compare the orbit values for an initial condition at earlier iterations to those at later iterations. You will see that the earlier iterations result in distinct plots which overlap little and appear to be approachable by the curves of a function. Conversely, later iterations, such as those 55 and above plotted below appear less describable by curves due to their chaotic behaviour, and overlap exactly in the non-chaotic regions of the plot.

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(iter_num&lt;5) %&gt;% filter(x_0==x_0s[25]) %&gt;% 
  ggplot(aes(r, final_state, colour=as.factor(iter_num))) + 
  geom_line(aes(group=as.factor(iter_num))) +
  geom_point(alpha=0.4) +
  theme_tufte() +
  labs(title=paste0("Bifurcation diagram of the logistic map points \nfor x_0 = ", 
                    round(x_0s[25], 2)," and iterates [0 - 5)"), y="orbit values") +
  theme(legend.position = "none")</code></pre>![](../../media/posts/11/figure14.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(iter_num&gt;=55) %&gt;% filter(x_0==x_0s[25]) %&gt;% 
  ggplot(aes(r, final_state, colour=as.factor(iter_num))) + 
  geom_line(aes(group=as.factor(iter_num))) +
  geom_point(alpha=0.4) +
  theme_tufte() +
  labs(title=paste0("Bifurcation diagram of the logistic map points \nfor x_0 = ", 
                    round(x_0s[25], 2)," and iterates [55 - 60)"), y="orbit values") +
  theme(legend.position = "none")</code></pre>![](../../media/posts/11/figure15.png =1344x960)
We can also note that points where <span class="math" id="MathJax-Span-135"><span class="mrow" id="MathJax-Span-136"><span class="mi" id="MathJax-Span-137">r≥3</span>r≥3</span></span> are less approachable by curves. Comparing the following plots should help convey this behaviour more intiutively:

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(r==x[15]) %&gt;% 
  ggplot(aes(iter_num, final_state, colour=as.factor(x_0))) + 
  geom_line(aes(group=as.factor(x_0)), alpha=0.2) +
  labs(title=paste0("Orbits for different initial conditions, r = ", 
                    round(x[15], 3)), x="x_n", y="orbit values") + 
  theme_tufte() +
  theme(legend.position = "none")</code></pre>![](../../media/posts/11/figure16.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(r==x[20]) %&gt;% 
  ggplot(aes(iter_num, final_state, colour=as.factor(x_0))) + 
  geom_line(aes(group=as.factor(x_0)), alpha=0.2) +
  labs(title=paste0("Orbits for different initial conditions, r = ", 
                    round(x[20], 3)), x="x_n", y="orbit values") + 
  theme_tufte() +
  theme(legend.position = "none")</code></pre>![](../../media/posts/11/figure17.png =1344x960)
<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(r==x[59]) %&gt;% 
  ggplot(aes(iter_num, final_state, colour=as.factor(x_0))) + 
  geom_line(aes(group=as.factor(x_0)), alpha=0.2) +
  labs(title=paste0("Orbits for different initial conditions, r = ", 
                    round(x[59], 3)), x="x_n", y="orbit values") + 
  theme_tufte() +
  theme(legend.position = "none")</code></pre>![](../../media/posts/11/figure18.png =1344x960)## Model

We’ve seen from the data exploration above that we should build our model on a subset of the data composed of early iterates orbit values, at one value of <code>r</code>.

<code class="hljs">resolution &lt;- 200 # resolution, in number of units per dimension
x &lt;- seq(0, 4, length=resolution) # r scale
min_iter &lt;- 0; max_iter &lt;- resolution-1
x_0s &lt;- seq(0, 1, length=resolution)

data &lt;- tibble()
for(x_0 in x_0s){
  data &lt;- bind_rows(data, bifurcation_data(r=x, x_0, min_iter, max_iter))
}</code></pre>
Let’s start by selecting values to test our proof of concept.

<code class="hljs">model_iterate_value &lt;- 0
model_r_value &lt;- x[round(resolution/2, 0)]</code></pre>
Now, let’s split our data into training and testing sets.

<code class="hljs">set.seed(1)

data_unnested &lt;- data %&gt;% unnest(everything()) %&gt;% 
  filter(x_0 &lt;= 0.5) %&gt;% 
  filter(iter_num == model_iterate_value) %&gt;% filter(r == model_r_value)

index &lt;- createDataPartition(data_unnested$x_0, p = .8, list=FALSE)
training_data &lt;- data_unnested[ index,]
test_data  &lt;- data_unnested[-index,]</code></pre>
And let’s create our training vectors from the training data set.

<code class="hljs">x_0 &lt;- training_data$x_0 
final_state &lt;- training_data$final_state

IV &lt;- final_state # predictor variables
DV &lt;- x_0 # response variable</code></pre>
We’re finally ready! Let’s run a smooth spline regression on our training data, and test it on our test data set.

<code class="hljs"># Let's try to perform a smooth spline regression:
final_smooth_model &lt;- npreg::ss(DV, IV)
final_smooth_model</code></pre>
<code class="hljs">## 
## Call:
## npreg::ss(x = DV, y = IV)
## 
## Smoothing Parameter  spar = -0.3288175   lambda = 2.509954e-10
## Equivalent Degrees of Freedom (Df) 54.60317
## Penalized Criterion (RSS) 1.517007e-10
## Generalized Cross-Validation (GCV) 1.881561e-11</code></pre>
<code class="hljs">summary(final_smooth_model)</code></pre>
<code class="hljs">## 
## Call:
## npreg::ss(x = DV, y = IV)
## 
## Residuals:
##        Min         1Q     Median         3Q        Max 
## -5.400e-06 -1.858e-07  5.613e-09  1.779e-07  9.054e-06 
## 
## Approx. Signif. of Parametric Effects:
##             Estimate Std. Error t value Pr(&gt;|t|)    
## (Intercept)   0.3308  3.046e-07 1086254        0 ***
## x             0.4975  3.368e-06  147709        0 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1 
## 
## Approx. Signif. of Nonparametric Effects:
##             Df    Sum Sq   Mean Sq   F value Pr(&gt;F)    
## s(x)      52.6 1.104e-01 2.099e-03 351395897      0 ***
## Residuals 25.4 1.517e-10 5.973e-12                     
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1 
## 
## Residual standard error: 2.444e-06 on 25.4 degrees of freedom
## Multiple R-squared:  1,    Adjusted R-squared:  1
## F-statistic: 344834510 on 53.6 and 25.4 DF,  p-value: &lt;2e-16</code></pre>
<code class="hljs">final_smooth_model$fit$knot</code></pre>
<code class="hljs">##  [1] 0.000000000 0.005025126 0.015075377 0.025125628 0.030150754 0.045226131
##  [7] 0.050251256 0.055276382 0.070351759 0.075376884 0.085427136 0.090452261
## [13] 0.095477387 0.110552764 0.120603015 0.130653266 0.135678392 0.140703518
## [19] 0.150753769 0.155778894 0.170854271 0.180904523 0.190954774 0.195979899
## [25] 0.201005025 0.216080402 0.221105528 0.241206030 0.246231156 0.251256281
## [31] 0.261306533 0.266331658 0.281407035 0.286432161 0.296482412 0.311557789
## [37] 0.316582915 0.326633166 0.336683417 0.346733668 0.356783920 0.361809045
## [43] 0.371859296 0.376884422 0.396984925 0.402010050 0.407035176 0.417085427
## [49] 0.422110553 0.432160804 0.437185930 0.442211055 0.452261307 0.457286432
## [55] 0.482412060 0.487437186 0.497487437</code></pre>
<code class="hljs">length(final_smooth_model$fi$knot)</code></pre>
<code class="hljs">## [1] 57</code></pre>
<code class="hljs">pred &lt;- predict(final_smooth_model, test_data$x_0)
print(paste("RMSE:", rmse(pred$y, test_data$x_0)))</code></pre>
<code class="hljs">## [1] "RMSE: 0.0919509218319031"</code></pre>
<code class="hljs">test_data %&gt;% 
        ggplot(aes(x = final_state, y = x_0)) + 
        stat_smooth(method = "gam", formula = y ~ bs(x, k = 50), color = "springgreen3") +
        geom_point() + 
        labs(x = "orbit values", y = "x_0", 
       title = paste0("Smooth spline regression on orbit values \nof the logistic equation at iterate = ", 
                      model_iterate_value, ", and r = ", round(model_r_value, 2))) + 
        theme_tufte() </code></pre>![](../../media/posts/11/figure19.png =1344x960)
Excellent! But can we do better? What if we tried to fit a spline of any degree on our data?

<code class="hljs"># We can also fit a spline of any degree, which in this case, should give us excellent results: 
any_degree_spline_model &lt;- lm(DV ~ ns(IV, df = 12), data = data_unnested)
summary(any_degree_spline_model)</code></pre>
<code class="hljs">## 
## Call:
## lm(formula = DV ~ ns(IV, df = 12), data = data_unnested)
## 
## Residuals:
##        Min         1Q     Median         3Q        Max 
## -0.0053647 -0.0000552 -0.0000012  0.0000517  0.0067825 
## 
## Coefficients:
##                     Estimate Std. Error t value Pr(&gt;|t|)    
## (Intercept)       -9.551e-05  9.459e-04  -0.101     0.92    
## ns(IV, df = 12)1   8.115e-02  1.268e-03  64.007   &lt;2e-16 ***
## ns(IV, df = 12)2   1.196e-01  1.621e-03  73.759   &lt;2e-16 ***
## ns(IV, df = 12)3   1.594e-01  1.470e-03 108.406   &lt;2e-16 ***
## ns(IV, df = 12)4   1.995e-01  1.571e-03 126.951   &lt;2e-16 ***
## ns(IV, df = 12)5   2.421e-01  1.544e-03 156.777   &lt;2e-16 ***
## ns(IV, df = 12)6   2.854e-01  1.577e-03 180.897   &lt;2e-16 ***
## ns(IV, df = 12)7   3.266e-01  1.533e-03 213.047   &lt;2e-16 ***
## ns(IV, df = 12)8   3.665e-01  1.507e-03 243.251   &lt;2e-16 ***
## ns(IV, df = 12)9   4.079e-01  1.461e-03 279.250   &lt;2e-16 ***
## ns(IV, df = 12)10  4.268e-01  1.126e-03 378.958   &lt;2e-16 ***
## ns(IV, df = 12)11  5.091e-01  2.381e-03 213.851   &lt;2e-16 ***
## ns(IV, df = 12)12  4.666e-01  8.857e-04 526.773   &lt;2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Residual standard error: 0.001356 on 67 degrees of freedom
## Multiple R-squared:  0.9999, Adjusted R-squared:  0.9999 
## F-statistic: 7.731e+04 on 12 and 67 DF,  p-value: &lt; 2.2e-16</code></pre>
<code class="hljs">pred &lt;- predict(any_degree_spline_model, test_data)</code></pre>
<code class="hljs">## Warning: 'newdata' had 20 rows but variables found have 80 rows</code></pre>
<code class="hljs">print(paste("RMSE:", RMSE(pred, test_data$x_0)))</code></pre>
<code class="hljs">## [1] "RMSE: 0.176476254615616"</code></pre>
<code class="hljs">test_data %&gt;% 
  ggplot(aes(x = final_state, y = x_0)) + 
  geom_smooth(method = lm, color = "springgreen3", 
              formula = y ~ ns(x, df = 12)) + 
  geom_point() + 
  labs(x = "orbit values", y = "x_0", 
       title = paste0("Any degree spline regression on orbit values \nof the logistic equation at iterate = ", 
                      model_iterate_value, ", and r = ", round(model_r_value, 2))) +
  theme_tufte()</code></pre>![](../../media/posts/11/figure20.png =1344x960)
Perfect! That’s a really stellar fit! (But it makes sense, because the original data came from a smooth clean function!) In principle, it should be possible to choose any slice of the original data set for unique iterate number and r value combinations, and perform a spline regression on them to very reliably predict the initial condition used to generate the set of points on the bifurcation diagram of the logistic equation.

Talking about slices is all fine and dandy, but what exactly do I mean? Let’s take a look at the next plot to get a better idea! Note: in the following plot, the slice on which we built our last model is coloured in red.

<strong>Examining the space of possible models visually:</strong> This is also the same as looking at a multivariate model in 3d, in fact now that I’ve mentioned multivariate models, let’s make a multivariate model corresponding to this surface!

<code class="hljs">data %&gt;% unnest(everything()) %&gt;% 
  filter(iter_num == model_iterate_value) %&gt;% 
  mutate(r_focus=if_else(r==model_r_value, T, F)) %&gt;% 
  filter(x_0 &lt; 0.5) %&gt;% 
  plot_ly(data=., 
          x = ~r, 
          y = ~x_0, 
          z = ~final_state, 
          color = ~r_focus,
          colors = c("turquoise", "red"),
          marker = list(size = 1,
                        reversescale=F)) %&gt;% 
  add_markers() %&gt;%
  layout(title = paste0("Model surface: all models approachable \nby splines for initial conditions \nbetween 0 and 1, at iteration step ", model_iterate_value),
         scene=list(xaxis = list(title = "r"),
                    yaxis = list(title = "x_0"),
                    zaxis = list(title = "orbit values"), 
                    camera = list(eye = list(x = -1.25, y = 1.25, z = 1.25))))</code></pre>![](../../media/posts/11/figure21.png =1216x942)
Note that if we change the iteration step, we get a different surface. Here is the surface we would have got if we had chosen to take a slice of the data at the 10th iteration step:

<code class="hljs">iterate_value &lt;- 10

data %&gt;% unnest(everything()) %&gt;% 
  filter(iter_num == iterate_value) %&gt;% 
  filter(x_0 &lt; 0.5) %&gt;% 
  plot_ly(data=., 
          x = ~r, 
          y = ~x_0, 
          z = ~final_state, 
          colors = "turquoise",
          marker = list(size = 1,
                        reversescale=F)) %&gt;% 
  add_markers() %&gt;%
  layout(title = paste0("Model surface: all models approachable \nby splines for initial conditions \nbetween 0 and 1, at iteration step ", iterate_value),
         scene=list(xaxis = list(title = "r"),
                    yaxis = list(title = "x_0"),
                    zaxis = list(title = "orbit values"), 
                    camera = list(eye = list(x = -1.25, y = 1.25, z = 1.25))))</code></pre>![](../../media/posts/11/figure22.png =900x950)<div class="section level2" id="model">
From the plot, you can see that the point cloud becomes harder to describe with a surface past 3 units along the <span class="math" id="MathJax-Span-140"><span class="mrow" id="MathJax-Span-141"><span class="mi" id="MathJax-Span-142">r</span>r</span></span> axis. This indicates it would be harder to approach it with a spline model.

<div class="section level2" id="multivariate-model">## Multivariate model

Let’s try to model x_0 from all orbit values and values of r for an iterate value at once:

<code class="hljs">set.seed(1)

data_unnested &lt;- data %&gt;% unnest(everything()) %&gt;% 
  filter(x_0 &lt;= 0.5) %&gt;% filter(iter_num == model_iterate_value)

index &lt;- createDataPartition(data_unnested$x_0, p = .8, list=FALSE)
training_data &lt;- data_unnested[ index,]
test_data  &lt;- data_unnested[-index,]</code></pre>
<code class="hljs">bifurcation_gam_multivariate &lt;- gam(x_0 ~ s(final_state) + s(r), data = training_data)
summary(bifurcation_gam_multivariate)</code></pre>
<code class="hljs">## 
## Family: gaussian 
## Link function: identity 
## 
## Formula:
## x_0 ~ s(final_state) + s(r)
## 
## Parametric coefficients:
##              Estimate Std. Error t value Pr(&gt;|t|)    
## (Intercept) 0.2485989  0.0005742     433   &lt;2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Approximate significance of smooth terms:
##                  edf Ref.df    F p-value    
## s(final_state) 8.982  9.000 5327  &lt;2e-16 ***
## s(r)           8.756  8.983 3017  &lt;2e-16 ***
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## R-sq.(adj) =   0.75   Deviance explained =   75%
## GCV = 0.0052814  Scale est. = 0.0052752  n = 16000</code></pre>
<code class="hljs">predictions_gam &lt;- predict(bifurcation_gam_multivariate, test_data)
RMSE(predictions_gam, test_data$x_0)</code></pre>
<code class="hljs">## [1] 0.07323365</code></pre>
<code class="hljs">plot(bifurcation_gam_multivariate)</code></pre>![](../../media/posts/11/figure23.png =1344x960)![](../../media/posts/11/figure24.png =1344x960)
Also excellent!

I am curious to try to apply models to later iteration steps, but for now I feel this project has gone on enough, and you probably have other stuff to get to, so I’ll come back to it later.

These models are all such good fits that it makes little sense to compare them. However, hopefully this exploration has served more than to show that a spline regression model can be used to predict initial conditions used to generate sets of points from bifurcation diagrams of the logistic map, as long as we have access to early iteration steps. Beyond that, my hope is that this exploration will provide readers with more insight into the shape and properties of the bifurcation diagram of the logistic equation, a mathematical object which is now ubiquitous throughout mathematical literature.