# NordVPN Linux CLI Reference

Version: 4.6.0

---

## Table of Contents

1. [Overview](#overview)
2. [Global Options](#global-options)
3. [Authentication](#authentication)
4. [Connection](#connection)
5. [Disconnect](#disconnect)
6. [Status and Information](#status-and-information)
7. [Settings](#settings)
8. [Allowlist](#allowlist)
9. [Meshnet](#meshnet)
10. [File Sharing](#file-sharing)
11. [Post-Quantum VPN](#post-quantum-vpn)
12. [Notes and Conflicts](#notes-and-conflicts)
13. [Quick Reference Table](#quick-reference-table)

---

## Overview

NordVPN is a VPN service with a Linux command-line interface. It encrypts internet traffic, changes your IP address, and offers over 7,100 servers across 118 countries. A single account can secure up to 10 devices.

The general command structure is:

```
nordvpn [global options] <command> [subcommand] [options] [arguments]
```

---

## Global Options

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help for any command |
| `--version`, `-v` | Print the app version |

---

## Authentication

### login

Log in to your NordVPN account. By default, opens a browser for authentication and returns you to the app.

```
nordvpn login [options]
```

| Option | Description |
|--------|-------------|
| `--callback <URL>` | Complete login manually if the browser fails. After logging in via browser, right-click the "Continue" button, copy the link address, and pass it here enclosed in quotes. |
| `--token <token>` | Log in using an access token generated from your Nord Account dashboard. Does not support multi-factor authentication. The token is revoked on logout. |

**Headless / no-GUI login procedure:**

1. Run `nordvpn login`
2. Open the provided URL in any browser
3. Complete the login flow
4. Right-click the "Return to the app" button and copy the link address
5. Run `nordvpn login --callback "<copied_URL>"`
6. Verify with `nordvpn account`

### logout

```
nordvpn logout [options]
```

| Option | Description |
|--------|-------------|
| `--persist-token` | Keep the current access token valid after logging out (useful for scripting or token reuse) |

### register

Open the NordVPN registration page to create a new account.

```
nordvpn register
```

### account

Display information about the currently logged-in account.

```
nordvpn account
```

---

## Connection

### connect

Connect to a VPN server. With no arguments, connects to the server NordVPN recommends based on load and location.

```
nordvpn connect [options] [<country>|<server>|<country_code>|<city>|<group>|<country> <city>]
nordvpn c [options] [...]
```

| Option | Description |
|--------|-------------|
| `--group <group>`, `-g <group>` | Connect to a server within a specific group |

**Connection target types:**

| Target | Description | Example |
|--------|-------------|---------|
| No argument | Recommended server | `nordvpn connect` |
| Country name | Best server in that country | `nordvpn connect Australia` |
| Country code | Best server using two-letter code | `nordvpn connect US` |
| Country + city | Best server in that city | `nordvpn connect Sweden Stockholm` |
| Server name | Specific server | `nordvpn connect jp35` |
| Group name | Best server in that group | `nordvpn connect P2P` |
| Group + country | Best server in group within country | `nordvpn connect --group P2P Germany` |

Press Tab for auto-suggestions for country and city names.

### disconnect

Disconnect from the VPN.

```
nordvpn disconnect
nordvpn d
```

### countries

List all countries where NordVPN servers are available. Countries displayed in a different color are virtual locations — servers physically located elsewhere but configured with that country's IP address.

```
nordvpn countries
```

### cities

List available cities within a given country.

```
nordvpn cities <country>
```

Example: `nordvpn cities United_States`

Press Tab for country name auto-suggestions.

### groups

List available server groups. Groups are specialty server categories such as P2P, Onion Over VPN, Double VPN, Dedicated IP, and regional groups.

```
nordvpn groups
```

---

## Status and Information

### status

Show the current VPN connection status, including server name, IP address, country, city, and protocol in use.

```
nordvpn status
```

### settings

Show all current NordVPN configuration values.

```
nordvpn settings
```

### version

Show the NordVPN daemon version.

```
nordvpn version
```

### rate

Rate the quality of the last VPN connection on a scale from 1 (poor) to 5 (great). Each connection can only be rated once.

```
nordvpn rate <1-5>
```

Example: `nordvpn rate 4`

---

## Settings

Use `nordvpn set` (alias: `nordvpn s`) to configure NordVPN behavior.

```
nordvpn set <setting> <value>
```

For all toggle settings, accepted values are:

- **Enable:** `on`, `enabled`, `true`, `1`, `enable`
- **Disable:** `off`, `disabled`, `false`, `0`, `disable`

### autoconnect

Automatically connect to the VPN when the operating system starts. You can optionally specify a target location.

```
nordvpn set autoconnect <on|off> [<country>|<server>|<country_code>|<city>|<group>|<country> <city>]
```

| Option | Description |
|--------|-------------|
| `--group <group>`, `-g <group>` | Auto-connect to a specific server group |

Examples:

```
nordvpn set autoconnect on
nordvpn set autoconnect on Australia
nordvpn set autoconnect on Sweden Stockholm
nordvpn set autoconnect on --group P2P
```

### technology

Set the VPN tunnel technology. Changing technology requires reconnecting.

```
nordvpn set technology <OPENVPN|NORDLYNX|NORDWHISPER>
```

| Technology | Description |
|------------|-------------|
| `NORDLYNX` | WireGuard-based protocol. Fastest option. Required for post-quantum VPN. |
| `OPENVPN` | Battle-tested protocol supporting both TCP and UDP. Not compatible with post-quantum VPN. |
| `NORDWHISPER` | Obfuscated protocol for bypassing deep packet inspection in restrictive networks. |

### protocol

Set the transport protocol when using OpenVPN technology.

```
nordvpn set protocol <TCP|UDP>
```

| Protocol | Description |
|----------|-------------|
| `UDP` | Faster, lower overhead. Default for most use cases. |
| `TCP` | More reliable delivery, better for unstable connections. |

This setting only applies when technology is set to OpenVPN.

### killswitch

Block all internet access when the VPN connection drops or while not connected. Prevents accidental exposure of your real IP.

```
nordvpn set killswitch <on|off>
```

When enabled, no traffic leaves your device outside of the VPN tunnel.

### firewall

Control whether NordVPN manages your system firewall rules.

```
nordvpn set firewall <on|off>
```

When enabled, NordVPN applies firewall rules to enforce VPN routing.

### threatprotectionlite

Block malicious websites, trackers, and intrusive ads at the DNS level without requiring a separate app.

```
nordvpn set threatprotectionlite <on|off>
```

Aliases: `tplite`, `tpl`, `cybersec`

**Note:** Enabling ThreatProtectionLite automatically disables any custom DNS servers you have set. They are mutually exclusive.

### dns

Set custom DNS servers for use while connected to the VPN.

```
nordvpn set dns <ip1> [ip2] [ip3]
nordvpn set dns off
```

- Accepts up to 3 IPv4 DNS server addresses separated by spaces
- Setting a custom DNS disables ThreatProtectionLite

Examples:

```
nordvpn set dns 1.1.1.1 1.0.0.1
nordvpn set dns 8.8.8.8 8.8.4.4
nordvpn set dns off
```

### obfuscate

Hide VPN traffic patterns from deep packet inspection (DPI). Useful in countries or networks that block or throttle VPN usage.

```
nordvpn set obfuscate <on|off>
```

Requires OpenVPN technology. Obfuscation disguises VPN packets to look like regular HTTPS traffic.

### lan-discovery

Allow access to local network devices (printers, NAS drives, smart TVs, etc.) while connected to the VPN.

```
nordvpn set lan-discovery <on|off>
```

When disabled, local network devices are unreachable while the VPN is active.

### routing

Allow traffic routing through VPN servers and Meshnet peer devices.

```
nordvpn set routing <on|off>
```

When disabled, the app connects to a VPN server or peer but does not route traffic through it. Useful for Meshnet peer management without traffic tunneling.

### meshnet

Enable or disable Meshnet on this device.

```
nordvpn set meshnet <on|off>
```

See the [Meshnet](#meshnet) section for full details.

### virtual-location

Allow connections to virtual location servers. These are servers physically located in one country but configured to provide an IP address from another country, expanding the available location pool.

```
nordvpn set virtual-location <on|off>
```

### notify

Enable or disable desktop notifications for connection events.

```
nordvpn set notify <on|off>
```

### tray

Show or hide the NordVPN system tray icon. The tray icon provides quick access to connection status and basic controls.

```
nordvpn set tray <on|off>
```

### analytics

Allow NordVPN to send anonymous usage data for product improvement. Data includes crash reports, OS version, and feature usage — nothing personally identifiable.

```
nordvpn set analytics <on|off>
```

### fwmark

Set a firewall mark (fwmark) used in policy-based routing. This classifies packets based on a mark previously set by iptables, enabling advanced routing configurations.

```
nordvpn set fwmark <value>
```

Intended for advanced users managing custom routing rules.

### arp-ignore

Control whether your device ignores ARP (Address Resolution Protocol) requests while the VPN is active. Ignoring ARP requests prevents other devices on the local network from discovering your VPN interface.

```
nordvpn set arp-ignore <on|off>
```

Default is on. Disabling it makes your VPN interface visible to ARP scans on the local network.

### defaults

Reset all NordVPN settings to their factory default values.

```
nordvpn set defaults
```

---

## Allowlist

Exclude specific ports, port ranges, or subnets from VPN protection. Traffic to allowlisted destinations bypasses the VPN tunnel and travels directly. Allowlisted ports can also accept incoming connections from external sources.

```
nordvpn allowlist <add|remove> [...]
nordvpn whitelist <add|remove> [...]
```

### allowlist add port

Allowlist a single port. Without a protocol argument, both TCP and UDP are allowlisted.

```
nordvpn allowlist add port <port> [protocol <TCP|UDP>]
```

Examples:

```
nordvpn allowlist add port 22
nordvpn allowlist add port 22 protocol TCP
nordvpn allowlist add port 53 protocol UDP
```

### allowlist add ports

Allowlist a range of ports. Both endpoints are inclusive.

```
nordvpn allowlist add ports <port_from> <port_to> [protocol <TCP|UDP>]
```

Examples:

```
nordvpn allowlist add ports 3000 5000
nordvpn allowlist add ports 8080 8090 protocol TCP
```

### allowlist add subnet

Allowlist an entire subnet so all traffic to that range bypasses the VPN. Must be in IPv4 CIDR notation.

```
nordvpn allowlist add subnet <address/prefix>
```

Example:

```
nordvpn allowlist add subnet 192.168.0.0/16
nordvpn allowlist add subnet 10.0.0.0/8
```

### allowlist remove port

Remove a single port from the allowlist.

```
nordvpn allowlist remove port <port> [protocol <TCP|UDP>]
```

### allowlist remove ports

Remove a port range from the allowlist.

```
nordvpn allowlist remove ports <port_from> <port_to> [protocol <TCP|UDP>]
```

### allowlist remove subnet

Remove a subnet from the allowlist.

```
nordvpn allowlist remove subnet <address/prefix>
```

### allowlist remove all

Remove all allowlisted ports and subnets at once.

```
nordvpn allowlist remove all
```

---

## Meshnet

Meshnet creates a virtual private network between your devices and trusted peers, regardless of their physical location. Each device gets a unique Meshnet IP address and a Nord hostname in the format `<username>-<mountain>.nord`. Devices communicate directly over encrypted NordLynx tunnels.

Meshnet supports up to 10 devices on the same NordVPN account plus external peers via invitation.

**Note:** Meshnet and post-quantum VPN cannot run simultaneously.

### Enabling Meshnet

```
nordvpn set meshnet on
nordvpn set meshnet off
```

---

### meshnet peer

Manage devices connected to your Meshnet.

#### peer list

List all Meshnet peers with their hostnames, IP addresses, and current permission settings.

```
nordvpn meshnet peer list [--filter <filter>]
```

| Option | Description |
|--------|-------------|
| `--filter <value>`, `-f <value>` | Filter output. Multiple filters can be comma-separated. Contradictory filters return an empty list. |

#### peer remove

Remove a peer from your Meshnet. To re-link a personal device, restart Meshnet on the removed device.

```
nordvpn meshnet peer remove <hostname|nickname|ip|pubkey>
```

#### peer refresh

Force a Meshnet peer list refresh if it was not updated automatically.

```
nordvpn meshnet peer refresh
```

#### peer connect

Use a Meshnet peer as a VPN server, routing all your traffic through it. The peer must have the routing permission granted for your device.

```
nordvpn meshnet peer connect <hostname|nickname|ip|pubkey>
```

To stop routing, run `nordvpn disconnect`.

#### peer incoming

Control whether a peer can access this device remotely using its hostname, nickname, or Meshnet IP address. Remote access is enabled for all devices by default.

```
nordvpn meshnet peer incoming allow <hostname|nickname|ip|pubkey>
nordvpn meshnet peer incoming deny <hostname|nickname|ip|pubkey>
```

When denied, the peer cannot reach any services or shared folders on this device.

#### peer routing

Control whether a peer is allowed to route all its internet traffic through this device, effectively using it as a VPN server.

```
nordvpn meshnet peer routing allow <hostname|nickname|ip|pubkey>
nordvpn meshnet peer routing deny <hostname|nickname|ip|pubkey>
```

**Caution:** When you allow routing, the peer's browsing activity could be attributed to your IP address, and you could monitor their DNS queries.

#### peer local

Control whether a peer that is routing traffic through this device can also access devices on this device's local network (routers, NAS, printers, etc.). Traffic routing must be enabled for this permission to have effect.

```
nordvpn meshnet peer local allow <hostname|nickname|ip|pubkey>
nordvpn meshnet peer local deny <hostname|nickname|ip|pubkey>
```

**Caution:** Only grant local network access to fully trusted devices.

#### peer fileshare

Control whether a peer can send files to this device.

```
nordvpn meshnet peer fileshare allow <hostname|nickname|ip|pubkey>
nordvpn meshnet peer fileshare deny <hostname|nickname|ip|pubkey>
```

Disabling fileshare for a peer blocks incoming transfers from them, but you can still send files to that peer unless they also disable it for you.

#### peer auto-accept

Enable or disable automatic acceptance of file transfers from a specific peer, bypassing the per-transfer confirmation prompt.

```
nordvpn meshnet peer auto-accept enable <hostname|nickname|ip|pubkey>
nordvpn meshnet peer auto-accept disable <hostname|nickname|ip|pubkey>
```

#### peer nickname

Set or remove a custom nickname for a peer device. Nicknames can be used as hostnames in place of the auto-generated Nord hostname.

```
nordvpn meshnet peer nickname set <hostname|nickname|ip|pubkey> <new_nickname>
nordvpn meshnet peer nickname remove <hostname|nickname|ip|pubkey>
```

Aliases: `nick`

---

### meshnet invite

Manage invitations to add external NordVPN users' devices to your Meshnet.

#### invite send

Send an invitation to another NordVPN user by email. After sending, you will be prompted to grant or deny specific permissions for their device.

```
nordvpn meshnet invite send <email>
```

Invitations expire after 72 hours if not canceled. The invitation remains active after acceptance so the user can accept on each of their devices.

#### invite accept

Accept a Meshnet invitation from another NordVPN user. You will be prompted to grant or deny permissions.

```
nordvpn meshnet invite accept <email>
```

#### invite deny

Decline a received invitation.

```
nordvpn meshnet invite deny <email>
```

#### invite revoke

Cancel a sent invitation before it is accepted.

```
nordvpn meshnet invite revoke <email>
```

#### invite list

Display all pending sent and received invitations.

```
nordvpn meshnet invite list
```

---

### meshnet set / remove

#### set nickname

Assign a custom nickname to this machine within Meshnet. The nickname can be used as an alternative hostname by peers.

```
nordvpn meshnet set nickname <new_nickname>
```

Nickname rules:
- Maximum 25 characters
- Latin letters (a-z, A-Z), digits, and single dashes only
- Cannot start or end with a dash
- No spaces

#### remove nickname

Remove the custom nickname from this device, reverting to the auto-generated Nord hostname.

```
nordvpn meshnet remove nickname
```

---

### Meshnet Traffic Routing

When you connect to a peer with `nordvpn meshnet peer connect`, all your internet traffic is tunneled through that peer's device. The connection automatically uses NordVPN DNS addresses:

- `103.86.96.100`
- `103.86.99.100`

Traffic routing can be chained: you can route through a peer that is itself already routing through another device.

If the host peer is connected to a VPN server, you will appear to have the VPN server's IP address rather than the peer's ISP-assigned IP.

---

## File Sharing

Meshnet file sharing transfers files directly between peers over an encrypted peer-to-peer connection. Files do not pass through NordVPN servers or any cloud storage. Meshnet must be enabled on both devices.

Use Tab for auto-completion of peer names, transfer IDs, and file names.

### fileshare send

Send one or more files or directories to a Meshnet peer.

```
nordvpn fileshare send <peer> <path> [<path2> ...]
```

The transfer begins as soon as the recipient accepts it. You can only send files to peers that have the fileshare permission enabled for your device.

Example:

```
nordvpn fileshare send username-andes.nord /home/user/documents/report.pdf
nordvpn fileshare send username-andes.nord /home/user/photos/
```

### fileshare accept

Accept an incoming file transfer. Accepted files are saved to the default downloads folder.

```
nordvpn fileshare accept <transfer_id> [file1] [file2] ...
nordvpn fileshare accept --path <directory> <transfer_id>
```

- Omit file names to accept all files in the transfer
- Specify individual file names to accept only those files
- Use `--path` to save files to a custom directory

### fileshare list

List transfers or inspect the files in a specific transfer.

```
nordvpn fileshare list [--incoming|--outgoing]
nordvpn fileshare list <transfer_id>
```

| Option | Description |
|--------|-------------|
| `--incoming` | Show only received transfers |
| `--outgoing` | Show only sent transfers |

Transfers are listed in chronological order, oldest first.

### fileshare cancel

Cancel an in-progress transfer. Can be used from a different terminal session for background transfers.

```
nordvpn fileshare cancel <transfer_id>
nordvpn fileshare cancel <transfer_id> <file>
```

- Omit the file name to cancel the entire transfer
- Specify a file name to cancel only that file within the transfer
- You can also cancel a running transfer with Ctrl+C in the same terminal

### fileshare clear

Remove entries from the transfer history.

```
nordvpn fileshare clear all
nordvpn fileshare clear <time_period>
```

- `all` removes the entire history
- `<time_period>` removes entries older than the specified duration

Time period uses systemd time span syntax. Examples:

```
nordvpn fileshare clear 1d        # clear entries older than 1 day
nordvpn fileshare clear 12h       # clear entries older than 12 hours
nordvpn fileshare clear 1d 12h    # clear entries older than 36 hours
nordvpn fileshare clear 1w        # clear entries older than 1 week
```

---

## Post-Quantum VPN

Post-quantum VPN uses cryptographic algorithms designed to resist attacks from quantum computers, protecting your data against future quantum computing threats.

### Enable / Disable

```
nordvpn set pq on
nordvpn set pq off
```

Aliases: `post-quantum`

```
nordvpn set post-quantum on
nordvpn set post-quantum off
```

### Compatibility Constraints

Post-quantum VPN has the following incompatibilities:

| Conflict | Resolution |
|----------|-----------|
| OpenVPN technology | Switch to NordLynx before enabling post-quantum. If you try to enable post-quantum while on OpenVPN, you will receive an error. |
| Switching to OpenVPN while post-quantum is on | Disable post-quantum first, then switch technology. |
| Meshnet | Cannot run simultaneously. Disable one before enabling the other. |

---

## Notes and Conflicts

### ThreatProtectionLite vs Custom DNS

These two features are mutually exclusive. Enabling one automatically disables the other:

- `nordvpn set threatprotectionlite on` disables any configured custom DNS
- `nordvpn set dns 1.1.1.1` disables ThreatProtectionLite

### Post-Quantum vs OpenVPN

Post-quantum encryption requires the NordLynx tunnel protocol. Attempting to use it with OpenVPN will fail. You must switch to NordLynx first.

### Post-Quantum vs Meshnet

Post-quantum VPN and Meshnet cannot be active at the same time. Attempting to enable both will result in an error prompting you to disable one first.

### Obfuscation and Technology

Obfuscation requires OpenVPN technology. It is not available with NordLynx or NordWhisper.

### Meshnet Traffic Routing Security Considerations

When allowing peers to route traffic through your device:
- The peer will appear on the internet using your IP address
- Any illegal activity by the peer would be attributed to your IP
- You can observe the peer's DNS queries as the host device
- If local network access is also granted, the peer can reach all devices on your LAN

Only grant routing and local network permissions to devices you fully trust.

### DNS Limits

- Maximum of 3 custom DNS servers
- Only IPv4 addresses are accepted

---

## Quick Reference Table

### Common Commands

| Task | Command |
|------|---------|
| Connect to best server | `nordvpn connect` |
| Connect to country | `nordvpn connect <Country>` |
| Connect to city | `nordvpn connect <Country> <City>` |
| Connect to specific server | `nordvpn connect <server_id>` |
| Connect to group | `nordvpn connect <Group>` |
| Connect to group in country | `nordvpn connect --group <Group> <Country>` |
| Disconnect | `nordvpn disconnect` |
| Check status | `nordvpn status` |
| Check account | `nordvpn account` |
| View current settings | `nordvpn settings` |
| Log in | `nordvpn login` |
| Log out | `nordvpn logout` |

### Common set Commands

| Task | Command |
|------|---------|
| Use NordLynx (WireGuard) | `nordvpn set technology NordLynx` |
| Use OpenVPN | `nordvpn set technology OpenVPN` |
| Use NordWhisper | `nordvpn set technology NordWhisper` |
| Set TCP protocol | `nordvpn set protocol TCP` |
| Set UDP protocol | `nordvpn set protocol UDP` |
| Enable Kill Switch | `nordvpn set killswitch on` |
| Enable auto-connect | `nordvpn set autoconnect on` |
| Enable ThreatProtectionLite | `nordvpn set threatprotectionlite on` |
| Set custom DNS | `nordvpn set dns 1.1.1.1 1.0.0.1` |
| Disable custom DNS | `nordvpn set dns off` |
| Enable obfuscation | `nordvpn set obfuscate on` |
| Enable LAN discovery | `nordvpn set lan-discovery on` |
| Enable post-quantum | `nordvpn set pq on` |
| Enable Meshnet | `nordvpn set meshnet on` |
| Allow virtual locations | `nordvpn set virtual-location on` |
| Reset all settings | `nordvpn set defaults` |

### Allowlist Quick Reference

| Task | Command |
|------|---------|
| Allowlist port (both protocols) | `nordvpn allowlist add port 22` |
| Allowlist port TCP only | `nordvpn allowlist add port 22 protocol TCP` |
| Allowlist port range | `nordvpn allowlist add ports 3000 8000` |
| Allowlist subnet | `nordvpn allowlist add subnet 192.168.0.0/16` |
| Remove specific port | `nordvpn allowlist remove port 22` |
| Remove port range | `nordvpn allowlist remove ports 3000 8000` |
| Remove subnet | `nordvpn allowlist remove subnet 192.168.0.0/16` |
| Remove all allowlist entries | `nordvpn allowlist remove all` |

### Meshnet Quick Reference

| Task | Command |
|------|---------|
| Enable Meshnet | `nordvpn set meshnet on` |
| List peers | `nordvpn meshnet peer list` |
| Route traffic through peer | `nordvpn meshnet peer connect <peer>` |
| Stop routing | `nordvpn disconnect` |
| Remove peer | `nordvpn meshnet peer remove <peer>` |
| Allow peer incoming access | `nordvpn meshnet peer incoming allow <peer>` |
| Allow peer to route through you | `nordvpn meshnet peer routing allow <peer>` |
| Allow peer LAN access | `nordvpn meshnet peer local allow <peer>` |
| Allow peer file sending | `nordvpn meshnet peer fileshare allow <peer>` |
| Auto-accept files from peer | `nordvpn meshnet peer auto-accept enable <peer>` |
| Set this device nickname | `nordvpn meshnet set nickname <name>` |
| Remove this device nickname | `nordvpn meshnet remove nickname` |
| Set peer nickname | `nordvpn meshnet peer nickname set <peer> <name>` |
| Send invite | `nordvpn meshnet invite send <email>` |
| Accept invite | `nordvpn meshnet invite accept <email>` |
| List invites | `nordvpn meshnet invite list` |
| Revoke sent invite | `nordvpn meshnet invite revoke <email>` |

### Fileshare Quick Reference

| Task | Command |
|------|---------|
| Send file to peer | `nordvpn fileshare send <peer> <path>` |
| List incoming transfers | `nordvpn fileshare list --incoming` |
| List outgoing transfers | `nordvpn fileshare list --outgoing` |
| Inspect transfer contents | `nordvpn fileshare list <transfer_id>` |
| Accept entire transfer | `nordvpn fileshare accept <transfer_id>` |
| Accept specific files | `nordvpn fileshare accept <transfer_id> <file>` |
| Accept to custom path | `nordvpn fileshare accept --path <dir> <transfer_id>` |
| Cancel transfer | `nordvpn fileshare cancel <transfer_id>` |
| Cancel single file | `nordvpn fileshare cancel <transfer_id> <file>` |
| Clear all history | `nordvpn fileshare clear all` |
| Clear history older than 1 day | `nordvpn fileshare clear 1d` |
