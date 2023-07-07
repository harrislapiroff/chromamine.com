---
title: LastPass Breach
date: 2022-12-24
category: software
tags: security, LastPass, 1Password, passwords
xpost:
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid02tGxVvqSCEowGBZzFC7qeP1FE9beu1NwGoWP19YmKDTSSF8mjLZ1FDPvUzuWchrSl
---

[LastPass’s latest breach](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/) is not quite “bad guys have all your passwords” but it’s pretty bad and I’ve been unimpressed by their response. Here’s the brief summary, as far as I can understand it:

(If you just want to know *what to do* as a LastPass user, skip to the last two paragraphs.)

- In August, attackers acquired technical info and source code from a LastPass development server. No user data in attacker hands at this point. 
- LastPass published information promptly. 
- Some unspecified amount of time later attackers used that information to get keys from an engineer (How is not clear. Maybe social engineering?) and then downloaded user vault data.
- Two days ago, LastPass published a blog post announcing the second part of the breach. 
- Saved login metadata (notably URLs) are more or less unencrypted, so attackers have access to lists of what sites all LastPass users use. 
- Passwords are encrypted using user master passwords, so the attackers can’t decrypt those unless a user’s master password is guessable or reused from somewhere else where it may have been breached.
All software has security holes and LastPass is a huge target, so of course it’s under regular attack and some of those attacks will get through. Still, a couple particular things bug me:
- Storing metadata more-or-less unencrypted is not great. *Which* websites you use can be sensitive data on its own.
- The passwords are still encrypted by users’ master passwords. This is roughly what you want. Breaches like this are planned for and that’s the next level of defense as per the plan. But it’s possible to do better than this. 1Password encrypts vault data with master passwords *and* a randomly generated local secret key. Even if an attacker acquired vault data from 1P and could guess your master password, they still could not decrypt your vault. (The secret key adds a bit of friction to the 1P user experience, but I think it’s not particularly tricky and the trade off seems worth it in light of the LP breach.)
But, okay, let’s set those two issues aside. Maintaining trust is about how you respond to security incidents. For me, there’s a couple red flags in LastPass’s response:
- Timing: Why is the timing of the user vault access unspecified? If it was earlier this week, this is a prompt disclosure, so they did the best they could. If it was much earlier than that then this is a late disclosure, either because they didn’t know user data had been accessed or because they tried to hide it. Neither would be a great explanation. In that case, dropping a report right before a bunch of people go on vacation is particularly bad. Maybe more details will be published on this front that will vindicate their announcement timing here. I’ll update this post if so. 
- Communication: The blog post itself seems poorly written to me. The worst details of the breach and mitigations users need to take are buried in the middle of a long narrative post. Maybe a LastPass user can share if they’ve sent out any emails that are clearer about how you should protect your data?

I’m still a bit on the fence about how bad this is. If LastPass publishes more details about the attack timing, maybe I’ll come out sympathetic to them. But right now it doesn’t look great to me.

If you’re a LastPass user and you have a master password that you’ve reused elsewhere or that might be guessable by a computer script (e.g., not very long or based on just a couple dictionary words) you should reset every password in your vault. If that sounds daunting, do at least the most valuable ones. You should also assume someone out there knows what websites you have credentials for.

Using LastPass continues to be better than not using a password manager at all! But there are better options out there. 1Password is my password manager of choice. I think they’ve consistently been ahead of the curve on security innovations and their design work is very good—and making security tools easy and pleasant to use properly *is* good security. I’ve also heard good things about BitWarden and Dashlane. If you like open source and local vaults I’ve heard KeePassXC is the way to go. Your system native password managers (iCloud Keychain, etc.) are also good.

***

**[2022-12-27]** A few addenda:

* [Glyph’s post for LastPass users](https://mastodon.social/@glyph/109561764572740750) is full of practical advice
* SwiftOnSecurity, who’s a well-respected security poster, [says](https://twitter.com/SwiftOnSecurity/status/1606085825225170945) this will “hasten [their] looking at Bitwarden”
* [This post](https://palant.info/2022/12/23/lastpass-has-been-breached-what-now/) goes deep on the possibility of cracking vaults offline without the master password. I don’t think this should be a major concern for most users, but certainly for ones with access to highly consequential systems
* Respected security writer Bruce Schneier did a [brief write up](https://www.schneier.com/blog/archives/2022/12/lastpass-breach.html) on the breach. (I’m not sure why he quotes a random crypto Twitter account to raise the possibility that the breach might be worse than they’ve publicized—I see no reason to take that tweet at face value.)
* A member of Yahoo’s infosec team [explains why he discourages LastPass](https://infosec.exchange/@epixoip/109585049354200263)
* One outstanding question, which may never be answered is: Who was the attacker? It’s not like this data has cropped up on the dark web for sale (that I’ve seen) (yet). I’ve seen speculation that it’s state actors, which would suggest activists, journalists, government agents, etc. are at higher risk than most people. Of course, without knowing, one should prepare for any possibility.
