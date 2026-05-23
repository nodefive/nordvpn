import St from 'gi://St';

import * as Constants from './constants.js';

const ICON_COLORS = {
    'Status: Connected':     'rgba(63,193,65,1)',
    'Status: Connecting':    'rgba(136,136,136,1)',
    'Status: Disconnected':  'rgba(136,136,136,1)',
    'Status: Disconnecting': 'rgba(136,136,136,1)',
    'Status: Reconnecting':  'rgba(136,136,136,1)',
    'Status: Restarting':    'rgba(136,136,136,1)',
    'ERROR':                 'rgba(216,31,31,1)',
    'LOGGED OUT':            'rgba(216,31,31,1)',
    'Status: Logging in':    'rgba(136,136,136,1)',
    'Status: Logging out':   'rgba(136,136,136,1)',
};

export default class PanelIcon {
    constructor(settings) {
        this._settings = settings;

        this.uiMap = {};
        this.commonStyle = "";
        this.updateStyle();
    }

    updateStyle() {
        let savedStyle = this._settings.get_value('panel-styles').deep_unpack();

        this.uiMap = {};
        Object.keys(savedStyle).forEach(key => {
            this.uiMap[Constants.states[key]] = savedStyle[key];
        });

        this.commonStyle = this._settings.get_string(`common-panel-style`);
    }

    update(status) {
        if (!status || this._label.isDisposed) return;

        let config = this.uiMap[status.currentState.stateName];
        let msg = config.panelText
        if (status.currentState.stateName === 'Status: Connected')
            msg = msg.replaceAll('{country}',      status.country)
                     .replaceAll('{COUNTRY}',      status.country.toUpperCase())
                     .replaceAll('{ctry}',         status.currentServer.replace(/(\d|.nordvpn.com)/g, '').toUpperCase())
                     .replaceAll('{city}',         status.city)
                     .replaceAll('{CITY}',         status.city.toUpperCase())
                     .replaceAll('{number}',       status.serverNumber)
                     .replaceAll('{server}',       status.currentServer)
                     .replaceAll('{ip}',           status.serverIP)
                     .replaceAll('{tech}',         status.currentTechnology)
                     .replaceAll('{protocol}',     status.currentProtocol)
                     .replaceAll('{transfer}',     status.transfer)
                     .replaceAll('{transferUp}',   (status.transfer?.match(/\d+.\d+ [a-zA-z]+ sent/g)     || ['0 B'])[0]?.replace(' sent', '') )
                     .replaceAll('{transferDown}', (status.transfer?.match(/\d+.\d+ [a-zA-z]+ received/g) || ['0 B'])[0]?.replace(' received', '') )
                     .replaceAll('{uptime}',       status.uptime)
                     .replaceAll('{uptimeHr}',     (status.uptime?.match(/\d+ hours/g)   || ['00'])[0]?.replace(' hours',   '')?.padStart(2, '0') )
                     .replaceAll('{uptimeMin}',    (status.uptime?.match(/\d+ minutes/g) || ['00'])[0]?.replace(' minutes', '')?.padStart(2, '0') )
                     .replaceAll('{uptimeSec}',    (status.uptime?.match(/\d+ seconds/g) || ['00'])[0]?.replace(' seconds', '')?.padStart(2, '0') );

        const style = this.commonStyle + config.css;
        if (msg && msg.startsWith('icon:')) {
            const iconName = msg.slice(5).trim();
            this._icon.icon_name = iconName;
            const iconColor = ICON_COLORS[status.currentState.stateName] || 'rgba(255,255,255,1)';
            this._icon.set_style(`color: ${iconColor};`);
            this._box.set_style(style.replace(/background-color:\s*[^;]+;?\s*/g, ''));
            this._icon.show();
            this._label.hide();
            this._label.text = '';
        } else {
            this._icon.set_style('');
            this._icon.hide();
            this._label.show();
            this._label.text = msg || "Style Missing MSG";
            this._box.set_style(style);
        }
    }

    button() {
        return this._button;
    }

    build() {
        this._button = new St.Bin({
            reactive: true,
            can_focus: true,
            x_expand: true,
            y_expand: false,
            track_hover: true
        });

        this._box = new St.BoxLayout({x_expand: false});
        this._icon = new St.Icon({icon_size: 22});
        this._icon.hide();
        this._label = new St.Label();
        this._label.connect('destroy', () => this._label.isDisposed = true);
        this._box.add_child(this._icon);
        this._box.add_child(this._label);
        this._button.set_child(this._box);
    }
}