# nypr-audio-services Changelog

## 0.3.8
- [BUGFIX] update `addBrowserId` to update passed urlsToTry array in place

## 0.3.7
- [ENHANCEMENT] adds `addBrowserId` method to `dj` service

## 0.3.6
- [BUGFIX] Move ember-responsive from devDependencies to dependencies

## 0.3.5
- [BUGFIX] do not transform serialied stories from 0.3.3. the problem was in how ember simple auth replaces the session store in testing

## 0.3.4
- [CHORE] upgrade ember-responsive

## 0.3.3
- [ENHANCEMENT] transform stories serialized in the store into ember data records

## 0.3.2
- [CHORE] loosen version restraints for in house deps

## 0.3.1
- [CHORE] update ember diff attrs to fix deprecation warning

## 0.3.0
- [CHORE] Update to Ember 3.0 and new module syntax

## 0.2.7
- [BUGFIX] Includes `takeaway` as a valid stream slug

## 0.2.6
- [BUGFIX] Send autoPlayChoice into hifi metadata correctly so nypr-metrics listen analytics can receive it properly

## 0.2.5
- [CHORE] bump nypr-ui

## 0.2.4
- [FEATURE] Adds `white-hollow-block` listen button
- [BUGFIX] Fixes minion button spinner alignment

## 0.2.3
- [BUGFIX] pass the null value, not the 'null' string into the ALL STREAMS link-to

## 0.2.2
- [CHORE] versions nypr-ui

## 0.2.1
- [BUGFIX] Includes `wqxr-special2` as a valid stream slug

## 0.2.0
- [ENHANCEMENT] Upgrades `nypr-metrics` to `~0.2.0`

## 0.1.0
- [ENHANCEMENT] Upgrades `nypr-metrics` to 0.1.0

## 0.0.2
- [ENHANCEMENT] Upgrades to ember-cli 2.16
- [ENHANCEMENT] Don't need to include hls.js or howler.js in bower, hifi provides those

## 0.0.1

- [ENHANCEMENT] Adds versioning
