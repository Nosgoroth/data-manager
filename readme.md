# Data manager

A data manager written in js/php. Don't expect the best code quality. Provided as-is, support won't be given.

## About

This is a personal project initially made for my own usage for tracking a few things. It ballooned in scope and now might have trouble scaling, and it wasn't designed to be used by other people. It's published simply for the peace of mind of version control and just in case anyone finds any use for it.

## Installing

Drop or clone the project into a folder served by apache/php, then visit it on a web browser. For scraping functionality, you will need the [openssl](https://stackoverflow.com/a/43513546) and [mb_string](https://stackoverflow.com/questions/2697708/mb-internal-encoding-not-available-though-configured) php extensions.

## Usage manual

This project was meant to be used only by me, so don't expect UX to be too discoverable.

(Some instructions to be added anyway. Maybe.)

### Usage warnings

**Don't use multiple tabs**. The app is pretty dumb in that it saves ALL the data for every change, not just for the series you edit. I'll fix this someday, maybe.

**Make backups** of your json data files periodically. Maybe make a symbolic link of the `_data` folder to Dropbox so that you get version history. Somethink like this should work on Windows:

```cmd
cd "C:\path\to\data-manager"
move _data "C:\path\to\dropbox\myDataManagerJsonFiles"
mklink /D _data "C:\path\to\dropbox\myDataManagerJsonFiles"
```

## Contact

I can promise absolutely no support, but you can contact me here:

* [@Nosgoroth on Twitter](https://twitter.com/nosgoroth)
* [nosgoroth@gmail.com](mailto:nosgoroth@gmail.com)

