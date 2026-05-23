import GLib from 'gi://GLib';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import Vpn from './Vpn.js';
import * as Constants from './constants.js';
import Logger from './Logger.js';

export default class CascadingCountryMenu {
    constructor(connectionCallback, settings) {
        this._log = new Logger('CascadingCountryMenu');
        this._connectionCallback = connectionCallback;
        this._vpn = new Vpn(settings);
        this._settings = settings;
        this._menu = null;
        this._isBuilt = false;
        this._isDisposed = false;
        this._buildInFlight = false;
        this._buildGen = 0;
        this._navGen = 0;
        this._pendingIdleIds = [];
        this._countries = null;
        this._countriesApiData = null;
    }

    // Creates a menu item that navigates without closing the panel menu.
    // Overriding activate() as an instance property shadows the prototype method,
    // preventing the 'activate' signal from being emitted and closing the menu.
    _makeNavItem(label, callback) {
        const item = new PopupMenu.PopupMenuItem(label);
        item.activate = () => callback();
        return item;
    }

    get menu() {
        if (!this._menu) this._createMenu();
        return this._menu;
    }

    _createMenu() {
        this._menu = new PopupMenu.PopupSubMenuMenuItem('Countries');
        // Reset to country list each time the submenu closes so reopening starts fresh.
        this._menu.menu.connect('open-state-changed', (menu, open) => {
            if (!open && this._isBuilt && !this._isDisposed) {
                const id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this._pendingIdleIds = this._pendingIdleIds.filter(i => i !== id);
                    if (!this._isDisposed && this._isBuilt) this._showCountriesLevel();
                    return GLib.SOURCE_REMOVE;
                });
                this._pendingIdleIds.push(id);
            }
        });
    }

    get isBuilt() { return this._isBuilt; }

    async tryBuild(running = true) {
        if (!this._menu) this._createMenu();
        if (this._isBuilt || this._isDisposed || this._buildInFlight) return;

        const gen = ++this._buildGen;
        this._buildInFlight = true;

        try {
            [this._countries, this._countriesApiData] = await Promise.all([
                this._vpn.getCountriesList(running),
                this._vpn.getCountriesWithCities().catch(() => null)
            ]);
        } catch (e) {
            this._log.warn('tryBuild: failed to fetch countries', {error: e?.message});
            return;
        } finally {
            this._buildInFlight = false;
            if (gen !== this._buildGen && !this._isDisposed) {
                const id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    this._pendingIdleIds = this._pendingIdleIds.filter(i => i !== id);
                    if (!this._isDisposed) this.tryBuild(running).catch(e => this._log.error('tryBuild retry failed', e));
                    return GLib.SOURCE_REMOVE;
                });
                this._pendingIdleIds.push(id);
            }
        }

        if (gen !== this._buildGen || this._isDisposed) return;
        if (!this._countries || this._countries.length === 0) return;

        this._showCountriesLevel();
        this._isBuilt = true;
        this._log.debug('tryBuild complete', {countries: this._countries.length});
    }

    _showCountriesLevel() {
        if (this._isDisposed || !this._menu) return;
        ++this._navGen;
        this._menu.menu.removeAll();

        const filter = this._settings.get_value('countries-in-menu').deep_unpack();
        const countries = filter.length > 0
            ? this._countries.filter(c => filter.includes(c))
            : this._countries;

        for (const country of countries) {
            const countryApiData = this._countriesApiData?.find(c =>
                c.name.toLowerCase() === country.toLowerCase()
            );
            this._menu.menu.addMenuItem(
                this._makeNavItem(country, () => this._showCitiesLevel(country, countryApiData))
            );
        }
    }

    _showCitiesLevel(country, countryApiData) {
        if (this._isDisposed || !this._menu) return;
        const navGen = ++this._navGen;
        this._menu.menu.removeAll();

        this._menu.menu.addMenuItem(this._makeNavItem('← Countries', () => {
            ++this._navGen;
            this._showCountriesLevel();
        }));
        this._menu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const connectItem = new PopupMenu.PopupMenuItem(`Connect to ${country}`);
        connectItem.connect('activate', () => {
            if (this._isDisposed || this._vpn.isConnectThrottled()) return;
            const arg = country.replace(/ /g, '_');
            this._vpn.connectVpn(arg).catch(e => this._log.error('connectVpn failed', e));
            this._connectionCallback(Constants.status.reconnecting, ['countries', arg]);
        });
        this._menu.menu.addMenuItem(connectItem);
        this._menu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const loadingItem = new PopupMenu.PopupMenuItem('Loading cities...');
        loadingItem.reactive = false;
        this._menu.menu.addMenuItem(loadingItem);

        this._vpn.getCitiesForCountry(country).then(cities => {
            if (this._isDisposed || navGen !== this._navGen) return;
            loadingItem.destroy();

            if (!cities || cities.length === 0) {
                this._menu.menu.addMenuItem(new PopupMenu.PopupMenuItem('No cities available'));
                return;
            }

            for (const city of cities) {
                const cityData = countryApiData?.cities?.find(c =>
                    c.name.toLowerCase() === city.toLowerCase()
                );
                this._menu.menu.addMenuItem(
                    this._makeNavItem(city, () => this._showServersLevel(country, city, countryApiData?.id, cityData?.id, countryApiData))
                );
            }
        }).catch(e => {
            this._log.warn('getCitiesForCountry failed', {country, error: e?.message});
            if (!this._isDisposed && navGen === this._navGen)
                loadingItem.label.set_text('Failed to load cities');
        });
    }

    _showServersLevel(country, city, countryId, cityId, countryApiData) {
        if (this._isDisposed || !this._menu) return;
        const navGen = ++this._navGen;
        this._menu.menu.removeAll();

        this._menu.menu.addMenuItem(this._makeNavItem(`← ${country}`, () => {
            ++this._navGen;
            this._showCitiesLevel(country, countryApiData);
        }));
        this._menu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const connectItem = new PopupMenu.PopupMenuItem(`Connect to ${city}`);
        connectItem.connect('activate', () => {
            if (this._isDisposed || this._vpn.isConnectThrottled()) return;
            const countryArg = country.replace(/ /g, '_');
            const cityArg = city.replace(/ /g, '_');
            this._vpn.connectVpn(`${countryArg} ${cityArg}`).catch(e => this._log.error('connectVpn failed', e));
            this._connectionCallback(Constants.status.reconnecting, ['cities', cityArg]);
        });
        this._menu.menu.addMenuItem(connectItem);
        this._menu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        if (!countryId || !cityId) {
            this._menu.menu.addMenuItem(new PopupMenu.PopupMenuItem('Server list unavailable'));
            return;
        }

        const loadingItem = new PopupMenu.PopupMenuItem('Loading servers...');
        loadingItem.reactive = false;
        this._menu.menu.addMenuItem(loadingItem);

        const limit = this._settings.get_value('number-servers-per-countries').unpack() || 10;
        this._vpn.getServersForCity(countryId, cityId, limit).then(servers => {
            if (this._isDisposed || navGen !== this._navGen) return;
            loadingItem.destroy();

            if (!servers || servers.length === 0) {
                this._menu.menu.addMenuItem(new PopupMenu.PopupMenuItem('No servers found'));
                return;
            }

            for (const server of servers) {
                const serverItem = new PopupMenu.PopupMenuItem(server.name);
                serverItem.connect('activate', () => {
                    if (this._isDisposed || this._vpn.isConnectThrottled()) return;
                    this._vpn.connectVpn(server.hostname).catch(e => this._log.error('connectVpn failed', e));
                    this._connectionCallback(Constants.status.reconnecting, ['servers', server.hostname]);
                });
                this._menu.menu.addMenuItem(serverItem);
            }
        }).catch(e => {
            this._log.warn('getServersForCity failed', {country, city, error: e?.message});
            if (!this._isDisposed && navGen === this._navGen)
                loadingItem.label.set_text('Failed to load servers');
        });
    }

    showHide(show = true) {
        if (!this._menu) return;
        if (show) this._menu.show();
        else this._menu.hide();
    }

    rebuild(running = false) {
        this._isBuilt = false;
        ++this._buildGen;
        ++this._navGen;
        this._countries = null;
        this._countriesApiData = null;
        if (!this._menu) return;
        this._menu.menu.removeAll();
        this._menu.menu.addMenuItem(new PopupMenu.PopupMenuItem('Loading...'));
        const id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._pendingIdleIds = this._pendingIdleIds.filter(i => i !== id);
            if (!this._isDisposed) this.tryBuild(running).catch(e => this._log.error('rebuild failed', e));
            return GLib.SOURCE_REMOVE;
        });
        this._pendingIdleIds.push(id);
    }

    disable() {
        this._isDisposed = true;
        ++this._buildGen;
        ++this._navGen;
        this._pendingIdleIds.forEach(id => GLib.Source.remove(id));
        this._pendingIdleIds = [];
        this._menu?.destroy();
        this._menu = null;
        this._isBuilt = false;
    }
}
