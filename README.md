# Redfish Crawler

Redfish Crawler is a CLI tool for crawling Redfish asset paths and exporting the discovered asset data as JSON.

## Quickstart

Install dependencies:

```sh
npm install
```

Run the crawler with the local entrypoint:

```sh
node src/index.js --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

Or run the published CLI directly with npx:

```sh
npx redfish-crawler --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

## Usage

```sh
redfish-crawler --hostname URL --asset-path PATH --username USER [options]
```

Required flags:

- `--hostname URL` : Redfish base URL, e.g. `https://example.bmc`
- `--asset-path PATH` : Redfish asset path, e.g. `/redfish/v1/Systems/1`
- `--username USER` : Basic auth username

Optional flags:

- `--output FILE` : Write output JSON to `FILE` (default `redfish_asset.json`)
- `--depth N` : Maximum crawl depth (default `5`)
- `--timeout N` : Request timeout in milliseconds (default `10000`)
- `--concurrency N` : Maximum concurrent requests (default `5`)
- `--insecure` : Disable TLS certificate verification
- `--verbose` : Enable verbose output
- `-h, --help` : Show help message

## Authentication and environment variables

If you prefer not to pass credentials on the command line, you can set the following environment variables in a `.env` file or your shell:

- `REDFISH_HOSTNAME`
- `REDFISH_ASSET_PATH`
- `REDFISH_USERNAME`
- `REDFISH_PASSWORD`
- `REDFISH_OUTPUT`
- `REDFISH_DEPTH`
- `REDFISH_TIMEOUT`
- `REDFISH_CONCURRENCY`
- `REDFISH_INSECURE`
- `REDFISH_VERBOSE`

If `REDFISH_PASSWORD` is not set, the tool prompts for the password interactively.
Avoid setting `REDFISH_PASSWORD` in the terminal, as it can be viewable in the command history.

## Example

```sh
REDFISH_HOSTNAME=https://example.bmc \
REDFISH_ASSET_PATH=/redfish/v1/Systems/1 \
REDFISH_USERNAME=admin \
REDFISH_PASSWORD=secret \
node src/index.js
```

Or with command-line arguments:

```sh
node src/index.js --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin --output output.json --depth 3 --concurrency 10
```
