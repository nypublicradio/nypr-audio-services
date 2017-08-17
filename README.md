# nypr-audio-services

This README outlines the details of collaborating on this Ember addon.
This repo is the home of all audio-related controls in use by the web-clients. It's mostly in the form of components, but there are also a handful of services used in the orchestration of responses to events triggered by ember-hifi.

## components
* `listen-button`
  * The primary UI widget through which users will start playback
  * Includes multiple variations that are controlled by a type parameter, which controls a set of CSS classes and inheritance
  * The bouncing animation is controlled by JS and based on a run-time measurement of the button's DOM dimensions
  * Includes a nested component which is configured to replace server-rendered HTML with an ember component
* `queue-button`
  * The primary UI widget for adding and removing a piece of audio to a local queue
* `player-notification`
  * slide up notification bar used to display messages from the player
* `nypr-player-integration`
  * translates property names from story and stream model attributes to unified keys that the player can consume
* `stream-banner`
  * sophisticated UI widget to display and play stream objects and their metadata
* `clear-history`
  * UI for the clearHistory method on the listen-history service
* `player-history`
* `player-queue`
* `queue-history`
* `queue-listitem`
* `text-crawl`

## services
* `dj`
  * orchestrates play requests and fetches records if passed an id
* `action-queue`
  * allows for event listeners to order up by priority and prevent subsequent listeners from running
 
## Installation
```sh
$ npm i nypublicradio/nypr-audio-services
$ ember g nypr-audio-services
```

## Development

* `git clone git@github.com:nypublicradio/nypr-audio-services`
* `cd nypr-audio-services`
* `npm install`
* `bower install`

## Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://ember-cli.com/](http://ember-cli.com/).
