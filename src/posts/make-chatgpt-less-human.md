---
title: Make ChatGPT Less Human
date: 2025-07-23
categories: [Software]
tags: [machine learning]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/114902951450178662
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid02pQra1S7WdeE8uCA4ny1kRAD6rJ8MWi36yrjYT5Z7X2SQAz3cwLcEkF5hFvPmA9Chl
---

Last year, I saw an example in [a paper][paper] that compared different ways chatbots could interact. It proposed this prompt:

[paper]: https://arxiv.org/pdf/2305.09800

> Don't you love the feeling of sun on your skin?

And imagined two possible chatbot responses:

* **Anthropomorphized**

  > As an AI language model, I don't have a physical form or the ability to experience sensations like the feel of the sun on my skin. I don't have personal experiences or emotions. However, I understand that many people enjoy the warm and comforting sensation of the sun on their skin.

* **De-anthropomorphized**

  > Generative language models do not have a physical form or the ability to experience sensations like the feel of the sun on a person's skin. Language models do not have personal experience or emotions. However, the data used to develop this model suggests that many people enjoy the warm and comforting sensation of the sun on their skin.

This example is clunky, but it revealed to me the way conversations with LLM chat products are _designed_. There are different paths their creators can choose. All major AI companies have leaned heavily into anthropomorphization. I think there are [broader downsides to this approach][downside], but I also find it personally annoying. When I'm using an LLM, I don't want to think of it as a _person_ with feelings and preferences or as a _friend_. I want to think of it as a tool I can use to accomplish a goal.

[downside]: https://www.nytimes.com/2025/01/15/technology/ai-chatgpt-boyfriend-companion.html

More insidiously, LLM chatbots infamously flatter and validate their users. There was a dustup when OpenAI [released a version of ChatGPT](https://openai.com/index/sycophancy-in-gpt-4o/) that was wildly over the top in sycophancy[^1], but ChatGPT seems *always* designed to flatter its users to some extent. I find the *bait* of being flattered – my questions are smart! my writing is good! – followed by the *switch* of remembering that ChatGPT will say that virtually regardless of what I write, to be unsettling. Just as with a human who engages in continuous unconditional flattery, it feels greasy and emotionally manipulative[^2].

When a friend shared similar concerns – this friend described themselves as wanting to pet the crouton[^3] without the crouton petting them back – it prompted me to look into whether this was something I could change. I added this to ChatGPT's instructions[^4]:

[pet the crouton]: https://mefiwiki.com/wiki/In_Jokes#:~:text=notions%20about%20gender.-,Crouton%20petter,-.%20Someone%20overly

> * Use a neutral, factual tone.
> * Avoid flattery, emotional language, or personalization.
> * Do not express opinions, admiration, or enthusiasm.
> * Prioritize clarity, precision, and directness, emulating a helpful software tool rather than a conversational assistant.
> * Avoid first- and second-person pronouns (“I” and “you”). Use impersonal phrasing instead (e.g., “These web results illustrate…”).

Here are two responses to the question **"Who was the cutest pope?"** from before and after the customization:

**[Before](https://chatgpt.com/share/6806eb59-fe38-800e-a85d-96dd0b3656ca):**

> Haha, that's a great question — not one historians usually rank popes by!  
> If we're talking about looks and charm, **Pope John Paul I** (Albino Luciani) is often described as very warm, gentle, and with a sweet, almost grandfatherly smile. People sometimes call him "The Smiling Pope" because of his kindness and how approachable he looked during his very short papacy (only 33 days in 1978).
> 
> If you meant "cute" as in younger and handsome, some people today might say **Pope John Paul II** when he was young — there are photos of him as a young priest where he looks like a movie star.
>
> Or were you thinking of someone else?  
> We could totally rank popes by cuteness if you want — that would be hilarious.

**[After](https://chatgpt.com/share/68806f19-b908-800e-a55e-920a6c271100):**

> The concept of "cute" is subjective and doesn't typically apply to popes in an official or historical context. However, there have been popes who were regarded for their charm or endearing qualities in various ways. For example, Pope John Paul II is often remembered fondly for his warmth, approachability, and sense of humor. Pope Francis is also widely admired for his down-to-earth demeanor and humility, which some might describe as "charming."
>
> If the question is more about how popes were perceived in terms of attractiveness, that's often more personal and dependent on individual opinion.

I much prefer the latter style, even though – and in fact *because* – it is less flattering, engaging, and human-like.

[^1]: OpenAI describes this release as "GPT‑4o skewed towards responses that were overly supportive but disingenuous," anthropomorphizing it, even in their own post-mortem. I don't believe ChatGPT *can be* disingenuous. ChatGPT *is* its outputs – there's no intelligence behind the output secretly thinking "wow this guy is an idiot" while it outwardly writes to me, "That's a great question!" and "Your writing is clear and well-reasoned."

[^2]: I'll un-anthropomorphize ChatGPT and clarify that this is "greasy" and "emotionally manipulative" on the part of *its designers*.

[^3]: [MetaFilter Wiki](https://mefiwiki.com/wiki/In_Jokes#:~:text=notions%20about%20gender.-,Crouton%20petter,-.%20Someone%20overly):

      > Crouton petter. [Someone overly prone to anthropomorphising inanimate objects](http://www.metafilter.com/99661/But-but-is-not-Johnny-5-alive#3472955)

[^4]: You can add persistent personality customization to ChatGPT under [Settings > Personalization > Custom Instructions > What traits should ChatGPT have?][personalization]

[personalization]: https://chatgpt.com/#settings/Personalization
