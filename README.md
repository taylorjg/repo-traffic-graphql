# Description

I wrote a [little Node.js program](https://github.com/taylorjg/repo-traffic)
to fetch and display GitHub repo traffic data using
[GitHub REST API v3](https://developer.github.com/v3/).

This repo will be a new version of the program using [GitHub GraphQL API v4](https://developer.github.com/v4/guides/intro-to-graphql/) when the new API supports traffic data.

# Build

```
$ npm run build

> repo-traffic-graphql@0.0.1 build /Users/jontaylor/HomeProjects/repo-traffic-graphql
> babel index.js --out-dir dist

index.js -> dist/index.js
$ 
```

# Usage

```
$ node dist/index -h

  Usage: index [options]

  Options:

    -t, --token <token>        GitHub API token
    -u, --username <username>  User whose repos should be displayed (default: taylorjg)
    -p, --page-size <n>        Page size (default: 100)
    -h, --help                 output usage information
$ 
```

# Example

```
TODO
```
