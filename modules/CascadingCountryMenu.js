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
        this._pendingIdleIds = [];
        this._countries = null;
        this._cities = null;
    }

    get menu() {
        if (!this._menu) this._createMenu();
        return this._menu;
    }

    _createMenu() {
        this._menu = new PopupMenu.PopupMenuSection();
    }

    get isBuilt() { return this._isBuilt; }

    async tryBuild(running = true) {
        if (!this._menu) this._createMenu();
        if (this._isBuilt || this._isDisposed || this._buildInFlight) return;

        const gen = ++this._buildGen;
        this._buildInFlight = true;

        try {
            this._countries = await this._vpn.getCountriesList(running);
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

        // Cities of the countries shown in the menu (one `nordvpn cities` call
        // each, ~50 ms), so countries with more than one city get a submenu.
        const cities = new Map();
        for (const country of this._menuCountries()) {
            try {
                cities.set(country, await this._vpn.getCitiesForCountry(country, running));
            } catch (e) {
                this._log.warn('tryBuild: failed to fetch cities', {country, error: e?.message});
                cities.set(country, []);
            }
            if (gen !== this._buildGen || this._isDisposed) return;
        }
        this._cities = cities;

        this._showCountriesLevel();
        this._isBuilt = true;
        this._log.debug('tryBuild complete', {countries: this._countries.length});
    }

    _menuCountries() {
        const filter = this._settings.get_value('countries-in-menu').deep_unpack();
        return filter.length > 0
            ? this._countries.filter(c => filter.includes(c))
            : this._countries;
    }

    // query: "Country" or "Country City", spaces as underscores (nordvpn c syntax)
    _connect(query) {
        if (this._isDisposed || this._vpn.isConnectThrottled()) return;
        this._vpn.connectVpn(query).catch(e => this._log.error('connectVpn failed', e));
        this._connectionCallback(Constants.status.reconnecting, ['countries', query]);
    }

    _showCountriesLevel() {
        if (this._isDisposed || !this._menu) return;
        this._menu.removeAll();

        const countries = this._menuCountries();

        if (countries.length > 0) {
            this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            for (const country of countries) {
                const countryArg = country.replace(/ /g, '_');
                const cities = this._cities?.get(country) ?? [];

                if (cities.length < 2) {
                    const menuItem = new PopupMenu.PopupMenuItem(country);
                    menuItem.connect('activate', () => this._connect(countryArg));
                    this._menu.addMenuItem(menuItem);
                    continue;
                }

                // More than one city: submenu with the fastest server first,
                // then each city.
                const subItem = new PopupMenu.PopupSubMenuMenuItem(country);
                const fastest = new PopupMenu.PopupMenuItem(`Fastest in ${country}`);
                fastest.connect('activate', () => this._connect(countryArg));
                subItem.menu.addMenuItem(fastest);
                subItem.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
                for (const city of cities) {
                    const cityItem = new PopupMenu.PopupMenuItem(city);
                    const cityArg = city.replace(/ /g, '_');
                    cityItem.connect('activate', () => this._connect(`${countryArg} ${cityArg}`));
                    subItem.menu.addMenuItem(cityItem);
                }
                this._menu.addMenuItem(subItem);
            }
        }
    }

    showHide(show = true) {
        if (!this._menu) return;
        this._menu.actor.visible = show;
    }

    rebuild(running = false) {
        this._isBuilt = false;
        ++this._buildGen;
        this._countries = null;
        this._cities = null;
        if (!this._menu) return;
        this._menu.removeAll();
        const loadingItem = new PopupMenu.PopupMenuItem('Loading countries...');
        loadingItem.reactive = false;
        this._menu.addMenuItem(loadingItem);
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
        this._pendingIdleIds.forEach(id => GLib.Source.remove(id));
        this._pendingIdleIds = [];
        this._menu?.destroy();
        this._menu = null;
        this._isBuilt = false;
    }
}
