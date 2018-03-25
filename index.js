import axios from "axios";
import program from "commander";

program
  .option("-t, --token <token>", "GitHub API token")
  .option("-u, --username <username>", "User whose repos should be displayed", "taylorjg")
  .option("-p, --page-size <n>", "Page size", Number, 100)
  .parse(process.argv);

axios.defaults.baseURL = "https://api.github.com/graphql";

if (program.token) {
  axios.defaults.headers.common["Authorization"] = `bearer ${program.token}`;
}

const getPages = async (query, makeNextQuery) => {
  const response = await axios.post("", { query });
  const data = response.data.data;
  const nextQuery = makeNextQuery(data);
  if (nextQuery) {
    return [data, ...await getPages(nextQuery, makeNextQuery)];
  }
  else {
    return [data];
  }
};

const displayRateLimitData = async () => {
  const query = `
    query {
      rateLimit {
        limit
        remaining
        resetAt
      }
    }`;
  const response = await axios.post("", { query });
  const rateLimit = response.data.data.rateLimit;
  console.log(`limit: ${rateLimit.limit}`);
  console.log(`remaining: ${rateLimit.remaining}`);
  console.log(`resetAt: ${rateLimit.resetAt}`);
};


const handleError = err => {
  if (err.response) {
    const response = err.response;
    const request = response.request;
    const status = response.status;
    const statusText = response.statusText;
    if (response.data && response.data.message) {
      console.log(`[${request.method} ${request.path}] status: ${status}; statusText: ${statusText}; message: ${response.data.message}`);
    }
    else {
      console.log(`[${request.method} ${request.path}] status: ${status}; statusText: ${statusText}; err: ${err}`);
    }
  }
  else {
    if (err.config) {
      console.log(`[${err.config.method} ${err.config.url}] err: ${err}`);
    }
    else {
      console.log(`err: ${err}`);
    }
  }
};

const flatten = xs => [].concat(...xs);

const asyncWrapper = async () => {
  try {
    await displayRateLimitData();

    const makeRepoQuery = cursor => {
      const after = cursor ? `after: "${cursor}", ` : "";
      return `{
        user(login: "${program.username}") {
          repositories(first: ${program.pageSize}, ${after} orderBy: {field: CREATED_AT, direction: DESC}) {
            edges {
              node {
                id
                name
                stargazers {
                  totalCount
                }
              }
              cursor
            }
          }
        }
      }`;
    };

    const initialQuery = makeRepoQuery();
    const results = await getPages(initialQuery, data => {
      const edges = data.user.repositories.edges;
      return edges.length ? makeRepoQuery(edges.slice(-1)[0].cursor) : null;
    });

    const repositories = flatten(results.map(data => data.user.repositories.edges));

    const compareRepositories = (a, b) => {
      return b.node.stargazers.totalCount - a.node.stargazers.totalCount;
    };

    const filteredSortedRepositories = repositories
      .filter(result => result.node.stargazers.totalCount)
      .sort(compareRepositories);
  
    const REPO_NAME_COL_WIDTH = 35;

    filteredSortedRepositories.forEach(repo => {
      const repoName = repo.node.name.padEnd(REPO_NAME_COL_WIDTH);
      const stars = `stars: ${repo.node.stargazers.totalCount}`;
      console.log(`${repoName}     ${stars}`);
    });

    await displayRateLimitData();
  }
  catch (err) {
    handleError(err);
  }
};

asyncWrapper();
