import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import * as Common from '../common.js';
import * as Constants from '../constants.js';

export default class StylesManager {
    constructor(settings) {
        this._settings = settings;
    }

    createStylesPage() {
        const stylePage = new Gtk.Grid({
            margin_start: 18,
            margin_top: 10,
            column_spacing: 12,
            row_spacing: 12,
            visible: true
        });

        const {styleItems, commonCss} = this._createStyleEditSection(stylePage);

        styleItems.forEach(item => {
            item.format.connect(`changed`, () => this._saveStyle(styleItems));
        });

        return stylePage;
    }

    _createStyleEditSection(stylePage) {
        let row = 0;
        let styleItems = [];
        Common.safeObjectKeys(Constants.states).forEach(state => {
            const label = new Gtk.Label({
                label: state,
                halign: Gtk.Align.START,
                visible: true
            });
            stylePage.attach(label, 0, row, 1, 1);

            const format = new Gtk.Entry({hexpand: true});
            const iconBtn = new Gtk.Button({icon_name: 'image-x-generic-symbolic', tooltip_text: 'Browse icons'});
            iconBtn.connect('clicked', () => this._openIconPicker(format, iconBtn.get_root()));
            const formatBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 4});
            formatBox.append(format);
            formatBox.append(iconBtn);
            stylePage.attach(formatBox, 1, row++, 1, 1);

            styleItems.push({state, format});
        });

        const commonCsslabel = new Gtk.Label({
            label: "Common CSS",
            halign: Gtk.Align.START,
            visible: true
        });
        stylePage.attach(commonCsslabel, 0, row, 1, 1);

        const commonCss = new Gtk.Entry();
        let cps = this._settings.get_string(`common-panel-style`);
        commonCss.get_buffer().set_text(cps, cps.length);
        commonCss.connect(`changed`, () => {
            let gv = new GLib.Variant("s", commonCss.get_buffer().get_text());
            this._settings.set_value(`common-panel-style`, gv);
        });
        stylePage.attach(commonCss, 1, row++, 4, 1);

        let savedStyle = this._settings.get_value('panel-styles').deep_unpack();
        this._loadStyle(savedStyle, styleItems);

        return {styleItems, commonCss};
    }

    _saveStyle(styleItems) {
        const existing = this._settings.get_value('panel-styles').deep_unpack();
        let data = {};
        styleItems.every(item => {
            data[item.state] = {
                panelText: item.format.get_buffer().get_text(),
                css: existing[item.state]?.css || '',
            };
            return true;
        });
        this._settings.set_value('panel-styles', new GLib.Variant('a{sa{ss}}', data));
    }

    _loadStyle(data, styleItems) {
        styleItems.forEach(item => {
            const panelText = data[item.state].panelText;
            item.format.get_buffer().set_text(panelText, panelText.length);
        });
    }

    _loadIconNames() {
        const icons = [];
        const baseDir = Gio.File.new_for_path('/usr/share/icons/Adwaita/symbolic');
        const queue = [baseDir];
        while (queue.length > 0) {
            const dir = queue.pop();
            try {
                const enumerator = dir.enumerate_children(
                    'standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null
                );
                let info;
                while ((info = enumerator.next_file(null)) !== null) {
                    const name = info.get_name();
                    if (info.get_file_type() === Gio.FileType.DIRECTORY) {
                        queue.push(dir.get_child(name));
                    } else if (name.endsWith('.svg')) {
                        icons.push(name.slice(0, -4));
                    }
                }
            } catch (e) {}
        }
        return icons.sort();
    }

    _openIconPicker(targetEntry, parentWindow) {
        const win = new Gtk.Window({
            title: 'Browse Icons',
            transient_for: parentWindow,
            modal: true,
            default_width: 520,
            default_height: 580,
        });

        const outer = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, spacing: 0});

        const searchEntry = new Gtk.SearchEntry({
            placeholder_text: 'Search icons...',
            margin_top: 8,
            margin_start: 8,
            margin_end: 8,
            margin_bottom: 4,
        });
        outer.append(searchEntry);

        const scroll = new Gtk.ScrolledWindow({vexpand: true, margin_start: 8, margin_end: 8});
        const listBox = new Gtk.ListBox({selection_mode: Gtk.SelectionMode.SINGLE});
        scroll.set_child(listBox);
        outer.append(scroll);

        const toolbar = new Gtk.Box({
            spacing: 8,
            margin_top: 8, margin_start: 8, margin_end: 8, margin_bottom: 8,
        });
        const cancelBtn = new Gtk.Button({label: 'Cancel', hexpand: true});
        const selectBtn = new Gtk.Button({label: 'Select', hexpand: true, css_classes: ['suggested-action']});
        toolbar.append(cancelBtn);
        toolbar.append(selectBtn);
        outer.append(toolbar);

        win.set_child(outer);

        for (const name of this._loadIconNames()) {
            const row = new Gtk.ListBoxRow();
            const rowBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 10,
                margin_top: 3, margin_bottom: 3, margin_start: 8, margin_end: 8,
            });
            rowBox.append(new Gtk.Image({icon_name: name, pixel_size: 22}));
            rowBox.append(new Gtk.Label({label: name, xalign: 0, hexpand: true}));
            row.set_child(rowBox);
            row._iconName = name;
            listBox.append(row);
        }

        listBox.set_filter_func(row => {
            const q = searchEntry.get_text().toLowerCase();
            return !q || row._iconName.toLowerCase().includes(q);
        });

        searchEntry.connect('search-changed', () => listBox.invalidate_filter());

        const applySelection = () => {
            const row = listBox.get_selected_row();
            if (row) {
                const text = `icon:${row._iconName}`;
                targetEntry.get_buffer().set_text(text, text.length);
            }
            win.close();
        };

        listBox.connect('row-activated', applySelection);
        selectBtn.connect('clicked', applySelection);
        cancelBtn.connect('clicked', () => win.close());

        win.present();
    }
}
