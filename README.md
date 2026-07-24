# Redfish Crawler

Redfish Crawler is a CLI tool for crawling Redfish asset paths and exporting discovered asset data as JSON.

## Installation

Install dependencies locally:

```sh
npm install
```

Install globally to use `redfish-crawler` directly:

```sh
npm install -g .
```

Run without installing by using `npx`:

```sh
npx redfish-crawler crawl --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

## Quickstart

Run the crawler locally:

```sh
node src/index.js crawl --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

Run the crawler locally:

```sh
node src/index.js crawl --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

Or run the published CLI directly with npx:

```sh
npx redfish-crawler crawl --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin
```

## Commands

### Crawl

```sh
redfish-crawler crawl [options]
```

Required options:

- `--hostname URL` : Redfish base URL, e.g. `https://example.bmc`
- `--asset-path PATH` : Redfish asset path, e.g. `/redfish/v1/Systems/1`
- `--username USER` : Basic auth username

Optional options:

- `--output FILE` : Write asset JSON to `FILE` (default `redfish_asset.json`)
- `--depth N` : Maximum crawl depth (default `5`)
- `--timeout N` : Request timeout in milliseconds (default `10000`)
- `--concurrency N` : Maximum concurrent requests (default `5`)
- `--insecure` : Disable TLS certificate verification
- `--verbose` : Enable verbose output
- `-h, --help` : Show crawl help message

### Submit

```sh
redfish-crawler submit <FILE> [options]
```

Required argument:

- `<FILE>` : Path to the JSON file produced by the crawler

Optional options:

- `--api API` : API endpoint used to submit crawled data
- `--u-position POSITION` : U position
- `--notes NOTES` : Submission notes
- `-h, --help` : Show submit help message

## Environment variables

For crawl:

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

For submit:

- `REDFISH_API_PATH`

If `REDFISH_PASSWORD` is not set for crawl, the CLI prompts for the password interactively.
Avoid setting `REDFISH_PASSWORD` in the terminal, as it can be visible in shell history.

## Examples

Crawl with command-line options:

```sh
node src/index.js crawl --hostname https://example.bmc --asset-path /redfish/v1/Systems/1 --username admin --output output.json --depth 3 --concurrency 10
```

Crawl with environment variables:

```sh
REDFISH_HOSTNAME=https://example.bmc \
REDFISH_ASSET_PATH=/redfish/v1/Systems/1 \
REDFISH_USERNAME=admin \
REDFISH_PASSWORD=secret \
node src/index.js crawl
```

Submit a crawled JSON file:

```sh
npx redfish-crawler submit redfish_asset.json --api https://api.example.com/submit --u-position 10 --notes "Imported from BMC"
```
