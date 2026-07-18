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

        this._showCountriesLevel();
        this._isBuilt = true;
        this._log.debug('tryBuild complete', {countries: this._countries.length});
    }

    _showCountriesLevel() {
        if (this._isDisposed || !this._menu) return;
        this._menu.removeAll();

        const filter = this._settings.get_value('countries-in-menu').deep_unpack();
        const countries = filter.length > 0
            ? this._countries.filter(c => filter.includes(c))
            : this._countries;

        if (countries.length > 0) {
            this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            for (const country of countries) {
                const menuItem = new PopupMenu.PopupMenuItem(country);
                menuItem.connect('activate', () => {
                    if (this._isDisposed || this._vpn.isConnectThrottled()) return;
                    const arg = country.replace(/ /g, '_');
                    this._vpn.connectVpn(arg).catch(e => this._log.error('connectVpn failed', e));
                    this._connectionCallback(Constants.status.reconnecting, ['countries', arg]);
                });
                this._menu.addMenuItem(menuItem);
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
