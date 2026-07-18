# NordVPN GNOME Shell Extension

A GNOME Shell extension that provides panel controls and state indicators for the NordVPN Linux CLI.

## Requirements

- GNOME Shell version 46 or later (tested up to 50)
- NordVPN Linux CLI client installed and configured
- The `nordvpn` executable available in the system PATH

## Installation

### Manual Installation

1. Copy the extension directory to your GNOME Shell extensions path:

   ```bash
   cp -r nordvpn@unl0cker ~/.local/share/gnome-shell/extensions/
   ```

2. Compile the GSettings schemas for the extension:

   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/nordvpn@unl0cker/schemas/
   ```

3. Restart your GNOME Shell environment:
   - Under X11: Press `Alt + F2`, type `r`, and press `Enter`.
   - Under Wayland: Log out and log back in to your session.

4. Enable the extension:
   - Via the GNOME Extensions application, or
   - By running:
     ```bash
     gnome-extensions enable nordvpn@unl0cker
     ```

## Features

### Panel Indicator
- Top-bar button showing the current VPN status (e.g., Connected, Connecting, Disconnected, Error, Logged Out).
- Displays country and server number when connected.
- Customizable panel label styles and background colors for each connection state via settings.

### Dropdown Menu
- **Status details**: Expandable panel showing the country, city, server name/IP, transfer details, and uptime when connected.
- **Connection controls**: Quick connect and disconnect toggles.
- **Submenus**: Location submenus for countries and cities fetched from the NordVPN API.
- **Preferences**: Access the settings page directly from the dropdown.
- **Account management**: Configurable quick-login and logout buttons.

### Automated Connection
- Option to automatically connect to VPN when the extension loads if it is currently disconnected.

## Configuration

Settings can be managed via the Preferences panel in GNOME Extensions or the GNOME Extensions App.

### Connection
- **Auto-connect**: Toggles automatically connecting on startup.
- **Protocol**: Choice between UDP or TCP (for OpenVPN).
- **Technology**: Switch between OpenVPN and NordLynx (WireGuard).

### NordVPN CLI Settings
Synchronizes daemon settings directly using the NordVPN command-line interface:
- Firewall configuration
- Kill switch toggle
- CyberSec / Threat Protection Lite
- Traffic obfuscation (OpenVPN only)
- Notification toggles
- System analytics
- IPv6 support

### Interface Customization
- **Panel Position**: Choose to place the indicator in the left, center, or right section of the top panel.
- **State Styling**: Define Custom CSS rules and label text templates for each VPN state (using placeholders like `{country}` and `{number}`).
- **Menu Items Visibility**: Toggle the login and logout buttons.
- **Adaptive Refresh**: Polling timeout settings (1–120 seconds) for `nordvpn status` requests. The extension automatically defaults to a higher refresh frequency during status transitions.

## Troubleshooting

### Indicator does not appear
Verify that the extension is enabled in your system settings and GNOME Shell has been restarted.

### Status is stuck on ERROR
Ensure the NordVPN daemon is running on your system:
```bash
systemctl status nordvpnd
```
Start the service if necessary:
```bash
sudo systemctl start nordvpnd
```

### Browser does not open on login
NordVPN CLI triggers your default browser to complete login authentication. Check that a system default browser is correctly registered.

## License

MIT License - Copyright (c) 2025 nodefive. See the LICENSE file for details.
