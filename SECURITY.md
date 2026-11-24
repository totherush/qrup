# Security

## What qrup protects against, and what it does not

Every time qrup starts, it creates a random access token and puts it in the address it prints and in the QR code. Only devices that open that address can list, download, upload, or delete files. Restarting qrup creates a new token, so old links stop working.

The qrup app can also ask to connect without the QR code (a join request). qrup then shows the phone's name and address in its terminal, and hands the phone the token only when you answer `y`. The name is chosen by the phone, so allow only requests you expect. Without an interactive terminal, qrup denies every join request.

`qrup --open` (or `QRUP_OPEN=1`) turns the token off. Then anyone on the same network who opens the address can access the upload folder, join requests are allowed without asking, and qrup prints a warning.

Traffic is plain HTTP. Someone who can read traffic on your network can see the token and the files. Use qrup on networks you trust, do not expose it to the internet, and stop it (Ctrl+C) when you are done.

qrup also protects the rest of your computer: requests cannot read or delete files outside the upload folder.

## Reporting a vulnerability

Please report security problems privately through [GitHub's private vulnerability reporting](https://github.com/totherush/qrup/security/advisories/new) rather than in a public issue. Include the qrup version (`qrup --version`) and steps to reproduce.
