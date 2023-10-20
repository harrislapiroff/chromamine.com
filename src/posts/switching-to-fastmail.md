---
title: Switching to Fastmail
date: 2023-10-20
categories: ['Software']
tags: [anti-corporate internet, email, Google, Fastmail, web]
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/111269138698419956
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid02fZfiku552ygSp28aHWVeaTyENznYxVThVnrErk7x9f5Nk6FWoWHc6TcYANfAb1pl
---

A few months ago I got [pretty annoyed with Gmail][gmail]. The motivating event was noticing ads interspersed among my emails. It maybe wasn't a super big deal[^1], but it spurred me to realize that, while Gmail was the best-of-class email platform for many years, that moat has narrowed or disappeared[^2]. It's now possible to pay for a service better incentivized to make product decisions for users rather than business clients. I opted to switch to [Fastmail][][^3].

[gmail]: /2023/05/increasingly-frustrated-with-gmail/
[Fastmail]: https://www.fastmail.com/

This switch was _easier_ than I expected and I'm very satisfied with Fastmail. There's a few things that are slightly worse, but the majority of my email flow is much improved. The cost is only slightly more than I was previously paying Google for storage.

# Setup

Setup was super easy:

* It allowed me from the outset to use a custom domain. It automatically detected [my domain registrar][gandi] and gave me step by step instructions for how to configure through them.
* It imported all of my emails from my Gmail inbox and allowed me to leave the import running indefinitely. I thought I'd undergo a process of telling my friends to update their inboxes and changing my address for services across the web – but that hasn't been necessary. People email me at my Gmail address and I reply from my Chromamine address and there's no trouble.

[gandi]: https://www.gandi.net/en

# Custom Domains

The custom domain support is _so good_ it justifies the fee entirely for me. This might be a niche feature, since many people don't own their own domain names, but having a custom domain for email is so good that you maybe should consider it.

* Fastmail supports multiple custom domain names (Gmail, by contrast, doesn't seem to support any unless you pay for the more costly [Google Workspace][]).
* For each domain you can set up as many email addresses as you want. Each email address can have its own default signature, which has turned out to be pretty useful. For example, emails I send from `contra@chromamine.com` automatically include a link to my [contra dance website][contra] and a mention of the organizations I help run.
* You can also set it up to receive catch-all emails – i.e., anytime someone sends an email to <code><em>anyuser</em>@yourdomain.com</code> it can show up in your inbox. I use this to filter my emails and identify who shares my email address with spammers[^4].
* You can also *send* from arbitrary email addresses. I can send you an email and make up an address, say `todayisoct20@chromamine.com`, on the fly.

[Google Workspace]: https://workspace.google.com/
[contra]: /contra/

For me these are huge quality of life improvements over what I was getting previously from Gmail.

(Worth a note here: even if you don't have a custom domain, you can create multiple anonymous Fastmail addresses on the fly using Fastmail's "[masked email][]" feature, though I personally use [iCloud Private Relay][] for this purpose.)

[masked email]: https://www.fastmail.help/hc/en-us/articles/4406536368911-Masked-Email
[iCloud Private Relay]: https://support.apple.com/en-us/102602

# The Client

Honestly, I've yet to encounter an email client I _truly_ love, but I think in general the Fastmail client is as good as the Gmail client.

There's things I think are better: I think it's generally less cluttered and easier for me to use.

There's a few things that are worse: I miss Gmail's auto-sorting into categories. I've mostly made up for that by making more aggressive use of manually curated filters and labels to keep the day-to-day receipts, notifications, and subscriptions out of my inbox. Fastmail, incidentally, offers more powerful filtering options, including writing custom filters in [Sieve][] if you so choose. I also miss being able to pop out the email composer into a popover, so I can refer to other emails while composing. I've worked around this by just opening a new window for composing email as needed.

[Sieve]: https://en.wikipedia.org/wiki/Sieve_(mail_filtering_language)

Fastmail has also surprised me with a few UX niceties:

* It seems to have _better_ handling of listservs than Gmail. When responding to a listserv email instead of "Reply" and "Reply All" (which can have unpredictable behavior depending on the configuration of the listserv) it offers me "Reply to List" and "Reply to Sender."
* Sometimes, after using the built in "Unsubscribe" it will additionally offer to *delete* all emails from the list I just unsubscribed from:

  ![Screenshot of a notification saying "You have unsubscribed from this list. Would you also like to delete all messages received from this list?"](/media/switching-to-fastmail/unsubscribe.png)

  I haven't figured out what combination of factors triggers this option to appear or not, but I appreciate it when it does.

# Some Pain Points

## Calendars

I initially tried to move to Fastmail calendar. I wanted the direct integration between email invitations and calendar events. This was, unfortunately, _disastrous_, though I'll concede it may have to do with the specific quirks of how I use calendars.

In particular, I tried to use Fastmail as a client for my existing Google calendar, figuring I'd accept event invites through my email client, but continue to use Google Calendar's web interface. It allows this in a halfhearted way. It doesn't officially support using an external calendar as your default. If you don't have a default calendar but you do connect a Google Calendar account it will choose a calendar associated with your Google account at random. Ugh.

I use shared calendars for housemates and organizations. I often create events and add myself as an attendee so they also appear on my personal calendar. Fastmail and Google were unable to coordinate properly on this. Sometimes when I tried to personally RSVP "no" to an event it would _cancel_ the event for all attendees. At one point I somehow set off an autonomous loop where my calendars were canceling and then recreating an event for a [BIDA][] board meeting repeatedly for an hour, spamming the rest of the board.

[BIDA]: https://bidadance.org/

Ultimately I gave up on getting this integration working and I've continued to use Google Calendar for everything. If someone sends a calendar invite to my Chromamine email I have to ask them to resend it to my Gmail (annoyingly, since this is the _only_ thing I'd like people to use that address for), but this hasn't happened frequently.

