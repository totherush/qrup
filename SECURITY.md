# Security

## What qrup protects against, and what it does not

Every time qrup starts, it creates a random access token and puts it in the address it prints and in the QR code. Only devices that open that address can list, download, upload, or delete files. Restarting qrup creates a new token, so old links stop working.

The qrup app can also ask to connect without the QR code (a join request). qrup then shows the phone's name and address in its terminal, and hands the phone the token only when you answer `y`. The name is chosen by the phone, so allow only requests you expect. Without an interactive terminal, qrup denies every join request.

`qrup --open` (or `QRUP_OPEN=1`) turns the token off. Then anyone on the same network who opens the address can access the upload folder, join requests are allowed without asking, and qrup prints a warning.

qrup only serves devices with a local network address: loopback, private IPv4 (10/8, 172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), and IPv6 unique local addresses (fc00::/7); an IPv4-mapped IPv6 address counts as its IPv4 address. Requests from any other address, such as a public IPv4 or IPv6 address, carrier-grade NAT or VPN ranges (100.64/10, which Tailscale uses), or through port forwarding from the internet, are refused with 403 before the token is checked, and the activity log shows `REFUSED` once per address. qrup uses the address of the connection itself and ignores `X-Forwarded-For`, so a reverse proxy on the same computer makes every request look local. `--any-network` (or `QRUP_ANY_NETWORK=1`) turns this check off for deliberate VPN use, and qrup prints a warning; the token still applies.

`--json` prints the token on stdout. Treat that output like the QR code: anyone who reads it can access the files.

Traffic is plain HTTP. Someone who can read traffic on your network can see the token and the files. Use qrup on networks you trust, do not expose it to the internet, and stop it (Ctrl+C) when you are done.

qrup also protects the rest of your computer: requests cannot read or delete files outside the upload folder.

## Reporting a vulnerability

Please report security problems privately through [GitHub's private vulnerability reporting](https://github.com/totherush/qrup/security/advisories/new) rather than in a public issue. Include the qrup version (`qrup --version`) and steps to reproduce.
