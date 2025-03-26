---
title: Signal is not appropriate for military communication, whether you use it well or not
date: 2025-03-26
categories: [Software]
tags: [security, politics, war]
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

First off, here are two things that are true and not contradicted by my writing that follows:

1. The Trump administration is full of people who are incompetent, malicious, and bad at their jobs, whose primary qualifications are sycophancy.
2. Signal is an *excellent* secure messaging app for most people, who are not coordinating military operations.

With that out of the way, I've seen a [Facebook post][] that's *kind of* misinformation shared around in the past few days. I don't usually make it my job to correct all misinformation on the internet, but this one was shared enough and touches subjects where I have knowledge. It also provides an opportunity to explore how to think like a security professional!

[Facebook post]: /media/signal-is-not-appropriate-for-military-communication/post.png

I'll caveat that I don't call myself a security expert. I work alongside experts on a daily basis and have a general idea of what sort of things they think about. Specifically, I work professionally on interface design and product management for [projects][] where security is a core concern.

[projects]: https://dangerzone.rocks/

Here's a point about security that I think laypeople often miss:

**Security isn't a spectrum from insecure to secure.** Things that are more secure in one scenario might be overkill or actively less secure in another. You have to consider *the specific threats in play*. Security experts call this [threat modeling][].

[threat modeling]: https://en.wikipedia.org/wiki/Threat_model

The problem with [government agents using Signal to conduct military operations][atl1] is not "they're morons who used Signal wrong." Yes, they made a confusing and hard to explain error in their usage of Signal. Also, yes, it's *very satisfying* to [make][] [fun][] [of][] [them][] for being bad at this. But the *primary error* was using Signal *at all* for this purpose. It's not designed for that!

[atl1]: https://www.theatlantic.com/politics/archive/2025/03/trump-administration-accidentally-texted-me-its-war-plans/682151/
[make]: https://social.taupehat.com/@me/114221830847605037
[fun]: https://bsky.app/profile/actuallyowltistic.com/post/3llavrd4wc22m
[of]: https://reductress.com/post/woman-texting-group-chat-about-crush-double-checks-that-atlantic-editor-not-in-here/
[them]: https://bsky.app/profile/did:plc:sq4srjwg5noukbywa5stn6ar/post/3ll56ohqtzs23

As [Actual Security Expert Matt Blaze][blaze] – I recommend a follow, if you're interested in this stuff – [wrote][blaze-post]:

[blaze]: https://federate.social/@mattblaze/
[blaze-post]: https://federate.social/@mattblaze/114219067469829677

> Signal provides:
>
> - Excellent protection against third party interception of communications (wiretapping).
>
> - Limited protection against compromised (hacked) or lost devices
>
> - No protection against certain common usage mistakes (accidentally including a reporter in your large group war planning chat).
>
> [...]
>
> The difference is that systems like Signal are designed to *facilitate* communication with anyone. Classified systems are designed to *limit* communication to authorized recipients.
>
> Both are sensible for their respective - very different - purposes.

Or [Jason Koebler at 404media][404]:

[404]: https://www.404media.co/when-your-threat-model-is-being-a-moron-signal/

> Top officials in the executive branch should not be using Signal to communicate about military actions at all because the threat model for this sort of communication is so extraordinary and unique (and bound by retention laws) that they should be communicating on existing government channels designed for this exact purpose.

It's actually quite easy to accidentally add someone to a Signal group.[^1] Just off the top of my head, it could happen

- if you have a wrong number in your contacts,
- if you have multiple contacts with the same name,
- if you accidentally tap on a name next to the name of the person you're trying to add,
- if you're adding multiple people and you accidentally select an additional person without noticing, or
- if your BFF added someone and you happened not to notice the notification or just assumed they were fine because, after all, your BFF added them.

All of these are normal human errors that I could certainly make and I bet you could too.[^2] Confirmation dialogs help, but people also [learn to ignore them][nng-confirmation].

Nor is it a flaw for Signal to make this process easy. Good secure software makes an effort to systematically prevent users from making mistakes like this, but often security trades off with usability. Design needs to balance consequences with interface friction. For most Signal users, adding the wrong person to a group chat might be an embarrassing social faux pas, but mostly *it isn't a felony violation of the Espionage Act*.[^3]

[nng-confirmation]: https://www.nngroup.com/articles/user-mistakes/

I don't know a lot (anything) about the government systems used for communicating these sort of things, but I imagine they include restrictions that make them better for this purpose that if included in Signal would make it worse for most people. Some features I might speculate they include:

- Strict centralized identity verification
- An onerous approval process for adding new people to a conversation
- A limited number of people who have access to the system *at all*
- Usage limited to particular locations or devices

(It is possible there are safeguards Signal could add that would be worth the trade-offs for most people. The state-of-art on security moves ever forward. I'm sure they're talking about it.)

The Trump administration *did* demonstrate incompetence in this case, but the incompetence was not primarily that they used Signal *poorly* but that they used it *at all*. They also, notably, demonstrated malice by using Signal, most likely, for the purpose of evading data retention laws.

Also: Your web browser is not spying on your Signal chats and reporting their contents to advertisers. It just isn't. If that was happening, there would be no reason for Signal to exist at all, let alone for security experts to promote it, as [they](https://ssd.eff.org/module/how-to-use-signal) [do](https://freedom.press/digisec/blog/signal-beginners/). It would be game over from the start.

[^1]: This is all without even mentioning that the original post details the process for *adding someone to a group* but not for *creating a group*, which is likely the process that was used here.
[^2]: I've never made the specific error of adding someone to a group chat, but I've definitely made the similar error of sending a message to the wrong person, multiple times, and I've had it happen to me multiple times. This sort of thing is common, and tolerable for most uses.
[^3]: Sidenote: the Espionage Act is not a great law and is [oft-abused by the government][espionage].

[espionage]: https://freedom.press/issues/how-espionage-act-morphed-dangerous-tool-used-prosecute-sources-and-threaten-journalists/
