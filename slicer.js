//@ts-check
async function loadClient() {
  const apiKey =
    localStorage.getItem("search-api-key") ||
    new URLSearchParams(location.search).get("search-api-key");
  console.log(
    apiKey,
    Array.from(new URLSearchParams(location.search).entries())
  );
  localStorage.setItem("search-api-key", apiKey);
  gapi.client.setApiKey(apiKey);
  // map the https://google.github.io/closure-library/api/goog.Thenable.html to a real Promise
  return new Promise((resolve, reject) => {
    gapi.client
      .load(
        "https://content.googleapis.com/discovery/v1/apis/customsearch/v1/rest"
      )
      .then(resolve, reject);
  });
}
/**
 * Make sure the client is loaded before calling this method.
 * @param {string} term
 * @returns
 */
function query(term) {
  const cacheKey = `search-cache-${encodeURIComponent(term)}`;
  if (localStorage.getItem(cacheKey)) {
    return JSON.parse(localStorage.getItem(cacheKey));
  }
  return new Promise((resolve, reject) => {
    // https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list
    gapi.client.search.cse
      .list({
        cx: "0ee7a2e1c024846c6",
        q: term,
        lr: "lang_de",
        cr: "countryDE",
      })
      .then(
        function (response) {
          localStorage.setItem(cacheKey, JSON.stringify(response.result));
          resolve(response.result);
        },
        function (err) {
          reject(err);
        }
      );
  });
}
function compare(a, b) {
  const linksA = a.items.map((item) => item.link);
  const linksB = b.items.map((item) => item.link);
  const unique = new Set([...linksA, ...linksB]);
  return linksA.length + linksB.length - unique.size;
}
async function execute() {
  const threshold = Number(
    /** @type HTMLInputElement */ (document.getElementById("threshold")).value
  );
  const textarea = /** @type HTMLTextAreaElement */ (
    document.getElementById("input")
  );
  const outputDiv = document.getElementById("output");
  try {
    outputDiv.textContent = "Processing...";

    const input = textarea.value
      .trim()
      .split("\n")
      .map((line) => {
        const parts = line.split("\t");
        return {
          keyword: parts[0].trim(),
          searchVolume: Number(parts[1].trim()) || 0,
          group: null,
          groupSearchVolume: null,
        };
      });

    for (const current of input) {
      if (!current.group) {
        current.group = current.keyword;
        current.groupSearchVolume = current.searchVolume;
      }
      for (const other of input) {
        if (other.group) {
          continue;
        }
        const a = await query(current.keyword);
        const b = await query(other.keyword);
        const overlap = compare(a, b);
        if (overlap >= Number(threshold)) {
          other.group = current.keyword;
          other.groupSearchVolume = current.searchVolume;
        }
      }
    }

    input.sort((a, b) => {
      return a.group > b.group ? 1 : -1;
    });

    input.sort((a, b) => {
      return a.group === b.group
        ? -1
        : a.groupSearchVolume < b.groupSearchVolume
        ? 1
        : -1;
    });

    // output as HTML table, for easy copy&paste to spreadsheet
    let result =
      "<table><thead><tr><th>keyword</th><th>keyword-group</th><th>search volume</th></tr></thead><tbody>";
    for (const { keyword, searchVolume, group } of input) {
      // console.log(keyword, suggestions);
      result += `<tr><td>${keyword}</td>`;
      result += `<td>${group}</td>`;
      result += `<td>${searchVolume}</td></tr>`;
    }
    result += "</tbody></table>";
    outputDiv.innerHTML = result;
  } catch (error) {
    outputDiv.innerText = error.message || JSON.stringify(error);
  }
}
gapi.load("client", async () => {
  await loadClient();
  document.getElementById("execute").addEventListener("click", () => {
    execute();
  });
});