Possibly I could achieve better integration by using a different email and calendar client (such as Apple Mail and Calendar), but I haven't experimented, since I'm otherwise satisfied with Fastmail and Google Calendar independent of each other.

## Google Groups

Along similar lines, I manage a few Google Groups. Google Groups allows you to subscribe to a group with a non-Gmail email address – though it's not well documented. As far as I can tell, it does not let you _manage_ a group with a non-Google email address.

I worked around this by adding both my Google account and my Chromamine address to the group and setting my Google account to receive no emails. I could still use the Google account to manage the group, but emails only get sent to my other email.

![Screenshot of the interface for managing Google Groups members. There are two Harris Lapiroffs in the group. One has the email address harrislapiroff@gmail.com, the other harris@chromamine.com. The former is set to "No email." The latter is set to "Each Email."](/media/switching-to-fastmail/group.png)

The workarounds for both of the above issues are irritating, but much outweighed by the things I really enjoy about Fastmail and I'm happy to have switched.

[private relay]: https://support.apple.com/en-us/102602

[^1]: These ads appear only in the Promotions and Social tabs, which are somewhat marketing-heavy regardless. Though it still strikes me as ironic that for many years one of Gmail's major features was cutting edge spam blocking – only for them to inject spam back into our inboxes.

[^2]: Largely, I think, due to the process Cory Doctorow calls "[enshittification][enshittification]":

      > Here is how platforms die: first, they are good to their users; then they abuse their users to make things better for their business customers; finally, they abuse those business customers to claw back all the value for themselves.

[^3]: People mostly suggested Fastmail and ProtonMail to me. Though I'm generally a security-conscious user, ProtonMail's devotion to security was above my needs, would introduce some annoyances – not being able to use third-party email clients, for example – and cost a little more than a comparable Fastmail plan.

[^4]: I've historically used Gmail's ["Plus Addressing"][plus addressing] to do this, but, annoyingly, many websites won't accept email addresses containing plus signs.

[plus addressing]: https://gmail.googleblog.com/2008/03/2-hidden-ways-to-get-more-from-your.html
[enshittification]: https://pluralistic.net/2023/01/21/potemkin-ai/#hey-guys
