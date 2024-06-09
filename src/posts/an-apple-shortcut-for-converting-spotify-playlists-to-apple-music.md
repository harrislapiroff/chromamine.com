---
title: An Apple Shortcut for Converting Spotify Playlists to Apple Music
date: 2024-06-09
categories: [Software]
tags: [Shortcuts, code, music]
excerpt:
  I've been playing Music League with some friends lately. It's been fun except that generates a Spotify playlist. Ugh! I've been manually recreating each playlist in Apple Music each week. It's an irritating extra step and at least once I put off doing it and missed the voting deadline.
xposts:
  - label: Mastodon
    url: https://social.coop/@harris/112588885397495745
  - label: Facebook
    url: https://www.facebook.com/harrislap/posts/pfbid035TKiUYhmJTCg63yrcrhuhG2erseCjbRfrWTeEWCKQKdPu55UkgAk968fpApL1Jgrl
---

I'm an Apple Music user and I'm reasonably happy with it as a service. I understand they pay artists at least a little more than streaming juggernaut Spotify[^1] and, as someone deeply embedded in Apple's ecosystem[^2], it's good for me that it's well integrated into the devices I use. One particularly annoying thing about being an Apple Music user is that a _ton_ of people and services _assume_ that I have a functioning Spotify account.

[^1]: Though I still try to purchase the albums outright for artists whose music I enjoy and want to support – especially indie artists and friends.
[^2]: I have a MacBook Pro, an iMac, an iPhone, an iPad, an Apple Watch, and a HomePod, to name some of the tech I use on a more-or-less weekly basis.

I've been playing [Music League][] with some friends lately. It's a game where each round you submit a song related to a theme and it puts together a playlist of submissions (anonymized) and you vote on which tracks you like best for the theme.

It's been fun *except* that generates a *Spotify* playlist. Ugh! I've been manually recreating each playlist in Apple Music each week. It's an irritating extra step and at least once I put off doing it and missed the voting deadline.

[Music League]: https://musicleague.com/

Finally, this week, I put together an [Apple Shortcut][] that accepts a Spotify playlist URL and converts it to an Apple Music playlist. Apple Shortcuts is an automation tool provided on iOS, macOS, and iPadOS, which is surprisingly capable, though often poorly documented and occasionally quirky.

[Apple Shortcut]: https://support.apple.com/guide/shortcuts/welcome/ios

{% button "Download Shortcut" "/media/an-apple-shortcut-for-converting-spotify-playlists-to-apple-music/Spotify%20Playlist%20to%20Apple%20Music.shortcut" "download" %}

You can invoke this shortcut from the Shortcuts app, add it to your home screen, or, as I have done, add it to your share sheet:

![Screenshot of an iOS share sheet. It is sharing a link under the domain open.spotify.com titled "Name Check." At the bottom are two options: Copy and Spotify Playlist to Apple Music](/media/an-apple-shortcut-for-converting-spotify-playlists-to-apple-music/share-sheet.png)

***

Here's how it works, in brief:

1. It requests the website version of the Spotify playlist and scrapes the HTML for Spotify IDs of the tracks. There's a series of `<meta>` tags in the HTML that look like this:

   ```html
   <meta name="music:song" content="https://open.spotify.com/track/0W6piFA90WF6OVPmmYVZQL">
   ```

   The shortcut uses regex to search for the bit on the end which is the track ID.

2. It requests those IDs one by one from [Songlink/Odesli][], a service for looking up songs across multiple streaming services. Here's an [example lookup][songlink example]. On that page it scrapes for an Apple Music link, using regex again.

[Songlink/Odesli]: https://odesli.co/
[songlink example]: https://song.link/s/0W6piFA90WF6OVPmmYVZQL

3. If it finds an Apple Music link, it looks up the track in Apple Music.

4. It adds all the tracks it finds to a new playlist.

If Odesli fails to turn up an Apple Music link in step 2 (which [sometimes happens][]) it will search Apple Music by the track name and artist and add the first result it finds there. It issues an first and allows the user to cancel the whole process.

[sometimes happens]: https://song.link/s/6kopmMZiyLmw7h66uXcXR7

Some of the actions I used in this shortcut, particularly the ones to do with the iTunes Store, are pretty poorly documented and fiddly. It required a couple hours of experimentation to get this shortcut working to my satisfaction. If you're trying to do something similar, it might be a good example to look over – I've tried to add comments to help anyone reading through it along. It seems to work pretty consistently on iOS in my testing. I've had less good of a time getting it to work properly on macOS. 
