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
  const response = await axios.post('', { query });
  const data = response.data.data;
  const nextQuery = makeNextQuery(data);
  if (nextQuery) {
    return [data, ...await getPages(nextQuery, makeNextQuery)];
  }
  else {
    return [data];
  }
};

// const displayRateLimitData = async () => {
//   const rateLimitResponse = await axios.get("/rate_limit");
//   const rateLimitData = rateLimitResponse.data;
//   console.log(`rate limit: ${rateLimitData.resources.core.limit}`);
//   console.log(`rate remaining: ${rateLimitData.resources.core.remaining}`);
//   console.log(`rate reset: ${new Date(rateLimitData.resources.core.reset * 1000)}`);
// };

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

// const flatten = xs => [].concat(...xs);

const asyncWrapper = async () => {
  try {
    // await displayRateLimitData();

    const initialQuery = `{
      user(login: "${program.username}") {
        name
        repositories(first: ${program.pageSize}, orderBy: {field: CREATED_AT, direction: DESC}) {
          edges {
            node {
              id
              name
            }
            cursor
          }
        }
      }
    }`;

    const results = await getPages(initialQuery, data => {
      const edges = data.user.repositories.edges;
      if (edges.length) {
        const cursor = edges.slice(-1)[0].cursor;
        const nextQuery = `{
          user(login: "${program.username}") {
            name
            repositories(first: ${program.pageSize}, after: "${cursor}", orderBy: {field: CREATED_AT, direction: DESC}) {
              edges {
                node {
                  id
                  name
                }
                cursor
              }
            }
          }
        }`;
        return nextQuery;
      }
      else {
        return null;
      }
    });

    console.log(`results.length: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));

    // const results = [];
    // let indent = 0;
    // for (let index = 0; index < repos.length; index++) {
    //   try {
    //     const repo = repos[index];
    //     const viewsPromise = axios.get(`/repos/${repo.owner.login}/${repo.name}/traffic/views`);
    //     const clonesPromise = axios.get(`/repos/${repo.owner.login}/${repo.name}/traffic/clones`);
    //     const [{ data: views }, { data: clones }] = await Promise.all([viewsPromise, clonesPromise]);

    //     const result = {
    //       repo,
    //       views,
    //       clones
    //     };

    //     results.push(result);

    //     process.stdout.write(".");
    //     indent++;
    //   }
    //   catch (err) {
    //     indent && process.stdout.write("\n");
    //     indent = 0;
    //     handleError(err);
    //   }
    // }

    // const compareResults = (a, b) => {
    //   const compareViewsCount = b.views.count - a.views.count;
    //   const compareClonesCount = b.clones.count - a.clones.count;
    //   return compareViewsCount ? compareViewsCount : compareClonesCount;
    // };

    // const filteredSortedResults = results
    //   .filter(result => result.views.count || result.clones.count)
    //   .sort(compareResults);

    // const REPO_NAME_COL_WIDTH = 30;
    // const COUNT_COL_WIDTH = 5;

    // filteredSortedResults.forEach(result => {
    //   const repoName = result.repo.name.padEnd(REPO_NAME_COL_WIDTH);
    //   const viewsCount = String(result.views.count).padStart(COUNT_COL_WIDTH);
    //   const viewsUniques = String(result.views.uniques).padStart(COUNT_COL_WIDTH);
    //   const clonesCount = String(result.clones.count).padStart(COUNT_COL_WIDTH);
    //   const clonesUniques = String(result.clones.uniques).padStart(COUNT_COL_WIDTH);
    //   const viewsNumbers = `views: ${viewsCount} / ${viewsUniques}`;
    //   const clonesNumbers = `clones: ${clonesCount} / ${clonesUniques}`;
    //   const stars = `stars: ${result.repo.stargazers_count}`;
    //   console.log(`${repoName}     ${viewsNumbers}     ${clonesNumbers}     ${stars}`);
    // });

    // await displayRateLimitData();
  }
  catch (err) {
    handleError(err);
  }
};

asyncWrapper();
