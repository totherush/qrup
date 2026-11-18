# Security

## What qrup protects against, and what it does not

qrup is meant for a trusted local network, such as your home Wi-Fi. It has no login: anyone on the same network who opens its address can list, download, upload, and delete files in the upload folder. Traffic is plain HTTP, so others on the network can read it.

Do not run qrup on public or shared Wi-Fi you do not trust, and do not expose it to the internet. Stop it (Ctrl+C) when you are done.

qrup does protect the rest of your computer: requests cannot read or delete files outside the upload folder.

## Reporting a vulnerability

Please report security problems privately through [GitHub's private vulnerability reporting](https://github.com/totherush/qrup/security/advisories/new) rather than in a public issue. Include the qrup version (`qrup --version`) and steps to reproduce.
