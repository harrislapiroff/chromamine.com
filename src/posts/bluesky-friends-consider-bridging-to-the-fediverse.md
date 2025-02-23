---
title: Bluesky friends, consider bridging to the Fediverse!
date: 2025-02-07
categories: [Software]
tags: [web, social media]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/113963780664509051
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid027hybCi8oUDC9HiPmVNCJnC1T19nRDAgou6X1dP3hSXpc4kevb2uawz9ftXXCEWNml
---

:::note
TL;DR: Bridging your [Bluesky][] account will allow me and others who use the [Fediverse][] (including [Mastodon][]) to interact with you on Bluesky.

[Bluesky]: https://bsky.social/
[Fediverse]: https://fediverse.info/
[Mastodon]: https://joinmastodon.org/

If you don't need to read a whole thing to persuade you, you can bridge your account _right now_ by following [@ap.brid.gy][] on Bluesky. Otherwise, read on.
:::

[@ap.brid.gy]: https://bsky.app/profile/ap.brid.gy

As I and others have been exploring our social media horizons beyond the legacy options of Twitter/X, Facebook, Instagram, etc., I've made no secret of my [skepticism][] [about][] Bluesky. But I've also been lurking there lately and the center of gravity for the political news and conversation I used to get from Twitter is definitely on Bluesky now.

[skepticism]: /2024/11/try-mastodon/
[about]: /2024/12/blueskys-enshittification-risk/

Frustratingly, though both services are based on (theoretically[^1]) decentralized protocols, they made different architectural decisions which prevent first-class interoperation.

[^1]: Bluesky is based on a decentralized protocol they developed, [AT Proto][], but in practice it is almost entirely controlled by _Bluesky, the VC-funded startup_. It's likely to remain so for the foreseeable future. If you would like to read *too much* about the question of Bluesky's decentralization, there's no better writer on the subject than [Christine Lemmer-Webber](https://dustycloud.org/blog/how-decentralized-is-bluesky/).

[AT Proto]: https://atproto.com/

So I'm asking Bluesky users to consider bridging their accounts to the _[Fediverse][]_ – that is, making their Bluesky presence available in the content-universe that includes Mastodon and other ActivityPub-supporting services.

[Fediverse]: https://fediverse.info/

# How does bridging work?

[Ryan Barrett][] created a service called [Bridgy Fed][] that mirrors Bluesky profiles, content, and interactions to the Fediverse and vice versa.

[Ryan Barrett]: https://snarfed.org/
[Bridgy Fed]: https://fed.brid.gy/

For example, my Mastodon account [@harris@social.coop][] is mirrored on Bluesky as [@harris.social.coop.ap.brid.gy][]. When I post on Mastodon, it shows up on my mirrored Bluesky profile. If I'm following someone who's Bluesky profile is mirrored to Mastodon, when I like or reply to their posts on Mastodon, those interactions also get mirrored back to Bluesky. It allows me and people on Bluesky to interact as though we were on the same service.

[@harris@social.coop]: https://social.coop/@harris
[@harris.social.coop.ap.brid.gy]: https://bsky.app/profile/harris.social.coop.ap.brid.gy

The catch is that this is an opt-in service. If you as a Bluesky user don't opt-in, then _you_ can follow me and see my posts, but _I can't see yours_. And if you like or reply to any of my posts, I can't see that either, unless I log in to Bluesky and poke around my mirrored profile.

# Why should I bridge my account?

1. Well, firstly and most selfishly, I will be able to see your posts and interact with you from Mastodon and spend less time juggling multiple microblogging services.
2. It increases the value of accounts on both services! You likely know at least a few people you'd benefit from following (friends or public figures) who are anti-corporate or open-source nerds like me and prefer the Fediverse. Certainly it's a benefit to the Fediverse to be able to access the wealth of content and conversation on Bluesky. This doesn't need to be a fight to the death of social media platforms – they can make each other better.
3. The more people who are using and getting value from the functionality that makes Bridgy Fed possible, the more likely it is that Bluesky will resist future pressure to remove the very features that make it an open and (plausibly, someday) decentralized platform.[^2]

[^2]: Investors, I think, are very likely to apply this pressure to Bluesky at some point, since being able to freely view and use your service via non-first-party mechanisms, tends to make it harder to show people ads, monetize their content, and sell them stuff. We saw this [happen with Reddit][reddit] last year, as another example.

[reddit]: https://en.wikipedia.org/wiki/2023_Reddit_API_controversy

# Some Caveats

Bridgy Fed certainly has some rough edges. As someone who cut their teeth on the web of the early aughts that was dominated by open APIs, self-hosted websites, and wild experimentation, I'm used to that. I've come to prefer the trade offs of the rough edges over the slick corporate walled gardens that dominated the past decade. But it's worth noting some of the problems you can expect when bridging:

* Mirroring isn't always consistent. Sometimes my posts are mirrored on a delay or aren't mirrored at all and it's not always obvious to me why.
* Different feature sets lead to awkward adaptations. A major example: ActivityPub on its own supports posts of any length. Most Mastodon instances have a 500 character limit. Bluesky has a 300 character limit. When I write a Mastodon post with more than 300 characters, it gets shown truncated to Bluesky users and they have to click a link to see it.
* I don't actually know how Barrett funds Bridgy Fed and it seems kinda like a hobby project for him.[^3] I hope he'll keep it up for a while to come, but it's not like it's supported by the flagship Mastodon nonprofit or something confidently stable. As far as I can tell, it's just a guy with a hobby.
* I have no idea how it interacts with limited visibility content. Basically everything I've written above assumes public accounts and public content.

[^3]: I've offered to donate some money to the cause, but he replied that they don't take donations yet – maybe someday.

Hope I'll see you across the bridge from the Fediverse soon.

***

For Bluesky Users:

{% button "Follow @ap.brid.gy" "https://bsky.app/profile/ap.brid.gy to opt-in" %}

For Mastodon/Fediverse Users:

* Follow `@bsky.brid.gy@bsky.brid.gy` to opt-in (e.g., enter it into the search bar on your Mastodon instance)
