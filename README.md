# Keyword Slicer

Analyze search results for a list of keywords and find overlaps.

## Usage

1. download or clone with git
2. run a local webserver, like `npx serve` (based on node+npm)
3. open in browser, like http://localhost:5000/?search-api-key=[apikey] when using `npx serve`

## Obtaining an API key

First get an API key: https://developers.google.com/custom-search/v1/overview Click on "Get a key" there and create or select a project.

See https://stackoverflow.com/a/11206266

Once through with those steps, copy the 'Search engine ID' and use it in the `gapi.client.search.cse()` call.
