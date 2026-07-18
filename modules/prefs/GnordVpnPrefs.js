import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';

import Vpn from '../Vpn.js';
import StylesManager from './StylesManager.js';
import ResetManager from './ResetManager.js';
import Logger from '../Logger.js';

export default class GnordVpnPrefs {
    constructor(settings, metadata = {}) {
        this._settings = settings;
        this._metadata = metadata;
        this._vpn = new Vpn(this._settings);
        this._log = new Logger('GnordVpnPrefs');
        this._techCbox = null;
        this._protoCbox = null;
        this._countryMenuPopulating = false;
    }

    _createVersionRow() {
        const name = this._metadata.name ?? 'gNordVpn-Local';
        const version = this._metadata.version ?? 'unknown';
        const url = this._metadata.url ?? '';

        const frame = new Gtk.Frame({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
        });

        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 12,
            margin_end: 12,
        });

        const title = new Gtk.Label({
            label: `${name}, v${version}`,
            halign: Gtk.Align.START,
            xalign: 0,
        });
        box.append(title);

        if (url) {
            const escapedUrl = GLib.markup_escape_text(url, -1);
            const link = new Gtk.Label({
                use_markup: true,
                selectable: false,
                wrap: true,
                halign: Gtk.Align.START,
                xalign: 0,
                label: `<a href="${escapedUrl}">${escapedUrl}</a>`,
            });
            box.append(link);
        }

        frame.set_child(box);
        return frame;
    }

    _createGeneralPage() {
        const generalGrid = new Gtk.Grid({
            column_spacing: 12, row_spacing: 12, margin_top: 10, margin_bottom: 10, margin_start: 10, margin_end: 10
        });

        // Panel Position Label and ComboBox
        const panelPositionLabel = new Gtk.Label({label: "Select Panel Position:", halign: Gtk.Align.START});
        generalGrid.attach(panelPositionLabel, 0, 0, 1, 1);

        const panelPositionCombo = new Gtk.ComboBoxText();
        panelPositionCombo.append("left", "Left");
        panelPositionCombo.append("center", "Center");
        panelPositionCombo.append("right", "Right");
        generalGrid.attach(panelPositionCombo, 1, 0, 1, 1);

        let initialPosition = this._settings.get_string('panel-position');
        panelPositionCombo.set_active_id(initialPosition);

        panelPositionCombo.connect('changed', () => {
            const newPosition = panelPositionCombo.get_active_id();
            this._settings.set_string('panel-position', newPosition);
        });



        // Timer Refresh
        const timerRefreshLabel = new Gtk.Label({
            label: "Seconds between NordVpn status calls (will take affect on restart)",
            halign: Gtk.Align.START
        });

        const timeRefreshSpinner = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 120,
                step_increment: 1,
                page_increment: 10,
                value: this._settings.get_int('refresh-timeout')
            }),
            numeric: true,
            halign: Gtk.Align.START,
            visible: true
        });
        timeRefreshSpinner.set_hexpand(false);

        generalGrid.attach(timerRefreshLabel, 0, 3, 1, 1);
        generalGrid.attach(timeRefreshSpinner, 1, 3, 1, 1);

        this._settings.bind(
            'refresh-timeout',
            timeRefreshSpinner.get_adjustment(),
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Reset All Settings Button
        const resetAll = new Gtk.Button({label: "Reset All Settings"});
        generalGrid.attach(resetAll, 0, 4, 2, 1);

        return {generalGrid, resetAll};
    }

    _createAccountsPage() {
        const accountsGrid = new Gtk.Grid({
            column_spacing: 12, row_spacing: 12, margin_top: 10, margin_bottom: 10, margin_start: 10, margin_end: 10
        });

        // Show Login Toggle
        const showLoginLabel = new Gtk.Label({label: "Show login button in menu:", halign: Gtk.Align.START});
        const showLoginToggle = new Gtk.Switch({
            active: this._settings.get_boolean('showlogin'),
            halign: Gtk.Align.START
        });
        this._settings.bind('showlogin', showLoginToggle, 'active', Gio.SettingsBindFlags.DEFAULT);
        accountsGrid.attach(showLoginLabel, 0, 0, 1, 1);
        accountsGrid.attach(showLoginToggle, 1, 0, 1, 1);

        // Show Logout Toggle
        const showLogoutLabel = new Gtk.Label({label: "Show logout button in menu:", halign: Gtk.Align.START});
        const showLogoutToggle = new Gtk.Switch({
            active: this._settings.get_boolean('showlogout'),
            halign: Gtk.Align.START
        });
        this._settings.bind('showlogout', showLogoutToggle, 'active', Gio.SettingsBindFlags.DEFAULT);
        accountsGrid.attach(showLogoutLabel, 0, 1, 1, 1);
        accountsGrid.attach(showLogoutToggle, 1, 1, 1, 1);

        // Account Information
        const accountInfo = new Gtk.Label({
            label: "<b>Account Information</b>",
            use_markup: true,
            halign: Gtk.Align.START
        });
        accountsGrid.attach(accountInfo, 0, 2, 2, 1);

        const accountEmailLabel = new Gtk.Label({label: "Account email:", halign: Gtk.Align.START});
        const accountEmail = new Gtk.Label({halign: Gtk.Align.START});
        accountsGrid.attach(accountEmailLabel, 0, 3, 1, 1);
        accountsGrid.attach(accountEmail, 1, 3, 1, 1);

        const accountStatusLabel = new Gtk.Label({label: "Account status:", halign: Gtk.Align.START});
        const accountStatus = new Gtk.Label({halign: Gtk.Align.START});
        accountsGrid.attach(accountStatusLabel, 0, 4, 1, 1);
        accountsGrid.attach(accountStatus, 1, 4, 1, 1);

        const loginButton = new Gtk.Button({label: "Login"});
        loginButton.connect('clicked', () => this._vpn.loginVpn().catch(e => this._log.error('loginVpn failed', e)));
        loginButton.set_sensitive(false);
        accountsGrid.attach(loginButton, 0, 5, 1, 1);

        const logoutButton = new Gtk.Button({label: "Logout"});
        logoutButton.connect('clicked', () => this._vpn.logoutVpn().catch(e => this._log.error('logoutVpn failed', e)));
        logoutButton.set_sensitive(false);
        accountsGrid.attach(logoutButton, 1, 5, 1, 1);

        let accountPageDestroyed = false;
        accountsGrid.connect('destroy', () => { accountPageDestroyed = true; });

        const refreshAccountButton = new Gtk.Button({label: "Refresh"});
        const refreshAccount = async () => {
            let account = await this._vpn.getAccount();
            // Guard: prefs window may have closed while the async call was in flight
            if (accountPageDestroyed) return;
            let loggedIn = !!account.emailAddress;
            accountEmail.set_text(account.emailAddress || "");
            accountStatus.set_text(account.vpnService || "");
            loginButton.set_sensitive(!loggedIn);
            logoutButton.set_sensitive(loggedIn);
        };
        refreshAccountButton.connect('clicked', () => refreshAccount().catch(e => this._log.error('getAccount failed', e)));
        accountsGrid.attach(refreshAccountButton, 0, 6, 1, 1);

        // Initialize account information
        refreshAccount().catch(e => this._log.error('getAccount failed', e));
        return accountsGrid;
    }

    _createConnectionsPage() {
        const connectionsGrid = new Gtk.Grid({
            margin_start: 18, margin_top: 10, column_spacing: 12, row_spacing: 12, visible: true
        });

        // Technology
        const techLabel = new Gtk.Label({
            label: `Select Technology:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(techLabel, 0, 0, 1, 1);

        let techModel = new Gtk.ListStore();
        techModel.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);
        this._techCbox = new Gtk.ComboBox({model: techModel});
        let techRenderer = new Gtk.CellRendererText();
        this._techCbox.pack_start(techRenderer, true);
        this._techCbox.add_attribute(techRenderer, 'text', 1);
        techModel.set(techModel.append(), [0, 1], ['OPENVPN', 'OpenVpn']);
        techModel.set(techModel.append(), [0, 1], ['NORDLYNX', 'NordLynx']);
        let tech = this._settings.get_string(`technology`);
        this._techCbox.set_active(tech === 'OPENVPN' ? 0 : 1);
        this._techCbox.connect('changed', (entry) => {
            let [success, iter] = this._techCbox.get_active_iter();
            if (!success) return;
            let tech = techModel.get_value(iter, 0);
            this._settings.set_string(`technology`, tech);
            onTechChange(tech);
        });
        this._techCbox.show();
        connectionsGrid.attach(this._techCbox, 1, 0, 1, 1);

        // Autoconnect Toggle
        const autoConnectLabel = new Gtk.Label({label: "Autoconnect to VPN on startup:", halign: Gtk.Align.START});
        const autoConnectToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`autoconnect`),
            halign: Gtk.Align.END,
            visible: true
        });
        this._settings.bind(`autoconnect`, autoConnectToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        autoConnectToggle.connect('state-set', (widget, state) => {
            this._settings.set_boolean('autoconnect', state);
            this._vpn.setAutoconnect(state).catch(e => this._log.error('setAutoconnect failed', e));
        });
        autoConnectToggle.set_hexpand(false);  // Don't expand horizontally
        connectionsGrid.attach(autoConnectLabel, 0, 1, 1, 1);
        connectionsGrid.attach(autoConnectToggle, 1, 1, 1, 1);

        // CyberSec
        const cybersecLabel = new Gtk.Label({
            label: `Enable CyberSec:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(cybersecLabel, 0, 2, 1, 1);

        const cyberSecToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`cybersec`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(cyberSecToggle, 1, 2, 1, 1);
        this._settings.bind(`cybersec`, cyberSecToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Firewall
        const firewallLabel = new Gtk.Label({
            label: `Enable Firewall:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(firewallLabel, 0, 3, 1, 1);

        const firewallToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`firewall`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(firewallToggle, 1, 3, 1, 1);
        this._settings.bind(`firewall`, firewallToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Killswitch
        const killswitchLabel = new Gtk.Label({
            label: `Enable Killswitch:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(killswitchLabel, 0, 4, 1, 1);

        const killswitchToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`killswitch`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(killswitchToggle, 1, 4, 1, 1);
        this._settings.bind(`killswitch`, killswitchToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Obfuscate
        const obfuscateLabel = new Gtk.Label({
            label: `Enable Obfuscate:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(obfuscateLabel, 0, 5, 1, 1);

        const obfuscateToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`obfuscate`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(obfuscateToggle, 1, 5, 1, 1);
        this._settings.bind(`obfuscate`, obfuscateToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Analytics
        const analyticsLabel = new Gtk.Label({
            label: `Enable Analyics (send anonymous usage to NordVpn):`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(analyticsLabel, 0, 6, 1, 1);

        const analyticsToggle = new Gtk.Switch({
            active: this._settings.get_boolean(`analytics`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(analyticsToggle, 1, 6, 1, 1);
        this._settings.bind(`analytics`, analyticsToggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Ipv6
        const ipv6Label = new Gtk.Label({
            label: `Enable IPv6:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(ipv6Label, 0, 7, 1, 1);

        const ipV6Toggle = new Gtk.Switch({
            active: this._settings.get_boolean(`ipv6`),
            halign: Gtk.Align.END,
            visible: true
        });
        connectionsGrid.attach(ipV6Toggle, 1, 7, 1, 1);
        this._settings.bind(`ipv6`, ipV6Toggle, `active`, Gio.SettingsBindFlags.DEFAULT);

        // Protocol
        const protocolLabel = new Gtk.Label({
            label: `Select Protocol:`,
            halign: Gtk.Align.START,
            visible: true
        });
        connectionsGrid.attach(protocolLabel, 0, 8, 1, 1);

        let protoModel = new Gtk.ListStore();
        protoModel.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);
        this._protoCbox = new Gtk.ComboBox({model: protoModel});
        let protoRenderer = new Gtk.CellRendererText();
        this._protoCbox.pack_start(protoRenderer, true);
        this._protoCbox.add_attribute(protoRenderer, 'text', 1);
        protoModel.set(protoModel.append(), [0, 1], ['UDP', 'UDP']);
        protoModel.set(protoModel.append(), [0, 1], ['TCP', 'TCP']);
        let protocol = this._settings.get_string(`protocol`);
        this._protoCbox.set_active(protocol === 'UDP' ? 0 : 1);
        this._protoCbox.connect('changed', (entry) => {
            let [success, iter] = this._protoCbox.get_active_iter();
            if (!success) return;
            let protocol = protoModel.get_value(iter, 0);
            this._settings.set_string(`protocol`, protocol);
        });
        this._protoCbox.show();
        connectionsGrid.attach(this._protoCbox, 1, 8, 1, 1);

        // Reset connection settings
        const resetConnection = new Gtk.Button({
            label: `Reset Connection Settings`,
            visible: true
        });
        connectionsGrid.attach(resetConnection, 0, 9, 1, 1);

        const onTechChange = (tech) => {
            const isOpenVpn = tech === 'OPENVPN';
            if (isOpenVpn) {
                obfuscateToggle.sensitive = true;
                this._protoCbox.sensitive = true;
            } else {
                obfuscateToggle.sensitive = false;
                this._protoCbox.sensitive = false;
            }
        }

        onTechChange(tech);
        return {connectionsGrid, resetConnection};
    }

    _createConnectionsSaveFooter() {
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            visible: true,
        });

        const button = new Gtk.Button({
            label: "Apply",
            visible: true,
        });

        // Set custom style
        button.get_style_context().add_class('suggested-action');

        // Adjust the width by setting size request
        button.set_size_request(80, -1);

        // Add some margin to the button for spacing
        button.margin_top = 20;

        button.connect('clicked', () => {
            button.set_sensitive(false);
            this._vpn.applySettingsToNord()
                .catch(e => this._log.error('applySettingsToNord failed', e))
                .finally(() => { try { button.set_sensitive(true); } catch {} });
        });

        box.append(button);  // Use append() in GTK 4

        return box;
    }

    _createCountriesPage() {
        const grid = new Gtk.Grid({
            margin_start: 18, margin_top: 10, column_spacing: 12, row_spacing: 12, visible: true
        });

        const maxLabel = new Gtk.Label({
            label: `Max servers per country:`, halign: Gtk.Align.START, visible: true
        });
        grid.attach(maxLabel, 0, 0, 1, 1);

        const maxInput = new Gtk.SpinButton();
        maxInput.set_sensitive(true);
        maxInput.set_range(0, 10000);
        maxInput.set_value(0);
        maxInput.set_increments(1, 2);
        grid.attach(maxInput, 1, 0, 1, 1);
        this._settings.bind(`number-servers-per-countries`, maxInput, `value`, Gio.SettingsBindFlags.DEFAULT);

        const selectLabel = new Gtk.Label({
            label: `Countries shown in menu:\n<small>Hold CTRL to select multiple — empty = show all</small>`,
            use_markup: true,
            halign: Gtk.Align.START,
            visible: true
        });
        grid.attach(selectLabel, 0, 1, 1, 1);

        const store = new Gtk.TreeStore();
        store.set_column_types([GObject.TYPE_STRING]);

        const column = new Gtk.TreeViewColumn({title: 'Countries', expand: true, min_width: 200});
        const renderer = new Gtk.CellRendererText();
        renderer.height = 30;
        column.pack_start(renderer, true);
        column.add_attribute(renderer, 'text', 0);

        const treeView = new Gtk.TreeView({model: store});
        treeView.insert_column(column, 0);
        treeView.get_selection().set_mode(Gtk.SelectionMode.MULTIPLE);

        const iterMap = {};
        this._countryMenuPopulating = false;

        treeView.get_selection().connect('changed', () => {
            if (this._countryMenuPopulating) return;
            const [paths] = treeView.get_selection().get_selected_rows();
            const selected = paths.map(path => {
                const [, iter] = store.get_iter(path);
                return store.get_value(iter, 0);
            });
            this._settings.set_value('countries-in-menu', new GLib.Variant('as', selected));
        });

        const scroll = new Gtk.ScrolledWindow();
        scroll.set_child(treeView);
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        scroll.set_min_content_height(400);
        grid.attach(scroll, 1, 1, 1, 1);

        return {grid, treeView, iterMap, store};
    }

    _populateCountryTree(countries, treeView, iterMap, store) {
        const selected = this._settings.get_value('countries-in-menu').deep_unpack();
        store.clear();
        // Clear the iterMap before repopulating
        Object.keys(iterMap).forEach(k => delete iterMap[k]);
        this._countryMenuPopulating = true;
        try {
            countries.forEach(country => {
                const iter = store.append(null);
                store.set(iter, [0], [country]);
                iterMap[country] = iter;
                if (selected.includes(country))
                    treeView.get_selection().select_iter(iter);
            });
        } finally {
            this._countryMenuPopulating = false;
        }
    }

    _setWindowSize(window) {
        const [pmWidth, pmHeight, pmScale] = this._getPrimaryMonitorInfo();
        const width = pmWidth * .8;
        const height = pmHeight * .6;

        window.set_default_size(width > 900 ? 900 : width, height > 700 ?  700 : height);
    }

    _getPrimaryMonitorInfo() {
        const display = Gdk.Display.get_default();
        const pm = display.get_monitors().get_item(0);
        if (!pm) return [700, 500, 1];

        const geo = pm.get_geometry();
        const scale = pm.get_scale_factor();

        return [geo.width, geo.height, scale];
    }

    fillPreferencesWindow(window) {
        let windowDestroyed = false;
        window.connect('destroy', () => { windowDestroyed = true; });

        // Sync GSettings from NordVPN then refresh combo boxes — they use one-time reads
        // at construction so we must update them after the async fetch resolves.
        this._vpn.setSettingsFromNord().then(() => {
            if (windowDestroyed) return;
            if (this._techCbox) {
                const tech = this._settings.get_string('technology');
                this._techCbox.set_active(tech === 'OPENVPN' ? 0 : 1);
            }
            if (this._protoCbox) {
                const proto = this._settings.get_string('protocol');
                this._protoCbox.set_active(proto === 'UDP' ? 0 : 1);
            }
        }).catch(e => this._log.error('setSettingsFromNord failed', e));

        // *** GENERAL
        const generalPage = new Adw.PreferencesPage();
        generalPage.set_title("General");
        generalPage.set_icon_name("emblem-system-symbolic");
        const versionGroup = new Adw.PreferencesGroup();
        versionGroup.add(this._createVersionRow());
        generalPage.add(versionGroup);
        const generalGroup = new Adw.PreferencesGroup();
        const {generalGrid, resetAll} = this._createGeneralPage();
        generalGroup.add(generalGrid);
        generalPage.add(generalGroup);
        window.add(generalPage);

        // *** ACCOUNTS
        const accountsPage = new Adw.PreferencesPage();
        accountsPage.set_title("Account");
        accountsPage.set_icon_name("user-home-symbolic");
        const accountsGroup = new Adw.PreferencesGroup();
        accountsGroup.add(this._createAccountsPage());
        accountsPage.add(accountsGroup);
        window.add(accountsPage);

        // *** STYLES
        const stylesPage = new Adw.PreferencesPage();
        stylesPage.set_title("Icons");
        stylesPage.set_icon_name("image-x-generic-symbolic");
        const stylesGroup = new Adw.PreferencesGroup();
        stylesGroup.add(new StylesManager(this._settings).createStylesPage());
        stylesPage.add(stylesGroup);
        window.add(stylesPage);

        // *** CONNECTIONS
        const connectionsPage = new Adw.PreferencesPage();
        connectionsPage.set_title("Connection");
        connectionsPage.set_icon_name("network-server-symbolic");
        const connectionsGroup = new Adw.PreferencesGroup();
        const {connectionsGrid, resetConnection} = this._createConnectionsPage();
        connectionsGroup.add(connectionsGrid);
        connectionsGroup.add(this._createConnectionsSaveFooter());
        connectionsPage.add(connectionsGroup);
        window.add(connectionsPage);

        // *** COUNTRIES
        const countriesPage = new Adw.PreferencesPage();
        countriesPage.set_title("Countries");
        countriesPage.set_icon_name("network-server-symbolic");
        const countriesGroup = new Adw.PreferencesGroup();
        const {grid: countriesGrid, treeView: countryTreeView, iterMap: countryIterMap, store: countryStore} = this._createCountriesPage();
        countriesGroup.add(countriesGrid);
        countriesPage.add(countriesGroup);
        window.add(countriesPage);

        // Show cached country list immediately, then refresh in background
        const cached = this._settings.get_value('cached-countries').deep_unpack();
        if (cached.length > 0)
            this._populateCountryTree(cached, countryTreeView, countryIterMap, countryStore);

        this._vpn.getCountriesList(true).then(countries => {
            if (windowDestroyed || !countries) return;
            this._settings.set_value('cached-countries', new GLib.Variant('as', countries));
            this._populateCountryTree(countries, countryTreeView, countryIterMap, countryStore);
        }).catch(e => this._log.error('prefs country list load failed', e));

        const resetManager = new ResetManager();
        resetAll.connect('clicked', () => {
            resetManager.resetAllSettings(this._settings, this._protoCbox, this._techCbox, countryTreeView, countryIterMap);
        });

        resetConnection.connect('clicked', () => {
            resetManager.resetConnectionSettings(this._settings, this._protoCbox, this._techCbox);
        });

        this._setWindowSize(window);
        return window;
    }
}
