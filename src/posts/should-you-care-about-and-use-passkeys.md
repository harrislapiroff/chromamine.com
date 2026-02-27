---
title: Should you care about and use passkeys?
date: 2026-02-26
categories: [Software]
tags: [web, security, 1Password]
images:
  signin:
    src: image.png
    alt: A screenshot of the 1Password app asking if I want to use a passkey to sign in to GitHub.
    caption: Instead of dealing with the login form on the left, I just click the button on the right to sign in.
# xposts:
#   - label: Mastodon
#     url: TBD
#   - label: Facebook
#     url: TBD
---

You're relatively tech- and security-savvy. You might not always be at the cutting edge or use the most paranoid security measures, but you use a password manager, you know about two-factor authentication and use it on at least some of your accounts. You know not to reuse passwords. Lately, though, you're seeing a lot of sites prompt you to create a "passkey" without a lot of explanation. Maybe you have a vague idea that someone thinks this is the future of logging in or something. Should you push the button? Is it going to be some new annoying security tool to manage? Where does the passkey live anyway? Why is everyone prompting you to do this when you're just trying to check your email? Are you going to risk getting locked out if you say yes, but something goes wrong?

I want to try to explain passkeys to the sort of person I just described and why I think you should use them. There are a lot of passkey explainers out there (the official one is at [passkeys.dev][]), but this one is mine and I want to start in a place that I don't see a lot of explainers start: talking about what we already know about password managers and security best practices. We know that the best password hygiene is:

[passkeys.dev]: https://passkeys.dev

1. Use a password manager.
2. Let the password manager generate a unique, random password for each site.
3. Have the password manager fill in the password for you when you log in.

You already don't have to memorize these passwords – it's possible you never even see some of them at all if you have the password manager automatically fill it for you. Logging in with a password isn't proving that you "know" a secret, it's proving that you *have access* to a secret.

When you think about this a little more deeply, doesn't this *already* feel a bit like a stopgap solution? There's a piece of software that asks you for a secret to prove your identity. There's another piece of software that stores your secret. You're responsible for making sure that the second piece of software conveys your secret to the first piece of software, even though you yourself may never even look at that secret. Isn't it weird that we still make that secret short and human-readable? Isn't it weird that you're being asked to serve as an intermediary between these two pieces of software? Shouldn't we just make them *talk directly to each other*?

The cool thing is that, it turns out, once you start connecting them directly, you can rethink the premise of the whole system to create something that's *more* secure.

