# NordVPN

A GNOME Shell extension to control NordVPN from the panel.

## Requirements

- GNOME Shell 46 or later (tested through 50)
- [NordVPN Linux CLI](https://nordvpn.com/download/linux/) installed and configured
- The `nordvpn` command must be available in your `PATH`

## Installation

### Manual installation

1. Clone or download this repository.
2. Copy the extension folder to your GNOME extensions directory:

   ```bash
   cp -r nordvpn@unl0cker ~/.local/share/gnome-shell/extensions/
   ```

3. Compile the GSettings schema:

   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/nordvpn@unl0cker/schemas/
   ```

4. Restart GNOME Shell:
   - On X11: press `Alt + F2`, type `r`, press `Enter`.
   - On Wayland: log out and log back in.

5. Enable the extension using GNOME Extensions app or:

   ```bash
   gnome-extensions enable nordvpn@unl0cker
   ```

## Features

### Panel indicator

A labeled button appears in the GNOME top bar showing the current VPN state. The label text and background color change per state, making it easy to see your connection status at a glance without opening the menu.

Default panel label styles:

| State       | Label text        | Background color       |
|-------------|-------------------|------------------------|
| Connected   | Country + server  | Green                  |
| Connecting  | CONNECTING        | Amber                  |
| Disconnected| DISCONNECTED      | Red                    |
| Logged out  | LOGGED OUT        | Blue                   |
| Error       | ERROR             | Red                    |

All label text and CSS styles are fully customizable from the preferences window.

### Panel menu

Clicking the indicator opens a dropdown menu with:

- **Status popup** — expandable item showing Country, City, Current server, Server IP, Transfer, and Uptime when connected.
- **Update available** notice — shown inline when the NordVPN CLI reports a newer version.
- **Connect / Disconnect** — one-click connection control.
- **Common Favorite** — quick-connect to a single configured favorite (optional, can be hidden).
- **Countries / Cities / Servers** — cascading submenu for browsing and connecting to specific locations. The country list is fetched from the NordVPN API and cached; the submenu rebuilds at most every 30 seconds to avoid excessive API calls.
- **Settings** — opens the preferences window.
- **Login / Logout** — authenticate or de-authenticate with NordVPN; visibility of each item is individually configurable.

### Auto-connect on startup

If the extension-level autoconnect setting is enabled and NordVPN is disconnected when the extension loads, it will automatically trigger a connection. This supplements NordVPN's own autoconnect for cases where the daemon starts after login.

### Favorites

Three types of favorites can be saved from the preferences window:

- Favorite countries
- Favorite cities
- Favorite servers

Favorites appear in the panel menu for fast one-click connection.

## Preferences

Open the preferences window from the menu (`Settings` item) or via GNOME Extensions.

### Connection

| Setting | Description |
|---|---|
| Auto-connect | Automatically connect when the extension enables |
| Protocol | UDP or TCP (OpenVPN only) |
| Technology | OpenVPN or NordLynx (WireGuard) |

### VPN settings

These are written directly to the NordVPN daemon via the CLI:

| Setting | Description |
|---|---|
| Firewall | Enable the NordVPN firewall |
| Kill Switch | Block traffic if the VPN drops |
| CyberSec | Block ads and malicious sites |
| Obfuscate | Hide VPN traffic (OpenVPN only) |
| Notify | Desktop notifications from NordVPN |
| Analytics | Send anonymous analytics to NordVPN |
| IPv6 | Enable IPv6 support |

### Panel appearance

| Setting | Description |
|---|---|
| Panel position | Left, center, or right section of the top bar |
| Common panel style | Base CSS applied to the indicator label for all states |
| Per-state styles | Individual label text and CSS for each connection state |

The label text for the Connected state supports the placeholders `{country}` and `{number}` (server number), for example: `{country} #{number}`.

### Menu visibility

| Setting | Description |
|---|---|
| Show Login | Show the Login item in the menu |
| Show Logout | Show the Logout item in the menu |

### Countries and cities

Configure which countries and cities appear in the panel submenu:

| Setting | Description |
|---|---|
| Countries in menu | Countries shown in the cascading country list |
| Countries for cities | Countries whose cities are fetched and listed |
| Max cities per country | Maximum city entries shown per country |
| Countries for servers | Countries whose recommended servers are fetched |
| Max servers per country | Maximum server entries shown per country |

### Refresh

| Setting | Description |
|---|---|
| Refresh timeout | How often (in seconds, 1–120) the extension polls `nordvpn status` |

The extension uses adaptive refresh: the interval shortens automatically during state transitions (connecting, disconnecting) and backs off exponentially if the CLI is unreachable.

## Troubleshooting

**The indicator is not visible.**
Make sure the extension is enabled and GNOME Shell has been restarted after installation.

**Status shows ERROR or nothing refreshes.**
Check that the NordVPN daemon is running:

```bash
systemctl status nordvpnd
```

Start it if needed:

```bash
sudo systemctl start nordvpnd
```

**Login opens no browser window.**
NordVPN generates a login URL and attempts to open it with the system default browser. Ensure a default browser is set.

**Settings changes are not applied to the daemon.**
Settings are synced to the daemon when the preferences window is saved. If the daemon is not running at that moment, the changes are stored locally and applied on the next save.

## License

MIT License — Copyright (c) 2025 nodefive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
