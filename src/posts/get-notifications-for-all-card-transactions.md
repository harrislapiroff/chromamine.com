---
title: Get Notifications For All Card Transactions
date: 2024-10-24
categories: [Miscellany]
tags: [personal finance, security]
images:
  citi:
    src: citi.jpg
	alt: Screenshot of a phone notification reading "Citi Alert: Transaction Exceeds. A $160.00 transaction was made at MAGFEST USA on card ending in. View details now."
	caption: By the way, you should come to [Magfest](https://www.magfest.org) with me.
  pnc:
    src: pnc.jpg
	alt: Screenshot of a phone notification reading "PNC Account Alert. On 10/20/24, a $306.87 cash withdrawal was deducted from PNC account from an ATM. This is greater than your alert threshold."
# xposts:
#  - label: Mastodon
#    url: 
#  - label: Facebook
#    url:
---

One thing I think is a best practice that isn't standard yet is receiving notifications on your phone for all credit and debit card transactions. Doing so allows you to

1. see in-the-moment if someone charged you the wrong amount at a POS, and
2. notice fraudulent transactions *immediately*.

Noticing fraudulent transactions as soon as possible is of particular importance. Credit card fraud is common, but fraud liability protections in the U.S. are very friendly to consumers – a maximum of $50 liability, by federal law. Worth noting: *debit card liability protections are much less good*. But in both cases, receiving maximum protection requires reporting fraud to the card issuer promptly. (Read more on [NerdWallet][], because I'm not an expert.) Regularly reviewing your bank statements also helps with that, but I'm not as consistent at doing that as I am at checking my phone notifications.

[NerdWallet]: https://www.nerdwallet.com/article/credit-cards/credit-card-vs-debit-card-safer-online-purchases

I haven't found the notifications particularly noisy. I'm not making *that* many card transactions in a day and in practice it's reassuring to see them reflected immediately on my phone. Compared to the many other notifications my phone gets in a day[^1] it's a drop in the bucket.

[^1]: Which I would *really* like to reduce the noise of generally, but that's another story.

{% image images.pnc %}

{% image images.citi %}

Banks mostly assume consumers won't want this. Some of them assume you might want it but *only* for large transactions (most fraudulent transactions start small!) so I've found it fiddly to enable, occasionally buggy to maintain, and the notifications can look somewhat awkward. But most major banking apps offer it. Local ones are hit and miss. Here's how I enabled it for the four banks I use and the different cards I have under them:

# Citi (credit):

From the Citi mobile app:

1. Profile > Account Alerts.
2. Under "Spending" turn on notifications for "Transaction Amound Exceeds." Citi allows you to receive alerts as notifications ("Push") or SMS. Set the amount to $0.

# Chase (credit)

From the Chase app:

1. More > Security and Privacy.
2. Under "Ways you can be more secure" there's a button for "Activate alerts to help keep your finances safe."
3. Select the account you want to receive alerts for.
4. Unfold "Single transaction above $X," set the amount to 0.00 and check "Push notification."

# PNC (debit)

From the PNC app:

1. Menu hamburger ≡ > Control Hub (it's on the bottom of the screen) > Alerts & Notifications.
2. PNC organizes notifications separately for cards vs. accounts. Under my accounts I turned on Push notifications for "Pre-authorized Payment Greater Than" and "Withdrawal Greater Than." Under my debit card I turned on alerts for "Card Transaction Greater Than." I set the threshold to each to $1 (PNC doesn't allow $0).

# FNBO (credit)

FNBO doesn't seem to offer push notifications. Guess I'll just have to watch that card closely. They do seem to offer SMS notifications, but you have to log in to the website to turn them on, which I haven't gotten around to yet.[^2]

[^2]: I got this card immediately before embarking on a current international vacation, during which I'm not receiving SMSes anyway.

Personally, I think banks should enable these alerts by default when you log in to their app with no threshold. The option should be to opt-out of getting those alerts or to add a higher threshold. But until that catches up, I recommend enabling it yourself as a security practice.

It may be obvious, but I didn't invent this idea. I realized how nice it was when I signed up for the now defunct banking startup Simple, whose premise was largely that they offered an *actually good* banking app. Notifications were on by default and I realized how good it was for me to see transactions process live! Ironically Simple customers went through a series of acquisitions, ending up with PNC, which has a much less good app with notifications off by default.