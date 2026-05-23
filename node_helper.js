/* Magic Mirror Node Helper: MMM-Futar
 * Fetches Budapest public transport (BKK Futár) arrivals.
 *
 * Migrated off the deprecated `request` library to `axios`. Adds a small
 * shared cache so multiple module instances watching the same stop reuse a
 * single network round-trip, and so newly-loaded instances render instantly
 * if data is already on hand.
 */

const NodeHelper = require('node_helper'); // eslint-disable-line import/no-unresolved
const https = require('https');
const axios = require('axios'); // eslint-disable-line import/no-extraneous-dependencies

const BASE_URL = 'https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-stop.json';
const REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_TTL_MS = 30000;
const LOG_PREFIX = 'MMM-Futar:';

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 4 });

const httpClient = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  httpsAgent,
  // axios decompresses gzip/deflate by default; declare it explicitly anyway
  headers: { 'Accept-Encoding': 'gzip, deflate' },
  responseType: 'json'
});

module.exports = NodeHelper.create({
  start() {
    this._subscribers = new Map(); // moduleId -> { config, cacheKey, intervalId }
    this._cache = new Map(); // cacheKey -> { data, fetchedAt }
    this._inflight = new Map(); // cacheKey -> Promise<data>
  },

  stop() {
    this._subscribers.forEach((sub) => {
      if (sub.intervalId) clearInterval(sub.intervalId);
    });
    this._subscribers.clear();
    this._cache.clear();
    this._inflight.clear();
  },

  socketNotificationReceived(notificationName, payload) {
    if (notificationName !== 'MMM-FUTAR.INIT' || !payload || !payload.moduleId) return;
    if (this._subscribers.has(payload.moduleId)) return;

    this._subscribe(payload.moduleId, payload.config);
    this.sendSocketNotification('MMM-FUTAR.STARTED', true);
  },

  _subscribe(moduleId, config) {
    const cacheKey = this._cacheKey(config);
    const updateInterval = Math.max(5000, Number(config.updateInterval) || 60000);

    // Serve any fresh cached data immediately, then schedule polling.
    const cached = this._cache.get(cacheKey);
    if (cached && this._isFresh(cached, this._cacheTtl(config))) {
      setImmediate(() => this._send(moduleId, cached.data));
    } else {
      // Kick off a fetch without blocking — first poll happens right away.
      this._fetch(moduleId, config, cacheKey).catch(() => { /* logged inside */ });
    }

    const intervalId = setInterval(() => {
      this._fetch(moduleId, config, cacheKey).catch(() => { /* logged inside */ });
    }, updateInterval);

    this._subscribers.set(moduleId, { config, cacheKey, intervalId });
  },

  async _fetch(moduleId, config, cacheKey) {
    const ttl = this._cacheTtl(config);
    const cached = this._cache.get(cacheKey);
    if (cached && this._isFresh(cached, ttl)) {
      this._send(moduleId, cached.data);
      return;
    }

    let pending = this._inflight.get(cacheKey);
    if (!pending) {
      pending = this._requestFromApi(config)
        .then((data) => {
          this._cache.set(cacheKey, { data, fetchedAt: Date.now() });
          return data;
        })
        .finally(() => {
          this._inflight.delete(cacheKey);
        });
      this._inflight.set(cacheKey, pending);
    }

    try {
      const data = await pending;
      this._send(moduleId, data);
    } catch (err) {
      console.error(`${LOG_PREFIX} Failed to load data for stop ${config.stopId}: ${err.message}`); // eslint-disable-line no-console
    }
  },

  async _requestFromApi(config) {
    const params = {
      stopId: config.stopId,
      onlyDepartures: true,
      minutesBefore: 0,
      minutesAfter: config.minutesAfter,
      key: config.apiKey
    };

    const response = await httpClient.get(BASE_URL, { params });
    if (!response.data || !response.data.data) {
      throw new Error('Unexpected response shape from Futár API');
    }
    return response.data.data;
  },

  _send(moduleId, data) {
    this.sendSocketNotification('MMM-FUTAR.VALUE_RECEIVED', { moduleId, data });
  },

  _cacheKey(config) {
    return [config.stopId, config.routeId || '', config.minutesAfter, config.apiKey].join('|');
  },

  _cacheTtl(config) {
    const configured = Number(config.cacheTtl);
    if (Number.isFinite(configured) && configured >= 0) return configured;
    return DEFAULT_CACHE_TTL_MS;
  },

  _isFresh(entry, ttl) {
    return (Date.now() - entry.fetchedAt) < ttl;
  }
});
