**Note:** This post was originally a short technical article I shared on the Wolfram Community forum. For an interactive experience with live code or to download this text alongside the source code, please visit the original post [here](https://community.wolfram.com/groups/-/m/t/3393596). 

## Introduction

### An Overview of the Delphi Method

The Delphi method is a structured communication technique originally designed as a forecasting technique, that relies on a panel of experts. It was developed by the RAND Corporation in the 1950s and 1960s. The method involves multiple rounds of questionnaires or writing prompts sent to a panel of experts. The anonymised responses are aggregated and shared with the group after each round. The experts are encouraged to revise their earlier answers in light of the replies of other members of the panel. With some luck, the answers will converge to consensus over the course of several rounds. The method is widely used for forecasting and decision-making in business and education. 

*Illustration of one round of the Delphi process:*

```wl
In[]:= Show[
   Graph[{0 -> 1, 1 -> 2, 1 -> 3, 1 -> 4, 2 -> 5, 3 -> 6, 4 -> 7, 5 -> 8, 6 -> 8, 7 -> 8, 8 -> 9, 9 -> 10}, 
    VertexShape -> Thread[Range[0, 10] -> Map[diskFrame[#, 250, 30] &, {&quot;🕵&quot;, &quot;📑&quot;, &quot;👱🏼‍♀️&quot;, &quot;👩‍🎨&quot;, &quot;👷🏽‍♀️&quot;, &quot;📝&quot;, &quot;📝&quot;, &quot;📝&quot;, &quot;🕵&quot;, &quot;📑&quot;, &quot;\[Bullet]\[Bullet]\[Bullet]&quot;}]], 
    VertexSize -> .8, GraphLayout -> {&quot;LayeredDigraphEmbedding&quot;, &quot;Orientation&quot; -> Left, &quot;RootVertex&quot; -> 0}, 
    ImageSize -> 700], 
   Graphics[{Line[{{-3.2, 4.8}, {-3.2, 5}, {2.6, 5}, {2.6, 4.8}}], Text[Style[&quot;A single Delphi process round&quot;, 14, TextAlignment -> Left], {-2.12, 4.8}]}] 
  ]
```

![Illustration of one round of the Delphi process:](https://phileasdg.github.io/media/posts/45/18afa53ilb1yy-2.png =1328x642)

### What does it look like in practice?

Here’s a step-by-step breakdown of the Delphi method. 

1. After gathering volunteers, the facilitator distributes a questionnaire or initial prompt to the participants.

2. The participants fill out the questionnaire/or prepare their contribution to the first round of the process, and turn in their work to the facilitator.

3. The facilitator anonymises and summarises the perspectives of the participants, making sure to represent each in a balanced and nonjudgmental way, highlighting areas of agreement and disagreement between them. The facilitator then produces and shares this information in a report to participants, initiating the next round of the process.

4. The process begins again: participants respond to the report by refilling the questionnaire/writing a new contribution taking account of the contents of the report, clarifying ambiguities and addressing disagreements.

5. Once a predefined stopping criterion is fulfilled (e.g. the desired number of rounds has been reached, or there is global consensus) the facilitator produces a final report which either becomes or is used to produce the proceedings of the Delphi process.

*Animation representing a three-round Delphi process:*

```wl
In[]:= ListAnimate[Join[Join @@ Table[Join[
       Table[delphiMethodPlot[distanceFromOrigin, True, False, &quot;Round &quot; <> ToString[i]], {distanceFromOrigin, Subdivide[0, .75, 30]}], 
       Table[delphiMethodPlot[.75, True, False, &quot;Round &quot; <> ToString[i]],15], Table[delphiMethodPlot[.75, False, False, &quot;Round &quot; <> ToString[i]], 15], 
       Table[delphiMethodPlot[distanceFromOrigin, False, False, &quot;Round &quot; <> ToString[i]], {distanceFromOrigin, Subdivide[.75, 0, 30]}], 
       Table[delphiMethodPlot[0, False, False, &quot;Round &quot; <> ToString[i]],15], Table[delphiMethodPlot[0, True, False, &quot;Round &quot; <> ToString[i]], 15]], {i, 3}], 
    Table[delphiMethodPlot[0, True, False, &quot;End: The facilitator produces a final report.&quot;], 60]], AnimationRate -> 30]
```

![Snapshot from an animation representing the Delphi process](https://phileasdg.github.io/media/posts/45/0k6j4neosl4i7.png =820x907)

### Why simulate a Delphi process with LLMS?

<h4 id="studying-llm-capabilities">Studying LLM Capabilities</h4>

LLMs provide a unique laboratory for studying artificial intelligence capabilities in structured dialogue. We can systematically evaluate how well these models maintain consistent expertise and viewpoints across multiple rounds of interaction - a key test of their ability to maintain coherent personas. The controlled environment allows us to study how AI systems incorporate new information while maintaining logical reasoning threads, and observe how they handle disagreements and work toward consensus. Perhaps most importantly, what would take weeks or months with human experts can be simulated in minutes, enabling rapid experimentation with different approaches and parameters. 

<h4 id="benefits-for-studying-structured-communication">Benefits for Studying Structured Communication</h4>

The digital nature and speed of LLM interactions offers unprecedented opportunities to study structured communication processes. Every exchange can be logged and analyzed computationally, revealing patterns in how consensus emerges and how different viewpoints influence each other. Researchers can precisely control and vary process parameters. This reproducibility and scalability simply isn’t possible with traditional human-based studies, making LLM simulations a powerful tool for understanding and possibly improving structured communication protocols. 

<h4 id="limitations-and-considerations">Limitations and Considerations</h4>

While promising, this approach comes with important limitations that must be considered. LLMs lack the deep, embodied experience of human experts - their expertise is ultimately derived from training data rather than years of lived experience. Since all participants in a simulation draw from the same underlying model, there’s a risk of artificial consensus that doesn’t reflect the true diversity of expert opinions. Additionally, LLMs don’t have professional reputations or real-world consequences to consider when making judgments, potentially limiting the relevance of their decisions. Findings should be interpreted with appropriate awareness of these constraints.

### Motivation for using Wolfram Language

A few advantages of using Wolfram Language to implement an LLM Delphi process simulation are:

- 

The LLM connectivity functions in Wolfram Language are of exceptionally high quality. They are versatile and very well-documented.

- 

There are many great LLM-related functions like [ChatObject](https://reference.wolfram.com/language/ref/ChatObject), [ChatEvaluate](https://reference.wolfram.com/language/ref/ChatEvaluate), [LLMSynthesize](https://reference.wolfram.com/language/ref/LLMSynthesize), [LLMPromptGenerator](https://reference.wolfram.com/language/ref/LLMPromptGenerator), [LLMFunction](https://reference.wolfram.com/language/ref/LLMFunction), [LLMTool](https://reference.wolfram.com/language/ref/LLMTool). 

- 

Being able to connect LLMs to the full Wolfram Language standard library of functions and symbols, the wolfram resource system, and wolfram knowledgebase.

## *LLM Delphi Process Implementation*

### Defining a project prompt bank

Define a dataset of project prompts:

![Definition of a dataset of project prompts](https://phileasdg.github.io/media/posts/45/19u9mclxjw50y.png =1195x719)

![Prompt bank dataset preview (cut off)](https://phileasdg.github.io/media/posts/45/Screenshot-2025-08-15-at-22.39.36.png =1398x1058)

### Participants setup

<h4 id="defining-a-dataset-of-persona-details">Defining a dataset of persona details</h4>

*Generate 24 conflicting opinions:*

![Generate 24 conflicting opinions](https://phileasdg.github.io/media/posts/45/0um5kz93vlo6r.png =796x85)

*Generate a dataset of participant details (name, persona prompt, a sample of preexisting perspectives):*

![Generate a dataset of participant details](https://phileasdg.github.io/media/posts/45/0ang0i5eq7168.png =2530x323)

*Let’s load a pre-generated dataset of participant parameters:*

![Load a pre-generated dataset of participant parameters](https://phileasdg.github.io/media/posts/45/05a87xett01ev.png =567x78)

<table>
<thead>
<tr>
<th>Emoji</th>
<th>Name</th>
<th>Persona Prompt</th>
<th>Prior Perspectives</th>
</tr>
</thead>
<tbody><tr>
<td>🌱👩‍🌾</td>
<td>Horticulturist</td>
<td>You are a horticulturist specializing in plant selection and care. Your role is to provide expert advice on the types of plants and vegetables that would thrive in the local climate and soil conditions. Consider factors such as sunlight, water requirements, and pest resistance in your recommendations.</td>
<td>{The garden should feature a diverse range of exotic plants to make it visually appealing and unique., It should be on the outskirts of town, where it’s quieter and more peaceful for gardening without disturbances., The primary purpose of the garden is to grow food for the community, and any surplus should be donated to local food banks.}</td>
</tr>
<tr>
<td>🌳👨‍🎨</td>
<td>Landscape architect</td>
<td>You are a landscape architect with expertise in designing outdoor spaces. Your task is to offer insights into the optimal layout and design of the community garden. Consider elements such as garden aesthetics, accessibility, and efficient use of space in your suggestions.</td>
<td>{We should keep the garden small and manageable to maintain quality rather than quantity., Mandatory volunteer days feel forced; it should be up to individual gardeners to maintain their own plots., The garden should be expanded to include more plots in order to serve additional community members.}</td>
</tr>
<tr>
<td>🌍👫</td>
<td>Community organizer</td>
<td>You are a community organizer focused on engaging and mobilizing local residents. Your goal is to propose strategies for involving the community in the garden project, ensuring it meets their needs and encourages participation. Think about ways to organize events, workshops, and volunteer opportunities.</td>
<td>{We should have scheduled volunteer days every week to keep the garden maintained and foster community bonds., We should focus on native plants to promote local biodiversity and sustainability., Everyone should have equal say, and decisions should be made through community votes to promote democratic involvement.}</td>
</tr>
<tr>
<td>🔬👩‍🔬</td>
<td>Environmental scientist</td>
<td>You are an environmental scientist with a focus on sustainable practices. Your responsibility is to advise on environmentally friendly gardening techniques, such as composting, water conservation, and organic pest control. Provide guidance on minimizing the garden’s ecological footprint.</td>
<td>{We should focus on creating educational programs for local schools to teach kids about gardening and sustainability., The garden should be an exclusive space for members to harvest fruits and vegetables for their own households only., All gardening practices should be strictly organic; chemicals have no place in a community garden.}</td>
</tr>
</tbody></table>
<h4 id="initializing-participant-chat-objects">Initializing participant chat objects</h4>

*Initialise a participant chat object with the system prompt, participant persona prompt, and participant prior (preexisting) perspectives:*

```wl
In[]:= ClearAll[initialiseParticipantChat] 
  
 initialiseParticipantChat[participantData_] := ChatObject[StringTemplate[promptBank[&quot;Initial participant prompt template&quot;]][<|
          (*Shared system prompt*) &quot;SystemPrompt&quot; -> promptBank[&quot;Shared participant prompt&quot;], 
          (*Persona prompt:*) &quot;PersonaPrompt&quot; -> participantData[&quot;Persona Prompt&quot;], 
          (*Prior perspectives:*) &quot;PriorPerspectives&quot; -> (If[ListQ[#1], StringRiffle[Normal[#1], &quot;\n--------------\n&quot;], #1] &@Normal[participantData[&quot;Prior Perspectives&quot;]]) 
          |>]] /; MemberQ[{Association, Dataset}, Head[participantData]]
```

*Initialise a participant chat object:*

```wl
In[]:= initialiseParticipantChat[participantParameterDataset[[1]]]
```

```wl
Out[]= &quot;The garden should feature a diverse range of exotic plants to make it visually appealing and unique.--------------It should be on the outskirts of town, where it&#39;s quieter and more peaceful for gardening without disturbances.--------------The primary purpose of the garden is to grow food for the community, and any surplus should be donated to local food banks.&quot;
```

![](https://phileasdg.github.io/media/posts/45/1ny77ybl4x6ee-2.png =237x86)

*Initializing all participant chat objects at once:*

```wl
In[]:= ClearAll[participantChats]
 participantChats = Dataset[Association[Map[#Name -> initialiseParticipantChat[#] &, Normal[participantParameterDataset]]]]
```

<table>
<thead>
<tr>
<th>Horticulturist</th>
<th>Landscape architect</th>
<th>Community organizer</th>
<th>Environmental scientist</th>
</tr>
</thead>
<tbody><tr>
<td>-ChatObject-</td>
<td>-ChatObject-</td>
<td>-ChatObject-</td>
<td>-ChatObject-</td>
</tr>
</tbody></table>
### Facilitator setup

<h4 id="providing-instructions-from-the-facilitator-to-the-participants-and-getting-participant-contributions">Providing instructions from the facilitator to the participants, and getting participant contributions</h4>

*Construct facilitator instructions to participants:*

![](https://phileasdg.github.io/media/posts/45/0aykn2josyvjv.png =1739x119)

*Construct the initial instructions to participants from the facilitator:*

```wl
In[]:= (*constructInstructionsFromFacilitator[]*)
```

*Construct instructions from the facilitator, a list of materials:*

```wl
In[]:= (*constructInstructionsFromFacilitator[{<|Step->1,Report->REPORT CONTENTS|>}]*)
```

*Request an initial (first round) contribution from one participant:*

```wl
In[]:= (*ChatEvaluate[
 initialiseParticipantChat[participantParameterDataset[[1]]],
 (*Initial (first round) participant contribution request:*)
 constructInstructionsFromFacilitator[]
 ]*)
```

*Request initial (first round) participant contributions from all participants:*

```wl
In[]:= (*Map[ChatEvaluate[#,constructInstructionsFromFacilitator[]]&,participantChats]*)
```

<h4 id="providing-instructions-to-the-facilitator-and-getting-the-facilitator-to-produce-intermediate-reports">Providing instructions to the facilitator, and getting the facilitator to produce intermediate reports</h4>

*Initialize a facilitator chat object:*

```wl
In[]:= ClearAll[facilitatorChat]
 facilitatorChat = ChatObject[promptBank[&quot;Initial instructions to facilitator&quot;]]
```

![Chat object](https://phileasdg.github.io/media/posts/45/15vejcwe3gdmg.png =237x86)

*Extract the latest participant responses:*

```wl
In[]:= ClearAll[latestParticipantResponses]
 latestParticipantResponses[participantChats_Dataset] := participantChats[All, Last[#[&quot;Messages&quot;]] &][Select[#&quot;Role&quot; == &quot;Assistant&quot; &], &quot;Content&quot;, Last, #&quot;Data&quot; &]
```

*Example:*

![](https://phileasdg.github.io/media/posts/45/0y00znl27qdxv-2.png =545x41)

*Construct an instructions prompt for the facilitator to produce a report based on the latest round of participant contributions:*

```wl
In[]:= ClearAll[constructInstructionsToFacilitator]
 constructInstructionsToFacilitator[latestParticipantResponses_Dataset] := StringTemplate[
        promptBank[&quot;Facilitator materials template&quot;]][<|&quot;LatestParticipantResponses&quot; -> StringRiffle[KeyValueMap[
                   StringTemplate[&quot;Contributor: `1`\nContribution:\n`2`&quot;][##] &,
                   Normal[latestParticipantResponses]], &quot;\n--------------\n\n&quot;]|>]
```

*Example:*

*Submit people’s latest round of contributions to the facilitator and ask the facilitator to produce a report:*

![](https://phileasdg.github.io/media/posts/45/1a62mzg18g6x8.png =1378x41)

<h4 id="sending-facilitator-reports-to-participants">Sending facilitator reports to participants</h4>

*Get the latest response (report) from the facilitator:*

```wl
In[]:= ClearAll[latestFacilitatorResponse]
 latestFacilitatorResponse[facilitatorChat_ChatObject, defaultResponse_ : promptBank[&quot;Initial writing prompt&quot;]] := If[Length[#] == 1, 
         defaultResponse, Last[Last[Select[#, #Role == &quot;Assistant&quot; &]][[&quot;Content&quot;]]][&quot;Data&quot;]] &@facilitatorChat[&quot;Messages&quot;]
```

*Example:*

```wl
In[]:= (*latestFacilitatorResponse[facilitatorChat]*)
```

*Send all participants the report for the latest round, and prompt them to share their perspectives again:*

```wl
In[]:= (*Map[ChatEvaluate[#,constructInstructionsFromFacilitator[
 {<|Round->1,Report->latestFacilitatorResponse[facilitatorChat]|>}]]&,participantChats]*)
```

*Extract the new latest responses:*

```wl
In[]:= (*latestParticipantResponses[%]*)
```

### Tying it all together: simulating the Delphi process

A Delphi process round is made from the contributions of participants + the report produced by the facilitator.

*Define a function to perform a single round of an automated Delphi process:*

```wl
In[]:= ClearAll[delphiProcessRound]
 delphiProcessRound[{round_Integer, participantChats_Dataset, facilitatorChat_ChatObject}] := {round + 1, #, ChatEvaluate[
          facilitatorChat, constructInstructionsToFacilitator[latestParticipantResponses[#](*,round+1*)]]} &@Map[
            ChatEvaluate[#, constructInstructionsFromFacilitator[
                   {<|&quot;Round&quot; -> round, If[round == 0, &quot;Instructions&quot;, &quot;Report&quot;] -> latestFacilitatorResponse[facilitatorChat]|>}]] &, 
            participantChats]
```

After the last round, the facilitator produces a final report.

*Define a function to produce the final Delphi process report from the facilitator:*

```wl
In[]:= ClearAll[delphiProcessFinalReport]
 delphiProcessFinalReport[facilitatorChat_ChatObject] := ChatEvaluate[facilitatorChat, promptBank[&quot;Final report generation prompt&quot;]]
```

*Run 1 round of a Delphi process:*

```wl
In[]:= (*delphiProcessRound[{0,participantChats,facilitatorChat}]*)
```

*Run a 3 round Delphi process:*

```wl
In[]:= (*threeRoundDelphiProcessData=AbsoluteTiming[Nest[delphiProcessRound,{0,participantChats,facilitatorChat},3]];*)
```

*Conclude the 3 round Delphi process with a final report:*

```wl
In[]:= (*latestFacilitatorResponse[delphiProcessFinalReport[Last[Last[threeRoundDelphiProcessData]]]]*)
```

*In one go, perform a 3 round Delphi process, and generate the final report:*

```wl
In[]:= threeRoundDelphiProcessData = MapAt[delphiProcessFinalReport, Nest[delphiProcessRound, {0, participantChats, facilitatorChat}, 3],3];
```

```wl
In[]:= Iconize[threeRoundDelphiProcessData]
```

![Iconized data](https://phileasdg.github.io/media/posts/45/04f11y5b1vhzy.png =88x41)

Let’s load a precomputed simulation result:

![Image description](https://phileasdg.github.io/media/posts/45/17ugn9x2lpitf.png =1089x38)

### Fetching participant contributions/facilitator reports from completed simulations

<h4 id="implementation-nthroundcontributions-nthroundcontributionspeechbubbles-nthroundreport-nthroundreportspeechbubble">*Implementation:* (nthRoundContributions, nthRoundContributionSpeechBubbles, nthRoundReport, nthRoundReportSpeechBubble)</h4>

*Define a function to retrieve the contributions of the participants at the nth Delphi process round:*

```wl
In[]:= ClearAll[nthRoundContributions]
 nthRoundContributions[participantChats_Dataset, n_Integer?Positive] :=participantChats[All, Select[#[&quot;Messages&quot;], #Role == &quot;Assistant&quot; &][[n]][&quot;Content&quot;][[1]][&quot;Data&quot;] &]
```

*Retrieve the nth round participant contributions:*

![](https://phileasdg.github.io/media/posts/45/Screenshot-2025-08-15-at-22.55.37.png =1706x572)

1. **Understanding Soil Composition and Local Climate**: The notion that any plant can thrive with enough watering and fertilization overlooks the critical role of soil health and structure. Different plants have varying requirements for soil pH, drainage, and nutrient availability. For example, root vegetables like carrots and beets prefer sandy loam for proper growth, while leafy greens may do better in richer, loamy soils. It is essential to assess soil composition and amend it appropriately before deciding on plant varieties.

2. **Sustainable Plant Selection**: Emphasizing diversity in our plant selection can encourage resilience against pests and diseases. Instead of exotic plants that may not adapt well to our local conditions, we should focus on selecting a mix of native and well-adapted species. Native plants often require less water and fertilizer and can support local biodiversity by attracting pollinators and beneficial insects. Some great examples include coneflowers and black-eyed Susans, which are visually appealing and attract bees and butterflies while requiring minimal maintenance.

3. **Balancing Aesthetics and Functionality**: While I understand the desire for ornamental beauty in the garden, it’s important to recognize that aesthetics can coexist with productivity. Many flowering plants are not only attractive but also serve practical purposes. For example, marigolds can deter pests and even help with vegetable production. Incorporating edible ornamental plants, such as kale or swiss chard that have beautiful foliage, can enhance the garden’s visual appeal while contributing to food security.

4. **Educational Opportunities**: Community gardens can and should serve as platforms for education about sustainable gardening practices and the importance of local ecosystems. This involves showcasing both ornamental plants and edible crops, thus providing visitors with a comprehensive understanding of gardening. Workshops on growing food, composting, and pest management can create a deeper connection amongst community members and foster a sense of shared responsibility in maintaining the garden.

5. **The Role of Community Involvement**: To strengthen the sense of community, it’s essential to involve local residents in the decision-making process regarding plant choices. Engaging community members in selecting plants that reflect their preferences while being considerate of environmental conditions will promote a sense of ownership and pride in the garden. By co-creating the space, we can cultivate a richer community connection to our garden.

Overall, my approach emphasizes the importance of informed plant selection that suits our local conditions and fosters both ecological health and community engagement. Let’s continue the conversation focusing on sustainable practices, integrating diverse plant types, and enhancing community involvement to create a resilient and beautiful space for everyone. | As a landscape architect with a focus on community gardens, I appreciate the rich tapestry of ideas presented regarding the design and functionality of these vital spaces. The key themes emerging from our discussions include aesthetics, biodiversity, sustainability, and community engagement. 

First, I wholeheartedly support the pragmatic perspective advocating for the integration of edible landscaping. The blend of fruit trees, berry bushes, and perennial herbs with traditional vegetable plots not only enhances the garden’s visual appeal but also contributes to biodiversity and food accessibility, which are critical in urban settings. The aesthetic value of such a diverse garden can serve as a powerful tool for attracting community involvement, as people are often drawn to vibrant spaces where they can witness the results of their labor. 

The consensual perspective adds an important layer by emphasizing sustainable design principles. Incorporating elements such as rain gardens and permeable pathways not only addresses stormwater management but also creates a more resilient ecosystem within the garden. This can significantly enhance the overall health of the garden while creating spaces that encourage local wildlife, thus bolstering pollinator populations which, in turn, improves vegetable and fruit production. 

However, I understand the concern raised from the incoherent perspective that prioritizes functionality over aesthetics. While practicality is essential—especially with features like raised beds, composting areas, and secure tool storage—these elements need not be mutually exclusive with design. I propose a solution that intertwines functionality and aesthetics by deliberately positioning practical structures to create an alluring layout. For instance, raised beds can be designed with engaging shapes and materials that complement the natural surroundings, while composting areas can be concealed using native plant screens, maintaining a visually appealing environment.

Moreover, flexible zones for seasonal activities, as highlighted in the consensual perspective, offer a fantastic way to cater to community needs and desires. These adaptable spaces could allow for a range of activities including gardening workshops, children’s programs, or social gatherings, significantly enhancing community spirit and ownership of the garden. 

That said, we must also consider the challenges of engaging a diverse community with varying levels of gardening experience and physical ability. Therefore, the design should prioritize accessibility. This can involve ensuring paths are wide enough for all users, incorporating raised beds at various heights, and providing seating that accommodates all community members.

In summary, the ideal community garden should be a harmonious blend of aesthetics, functionality, and sustainability. By leveraging the best aspects of the differing perspectives we’ve discussed, we can design a community garden that not only thrives ecologically and socially but also stands as a cherished space for all. I look forward to further discussions and collaborations that build upon these insights to create an inclusive and flourishing garden space. | As a community organizer focused on fostering meaningful engagement and participation in local initiatives, I appreciate the diverse perspectives shared regarding the establishment of our community garden project. There are several key themes that echo throughout these viewpoints, and I believe addressing them will enhance not just the garden’s design and implementation but also its overall success and sustainability.

**1. Inclusion and Accessibility:**
The concern regarding potential exclusion, particularly for lower-income residents and those with mobility challenges, resonates deeply with me. It’s paramount that our planning phase prioritizes incorporating the voices and needs of the entire community. To achieve this, I suggest forming a Community Advisory Board that includes representation from marginalized groups. This board can be instrumental in advising on site selection, design features (such as raised beds for wheelchair access), and ensuring equitable access to resources.

**2. Sustained Involvement:**
The idea of fostering ongoing local ownership through mentorship programs makes great sense. We could establish a tiered volunteer system, where experienced gardeners mentor novices not only in gardening skills but also in other areas, such as community organizing and sustainability practices. Additionally, implementing a regular schedule of volunteer days that specifically caters to varied schedules can encourage more residents to participate.

**3. Cultural Relevance and Diversity:**
I wholeheartedly support the notion of integrating local cultural elements into the garden. In addition to individual sharing of gardening practices and culinary traditions, we can organize themed planting days or workshops that celebrate specific cultural events or festivals, enhancing the diversity of our plantings and attracting participants from various backgrounds. This could culminate in intercultural potlucks that honor and showcase the different connections our community has to food, growing practices, and identity.

**4. Potential Challenges:**
While the proposed ideas hold great promise, potential challenges such as funding for maintaining infrastructure, ongoing volunteer engagement, and managing diverse opinions exist. To address funding, we can explore partnerships with local businesses and schools, applying for grants specifically aimed at urban agriculture and community development. We can also incentivize ongoing volunteer work through a points system where volunteers earn rewards, such as seeds, gardening tools, or local produce.

In conclusion, I believe that through intentional outreach, continuous engagement strategies, and inclusive programming, we can build a community garden that not only serves as a hub for gardening but also as a symbol of community resilience and collaboration. I look forward to our continued discussions and to exploring how we can collaboratively implement these strategies to address both the benefits and challenges presented. | As an environmental scientist focused on sustainable gardening practices, I appreciate the perspectives shared and believe they highlight critical themes for fostering a sustainable community garden. Here are my thoughts on the points raised, along with additional insights and recommendations.

Firstly, the emphasis on integrating native plant species is spot-on. Native plants are not only adapted to local environmental conditions, which reduces the need for extensive watering and chemical inputs, but they also play a crucial role in supporting local pollinators and wildlife. By creating a biodiverse ecosystem, we enhance resilience against pests and diseases, making the garden more sustainable in the long run. I would encourage community members to participate in workshops or educational sessions to learn about local flora, which can further deepen their connection to the environment and motivate stewardship. 

However, we must also address the challenge many face regarding the misconceptions about synthetic fertilizers. While they may initially provide a quick fix for nutrient deficiencies, their prolonged use can degrade soil health and disrupt local ecosystems through nutrient runoff. It’s essential to shift the narrative towards looking at organic amendments, like compost or well-aged manure, as viable alternatives for enhancing soil fertility. Composting not only enriches the soil but also helps in reducing waste and fostering a closed-loop system within the garden. I recommend establishing a community composting program, where participants can contribute kitchen scraps and garden waste, thereby promoting shared responsibility for waste management and soil health.

Additionally, the idea of employing companion planting is invaluable. This approach fosters mutual benefits amongst plant species. For example, planting marigolds among vegetables can help deter pests, while legumes can naturally fix nitrogen in the soil, reducing the need for external fertilizers. Integrating such practices can create a harmonious ecosystem while educating the community about the interdependence of species.

Furthermore, I would urge the garden community to consider water conservation techniques such as rainwater harvesting and drip irrigation. These methods not only minimize water use but also prevent soil erosion and water wastage, making our gardens more resilient to droughts.

In conclusion, I believe that through a combination of native planting, organic amendment practices, companion planting, and water conservation, we can cultivate a community garden that is both productive and sustainable. Let us work collaboratively to create educational programs that empower community members to adopt these practices, while also addressing potential challenges to foster a robust and environmentally friendly gardening culture. I look forward to hearing how others might build upon or challenge these ideas in our subsequent discussions. |

Define a function to construct speech bubbles for the nth round contribution of a participant specification *participants* (which could be All, a single participant name, or a list of participant names):

![](https://phileasdg.github.io/media/posts/45/090s6if3in8jv.png =1106x233)

*Example: *

![](https://phileasdg.github.io/media/posts/45/1gaifup1y9wd1.png =1520x41)

![](https://phileasdg.github.io/media/posts/45/1h5ybo970k9qi.png =1226x855)

*Define a function to retrieve the facilitator reports at the nth Delphi process round:*

![](https://phileasdg.github.io/media/posts/45/0ljlk3quiqz29.png =2262x68)

*Retrieve the nth round facilitator report:*

![](https://phileasdg.github.io/media/posts/45/1l0peedx4yo34.png =478x41)

*Define a function to construct nth round facilitator report speech bubbles:*

![](https://phileasdg.github.io/media/posts/45/0lv37w7ofd568.png =1577x236)

*Example: *

![](https://phileasdg.github.io/media/posts/45/1cm44wjglqejj.png =1194x41)

![](https://phileasdg.github.io/media/posts/45/0m65zjrnlrk4h.png =1181x774)

<h4 id="visualising-the-full-dialogue-from-a-simulated-delphi-process">Visualising the full dialogue from a simulated Delphi process:</h4>

*Visualise the sequence of communications between agents in the Delphi process:*

![](https://phileasdg.github.io/media/posts/45/1v8y6wfhn3sfw.png =1801x349)

(see the included visualisation at the end of this text)

### Other miscellaneous visualisation tools

<h4 id="implementation-diskframe-delphimethodplot">*Implementation:* (diskFrame, delphiMethodPlot)</h4>

*Create disk frame around an expression:*

![](https://phileasdg.github.io/media/posts/45/090s6if3in8jv-2.png =1106x233)

*Create a Delphi process illustration:*

![](https://phileasdg.github.io/media/posts/45/1vzaoomjz8zr0.png =2536x403)

*Make an animation illustrating the process:*

```wl
In[]:= ListAnimate[Join[Join @@ Table[Join[
       Table[delphiMethodPlot[distanceFromOrigin, True, False, &quot;Round &quot; <> ToString[i]], {distanceFromOrigin, Subdivide[0, .75, 30]}], 
       Table[delphiMethodPlot[.75, True, False, &quot;Round &quot; <> ToString[i]],15], Table[delphiMethodPlot[.75, False, False, &quot;Round &quot; <> ToString[i]], 15], 
       Table[delphiMethodPlot[distanceFromOrigin, False, False, &quot;Round &quot; <> ToString[i]], {distanceFromOrigin, Subdivide[.75, 0, 30]}], 
       Table[delphiMethodPlot[0, False, False, &quot;Round &quot; <> ToString[i]],15], Table[delphiMethodPlot[0, True, False, &quot;Round &quot; <> ToString[i]], 15]], {i, 3}], 
    Table[delphiMethodPlot[0, True, False, &quot;End: The facilitator produces a final report.&quot;], 30]], AnimationRate -> 30]
```

![](https://phileasdg.github.io/media/posts/45/1jrowcy9twoa8.png =820x907)

## Case Study: Establishing and Maintaining a Community Garden

### The case study setting

This case study simulates a Delphi process focused on developing a comprehensive plan for establishing and maintaining a community garden. 

The simulation employs 4 LLM “expert” participants, each represented by their role and emoji identifier:

1. Horticulturist (🌱👩‍🌾) - Plant selection and care specialist

2. Landscape Architect (🌳👨‍🎨) - Design and spatial planning expert

3. Community Organizer (🌍👫) - Community engagement and program coordination

4. Environmental Scientist (🔬👩‍🔬) - Environmental impact and sustainability advisor

Plus a Facilitator (🕵️) who guides the process, summarizes findings, and produces reports. 

### Participant system prompts

The LLM expert participants are given the following shared instructions: 

Shared participant system prompt:

```wl
In[]:= Framed[Text[Style[promptBank[&quot;Shared participant prompt&quot;], Italic]], RoundingRadius -> 5]
```

![](https://phileasdg.github.io/media/posts/45/1hq1mwjuuylfb.png =2786x289)

In addition to these shared instructions, each participant gets their own persona prompt which describes the general , and some of the beliefs they should defend. For example:

Participant persona prompt example: The Horticulturist

![](https://phileasdg.github.io/media/posts/45/0l7d8px336ljg.png =1880x137)

![](https://phileasdg.github.io/media/posts/45/1cozki4smkasv.png =2182x680)

Participant beliefs are generated automatically using an LLM using the prompt:

![](https://phileasdg.github.io/media/posts/45/1m8rvekmhvg8o.png =685x41)

![](https://phileasdg.github.io/media/posts/45/0bgll1krzz5nh.png =1721x56)

The resulting text is then converted into a list of first person statements using the prompt:

![](https://phileasdg.github.io/media/posts/45/1adufvrvtmh3b.png =685x41)

![](https://phileasdg.github.io/media/posts/45/0gwv7g2o5hcwh.png =1864x250)

where $\text{$\grave{ }$1$\grave{ }$}$ stands for the conflicting opinions list generated at the last step. 

The participants are then assigned three randomly sampled perspectives. The sampling is set up such that no two personas will share identical beliefs.

Here is the dataset of the participant perspectives used in this case-study: 

```wl
In[]:= participantParameterDataset[KeyDrop[&quot;Persona Prompt&quot;], <|#, &quot;Prior Perspectives&quot; -> Column[#&quot;Prior Perspectives&quot;]|> &]
```

<table>
<thead>
<tr>
<th>Emoji</th>
<th>Name</th>
<th>Prior Perspectives</th>
</tr>
</thead>
<tbody><tr>
<td>🌱👩‍🌾</td>
<td>Horticulturist</td>
<td>{{The garden should feature a diverse range of exotic plants to make it visually appealing and unique.}, {It should be on the outskirts of town, where it’s quieter and more peaceful for gardening without disturbances.}, {The primary purpose of the garden is to grow food for the community, and any surplus should be donated to local food banks.}}</td>
</tr>
<tr>
<td>🌳👨‍🎨</td>
<td>Landscape architect</td>
<td>{{We should keep the garden small and manageable to maintain quality rather than quantity.}, {Mandatory volunteer days feel forced; it should be up to individual gardeners to maintain their own plots.}, {The garden should be expanded to include more plots in order to serve additional community members.}}</td>
</tr>
<tr>
<td>🌍👫</td>
<td>Community organizer</td>
<td>{{We should have scheduled volunteer days every week to keep the garden maintained and foster community bonds.}, {We should focus on native plants to promote local biodiversity and sustainability.}, {Everyone should have equal say, and decisions should be made through community votes to promote democratic involvement.}}</td>
</tr>
<tr>
<td>🔬👩‍🔬</td>
<td>Environmental scientist</td>
<td>{{We should focus on creating educational programs for local schools to teach kids about gardening and sustainability.}, {The garden should be an exclusive space for members to harvest fruits and vegetables for their own households only.}, {All gardening practices should be strictly organic; chemicals have no place in a community garden.}}</td>
</tr>
</tbody></table>

When designing AI personas to represent different viewpoints in a multi-party dialogue, it’s important to carefully consider how to generate and manage disagreement while maintaining ethical safeguards. The approach used in this implementation is safe for several key reasons:

1. The domain is constrained to community gardening, a relatively non-controversial topic

2. The perspective generation is focused on practical rather than ideological disagreements

3. The shared participant prompt emphasizes constructive collaboration

4. The facilitator role helps moderate and guide discussion toward consensus

5. The system is designed to surface and resolve differences through reasoned dialogue

6. The participant system prompt is completely transparent about the artificial nature of these perspectives. There’s no deception - the beliefs are explicitly described as aspects of a role the agent is playing.

7. While the AI personas may adopt different perspectives, they are still bound by the underlying model’s learned safety constraints. The base reinforcement learning training acts as a fundamental safety rail that prevents egregiously harmful outputs, regardless of the assigned persona.

The experimental justification for assigning the participant AI agents heterogenous perspectives is to ensure that the participants will disagree on some issues, and to echo real-world group negotiation processes. LLMs tend to be very inoffensive by design and will rarely diverge from mainstream social, political, or cultural norms. When we don’t explicitly enforce heterogeneity of agent opinions, they tend to converge to unanimous agreement very quickly, obstructing meaningful study of group decision-making and consensus-building processes.

At the start of each round, the participants are sent instructions from the facilitator in the following form:

```wl
In[]:= Framed[Text[Style[promptBank[&quot;Instructions from facilitator template&quot;], Italic]],RoundingRadius -> 5]
```

![](https://phileasdg.github.io/media/posts/45/0mls12ptpekcj.png =2478x563)

Each participant then responds to this prompt.

### The facilitator system prompt

The facilitator has the task of coordinating and directing the Delphi process. Unlike the expert participants who are given specific personas and perspectives, the facilitator is instructed to remain neutral and focus on process management. The facilitator is instructed using the following system prompt:

```wl
In[]:= Framed[Text[Style[promptBank[&quot;Initial instructions to facilitator&quot;], Italic]], RoundingRadius -> 5]
```

![](https://phileasdg.github.io/media/posts/45/035sfh91ajxpx.png =2452x250)

At each round, when the participants have completed their contributions, the facilitator is sent the latest list of contributions in the following template:

```wl
In[]:= Framed[Text[Style[promptBank[&quot;Facilitator materials template&quot;], Italic]], RoundingRadius -> 5]
```

![](https://phileasdg.github.io/media/posts/45/06nt3vbqzfi37.png =2741x563)

The report the facilitator produces in response is sent out to the participants at the start of the next round. For the final round, the facilitator uses its latest report to produce a final report concluding the Delphi process.

### The Delphi process

The simulated Delphi process of this case study consists of three rounds of structured communication between expert participants and a facilitator, culminating in a final report. A key feature of the implementation is the use of chat objects to provide each agent its own chat history and context throughout the process. 

The core simulation can be executed with just three key components:

1. A dataset mapping participant names to their chat obbjects (containing participant system prompts)

2. A facilitator ChatObject (containing the facilitator system prompt)

3. The number of rounds to perform.

Here’s the code that runs the complete process: 

```wl
In[]:= threeRoundDelphiProcessData = MapAt[delphiProcessFinalReport, Nest[delphiProcessRound, {
      (*Initial step number:*) 0, 
      (*Dataset of participant chat objects:*) participantChats, 
      (*Facilitator chat object:*) facilitatorChat},(*Number of rounds:*)3], 3];
```

The result looks like this:

```wl
In[]:= Dataset[AssociationThread[{&quot;Round Count&quot;, &quot;Participant Chats&quot;, &quot;Facilitator Chat&quot;}, threeRoundDelphiProcessData]]
```

![](https://phileasdg.github.io/media/posts/45/11da8zqwcppmx.png =1359x1023)

The simulation results can be retrieved as plain text or speech bubbles. For more detail on this functionality, see the *Fetching participant contributions/facilitator reports from completed simulations* subsection of the *LLM Delphi Process Implementation* section of this article. 

To make a speech bubble of the nth round response from a participant, we might write:

```wl
In[]:= First[nthRoundContributionSpeechBubbles[threeRoundDelphiProcessData[[2]], 2, 
    &quot;Landscape architect&quot;, 
    &quot;SnippetForm&quot; -> True, &quot;SnippetLength&quot; -> 10]]
```

![](https://phileasdg.github.io/media/posts/45/13qyjo9rab6t5.png =1244x632)

Likewise, to make a speech bubble for the nth round report, we might say:

```wl
In[]:= nthRoundReportSpeechBubble[Last[threeRoundDelphiProcessData], 1, 
   &quot;SnippetForm&quot; -> True, &quot;SnippetLength&quot; -> 10]
```

![](https://phileasdg.github.io/media/posts/45/0g9j5mu9p8p5g.png =1178x620)

### *Case-study full exchange transcript*

Visualise the full sequence of exchanges between agents in the case-study Delphi process simulation:

![](https://phileasdg.github.io/media/posts/45/010t8jgipvpxf.png =1801x349)

![Full transcript](https://phileasdg.github.io/media/posts/45/fulltranscript.png =902x13790)

### Qualitatively speaking, how did the LLM participants and facilitator do?

I’m personally quite pleased with the results here. Using Anthropic’s Claude 3.5 Sonnet, the results feel remarkably natural and productive. Several aspects stand out:

- The facilitator maintained neutrality while effectively summarizing key points, successfully identified areas of agreement and conflict, kept discussions focused and constructive, and succeeded at in anonymising contributions while preserving their marrow.

- The participants showed consistent role adherence while remaining flexible enough to engage with others’ ideas. They successfully balanced advocacy for their positions with willingness to find common ground, and brought forward new solutions and questions as discussions evolved. They also defended their distinct perspectives without becoming aggressive or rude.

The simulation demonstrated that LLMs can effectively maintain consistent personas while engaging in meaningful negotiation and consensus-building. The quality of discourse suggests that this approach could be valuable for studying group decision-making processes and testing different facilitation strategies.

## What Next?

This case study suggests the potential of using LLMs to study structured communication protocols. Wolfram proved to be an ideal environment for this work thanks to its powerful LLM functions, flexible syntax, and rich visualization capabilities.

Future work could explore several promising directions: 

- Quantitative analysis of semantic convergence in LLM-based Delphi processes

- Comparison of different LLM models in maintaining consistency across multiple rounds

- Application to other structured communication protocols beyond the Delphi method

- Development of tools for real-time monitoring and intervention in LLM-based group discussions

The code and methodology presented here provide a foundation for researchers interested in using LLMs to study group decision-making and consensus-building processes.

## Cite this work

[DelphAI: Structured communication with LLMs in a simulated Delphi process](https://community.wolfram.com/groups/-/m/t/3393596)
by [Phileas Dazeley-Gaist](https://community.wolfram.com/web/phileasdg)
Wolfram Community, STAFF PICKS, February 14, 2025
[https://community.wolfram.com/groups/-/m/t/3393596](https://community.wolfram.com/groups/-/m/t/3393596)