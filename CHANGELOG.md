# Change Log

All notable changes to this project is documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.3.0]

- CHANGED: Replaced `axios` with Node's built-in global `fetch` (stable since Node 22, which is what MM 2.36+ ships). The module now has **zero runtime npm dependencies** — installations no longer need a separate `npm install` step.
- IMPROVED: Request timeout now uses `AbortController` for a clean cancellation of the underlying socket.

## [2.2.0]

- ADDED: New `showHeadsignInHead` configuration option (default `false`). When `true`, the next departure's destination (e.g. "Keleti pályaudvar M") is appended to the head, after the route number.
- ADDED: New `showHeadsignInStopTime` configuration option (default `false`). When `true`, each departure row shows the destination — useful at stops where the same route has multiple terminals (e.g. trolleybus 82 at Mexikói út vs. Uzsoki Utcai Kórház).
- ADDED: New `headsignSeparator` configuration option (default `" → "`). Prefix used before the destination in both head and stop-time rendering.
- FIXED: `_getRowOpacity` no longer mutates `config.fadePoint` when the operator-provided value is negative — uses a local clamp instead.

## [2.1.0]

- CHANGED: Replaced the deprecated `request` library with `axios` in the node helper. This is needed because recent versions of MagicMirror² no longer ship `request`. The module now installs its own dependency via `npm install`.
- ADDED: Shared in-memory response cache and in-flight request deduplication in the node helper. Multiple module instances watching the same stop now share a single network round-trip, and freshly-loaded instances render immediately when cached data is available. The cache TTL defaults to 30 seconds and can be overridden via the new optional `cacheTtl` configuration parameter (in milliseconds).
- ADDED: HTTP keep-alive and gzip transport in the node helper, plus a 10s request timeout, to speed up polling and surface failures cleanly.
- IMPROVED: Cleaner error logging and lifecycle handling (timers torn down on module stop).

## [2.0.4]

- FIXED: The fix introduced in version 2.0.2 (commit cbe5e91) broke the module in cases when the API response does not contain `stopId` at all. For example: https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json?stopId=BKK_056216&routeId=BKK_5400&onlyDepartures=true&minutesBefore=0&minutesAfter=40&key=APIKEY

## [2.0.3]

- FIXED: the `showSymbolInStopTime` and `showHeaderInStopTime` options of the `alerts` configuration work independently from each other. Thanks [borzaka](https://github.com/borzaka) for submitting the fix for this issue.

## [2.0.2]

- FIXED: Incorrect stop times displayed (added stopId validation to fix API inconsistencies), see [issue #7](https://github.com/balassy/MMM-Futar/issues/7) and [PR #36](https://github.com/balassy/MMM-Futar/pull/36). Thanks [borzaka](https://github.com/borzaka) for submitting the fix for this issue.

## [2.0.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

## [2.0.0]

- **BREAKING CHANGE**: Introduced the **mandatory `apikey`** configuration parameter. Follow the instructions in `README.md` to obtain it from https://opendata.bkk.hu.

## [1.6.1]

- FIXED: New data fetch mechanism works well with multiple module instances.

## [1.6.0]

- UPDATED: Rebuilt the data fetch mechanism, because the Futar API removed JSONP support. 
- UPDATED: `grunt` removed and all developer dependencies updated to the latest version.

## [1.5.2]

- FIXED: Language is set explicitly independently from other modules.

## [1.5.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

- FIXED: Security vulnerabilities in [lodash](https://www.npmjs.com/advisories/1065), [set-value](https://www.npmjs.com/advisories/1012) and [mixin-deep](https://www.npmjs.com/advisories/1013) developer dependencies are fixed.

## [1.5.0]

- FIXED: This release uses the changed BKK API base URL through HTTPS and bypasses the CORS restrictions with JSONP. Please run `npm install` after downloading this version.

## [1.4.1]

This is a maintenance release that updates all third party developer dependencies to the latest version. This change should not affect the functionality of the module.

## [1.4.0]

- ADDED: Too early stop times can be hidden with the new `hideStopTimesInNextMinutes` configuration setting.

## [1.3.1]

- BUGFIX: The ferry, rail, subway and trolleybus vehicle icons are displayed properly. Subway and trolleybus text colors are slightly adjusted. See [issue #5](https://github.com/balassy/MMM-Futar/issues/5).

## [1.3.0]

- ADDED: The route name can be displayed in every stop time using the new `showRouteNameInStopTime` configuration switch.
- ADDED: The route name can be displayed in every stop time in colors using the new `coloredRouteNameInStopTime` configuration switch.
- ADDED: Operational alerts are displayed in every stop time by default, but this behavior can be changed using the properties of the new `alerts` object in the configuration.

## [1.2.0]

- ADDED: The symbol and the head text are colored colored by default, but this behavior can be changed with the new `colorSymbolInHead`, `coloredTextInHead`, `coloredSymbolInStopTime` and `symbolColors` configuration settings.

## [1.1.0]

- ADDED: The maximum number of displayed items can be configured with the `maxNumberOfItems` setting.

## [1.0.1]

- FIXED: Route name is displayed even if there is no upcoming departure in the monitored time window.

## [1.0.0]

- First public release.
