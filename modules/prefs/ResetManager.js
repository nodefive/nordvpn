export default class ResetManager {
    resetAllSettings(settings, protoCbox, techCbox, countryTreeView, countryIterMap) {
        this._resetGeneralSetting(settings);
        this._resetAccountSetting(settings);
        this.resetConnectionSettings(settings, protoCbox, techCbox);
        this._resetCountrySetting(settings, countryTreeView, countryIterMap);
    }

    resetConnectionSettings(settings, protoCbox, techCbox) {
        this._resetSetting(settings, ['cybersec', 'firewall', 'killswitch', 'obfuscate', 'notify', 'ipv6', 'protocol', 'technology']);

        const protocol = settings.get_string('protocol');
        protoCbox.set_active(protocol === 'UDP' ? 0 : 1);

        const tech = settings.get_string('technology');
        techCbox.set_active(tech === 'OPENVPN' ? 0 : 1);
    }

    _resetGeneralSetting(settings) {
        this._resetSetting(settings, ['autoconnect', 'commonfavorite']);
    }

    _resetAccountSetting(settings) {
        this._resetSetting(settings, ['showlogin', 'showlogout']);
    }

    _resetCountrySetting(settings, countryTreeView, countryIterMap) {
        this._resetSetting(settings, ['number-servers-per-countries', 'countries-in-menu']);
        countryTreeView.get_selection().unselect_all();
    }

    _resetSetting(settings, keys) {
        keys.forEach(key => settings.set_value(key, settings.get_default_value(key)));
    }
}