Instead of sending a password to a website, the website and your **credential manager** (this is what I'm going to call your password manager since it handles more than passwords) can perform a "handshake" using [public key cryptography][]. Your credential manager still holds a secret key it created for that website, but unlike a password, it's an unguessable, cryptographic secret key. More importantly, the secret is never actually shared with the website. Your credential manager is able to cryptographically sign some data with it to prove that it has the correct secret key,[^1] but it never has to send the secret key itself. The result is that passkeys behave kind of like passwords under pre-passkey best practices:

[public key cryptography]: https://en.wikipedia.org/wiki/Public-key_cryptography

[^1]: I'm glossing over a lot of details here, but public key cryptography is *incredibly cool*. When I first learned that it was possible to create a pair of encryption keys where one decrypts whatever the other encrypts and vice versa – without needing the original key to perform the decryption – it seemed like magic. Eventually I took a number theory course and learned the math behind it and it *still seems like magic*.

1. They're stored in your credential manager.
2. They're unique for each site.

*But* in addition to that you get additional security benefits. Unlike passwords, passkeys:

1. cannot be compromised in a data breach, because the website never has access to the secret at all – it never even has access to a cryptographic hash of the secret, as most sites today do for passwords.
2. are phishing resistant because your credential manager simply won't perform a handshake with a fake website. It won't even offer to.

All of this security complexity is hidden behind software, so the user experience is more like:

1. When you create a passkey, a website asks if you want to create a passkey and your credential manager asks you if you want to save the passkey.
2. When you want to log in, your credential manager asks you if you want to use the passkey. When you click yes, you're logged in.

{% image images.signin %}

I think some of the confusion around passkeys is simply that this feels *too* easy. Logging in isn't *supposed* to be a one-click process, right? Is it really secure? What's going to break? Where did my credentials go? But that really is how it works. Passkeys are the rare security innovation where I expect that, especially in the long run, they will be both easier to use *and* more secure.

Okay, but

# Where are my passkeys stored?

Just like your passwords, they're stored in your credential manager. If you don't have a credential manager like [1Password][], [Dashlane][], or [Bitwarden][], they'll most likely be stored in your operating system's built-in credential manager. Just like your passwords, they'll be available anywhere your credential manager is available.

[1Password]: https://1password.com
[Dashlane]: https://www.dashlane.com
[Bitwarden]: https://bitwarden.com

Some passkeys are **synced** across devices but you *can* create passkeys that are **device-bound**. You can have more than one passkey for authenticating to a service, so if, for example, you are really security-conscious, you might create a separate passkey for each device you use to access your email account. Later on, if you lose your phone, you can revoke the passkey associated with that phone. Or, you could create passkeys that *only* live on your phone and use the cross-device sign in flow described below to log in on all other devices.

For myself, I'd rather just have the convenience of all my passkeys synced across every device – which is 1Password's default behavior anyway.

# What if I lose my passkeys?

In ~2 years of using passkeys, I have not had the experience of losing any. I trust my password manager to manage my passkeys just as much as I trust it to manage my passwords.

Additionally, we're still in what will be a long transition phase for passkeys. Ultimately, passkeys are the authentication method of the future and will largely replace passwords, but, during this transition phase, virtually all services will still allow you to log in with a password. So you can experiment with enabling passkeys on accounts without worrying that you'll be locked out, as long as you still have your password as well.

# What if I need to log into something on a device I don't own?

There is a flow for logging into a device that doesn't have your passkey. When you try to log into a service, the other device will show a QR code which you can scan with a device that you *do* own, like your phone. Your phone will perform the authentication process with some added security (like a proximity check) and you'll be logged in on the other device. I haven't actually tried this flow myself, so I can't report on its usability, but it sounds very similar to the way I log into apps on my Google TV to avoid using the @#%!ing on-screen keyboard.

And, again, at least for now, if all else fails, most services will continue to let you authenticate with a password instead.

# Doesn't this create a single point of compromise?

Indeed, if all of your passkeys are stored in one place, that does create a single point of compromise. But wait a second, isn't that already true when you're using a password manager? One nice thing about having a single credential storage is that you can make unlocking that a more secure process than you could if you were worrying about 20 or 100 services. For example 1Password requires:

1. Either a master password or biometrics (FaceID or TouchID, depending on the device) to access credentials.
2. The master password at least once every two weeks.
3. A long secret key or a device with 1Password already installed in order to install 1Password on a new device.

My credential manager is the bank vault that is protected with multiple layers of security. Everything else that uses passkeys, I just have to click a button (and scan my finger).

***

Passkeys are still relatively new, so they aren't supported everywhere or even most places. I expect there's going to be some rough edges that need to be worked out, but I will say, when I sat down to research this post, I was impressed at how much stuff was already thought through. Other people I've talked to who have made the leap have reported it's just worked seamlessly for them. Things that I thought would be issues (like logging in on third-party devices) already have reasonable workflows.

I think the security folks who have been working on this know how hard it is to get people to adopt new security practices and they worked hard to make it seamless and foolproof before the big push. I can't promise it'll all work perfectly but, for myself (acknowledging that I'm on the more tech- and security-savvy end of the spectrum), I've been using passkeys for over two years on some services and have yet to run into any major problems with them.

For further reading, I recommend Wired's explainer _[How Passkeys Work – and How To Use Them](https://www.wired.com/story/what-is-a-passkey-and-how-to-use-them/)_.

If you use passkeys and run into issues, I'd be interested in hearing what they are to inform updates to this post. You can comment on Facebook or Mastodon or [via email][].

[via email]: mailto:blog@chromamine.com
